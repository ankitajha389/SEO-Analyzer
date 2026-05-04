const API = "https://seo-analyzer-0nuw.onrender.com/api";

// ── TABS ──
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

function scoreColor(s) {
  if (s >= 70) return "#22c55e";
  if (s >= 40) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(s) {
  if (s >= 70) return "Good";
  if (s >= 40) return "Needs Work";
  return "Poor";
}

function ring(score) {
  const r = 44, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  return `
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle class="ring-bg" cx="55" cy="55" r="${r}"/>
      <circle class="ring-fill" cx="55" cy="55" r="${r}"
        stroke="${color}"
        stroke-dasharray="${circ}"
        stroke-dashoffset="${offset}"
        transform="rotate(-90 55 55)"/>
      <text class="ring-text" x="55" y="55" fill="${color}">${score}</text>
    </svg>`;
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = "⚠ " + msg;
  el.classList.add("show");
}

function hideError(id) { document.getElementById(id).classList.remove("show"); }

// ── ANALYZE ──
document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const url = document.getElementById("urlInput").value.trim();
  if (!url) return;
  hideError("analyzeError");
  document.getElementById("analyzeLoader").classList.add("show");
  document.getElementById("analyzeResults").classList.remove("show");
  document.getElementById("analyzeBtn").disabled = true;

  try {
    const res = await fetch(`${API}/analyze?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error("Server returned " + res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    renderAnalyze(data, url);
    document.getElementById("analyzeResults").classList.add("show");
  } catch (e) {
    showError("analyzeError", e.message);
  } finally {
    document.getElementById("analyzeLoader").classList.remove("show");
    document.getElementById("analyzeBtn").disabled = false;
  }
});

function renderAnalyze(data, url) {
  const op = data.on_page, tech = data.technical, kw = data.keywords;

  // Score rings
  document.getElementById("overallScore").innerHTML = ring(data.overall_score);
  document.getElementById("onPageScore").innerHTML = ring(op.score ?? 0);
  document.getElementById("techScore").innerHTML = ring(tech.score ?? 0);
  document.getElementById("overallHint").textContent = scoreLabel(data.overall_score);

  // SERP
  const title = op.title || "No title found";
  const desc = op.meta_description || "No meta description found.";
  document.getElementById("serpFakeSearch").textContent = new URL(url).hostname;
  document.getElementById("serpUrl").textContent = url.length > 60 ? url.slice(0, 60) + "…" : url;
  document.getElementById("serpTitle").textContent = title;
  document.getElementById("serpDesc").textContent = desc.slice(0, 160);

  const warns = [];
  if (op.title_length > 60) warns.push(`Title too long — ${op.title_length}/60 chars`);
  if (op.meta_description_length > 160) warns.push(`Description too long — ${op.meta_description_length}/160 chars`);
  document.getElementById("serpWarns").innerHTML = warns.map(w =>
    `<div class="serp-warn-badge">⚠ ${w}</div>`).join("");

  document.getElementById("charBars").innerHTML = `
    ${charBar("Title", op.title_length, 60)}
    ${charBar("Meta Description", op.meta_description_length, 160)}
  `;

  // On-page details
  const headingsHtml = Object.entries(op.headings || {})
    .filter(([, vals]) => vals.length)
    .map(([tag, vals]) => vals.map(v =>
      `<span class="heading-tag"><span class="htag">${tag.toUpperCase()}</span>${v.slice(0, 55)}</span>`
    ).join("")).join("");

  document.getElementById("onPageDetails").innerHTML = `
    <div class="info-grid">
      <div class="info-item"><label>Title</label><p>${op.title || "—"}</p></div>
      <div class="info-item"><label>Title Length</label><p>${op.title_length} / 60 chars</p></div>
      <div class="info-item"><label>Meta Description</label><p>${op.meta_description || "—"}</p></div>
      <div class="info-item"><label>Meta Desc Length</label><p>${op.meta_description_length} / 160 chars</p></div>
      <div class="info-item"><label>Canonical URL</label><p>${op.canonical || "—"}</p></div>
      <div class="info-item"><label>Images Missing Alt</label><p>${op.images_without_alt} of ${op.images_total} images</p></div>
    </div>
    ${headingsHtml ? `<div class="headings-section"><label>Page Headings</label>${headingsHtml}</div>` : ""}
  `;

  // Issues
  const allIssues = [...(op.issues || []), ...(tech.issues || [])];
  document.getElementById("issuesList").innerHTML = allIssues.length
    ? allIssues.map(i => `<li>⚠ ${i}</li>`).join("")
    : `<li class="success">✅ No issues found — great job!</li>`;

  // Technical
  const techItems = [
    { icon: "🔒", label: "HTTPS", value: tech.https ? "Secure" : "Not Secure", cls: tech.https ? "pass" : "fail" },
    { icon: "⏱", label: "Load Time", value: tech.load_time_seconds != null ? `${tech.load_time_seconds}s` : "N/A", cls: tech.load_time_seconds <= 3 ? "pass" : "warn" },
    { icon: "🤖", label: "robots.txt", value: tech.robots_txt ? "Found" : "Missing", cls: tech.robots_txt ? "pass" : "fail" },
    { icon: "🗺", label: "sitemap.xml", value: tech.sitemap_xml ? "Found" : "Missing", cls: tech.sitemap_xml ? "pass" : "fail" },
    { icon: "🔗", label: "Broken Links", value: `${tech.broken_links?.length ?? 0} found`, cls: tech.broken_links?.length ? "fail" : "pass" },
    { icon: "🔍", label: "Links Checked", value: `${tech.internal_links_checked ?? 0} internal`, cls: "" },
    ...(tech.core_web_vitals ? [
      { icon: "🖼", label: "LCP", value: tech.core_web_vitals.LCP, cls: "" },
      { icon: "⚡", label: "TBT", value: tech.core_web_vitals.TBT, cls: "" },
      { icon: "📐", label: "CLS", value: tech.core_web_vitals.CLS, cls: "" },
    ] : []),
  ];

  document.getElementById("techChecks").innerHTML = techItems.map(t => `
    <div class="tech-item">
      <div class="tech-icon">${t.icon}</div>
      <div class="tech-label">${t.label}</div>
      <div class="tech-value ${t.cls}">${t.value}</div>
    </div>
  `).join("");

  // Keywords
  document.getElementById("wordStats").textContent =
    `Total words: ${kw.total_words ?? 0}  ·  Unique words: ${kw.unique_words ?? 0}`;

  const maxDensity = Math.max(...(kw.keywords || []).map(k => k.density), 1);
  document.getElementById("keywordsTable").innerHTML = `
    <div class="kw-row kw-header">
      <span>Keyword</span><span>Density Bar</span><span>Count</span><span>Density</span><span>Status</span>
    </div>
    ${(kw.keywords || []).map(k => `
      <div class="kw-row">
        <span class="kw-word">${k.keyword}</span>
        <div class="kw-bar-track">
          <div class="kw-bar-fill" style="width:${(k.density/maxDensity)*100}%;background:${densityColor(k.status)}"></div>
        </div>
        <span style="color:var(--muted2)">${k.count}</span>
        <span style="color:var(--muted2)">${k.density}%</span>
        <span><span class="badge ${k.status}">${k.status}</span></span>
      </div>
    `).join("")}
  `;
}

function charBar(label, val, max) {
  const pct = Math.min((val / max) * 100, 100);
  const color = val > max ? "#ef4444" : val > max * 0.85 ? "#f59e0b" : "#22c55e";
  return `
    <div class="char-bar-row">
      <div class="char-bar-label"><span>${label}</span><span>${val} / ${max}</span></div>
      <div class="char-bar-track">
        <div class="char-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>`;
}

function densityColor(status) {
  if (status === "overstuffed") return "#ef4444";
  if (status === "low") return "#4f8ef7";
  return "#22c55e";
}

// ── COMPARE ──
document.getElementById("compareBtn").addEventListener("click", async () => {
  const url1 = document.getElementById("compareUrl1").value.trim();
  const url2 = document.getElementById("compareUrl2").value.trim();
  if (!url1 || !url2) return;
  hideError("compareError");
  document.getElementById("compareLoader").classList.add("show");
  document.getElementById("compareResults").classList.remove("show");
  document.getElementById("compareBtn").disabled = true;

  try {
    const res = await fetch(`${API}/compare?url1=${encodeURIComponent(url1)}&url2=${encodeURIComponent(url2)}`);
    if (!res.ok) throw new Error("Server returned " + res.status);
    const data = await res.json();
    renderCompare(data);
    document.getElementById("compareResults").classList.add("show");
  } catch (e) {
    showError("compareError", e.message);
  } finally {
    document.getElementById("compareLoader").classList.remove("show");
    document.getElementById("compareBtn").disabled = false;
  }
});

function renderCompare(data) {
  ["site1", "site2"].forEach(key => {
    const s = data[key];
    const el = document.getElementById(key + "Card");
    el.querySelector("h4").textContent = s.url;

    const scoreEl = el.querySelector(".compare-score");
    scoreEl.textContent = s.overall_score;
    scoreEl.style.color = scoreColor(s.overall_score);

    el.querySelector(".compare-bars").innerHTML = `
      ${compareBar("On-Page", s.on_page_score)}
      ${compareBar("Technical", s.technical_score)}
    `;

    el.querySelector(".compare-details").innerHTML = `
      <div style="font-size:0.8rem;color:var(--muted);margin-bottom:8px">
        Title: <span style="color:var(--text)">${s.title || "—"}</span>
      </div>
      <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px">Top Keywords</div>
      <div style="margin-bottom:12px">
        ${s.top_keywords.map(k => `<span class="badge ok" style="margin:2px">${k.keyword} ${k.density}%</span>`).join("")}
      </div>
      <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px">Issues</div>
      <ul class="issues-list">
        ${s.issues.length
          ? s.issues.map(i => `<li>⚠ ${i}</li>`).join("")
          : `<li class="success">✅ No issues</li>`}
      </ul>
    `;
  });
}

function compareBar(label, score) {
  return `
    <div class="compare-bar-row">
      <div class="compare-bar-label"><span>${label}</span><span>${score}/100</span></div>
      <div class="compare-bar-track">
        <div class="compare-bar-fill" style="width:${score}%;background:${scoreColor(score)}"></div>
      </div>
    </div>`;
}
