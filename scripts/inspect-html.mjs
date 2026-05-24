import * as cheerio from "cheerio";

const BASE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function extractCookies(h) {
  return (h.getSetCookie?.() ?? []).map((s) => s.split(";")[0]).join("; ");
}

function merge(a, b) {
  const m = new Map();
  for (const r of [a, b])
    for (const p of r.split(";")) {
      const t = p.trim();
      if (!t) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      m.set(t.slice(0, i).trim(), t.slice(i + 1).trim());
    }
  return [...m].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function login(base, auth, user, pass) {
  const pg = await fetch(`${base}/MyResearch/Login?auth_method=${auth}`, {
    headers: BASE_HEADERS,
  });
  const pc = extractCookies(pg.headers);
  const $ = cheerio.load(await pg.text());
  let form = $('form[name="loginForm"]')
    .filter(
      (_, f) =>
        $(f).find(`input[name="auth_method"][value="${auth}"]`).length > 0,
    )
    .first();
  if (!form.length) form = $('form[name="loginForm"]').first();
  const fields = {};
  form.find('input[type="hidden"], input[type="submit"]').each((_, el) => {
    const n = $(el).attr("name"),
      v = $(el).attr("value");
    if (n && v) fields[n] = v;
  });
  const params = new URLSearchParams({
    ...fields,
    username: user,
    password: pass,
    remember_me: "on",
    auth_method: auth,
  });
  const lr = await fetch(`${base}/MyResearch/Home`, {
    method: "POST",
    headers: {
      ...BASE_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: base,
      Origin: base,
      Cookie: pc,
    },
    body: params.toString(),
    redirect: "manual",
  });
  return merge(pc, extractCookies(lr.headers));
}

// Login to OULA (15 loans with rich data)
const cookies = await login(
  "https://oula.finna.fi",
  "Database",
  "sanjay",
  "bkp_wur0ubr_yjp!EWC",
);
console.log("Login OK:", cookies.includes("loginToken"));

// Fetch CheckedOut
const resp = await fetch("https://oula.finna.fi/MyResearch/CheckedOut", {
  headers: { ...BASE_HEADERS, Cookie: cookies },
});
const html = await resp.text();
const $ = cheerio.load(html);

console.log("Row count:", $("tr.myresearch-row").length);

// Dump first row HTML to inspect selectors
console.log("\n=== FIRST ROW FULL HTML ===");
console.log($("tr.myresearch-row").first().html());

// Also try to extract fields we think exist
console.log("\n=== FIELD EXTRACTION TEST (first 3 rows) ===");
$("tr.myresearch-row")
  .slice(0, 3)
  .each((i, row) => {
    const $r = $(row);
    console.log(`\n--- Row ${i} ---`);
    console.log("Title:", $r.find("h3.record-title").text().trim());
    console.log(
      "ID:",
      $r.find('input[name="renewSelectedIDS[]"]').attr("value"),
    );
    console.log("Status text:", $r.find(".status-column").text().trim().replace(/\s+/g, " "));

    // Try to find cover image
    const img = $r.find("img").first();
    console.log("Image src:", img.attr("src") || img.attr("data-src") || "NONE");

    // Try to find author
    const authorLink = $r.find("a.author-link, .record-author a").first();
    console.log("Author link:", authorLink.text().trim() || "NONE");

    // Try all text in record details
    const recordInfo = $r.find("td").eq(1);
    console.log("Record cell text:", recordInfo?.text()?.trim()?.replace(/\s+/g, " ")?.slice(0, 300));

    // Try status column full
    const statusCol = $r.find("td").last();
    console.log("Status cell text:", statusCol?.text()?.trim()?.replace(/\s+/g, " "));
  });

// Also fetch Holds and Fines pages for future reference
console.log("\n\n=== HOLDS PAGE ===");
const holdsResp = await fetch("https://oula.finna.fi/MyResearch/Holds", {
  headers: { ...BASE_HEADERS, Cookie: cookies },
});
const holdsHtml = await holdsResp.text();
const $h = cheerio.load(holdsHtml);
console.log("Status:", holdsResp.status);
console.log("Title:", $h("h2, h1").first().text().trim());
console.log("Rows:", $h("tr.myresearch-row").length);
console.log("Content preview:", $h(".mainbody, main, #content").text().trim().replace(/\s+/g, " ").slice(0, 300));

console.log("\n\n=== FINES PAGE ===");
const finesResp = await fetch("https://oula.finna.fi/MyResearch/Fines", {
  headers: { ...BASE_HEADERS, Cookie: cookies },
});
const finesHtml = await finesResp.text();
const $f = cheerio.load(finesHtml);
console.log("Status:", finesResp.status);
console.log("Title:", $f("h2, h1").first().text().trim());
console.log("Content preview:", $f(".mainbody, main, #content, .myresearch-content").text().trim().replace(/\s+/g, " ").slice(0, 500));
