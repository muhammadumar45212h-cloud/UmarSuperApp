(function () {
  "use strict";

  const KEY = "super_ai_learning_loop_v1";
  const MAX_ITEMS = 5000;
  const api = window.SuperAILearning = window.SuperAILearning || {};

  function clean(value, max = 5000) {
    return String(value == null ? "" : value).trim().slice(0, max);
  }

  function normalize(value) {
    return clean(value, 1000).toLowerCase()
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

  function write(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items.slice(-MAX_ITEMS)));
      return true;
    } catch (_) {
      return false;
    }
  }

  // Call after chatbot has a question and a proposed answer.
  // Unverified exchanges are saved as experiences, not trusted facts.
  api.recordExchange = function (question, answer, meta = {}) {
    question = clean(question, 2000);
    answer = clean(answer, 5000);
    if (!question || !answer) return { ok: false, reason: "empty" };

    const items = read();
    const q = normalize(question);
    const existing = items.findIndex(x =>
      x.kind === "exchange" && normalize(x.question) === q
    );

    const item = {
      kind: "exchange",
      question,
      answer,
      confidence: "unverified",
      feedback: null,
      createdAt: new Date().toISOString(),
      source: clean(meta.source || "chat", 80)
    };

    if (existing >= 0) items[existing] = item;
    else items.push(item);

    return { ok: write(items), count: items.length };
  };

  // User explicitly teaches or corrects an answer.
  api.teach = function (question, answer) {
    question = clean(question, 2000);
    answer = clean(answer, 5000);
    if (!question || !answer) return { ok: false, reason: "empty" };

    const items = read();
    const q = normalize(question);
    const item = {
      kind: "taught",
      question,
      answer,
      confidence: "user-taught-not-verified",
      feedback: null,
      createdAt: new Date().toISOString(),
      source: "user"
    };

    const existing = items.findIndex(x =>
      x.kind === "taught" && normalize(x.question) === q
    );
    if (existing >= 0) items[existing] = item;
    else items.push(item);

    return { ok: write(items), count: items.length };
  };

  // Returns user-taught answers first. Caller should treat them as unverified.
  api.find = function (question) {
    const q = normalize(question);
    if (!q) return null;

    const items = read();
    const exact = items.slice().reverse().find(x =>
      normalize(x.question) === q && x.kind === "taught"
    );
    if (exact) return exact;

    return items.slice().reverse().find(x =>
      normalize(x.question) === q && x.kind === "exchange"
    ) || null;
  };

  api.feedback = function (question, vote, correction) {
    const q = normalize(question);
    if (!q) return { ok: false };

    const items = read();
    const matches = items.filter(x => normalize(x.question) === q);
    if (!matches.length && correction) {
      return api.teach(question, correction);
    }
    matches.forEach(x => {
      x.feedback = vote === "helpful" ? "helpful" : "needs-review";
      x.feedbackAt = new Date().toISOString();
    });

    const ok = write(items);
    if (correction) {
      const taught = api.teach(question, correction);
      return { ok: ok && taught.ok, corrected: true };
    }
    return { ok };
  };

  api.list = function (limit = 50) {
    const n = Math.max(1, Math.min(500, Number(limit) || 50));
    return read().slice(-n);
  };

  api.stats = function () {
    const items = read();
    return {
      total: items.length,
      taught: items.filter(x => x.kind === "taught").length,
      exchanges: items.filter(x => x.kind === "exchange").length,
      needsReview: items.filter(x => x.feedback === "needs-review").length
    };
  };

  api.forget = function () {
    try {
      localStorage.removeItem(KEY);
      return true;
    } catch (_) {
      return false;
    }
  };

  console.log("SuperAI Learning Loop ready", api.stats());
})();
