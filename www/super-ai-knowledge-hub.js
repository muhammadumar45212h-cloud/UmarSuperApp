(function () {
  "use strict";

  function norm(s) {
    return String(s || "").toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ").trim();
  }

  const STOP = new Set([
    "the","a","an","is","are","was","were","what","why","how",
    "please","explain","simply","short","answer","give","me",
    "kya","hai","hain","ko","ka","ki","ke","aur","mein","se",
    "samjhao","samjhayen","batayein","batao","mukhtasar",
    "jawab","dein","den","liye","par","ek","asaani","asaan"
  ]);

  function tokens(s) {
    return norm(s).split(" ").filter(w => w.length > 1 && !STOP.has(w));
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
        out.push({
          question,
          answer,
          source: source || r.topic || "knowledge",
          topic: String(r.topic || ""),
          verified: r.verified === true
        });
      }
    }

    for (const name of Object.keys(window)) {
      if (name.startsWith("SuperAI_Knowledge_Mega_")) {
        addArray(window[name], name);
      }
    }

    addArray(window.SAIKnowledgeModules, "legacy");

    // History packs use window.SuperAIHistory[topic] = [...]
    const history = window.SuperAIHistory;
    if (history && typeof history === "object") {
      for (const key of Object.keys(history)) {
        addArray(history[key], "history:" + key);
      }
    }

    return out;
  }

  function rank(query, record) {
    const q = norm(query);
    const question = norm(record.question);
    if (!q || !question) return 0;

    if (q === question) return 1;

    // Handles questions embedded in longer learning prompts.
    if (question.includes(q)) return 0.94;
    if (q.includes(question) && question.length > 5) return 0.88;

    const qt = [...new Set(tokens(q))];
    const rt = [...new Set(tokens(question))];
    if (!qt.length || !rt.length) return 0;

    let common = 0;
    for (const t of qt) if (rt.includes(t)) common++;

    const queryCoverage = common / qt.length;
    const recordCoverage = common / rt.length;
    return queryCoverage * 0.72 + recordCoverage * 0.28;
  }

  function search(query, limit) {
    const rows = records();
    return rows.map(r => ({
      ...r,
      confidence: rank(query, r)
    }))
    .filter(r => r.confidence >= 0.38)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, Math.max(1, Math.min(Number(limit) || 5, 20)));
  }

  function ask(query) {
    const results = search(query, 5);
    const best = results[0];

    if (!best || best.confidence < 0.58) {
      return { found: false, answer: "", confidence: best ? best.confidence : 0 };
    }

    return {
      found: true,
      answer: best.answer,
      question: best.question,
      source: best.source,
      topic: best.topic,
      confidence: best.confidence
    };
  }

  function stats() {
    const rows = records();
    return {
      records: rows.length,
      sources: [...new Set(rows.map(r => r.source))].length
    };
  }

  window.SuperAIKnowledgeHub = { search, ask, stats };
  console.log("[Super AI] Knowledge Hub ready.", stats());
})();
