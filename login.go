package main

import (
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"golang.org/x/net/publicsuffix"
)

const (
	loginPageURL = finnaBaseURL + "/MyResearch/Login?auth_method=Database"
	loginPostURL = finnaBaseURL + "/MyResearch/Home"
)

// ErrSessionExpired is returned when a request redirects to the login page.
var ErrSessionExpired = fmt.Errorf("finna session expired")

// login performs a fresh Finna ID (Database) login and returns an http.Client
// whose cookie jar is fully populated and ready for use.
//
// Flow:
//  1. Seed the jar with any cookies in cfg.FinnaCookie (captures cf_clearance,
//     language pref, etc. so Cloudflare doesn't block us)
//  2. GET the login page → extract CSRF token
//  3. POST credentials → server sets PHPSESSID + loginToken in jar
//  4. Verify we landed on an authenticated page (not redirected back to login)
func login(cfg Config) (*http.Client, error) {
	jar, err := cookiejar.New(&cookiejar.Options{PublicSuffixList: publicsuffix.List})
	if err != nil {
		return nil, fmt.Errorf("create cookie jar: %w", err)
	}

	client := &http.Client{
		Jar:     jar,
		Timeout: 30 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return nil // follow all redirects
		},
	}

	// Seed the jar with existing cookies (Cloudflare clearance, language, etc.)
	// so the login request looks like a known browser to the server.
	if cfg.FinnaCookie != "" {
		seedJar(jar, cfg.FinnaCookie)
	}

	// Step 1 — GET the login page to obtain a fresh CSRF token.
	loginGetReq, _ := http.NewRequest("GET", loginPageURL, nil)
	setBaseHeaders(loginGetReq)

	loginGetResp, err := client.Do(loginGetReq)
	if err != nil {
		return nil, fmt.Errorf("GET login page: %w", err)
	}
	defer loginGetResp.Body.Close()

	csrf, err := extractLoginCSRF(loginGetResp.Body)
	if err != nil {
		return nil, fmt.Errorf("extract login CSRF: %w", err)
	}

	// Step 2 — POST credentials.
	form := url.Values{
		"username":     {cfg.FinnaID},
		"password":     {cfg.FinnaPassword},
		"remember_me":  {"on"},
		"auth_method":  {"Database"},
		"csrf":         {csrf},
		"processLogin": {"Log in"},
	}

	loginPostReq, _ := http.NewRequest("POST", loginPostURL, strings.NewReader(form.Encode()))
	setBaseHeaders(loginPostReq)
	loginPostReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	loginPostReq.Header.Set("Referer", loginPageURL)

	loginPostResp, err := client.Do(loginPostReq)
	if err != nil {
		return nil, fmt.Errorf("POST login: %w", err)
	}
	defer loginPostResp.Body.Close()

	// Step 3 — Verify success: we should NOT be back on the login page.
	if isLoginPage(loginPostResp.Request.URL) {
		return nil, fmt.Errorf("login failed — check FINNA_ID and FINNA_PASSWORD")
	}

	return client, nil
}

// extractLoginCSRF parses the Finna login page and returns the hidden CSRF value.
//
// Target HTML:
//
//	<form name="loginForm" ...>
//	  <input type="hidden" name="csrf" value="abc123">
//	</form>
func extractLoginCSRF(body io.Reader) (string, error) {
	doc, err := goquery.NewDocumentFromReader(body)
	if err != nil {
		return "", fmt.Errorf("parse login HTML: %w", err)
	}

	csrf, exists := doc.Find(`form[name="loginForm"] input[name="csrf"]`).First().Attr("value")
	if !exists || csrf == "" {
		return "", fmt.Errorf("CSRF not found in login form — is the login page loading correctly?")
	}
	return csrf, nil
}

// isLoginPage returns true if the URL path indicates we are on a login page.
func isLoginPage(u *url.URL) bool {
	return strings.Contains(u.Path, "/MyResearch/Login")
}

// seedJar parses a raw "Cookie: ..." header string (e.g. from a browser DevTools
// copy) and injects each cookie into the jar for oula.finna.fi.
// This is used to pre-populate Cloudflare clearance and preference cookies.
func seedJar(jar http.CookieJar, cookieStr string) {
	finnaURL, _ := url.Parse(finnaBaseURL)
	var cookies []*http.Cookie

	for _, pair := range strings.Split(cookieStr, ";") {
		pair = strings.TrimSpace(pair)
		if pair == "" {
			continue
		}
		name, value, _ := strings.Cut(pair, "=")
		name = strings.TrimSpace(name)
		value = strings.TrimSpace(value)
		if name == "" {
			continue
		}
		cookies = append(cookies, &http.Cookie{
			Name:  name,
			Value: value,
			Path:  "/",
		})
	}

	jar.SetCookies(finnaURL, cookies)
}

// setBaseHeaders applies browser-like request headers without a Cookie header
// (cookies are managed by the http.Client's jar instead).
func setBaseHeaders(req *http.Request) {
	req.Header.Set("User-Agent",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "+
			"(KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36")
	req.Header.Set("Accept",
		"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Origin", finnaBaseURL)
}