package main

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// RenewalResult holds the outcome for a single loan after the POST.
type RenewalResult struct {
    Loan       Loan
    Success    bool
    NewDueDate time.Time
    ErrMsg     string
}

// renewAll sends a "Renew All" POST to Finna using the shared client.
// If DRY_RUN=true, it simulates success without sending any POST.
func renewAll(cfg Config, csrf string, loans []Loan, client *http.Client) ([]RenewalResult, error) {

    // ───────────────────────────────────────────────────────────────
    // DRY RUN MODE — simulate success without touching Finna
    // ───────────────────────────────────────────────────────────────
    if cfg.DryRun {
        results := make([]RenewalResult, len(loans))
        for i, l := range loans {
            results[i] = RenewalResult{
                Loan:       l,
                Success:    true,
                NewDueDate: l.DueDate, // unchanged in dry-run
            }
        }
        return results, nil
    }

    // ───────────────────────────────────────────────────────────────
    // Build POST body
    // ───────────────────────────────────────────────────────────────
    body := buildRenewalForm(csrf, loans)

    req, err := http.NewRequest("POST", checkedOutURL, strings.NewReader(body))
    if err != nil {
        return nil, err
    }
    setBaseHeaders(req)
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
    req.Header.Set("Referer", checkedOutURL)

    // Renewal can be slow when many items exist.
    client.Timeout = 60 * time.Second

    // ───────────────────────────────────────────────────────────────
    // Send POST with retry logic
    // ───────────────────────────────────────────────────────────────
    resp, err := doRequestWithRetry(client, req)
    if err != nil {
        return nil, fmt.Errorf("POST renewal: %w", err)
    }
    defer resp.Body.Close()

    // Session expired → caller will re-login and retry
    if isLoginPage(resp.Request.URL) {
        return nil, ErrSessionExpired
    }

    if resp.StatusCode != 200 {
        return nil, fmt.Errorf("renewal POST returned HTTP %d", resp.StatusCode)
    }

    // ───────────────────────────────────────────────────────────────
    // Parse renewal results
    // ───────────────────────────────────────────────────────────────
    return parseRenewalResponse(resp.Body, loans)
}

// buildRenewalForm constructs the URL-encoded POST body.
func buildRenewalForm(csrf string, loans []Loan) string {
    v := url.Values{}
    v.Set("csrf", csrf)
    v.Set("renewAll", "1")
    v.Set("selectAll", "on")

    for _, loan := range loans {
        v.Add("renewSelectedIDS[]", loan.ID)
        v.Add("selectAllIDS[]", loan.ID)
        v.Add("renewAllIDS[]", loan.ID)
    }

    return v.Encode()
}

// parseRenewalResponse reads the HTML from the renewal POST response and
// matches each loan row to a success or failure outcome.
func parseRenewalResponse(body io.Reader, loans []Loan) ([]RenewalResult, error) {
    doc, err := goquery.NewDocumentFromReader(body)
    if err != nil {
        return nil, fmt.Errorf("parse renewal HTML: %w", err)
    }

    // Map loan ID → original Loan
    loanByID := make(map[string]Loan, len(loans))
    for _, l := range loans {
        loanByID[l.ID] = l
    }

    var results []RenewalResult

    doc.Find("tr.myresearch-row").Each(func(_ int, row *goquery.Selection) {
        id, ok := row.Find(`input[name="renewSelectedIDS[]"]`).First().Attr("value")
        if !ok || id == "" {
            return
        }

        loan := loanByID[id]
        result := RenewalResult{Loan: loan}

        statusCol := row.Find(".status-column")
        statusText := statusCol.Text()

        // ───────────────────────────────────────────────────────────────
        // SUCCESS
        // ───────────────────────────────────────────────────────────────
        if statusCol.Find(".alert-success").Length() > 0 {
            result.Success = true

            // Try to parse new due date
            newDue := parseDueDate(statusText)

            // Cloudflare sometimes strips HTML → fallback to original due date
            if newDue.IsZero() {
                newDue = loan.DueDate
            }

            result.NewDueDate = newDue
            results = append(results, result)
            return
        }

        // ───────────────────────────────────────────────────────────────
        // FAILURE
        // ───────────────────────────────────────────────────────────────
        if statusCol.Find(".alert-danger").Length() > 0 {
            result.Success = false
            result.ErrMsg = strings.TrimSpace(statusCol.Find(".alert-danger").Text())
            results = append(results, result)
            return
        }

        // ───────────────────────────────────────────────────────────────
        // UNKNOWN (should not happen)
        // ───────────────────────────────────────────────────────────────
        result.Success = false
        result.ErrMsg = "no renewal status in response"
        results = append(results, result)
    })

    return results, nil
}