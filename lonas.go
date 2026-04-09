package main

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

const (
	finnaBaseURL  = "https://oula.finna.fi"
	checkedOutURL = finnaBaseURL + "/MyResearch/CheckedOut"
	dueDateFormat = "2.1.2006 15.04"
)

// Loan represents a single checked-out item.
type Loan struct {
	ID      string
	Title   string
	DueDate time.Time
}

// DaysUntilDue returns how many full days remain until the due date.
func (l Loan) DaysUntilDue() int {
	return int(time.Until(l.DueDate).Hours() / 24)
}

// fetchLoans loads the CheckedOut page using the shared client and returns all
// loans plus the CSRF token needed for the renewal POST.
//
// Returns ErrSessionExpired if the server redirects to the login page — the
// caller should re-login and retry once.
func fetchLoans(cfg Config, client *http.Client) ([]Loan, string, error) {
	req, err := http.NewRequest("GET", checkedOutURL, nil)
	if err != nil {
		return nil, "", err
	}
	setBaseHeaders(req)
	req.Header.Set("Referer", finnaBaseURL)

	resp, err := client.Do(req)
	if err != nil {
		return nil, "", fmt.Errorf("GET CheckedOut: %w", err)
	}
	defer resp.Body.Close()

	// Redirect to login page means the session has expired.
	if isLoginPage(resp.Request.URL) {
		return nil, "", ErrSessionExpired
	}
	if resp.StatusCode != 200 {
		return nil, "", fmt.Errorf("unexpected HTTP %d from CheckedOut", resp.StatusCode)
	}

	return parseCheckoutPage(resp.Body)
}

// parseCheckoutPage extracts loans and the CSRF token from the CheckedOut HTML.
func parseCheckoutPage(body io.Reader) ([]Loan, string, error) {
	doc, err := goquery.NewDocumentFromReader(body)
	if err != nil {
		return nil, "", fmt.Errorf("parse HTML: %w", err)
	}

	// CSRF token is in the hidden input inside the renewals form.
	csrf, exists := doc.Find(`form#renewals input[name="csrf"]`).First().Attr("value")
	if !exists || csrf == "" {
		// If the page also contains the login form, we've been silently redirected.
		if doc.Find(`form[name="loginForm"]`).Length() > 0 {
			return nil, "", ErrSessionExpired
		}
		return nil, "", fmt.Errorf("CSRF token not found in CheckedOut page")
	}

	var loans []Loan
	doc.Find("tr.myresearch-row").Each(func(_ int, row *goquery.Selection) {
		id, ok := row.Find(`input[name="renewSelectedIDS[]"]`).First().Attr("value")
		if !ok || id == "" {
			return // header row or unexpected structure
		}

		title := strings.TrimSpace(row.Find("h3.record-title").Text())
		dueDate := parseDueDate(row.Find(".status-column").Text())

		loans = append(loans, Loan{
			ID:      id,
			Title:   title,
			DueDate: dueDate,
		})
	})

	return loans, csrf, nil
}

// parseDueDate extracts the due date from status-column text like:
//
//	"Tiedekirjasto Pegasus  Checked Out: 8.10.2021  Due date: 23.4.2026 23.59"
func parseDueDate(text string) time.Time {
	const marker = "Due date:"
	idx := strings.Index(text, marker)
	if idx < 0 {
		return time.Time{}
	}
	rest := strings.TrimSpace(text[idx+len(marker):])

	// Grab "DD.M.YYYY" and "HH.MM" as the first two space-separated tokens.
	fields := strings.Fields(rest)
	if len(fields) < 2 {
		return time.Time{}
	}
	t, err := time.Parse(dueDateFormat, fields[0]+" "+fields[1])
	if err != nil {
		return time.Time{}
	}
	return t
}