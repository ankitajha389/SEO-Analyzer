const axios = require("axios");
const cheerio = require("cheerio");
require("dotenv").config();

async function checkTechnical(url) {
  const results = {};
  const issues = [];
  let score = 100;
  let html = "";

  // HTTPS
  results.https = url.startsWith("https://");
  if (!results.https) { score -= 10; issues.push("Site is not using HTTPS"); }

  // Load time
  try {
    const start = Date.now();
    const res = await axios.get(url, { timeout: 15000, headers: { "User-Agent": "Mozilla/5.0" } });
    results.load_time_seconds = parseFloat(((Date.now() - start) / 1000).toFixed(2));
    html = res.data;
    if (results.load_time_seconds > 3) {
      score -= 10;
      issues.push(`Slow page load: ${results.load_time_seconds}s (target < 3s)`);
    }
  } catch (e) {
    results.load_time_seconds = null;
    issues.push(`Could not load page: ${e.message}`);
    score -= 20;
  }

  const base = new URL(url).origin;

  // robots.txt
  try {
    const r = await axios.get(`${base}/robots.txt`, { timeout: 5000 });
    results.robots_txt = r.status === 200;
  } catch { results.robots_txt = false; }
  if (!results.robots_txt) { score -= 5; issues.push("robots.txt not found"); }

  // sitemap.xml
  try {
    const s = await axios.get(`${base}/sitemap.xml`, { timeout: 5000 });
    results.sitemap_xml = s.status === 200;
  } catch { results.sitemap_xml = false; }
  if (!results.sitemap_xml) { score -= 5; issues.push("sitemap.xml not found"); }

  // Broken links (internal, max 20)
  const broken = [];
  try {
    const $ = cheerio.load(html);
    const links = [];
    $("a[href]").each((_, el) => {
      try {
        const href = new URL($(el).attr("href"), url).href;
        if (new URL(href).hostname === new URL(url).hostname) links.push(href);
      } catch {}
    });
    const toCheck = [...new Set(links)].slice(0, 20);
    await Promise.all(toCheck.map(async (link) => {
      try {
        const r = await axios.head(link, { timeout: 5000, maxRedirects: 5 });
        if (r.status >= 400) broken.push({ url: link, status: r.status });
      } catch { broken.push({ url: link, status: "timeout" }); }
    }));
    results.internal_links_checked = toCheck.length;
  } catch { results.internal_links_checked = 0; }

  results.broken_links = broken;
  if (broken.length) { score -= Math.min(15, broken.length * 3); issues.push(`${broken.length} broken internal link(s) found`); }

  results.score = Math.max(score, 0);
  results.issues = issues;
  return results;
}

module.exports = { checkTechnical };
