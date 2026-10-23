(function () {
  "use strict";

  const STOP = new Set([
    "what","is","the","a","an","of","in","to","for","and","how","why",
    "does","do","can","are","was","were","this","that","with","from",
    "kya","kia","hai","hain","ka","ki","ke","ko","me","mein","aur",
    "kaise","kyun","batao","mujhe","ye","woh","kya","hota","hoti"
  ]);

  function norm(s) {
    return String(s || "").toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ").trim();
  }

  function tokens(s) {
    return [...new Set(norm(s).split(" ").filter(
      w => w.length > 1 && !STOP.has(w)
    ))];
  }

  function records() {
    const out = [];
    const seen = new Set();

    function addArray(arr, source) {
      if (!Array.isArray(arr)) return;
      for (const r of arr) {
        if (!r || typeof r !== "object") continue;
        const question = String(r.q || r.question || "").trim();
        const answer = String(r.a || r.answer || "").trim();
        if (!question || !answer) continue;

        const id = norm(question) + "|" + norm(answer);
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({ question, answer, source });
      }
    }

    for (const name of Object.keys(window)) {
      if (name.startsWith("SuperAI_Knowledge_Mega_")) {
        addArray(window[name], name);
      }
    }

    addArray(window.SAIKnowledgeModules, "legacy");
    return out;
  }

  function rank(query, record) {
    const q = norm(query);
    const question = norm(record.question);
    if (!q || !question) return 0;
    if (q === question) return 1;
    if (question.includes(q) || q.includes(question)) return 0.94;

    const qt = tokens(q);
    const rt = tokens(question);
    if (!qt.length || !rt.length) return 0;

    const set = new Set(rt);
    let common = 0;
    for (const w of qt) if (set.has(w)) common++;

    const coverage = common / qt.length;
    const precision = common / rt.length;
    const dice = (2 * common) / (qt.length + rt.length);

    // Question match matters more than words found only in the answer.
    return Math.min(0.90, coverage * 0.55 + precision * 0.20 + dice * 0.25);
  }

  function search(query, limit) {
    const q = norm(query);
    if (!q) return [];

    return records().map(r => ({
      ...r,
      confidence: rank(q, r)
    }))
    .filter(r => r.confidence >= 0.40)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, Math.max(1, Math.min(20, Number(limit) || 5)));
  }

  function ask(query) {
    const results = search(query, 5);
    const top = results[0];

    if (!top || top.confidence < 0.58) {
      return {
        found: false,
        answer: "Mujhe apni loaded knowledge mein is sawal ka pakka match nahi mila.",
        confidence: top ? top.confidence : 0,
        results
      };
    }

    return {
      found: true,
      answer: top.answer,
      confidence: top.confidence,
      source: top.source,
      results
    };
  }

  function stats() {
    const rows = records();
    const sources = new Set(rows.map(r => r.source));
    return {
      sources: sources.size,
      records: rows.length
    };
  }

  window.SuperAIKnowledgeHub = { search, ask, stats };
})();
