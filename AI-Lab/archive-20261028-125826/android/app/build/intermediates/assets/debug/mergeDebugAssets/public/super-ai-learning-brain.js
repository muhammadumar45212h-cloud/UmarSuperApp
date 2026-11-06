(function () {
  "use strict";

  const KEY = "SUPER_AI_LEARNED_KNOWLEDGE_V1";

  function norm(s) {
    return String(s || "").toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ").trim();
  }

  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return [];
    }
  }

  function save(rows) {
    try {
      localStorage.setItem(KEY, JSON.stringify(rows));
      return true;
    } catch (e) {
      console.error("[Super AI] Local save failed:", e);
      return false;
    }
  }

  function teach(question, answer) {
    question = String(question || "").trim();
    answer = String(answer || "").trim();

    if (!question || !answer) {
      return { ok: false, message: "Sawal aur jawab dono likhein." };
    }
    if (question.length > 1000 || answer.length > 10000) {
      return { ok: false, message: "Sawal ya jawab bohat lamba hai." };
    }

    const rows = read();
    const key = norm(question);
    const existing = rows.findIndex(r => norm(r.question) === key);
    const item = {
      question,
      answer,
      updatedAt: new Date().toISOString()
    };

    if (existing >= 0) rows[existing] = item;
    else rows.push(item);

    if (!save(rows)) {
      return { ok: false, message: "Device storage mein save nahi ho saka." };
    }

    return { ok: true, message: "Jawab save ho gaya.", total: rows.length };
  }

  function find(question) {
    const key = norm(question);
    const rows = read();
    const exact = rows.find(r => norm(r.question) === key);

    if (exact) {
      return {
        found: true,
        answer: exact.answer,
        question: exact.question,
        match: "learned"
      };
    }

    if (window.SuperAIKnowledgeHub) {
      const result = window.SuperAIKnowledgeHub.ask(question);
      if (result && result.found && result.answer) {
        return { ...result, match: "knowledge" };
      }
    }

    return { found: false, answer: "", match: "none" };
  }

  function teachCommand(text) {
    const m = String(text || "").match(
      /^SIKHAO\s*:\s*(.+?)\s*\|\s*([\s\S]+)$/i
    );
    return m ? teach(m[1], m[2]) : null;
  }

  function stats() {
    return {
      learnedQuestions: read().length,
      storage: "local device",
      hubAvailable: !!window.SuperAIKnowledgeHub
    };
  }

  window.SuperAILearningBrain = { teach, find, stats, teachCommand };
  console.log("[Super AI] Learning Brain ready.", stats());
})();
