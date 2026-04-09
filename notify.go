package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// ─── Discord webhook payload types ───────────────────────────────────────────

type discordPayload struct {
	Embeds []discordEmbed `json:"embeds"`
}

type discordEmbed struct {
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Color       int            `json:"color"`
	Fields      []discordField `json:"fields,omitempty"`
	Footer      *discordFooter `json:"footer,omitempty"`
}

type discordField struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline bool   `json:"inline"`
}

type discordFooter struct {
	Text string `json:"text"`
}

// Discord embed colour codes
const (
	colorGreen  = 0x57F287 // renewal success
	colorRed    = 0xED4245 // error / failures
	colorYellow = 0xFEE75C // warning (some failed)
	colorBlue   = 0x5865F2 // informational
)

// ─── Send helpers ─────────────────────────────────────────────────────────────

// sendDiscord posts an embed to the configured webhook URL.
func sendDiscord(cfg Config, embed discordEmbed) error {
	if cfg.DiscordWebhookURL == "" {
		return fmt.Errorf("DISCORD_WEBHOOK_URL is not set")
	}

	payload := discordPayload{Embeds: []discordEmbed{embed}}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := http.Post(cfg.DiscordWebhookURL, "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("discord webhook: %w", err)
	}
	defer resp.Body.Close()

	// 204 No Content is the success response from Discord webhooks.
	if resp.StatusCode != 200 && resp.StatusCode != 204 {
		return fmt.Errorf("discord webhook HTTP %d", resp.StatusCode)
	}
	return nil
}

// ─── Message builders ─────────────────────────────────────────────────────────

// buildRenewalEmbed creates the embed shown after a renewal run.
func buildRenewalEmbed(results []RenewalResult) discordEmbed {
	renewed, failed := 0, 0
	for _, r := range results {
		if r.Success {
			renewed++
		} else {
			failed++
		}
	}

	color := colorGreen
	title := fmt.Sprintf("📚 Renewal complete — %d/%d renewed", renewed, len(results))
	if failed > 0 && renewed == 0 {
		color = colorRed
		title = fmt.Sprintf("📚 Renewal failed — 0/%d renewed", len(results))
	} else if failed > 0 {
		color = colorYellow
		title = fmt.Sprintf("📚 Renewal partial — %d renewed, %d failed", renewed, failed)
	}

	var sb strings.Builder
	for _, r := range results {
		if r.Success {
			sb.WriteString(fmt.Sprintf("✅ **%s**\n→ due %s\n\n",
				truncate(r.Loan.Title, 60), r.NewDueDate.Format("2.1.2006")))
		} else {
			sb.WriteString(fmt.Sprintf("❌ **%s**\n→ %s\n\n",
				truncate(r.Loan.Title, 60), r.ErrMsg))
		}
	}

	return discordEmbed{
		Title:       title,
		Description: strings.TrimSpace(sb.String()),
		Color:       color,
		Footer:      &discordFooter{Text: "Oula Finna · " + time.Now().Format("2.1.2006 15:04")},
	}
}

// buildCannotRenewEmbed is sent when renewal could not be attempted
// (e.g. session expired) but loans are due soon.
func buildCannotRenewEmbed(loans []Loan, reason string) discordEmbed {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("**Reason:** %s\n\n**Loans needing attention:**\n", reason))
	for _, l := range loans {
		days := l.DaysUntilDue()
		sb.WriteString(fmt.Sprintf("• **%s** — due in %d days (%s)\n",
			truncate(l.Title, 55), days, l.DueDate.Format("2.1.2006")))
	}
	return discordEmbed{
		Title:       "⚠️ Finna renewal failed",
		Description: sb.String(),
		Color:       colorRed,
		Footer:      &discordFooter{Text: "Oula Finna · " + time.Now().Format("2.1.2006 15:04")},
	}
}

// buildUpcomingEmbed is the calm daily check-in when nothing needs renewal yet.
func buildUpcomingEmbed(loans []Loan, daysThreshold int) discordEmbed {
	lookahead := daysThreshold + 14
	var sb strings.Builder
	count := 0
	now := time.Now()
	cutoff := now.AddDate(0, 0, lookahead)

	for _, l := range loans {
		if l.DueDate.Before(cutoff) {
			days := l.DaysUntilDue()
			sb.WriteString(fmt.Sprintf("• **%s** — %d days (%s)\n",
				truncate(l.Title, 55), days, l.DueDate.Format("2.1.2006")))
			count++
		}
	}

	desc := fmt.Sprintf("No loans due within %d days.\n\n", daysThreshold)
	if count > 0 {
		desc += fmt.Sprintf("**Coming up (next %d days):**\n%s", lookahead, sb.String())
	} else {
		desc += "_All clear — nothing due soon._"
	}

	return discordEmbed{
		Title:       "📚 Finna check-in — nothing to renew",
		Description: desc,
		Color:       colorBlue,
		Footer:      &discordFooter{Text: "Oula Finna · " + time.Now().Format("2.1.2006 15:04")},
	}
}

// buildErrorEmbed wraps a fatal error in a Discord embed.
func buildErrorEmbed(err error) discordEmbed {
	return discordEmbed{
		Title:       "🚨 Finna renewer error",
		Description: fmt.Sprintf("```\n%v\n```\nCheck your `FINNA_COOKIE` — session may have expired.", err),
		Color:       colorRed,
		Footer:      &discordFooter{Text: "Oula Finna · " + time.Now().Format("2.1.2006 15:04")},
	}
}

// ─── Utilities ────────────────────────────────────────────────────────────────

func truncate(s string, n int) string {
	runes := []rune(s)
	if len(runes) <= n {
		return s
	}
	return string(runes[:n]) + "…"
}