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
    colorGreen  = 0x57F287 // success
    colorRed    = 0xED4245 // error
    colorYellow = 0xFEE75C // partial
    colorBlue   = 0x5865F2 // info
)

// ─── Send helpers ─────────────────────────────────────────────────────────────

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

    if resp.StatusCode != 200 && resp.StatusCode != 204 {
        return fmt.Errorf("discord webhook HTTP %d", resp.StatusCode)
    }
    return nil
}

// ─── Renewal summary embed ────────────────────────────────────────────────────

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
            old := r.Loan.DueDate
            new := r.NewDueDate
            delta := int(new.Sub(old).Hours() / 24)

            sb.WriteString(fmt.Sprintf(
                "**📘 %s**\n"+
                    "• **Was due:** %s\n"+
                    "• **Now due:** %s\n"+
                    "• **Extended:** %d days\n\n",
                truncate(r.Loan.Title, 80),
                old.Format("2.1.2006 15:04"),
                new.Format("2.1.2006 15:04"),
                delta,
            ))
        } else {
            sb.WriteString(fmt.Sprintf(
                "**❌ %s**\n• %s\n\n",
                truncate(r.Loan.Title, 80),
                r.ErrMsg,
            ))
        }
    }

    return discordEmbed{
        Title:       title,
        Description: strings.TrimSpace(sb.String()),
        Color:       color,
        Footer:      &discordFooter{Text: "Oula Finna · " + time.Now().Format("2.1.2006 15:04")},
    }
}


// ─── Daily check-in embed (nothing to renew) ──────────────────────────────────

func buildUpcomingEmbed(loans []Loan, daysThreshold int) discordEmbed {
    now := time.Now()
    cutoff := now.AddDate(0, 0, daysThreshold)

    var sb strings.Builder

    // Header
    sb.WriteString(fmt.Sprintf("No loans due within **%d days**.\n\n", daysThreshold))

    // Total loans
    sb.WriteString(fmt.Sprintf("📚 You currently have **%d** loan items\n\n", len(loans)))

    // All loan items
    sb.WriteString("### 📘 All loan items\n")
    for _, l := range loans {
        if l.DueDate.IsZero() {
            continue
        }

        sb.WriteString(fmt.Sprintf(
            "📗 **%s**\n"+
                "• **Due:** %s\n"+
                "• **Days left:** %d\n\n",
            truncate(l.Title, 80),
            l.DueDate.Format("2.1.2006 23:59"),
            l.DaysUntilDue(),
        ))
    }

    // Items needing renewal within threshold
    sb.WriteString("### 🔥 Items needing renewal within 7 days\n")

    needRenew := false
    for _, l := range loans {
        if l.DueDate.IsZero() {
            continue
        }
        if !l.DueDate.After(cutoff) {
            needRenew = true
            sb.WriteString(fmt.Sprintf(
                "📕 **%s**\n"+
                    "• **Due:** %s\n"+
                    "• **Days left:** %d\n\n",
                truncate(l.Title, 80),
                l.DueDate.Format("2.1.2006 23:59"),
                l.DaysUntilDue(),
            ))
        }
    }

    if !needRenew {
        sb.WriteString("📕 None — all items are safe.\n")
    }

    return discordEmbed{
        Title:       "📚 Finna check‑in — nothing to renew",
        Description: strings.TrimSpace(sb.String()),
        Color:       colorBlue,
        Footer:      &discordFooter{Text: "Oula Finna · " + time.Now().Format("2.1.2006 15:04")},
    }
}



// ─── Error embed ─────────────────────────────────────────────────────────────

func buildErrorEmbed(err error) discordEmbed {
    return discordEmbed{
        Title:       "🚨 Finna renewer error",
        Description: fmt.Sprintf("```\n%v\n```\nAutomatic re-login may have failed.", err),
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