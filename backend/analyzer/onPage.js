const axios = require("axios");
const cheerio = require("cheerio");

async function analyzeOnPage(url) {
  try {
    const { data: html } = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(html);

    const title = $("title").text().trim();
    const metaDesc = $('meta[name="description"]').attr("content") || "";
    const metaKeywords = $('meta[name="keywords"]').attr("content") || "";
    const canonical = $('link[rel="canonical"]').attr("href") || "";

    const headings = {};
    ["h1", "h2", "h3", "h4", "h5", "h6"].forEach((tag) => {
      headings[tag] = $(tag).map((_, el) => $(el).text().trim()).get();
    });

    const images = $("img");
    const imagesWithoutAlt = [];
    images.each((_, el) => {
      if (!$(el).attr("alt")) imagesWithoutAlt.push($(el).attr("src") || "");
    });

    let score = 100;
    const issues = [];

    if (!title) { score -= 15; issues.push("Missing title tag"); }
    else if (title.length > 60) { score -= 5; issues.push(`Title too long (${title.length} chars, max 60)`); }

    if (!metaDesc) { score -= 15; issues.push("Missing meta description"); }
    else if (metaDesc.length > 160) { score -= 5; issues.push(`Meta description too long (${metaDesc.length} chars, max 160)`); }

    if (!headings.h1.length) { score -= 10; issues.push("Missing H1 tag"); }
    else if (headings.h1.length > 1) { score -= 5; issues.push(`Multiple H1 tags found (${headings.h1.length})`); }

    if (imagesWithoutAlt.length) {
      score -= Math.min(10, imagesWithoutAlt.length * 2);
      issues.push(`${imagesWithoutAlt.length} image(s) missing alt text`);
    }

    if (!canonical) { score -= 5; issues.push("Missing canonical tag"); }

    return {
      score: Math.max(score, 0),
      issues,
      title,
      title_length: title.length,
      meta_description: metaDesc,
      meta_description_length: metaDesc.length,
      meta_keywords: metaKeywords,
      canonical,
      headings,
      images_total: images.length,
      images_without_alt: imagesWithoutAlt.length,
    };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { analyzeOnPage };
