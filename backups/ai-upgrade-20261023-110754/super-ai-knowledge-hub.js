(function () {
  function norm(s) {
    return String(s || "").toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ").trim();
  }

  function records() {
    const all = [];
    const names = Object.keys(window).filter(
      n => n.startsWith("SuperAI_Knowledge_Mega_")
    );

    for (const name of names) {
      const arr = window[name];
      if (!Array.isArray(arr)) continue;

      for (const r of arr) {
        if (!r || typeof r !== "object") continue;
        const question = r.q || r.question;
        const answer = r.a || r.answer;
        if (question && answer) {
          all.push({ question: String(question), answer: String(answer), source: name });
        }
      }
    }
    return all;
  }

  function search(query, limit) {
    const q = norm(query);
    if (!q) return [];

    const words = [...new Set(q.split(" ").filter(w => w.length > 1))];
    return records().map(r => {
      const question = norm(r.question);
      const answer = norm(r.answer);
      let score = question === q ? 100 : question.includes(q) ? 70 : 0;

      for (const w of words) {
        if (question.includes(w)) score += 3;
        else if (answer.includes(w)) score += 1;
      }
      return { ...r, score };
    })
    .filter(r => r.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(20, Number(limit) || 5)));
  }

  function ask(query) {
    const results = search(query, 5);
    return results.length
      ? { found: true, answer: results[0].answer, results }
      : { found: false, answer: "Loaded knowledge mein jawab nahi mila.", results: [] };
  }

  window.SuperAIKnowledgeHub = {
    search,
    ask,
    stats: () => ({
      sources: Object.keys(window).filter(
        n => n.startsWith("SuperAI_Knowledge_Mega_") &&
             Array.isArray(window[n])
      ).length,
      records: records().length
    })
  };
})();
