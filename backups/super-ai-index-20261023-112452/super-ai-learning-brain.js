(function () {
  "use strict";

  const STORAGE_KEY = "SUPER_AI_LEARNED_KNOWLEDGE_V1";

  function normalize(text) {
    return String(text || "").toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return [];
    }
  }

  function save(rows) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
      return true;
    } catch (_) {
      return false;
    }
  }

  function teach(question, answer) {
    question = String(question || "").trim();
    answer = String(answer || "").trim();

    if (question.length < 2 || answer.length < 1) {
      return { ok: false, message: "Sawal aur jawab dono likho." };
    }
    if (question.length > 1000 || answer.length > 8000) {
      return { ok: false, message: "Sawal ya jawab bohat lamba hai." };
    }

    const rows = read();
    const key = normalize(question);
    const index = rows.findIndex(r => normalize(r.question) === key);
    const entry = {
      question,
      answer,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) rows[index] = entry;
    else rows.push(entry);

    if (!save(rows)) {
      return { ok: false, message: "Device storage full ya unavailable hai." };
    }

    return { ok: true, message: "Sawal-jawab save ho gaya.", total: rows.length };
  }

  function find(question) {
    const key = normalize(question);
    const rows = read();
    const exact = rows.find(r => normalize(r.question) === key);

    if (exact) {
      return {
        found: true,
        answer: exact.answer,
        question: exact.question,
        match: "exact"
      };
    }

    if (window.SuperAIKnowledgeHub) {
      const result = window.SuperAIKnowledgeHub.ask(question);
      if (result && result.found) {
        return {
          found: true,
          answer: result.answer,
          question: question,
          match: "knowledge-hub",
          confidence: result.confidence
        };
      }
    }

    return { found: false, answer: "", match: "none" };
  }

  function stats() {
    return {
      learnedQuestions: read().length,
      storage: "local device",
      hubAvailable: !!window.SuperAIKnowledgeHub
    };
  }

  function teachCommand(text) {
    const m = String(text || "").match(/^SIKHAO\s*:\s*(.+?)\s*\|\s*([\s\S]+)$/i);
    if (!m) return null;
    return teach(m[1], m[2]);
  }

  window.SuperAILearningBrain = {
    teach,
    find,
    stats,
    teachCommand
  };

  console.log("[Super AI] Learning Brain ready.", stats());
})();
