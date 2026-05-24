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
  const pg = await fetch(`${base}/MyResearch/Login?auth_method=${auth}`, { headers: BASE_HEADERS });
  const pc = extractCookies(pg.headers);
  const $ = cheerio.load(await pg.text());
  let form = $('form[name="loginForm"]').filter((_, f) => $(f).find(`input[name="auth_method"][value="${auth}"]`).length > 0).first();
  if (!form.length) form = $('form[name="loginForm"]').first();
  const fields = {};
  form.find('input[type="hidden"], input[type="submit"]').each((_, el) => { const n = $(el).attr("name"), v = $(el).attr("value"); if (n && v) fields[n] = v; });
  const params = new URLSearchParams({ ...fields, username: user, password: pass, remember_me: "on", auth_method: auth });
  const lr = await fetch(`${base}/MyResearch/Home`, { method: "POST", headers: { ...BASE_HEADERS, "Content-Type": "application/x-www-form-urlencoded", Referer: base, Origin: base, Cookie: pc }, body: params.toString(), redirect: "manual" });
  return merge(pc, extractCookies(lr.headers));
}

const cookies = await login("https://oula.finna.fi", "Database", "sanjay", "bkp_wur0ubr_yjp!EWC");

const resp = await fetch("https://oula.finna.fi/MyResearch/CheckedOut", { headers: { ...BASE_HEADERS, Cookie: cookies } });
const html = await resp.text();
const $ = cheerio.load(html);

// Get the RAW HTML of just the second row (first data row, skipping header)
const row = $("tr.myresearch-row").eq(1);
console.log("=== RAW ROW HTML (row 1) ===");
console.log(row.html());

console.log("\n\n=== SELECTOR TESTS ===");

// Test various selectors on row 1
console.log("\nTitle:", row.find("h3.record-title, a.record-title").text().trim());
console.log("Cover img:", row.find("img").first().attr("src")?.slice(0, 80));
console.log("Author (scheme 1):", row.find(".record-core-metadata a").first().text().trim());
console.log("Author (scheme 2):", row.find('[class*="author"]').first().text().trim());

// Find all classes used in the row
const classes = new Set();
row.find("*").each((_, el) => {
  const c = $(el).attr("class");
  if (c) c.split(/\s+/).forEach(cls => classes.add(cls));
});
console.log("\nAll CSS classes in row:", [...classes].sort().join(", "));

// Find all elements with text content in the row
console.log("\n=== ELEMENT STRUCTURE ===");
row.children().each((i, child) => {
  const tag = $(child).prop("tagName");
  const cls = $(child).attr("class") || "";
  const text = $(child).text().trim().replace(/\s+/g, " ").slice(0, 100);
  console.log(`  Child ${i}: <${tag}> class="${cls}" → "${text}"`);

  // Go one level deeper
  $(child).children().each((j, grandchild) => {
    const tag2 = $(grandchild).prop("tagName");
    const cls2 = $(grandchild).attr("class") || "";
    const text2 = $(grandchild).text().trim().replace(/\s+/g, " ").slice(0, 100);
    if (text2) console.log(`    Child ${i}.${j}: <${tag2}> class="${cls2}" → "${text2}"`);
  });
});
