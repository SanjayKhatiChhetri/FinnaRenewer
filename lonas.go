package main

import (
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

const (
	finnaBaseURL  = "https://oula.finna.fi"
	checkedOutURL = finnaBaseURL + "/MyResearch/CheckedOut"
	dueDateFormat = "2.1.2006 15.04"
)

// dueDateRegex matches the Finnish due date+time pattern "DD.M.YYYY HH.MM"
// anywhere in a block of text, even when adjacent HTML elements have been
// concatenated without whitespace by goquery (e.g. "23.59Renewal Successful").
var dueDateRegex = regexp.MustCompile(`(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{2}\.\d{2})`)

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

// parseDueDate extracts the due date from a block of text that contains
// "Due date: DD.M.YYYY HH.MM" somewhere inside it.
//
// We use a regex rather than splitting on whitespace because goquery's .Text()
// concatenates adjacent sibling elements without inserting spaces. For example,
// the renewal response produces text like:
//
//	"Due date: 23.4.2026 23.59Renewal Successful"
//
// where the time "23.59" is glued directly to "Renewal". The regex anchors on
// the exact numeric pattern so it extracts the date correctly regardless of
// what follows it.

func parseDueDate(text string) time.Time {
    m := dueDateRegex.FindStringSubmatch(text)
    if m == nil {
        return time.Time{}
    }

    t, err := time.Parse("2.1.2006 15.04", m[1]+" "+m[2])
    if err != nil {
        return time.Time{}
    }
    return t
}
