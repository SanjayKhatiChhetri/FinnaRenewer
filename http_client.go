package main

import (
    "errors"
    "fmt"
    "io"
    "net/http"
    "time"
)

var (
    errCloudflare = errors.New("cloudflare challenge")
    errHTTP5xx    = errors.New("server error")
)

// doRequestWithRetry wraps client.Do(req) with retry logic.
// Retries on:
//   - network errors
//   - Cloudflare 403 / 503
//   - Finna 500
//   - temporary timeouts
func doRequestWithRetry(client *http.Client, req *http.Request) (*http.Response, error) {
    var lastErr error

    for attempt := 1; attempt <= 4; attempt++ {
        resp, err := client.Do(req)
        if err != nil {
            lastErr = err
            time.Sleep(backoff(attempt))
            continue
        }

        // Cloudflare challenge
        if resp.StatusCode == 403 || resp.StatusCode == 503 {
            lastErr = fmt.Errorf("%w: HTTP %d", errCloudflare, resp.StatusCode)
            resp.Body.Close()
            time.Sleep(backoff(attempt))
            continue
        }

        // Finna internal error
        if resp.StatusCode >= 500 {
            lastErr = fmt.Errorf("%w: HTTP %d", errHTTP5xx, resp.StatusCode)
            resp.Body.Close()
            time.Sleep(backoff(attempt))
            continue
        }

        return resp, nil
    }

    return nil, fmt.Errorf("request failed after retries: %w", lastErr)
}

// backoff returns exponential backoff durations.
func backoff(attempt int) time.Duration {
    switch attempt {
    case 1:
        return 500 * time.Millisecond
    case 2:
        return 1 * time.Second
    case 3:
        return 2 * time.Second
    default:
        return 4 * time.Second
    }
}

// readBody fully reads and closes a response body.
func readBody(resp *http.Response) ([]byte, error) {
    defer resp.Body.Close()
    return io.ReadAll(resp.Body)
}
