package main

import (
	"bufio"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds all runtime configuration loaded from environment / .env file.
type Config struct {
	// Primary auth: Finna ID login (automatic, no manual cookie copying).
	FinnaID       string
	FinnaPassword string

	// Legacy / Cloudflare seed: paste your browser cookie string here.
	// Used to pre-populate cf_clearance and other non-session cookies so
	// Cloudflare doesn't challenge the login request. Update only when
	// Cloudflare clears its challenge (~monthly or less).
	// Not needed if your server IP is not challenged by CF.
	FinnaCookie string

	// Discord webhook for notifications (optional).
	DiscordWebhookURL string

	// Renew loans due within this many days (default: 7).
	RenewDaysBefore int
}

func main() {
	cfg := mustLoadConfig()

	// ── Login ──────────────────────────────────────────────────────────────
	log.Println("▶ Logging in to Oula Finna…")
	client, err := login(cfg)
	if err != nil {
		notifyError(cfg, fmt.Errorf("login failed: %w", err))
		log.Fatalf("login error: %v", err)
	}
	log.Println("  Login successful.")

	// ── Fetch loans (with one auto-retry on session expiry) ────────────────
	loans, csrf, err := fetchLoansWithRetry(cfg, client)
	if err != nil {
		notifyError(cfg, err)
		log.Fatalf("fetch error: %v", err)
	}
	log.Printf("  Found %d loans.", len(loans))

	// ── Decide which loans need renewal ────────────────────────────────────
	cutoff := time.Now().AddDate(0, 0, cfg.RenewDaysBefore)
	var toRenew []Loan
	for _, l := range loans {
		if l.DueDate.IsZero() || !l.DueDate.After(cutoff) {
			toRenew = append(toRenew, l)
		}
	}

	if len(toRenew) == 0 {
		log.Printf("  No loans due within %d days — nothing to renew.", cfg.RenewDaysBefore)
		if cfg.DiscordWebhookURL != "" {
			embed := buildUpcomingEmbed(loans, cfg.RenewDaysBefore)
			if err := sendDiscord(cfg, embed); err != nil {
				log.Printf("  Discord error: %v", err)
			}
		}
		return
	}

	log.Printf("  %d loan(s) due within %d days — renewing all…", len(toRenew), cfg.RenewDaysBefore)
	for _, l := range toRenew {
		log.Printf("    • %s (due %s, %d days)",
			truncate(l.Title, 50), l.DueDate.Format("2.1.2006"), l.DaysUntilDue())
	}

	// ── Renew ──────────────────────────────────────────────────────────────
	// We always POST all loans via "Renew All"; the library decides per-item
	// renewability, and we capture each result from the response HTML.
	results, err := renewAll(cfg, csrf, loans, client)
	if err != nil {
		notifyError(cfg, err)
		log.Fatalf("renewal error: %v", err)
	}

	for _, r := range results {
		if r.Success {
			log.Printf("  ✅ %s → due %s",
				truncate(r.Loan.Title, 50), r.NewDueDate.Format("2.1.2006"))
		} else {
			log.Printf("  ❌ %s — %s",
				truncate(r.Loan.Title, 50), r.ErrMsg)
		}
	}

	// ── Notify ─────────────────────────────────────────────────────────────
	if cfg.DiscordWebhookURL != "" {
		embed := buildRenewalEmbed(results)
		if err := sendDiscord(cfg, embed); err != nil {
			log.Printf("  Discord error: %v", err)
		} else {
			log.Println("  Discord notification sent.")
		}
	}
}

// fetchLoansWithRetry calls fetchLoans and, if the session has expired,
// performs a fresh login and retries once.
func fetchLoansWithRetry(cfg Config, client *http.Client) ([]Loan, string, error) {
	log.Println("▶ Fetching loans…")
	loans, csrf, err := fetchLoans(cfg, client)
	if err == nil {
		return loans, csrf, nil
	}

	if !errors.Is(err, ErrSessionExpired) {
		return nil, "", err
	}

	// Session expired mid-run — re-login and retry once.
	log.Println("  Session expired — re-logging in…")
	newClient, loginErr := login(cfg)
	if loginErr != nil {
		return nil, "", fmt.Errorf("re-login failed: %w", loginErr)
	}

	// Replace the old client's jar with the new one so renewAll also benefits.
	client.Jar = newClient.Jar

	return fetchLoans(cfg, client)
}

// notifyError sends an error embed to Discord if configured.
func notifyError(cfg Config, err error) {
	if cfg.DiscordWebhookURL == "" {
		return
	}
	embed := buildErrorEmbed(err)
	if terr := sendDiscord(cfg, embed); terr != nil {
		log.Printf("  (Discord error notification also failed: %v)", terr)
	}
}

// ── Config loading ─────────────────────────────────────────────────────────────

// mustLoadConfig loads config from .env + environment. Exits with a helpful
// message if required values are missing.
func mustLoadConfig() Config {
	loadDotEnv(".env")

	cfg := Config{
		FinnaID:           os.Getenv("FINNA_ID"),
		FinnaPassword:     os.Getenv("FINNA_PASSWORD"),
		FinnaCookie:       os.Getenv("FINNA_COOKIE"),
		DiscordWebhookURL: os.Getenv("DISCORD_WEBHOOK_URL"),
		RenewDaysBefore:   7,
	}

	if d := os.Getenv("RENEW_DAYS_BEFORE"); d != "" {
		if n, err := strconv.Atoi(d); err == nil && n > 0 {
			cfg.RenewDaysBefore = n
		}
	}

	if cfg.FinnaID == "" || cfg.FinnaPassword == "" {
		fmt.Fprintln(os.Stderr, `
ERROR: FINNA_ID and FINNA_PASSWORD are required.

Add them to your .env file:
  FINNA_ID=your.finna.username
  FINNA_PASSWORD=your_password

FINNA_COOKIE is optional but recommended: paste your browser's full
cookie string to help bypass Cloudflare on the first login request.
You only need to update it when Cloudflare starts blocking requests.
`)
		os.Exit(1)
	}

	return cfg
}

// loadDotEnv reads KEY=VALUE pairs from path into the process environment.
// Lines beginning with # are comments. Already-set env vars are not overridden.
func loadDotEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		return // .env is optional
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		k, v, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key := strings.TrimSpace(k)
		val := strings.Trim(strings.TrimSpace(v), `"'`)
		if os.Getenv(key) == "" {
			os.Setenv(key, val)
		}
	}
}