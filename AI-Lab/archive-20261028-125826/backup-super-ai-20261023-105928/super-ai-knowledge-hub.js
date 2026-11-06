(function () {
  const names = [
    "SuperAI_Knowledge_Mega_Finance",
    "SuperAI_Knowledge_Mega_Programming",
    "SuperAI_Knowledge_Mega_Geography",
    "SuperAI_Knowledge_Mega_Environment"
  ];
  function norm(s) {
    return String(s || "").toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  }
  function search(query, limit) {
    const q = norm(query);
    if (!q) return [];
    const words = q.split(" ").filter(w => w.length > 1);
    return names.flatMap(n => Array.isArray(window[n]) ? window[n] : [])
      .map(r => {
        const question = norm(r.q);
        const combined = norm(r.q + " " + r.a);
        let score = question === q ? 100 : question.includes(q) ? 70 : 0;
        words.forEach(w => { if (combined.includes(w)) score += 2; });
        return {...r, score};
      })
      .filter(r => r.score > 0)
      .sort((a,b) => b.score-a.score)
      .slice(0, Math.max(1, Math.min(20, Number(limit) || 5)));
  }
  function ask(q) {
    const results = search(q, 5);
    return results.length
      ? {found:true, answer:results[0].a, results}
      : {found:false, answer:"Loaded knowledge files mein jawab nahi mila.", results:[]};
  }
  window.SuperAIKnowledgeHub = {
    search, ask,
    stats: () => ({
      sources: names.filter(n => Array.isArray(window[n])).length,
      records: names.reduce((sum,n) => sum + (Array.isArray(window[n]) ? window[n].length : 0), 0)
    })
  };
})();
