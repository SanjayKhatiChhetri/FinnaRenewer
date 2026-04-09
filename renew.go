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
	ErrMsg     string // populated on failure
}

// renewAll sends a "Renew All" POST to Finna using the shared client,
// replicating exactly what the browser sends when clicking Renew All → Yes.
//
// POST body (from HAR capture):
//
//	csrf=<token>&renewAll=1&selectAll=on
//	&renewSelectedIDS[]=<id>&selectAllIDS[]=<id>&renewAllIDS[]=<id>  (per loan)
func renewAll(cfg Config, csrf string, loans []Loan, client *http.Client) ([]RenewalResult, error) {
	body := buildRenewalForm(csrf, loans)

	req, err := http.NewRequest("POST", checkedOutURL, strings.NewReader(body))
	if err != nil {
		return nil, err
	}
	setBaseHeaders(req)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Referer", checkedOutURL)

	// Renewal can be slow when there are many items.
	client.Timeout = 60 * time.Second

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("POST renewal: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("renewal POST returned HTTP %d", resp.StatusCode)
	}

	return parseRenewalResponse(resp.Body, loans)
}

// buildRenewalForm constructs the URL-encoded POST body.
// Each loan ID appears three times (renewSelectedIDS, selectAllIDS, renewAllIDS)
// matching the exact format captured from the browser HAR.
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

	// Build a quick lookup from loan ID → Loan for title fallback.
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

		loan, known := loanByID[id]
		if !known {
			loan = Loan{
				ID:    id,
				Title: strings.TrimSpace(row.Find("h3.record-title").Text()),
			}
		}

		result := RenewalResult{Loan: loan}
		statusCol := row.Find(".status-column")

		switch {
		case statusCol.Find(".alert-success").Length() > 0:
			result.Success = true
			result.NewDueDate = parseDueDate(statusCol.Text())

		case statusCol.Find(".alert-danger").Length() > 0:
			result.Success = false
			result.ErrMsg = strings.TrimSpace(statusCol.Find(".alert-danger").Text())

		default:
			result.Success = false
			result.ErrMsg = "no renewal status in response"
		}

		results = append(results, result)
	})

	return results, nil
}