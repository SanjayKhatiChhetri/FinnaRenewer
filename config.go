package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config holds all runtime configuration loaded from environment / .env file.
type Config struct {
    FinnaID           string
    FinnaPassword     string
    FinnaCookie       string
    DiscordWebhookURL string
    RenewDaysBefore   int
    DryRun            bool
    HealthCheck       bool
}

// mustLoadConfig loads config from .env + environment.
func mustLoadConfig() Config {
    loadDotEnv(".env")

    cfg := Config{
        FinnaID:           os.Getenv("FINNA_ID"),
        FinnaPassword:     os.Getenv("FINNA_PASSWORD"),
        FinnaCookie:       os.Getenv("FINNA_COOKIE"),
        DiscordWebhookURL: os.Getenv("DISCORD_WEBHOOK_URL"),
        RenewDaysBefore:   7,
    }

    // RENEW_DAYS_BEFORE
    if d := os.Getenv("RENEW_DAYS_BEFORE"); d != "" {
        if n, err := strconv.Atoi(d); err == nil && n > 0 {
            cfg.RenewDaysBefore = n
        }
    }

    // DRY_RUN
    if v := strings.ToLower(os.Getenv("DRY_RUN")); v == "1" || v == "true" {
        cfg.DryRun = true
    }

    // HEALTHCHECK
    if v := strings.ToLower(os.Getenv("HEALTHCHECK")); v == "1" || v == "true" {
        cfg.HealthCheck = true
    }

    // Required fields
    if cfg.FinnaID == "" || cfg.FinnaPassword == "" {
        fmt.Fprintln(os.Stderr, `
ERROR: FINNA_ID and FINNA_PASSWORD are required.

Add them to your .env file:
  FINNA_ID=your.finna.username
  FINNA_PASSWORD=your_password

FINNA_COOKIE is optional but recommended: paste your browser's full
cookie string to help bypass Cloudflare on the first login request.
`)
        os.Exit(1)
    }

    return cfg
}

// loadDotEnv reads KEY=VALUE pairs from path into the process environment.
func loadDotEnv(path string) {
    f, err := os.Open(path)
    if err != nil {
        return
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
