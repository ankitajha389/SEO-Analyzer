const { Router } = require("express");
const { analyzeOnPage } = require("../analyzer/onPage");
const { analyzeKeywords } = require("../analyzer/keywords");
const { checkTechnical } = require("../analyzer/technical");

const router = Router();

router.get("/analyze", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "url query param required" });

  const [onPage, keywords, technical] = await Promise.all([
    analyzeOnPage(url),
    analyzeKeywords(url),
    checkTechnical(url),
  ]);

  const overall = Math.round(((onPage.score ?? 0) + (technical.score ?? 0)) / 2);
  res.json({ url, overall_score: overall, on_page: onPage, keywords, technical });
});

router.get("/compare", async (req, res) => {
  const { url1, url2 } = req.query;
  if (!url1 || !url2) return res.status(400).json({ error: "url1 and url2 required" });

  async function summarize(url) {
    const [onPage, technical, keywords] = await Promise.all([
      analyzeOnPage(url),
      checkTechnical(url),
      analyzeKeywords(url, 5),
    ]);
    return {
      url,
      overall_score: Math.round(((onPage.score ?? 0) + (technical.score ?? 0)) / 2),
      on_page_score: onPage.score ?? 0,
      technical_score: technical.score ?? 0,
      title: onPage.title || "",
      issues: [...(onPage.issues || []), ...(technical.issues || [])],
      top_keywords: keywords.keywords || [],
    };
  }

  const [site1, site2] = await Promise.all([summarize(url1), summarize(url2)]);
  res.json({ site1, site2 });
});

module.exports = router;
