---
name: Oula-Finna Library Renewal System
description: Go-based automation to renew library loans from oula.finna.fi with notifications and optional Supabase logging
type: project
---

Building an automated Oula-Finna library loan renewal system in Go by reverse-engineering the private API.

**Why:** Automate the tedious manual renewal process, get notified when renewal isn't possible before items become overdue.

**How to apply:** All code should be Go. Architecture decisions should favor simplicity — cookie-based auth first, real login later.

## Discovered API endpoints
- `GET https://oula.finna.fi/AJAX/JSON?method=getUserTransactions` — returns loan list as JSON, requires session cookies
- `GET https://oula.finna.fi/AJAX/JSON?method=keepAlive` — keeps session alive
- `POST https://oula.finna.fi/MyResearch/CheckedOut` — renewal endpoint, `application/x-www-form-urlencoded`

## Renewal POST body
```
csrf=<token>
renewAll=1
selectAll=on
renewSelectedIDS[]=<loanId>
selectAllIDS[]=<loanId>
renewAllIDS[]=<loanId>
```

## Loan HTML structure
```html
<tr id="recordoy.9911914713906252" class="myresearch-row">
  <input class="checkbox-select-item" name="renewSelectedIDS[]" value="5784359220006252">
  <h3 class="record-title">Book title</h3>
  <strong>Due date: 23.4.2026 23.59</strong>
  <div class="alert alert-success">Renewal Successful</div>
</tr>
```

## Architecture
- Language: Go
- Scheduling: cron (daily)
- Auth: reuse browser session cookies initially; implement login flow later
- Notifications: Telegram bot (preferred), email/Discord optional
- Storage: optional Supabase for loan history, renewal logs, errors

## Roadmap
1. ✅ Confirm JSON structure from getUserTransactions
2. Build Go structs for loan data
3. Build renewal POST in Go
4. Add renewal logic (renew if due ≤ X days, retry, error handling)
5. Add Telegram notifications
6. Add cron scheduling
7. Optional: Supabase logging