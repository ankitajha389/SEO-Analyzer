const axios = require("axios");
const cheerio = require("cheerio");

const STOPWORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with",
  "is","it","this","that","was","are","be","as","by","from","have","has",
  "had","not","we","you","he","she","they","i","my","your","our","their",
  "its","will","can","do","did","so","if","about","which","when","there",
  "all","been","more","also","into","than","then","some","what","would",
  "could","should","just","up","out","no","his","her","him","them","who"
]);

function tokenize(text) {
  return text.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g)?.filter(w => !STOPWORDS.has(w)) || [];
}

function tfidf(word, words, total) {
  const tf = words.filter(w => w === word).length / total;
  const idf = tf > 0 ? Math.log(1 + 1 / tf) : 0;
  return parseFloat((tf * idf).toFixed(5));
}

async function analyzeKeywords(url, topN = 15) {
  try {
    const { data: html } = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(html);
    $("script, style, noscript").remove();
    const text = $.text();

    const words = tokenize(text);
    const total = words.length;

    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);

    const keywords = sorted.map(([word, count]) => {
      const density = parseFloat(((count / total) * 100).toFixed(2));
      const status = density > 5 ? "overstuffed" : density < 0.5 ? "low" : "ok";
      return { keyword: word, count, density, tfidf: tfidf(word, words, total), status };
    });

    return { total_words: total, unique_words: Object.keys(freq).length, keywords };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { analyzeKeywords };
