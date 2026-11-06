(function () {
  "use strict";

  const HISTORY_KEY = "super_ai_chat_history_v1";
  const LEARN_KEY = "super_ai_learned_answers_v1";

  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  window.SuperAIMemory = {
    history() {
      return read(HISTORY_KEY, []).slice(-80);
    },

    saveMessage(role, text) {
      const list = read(HISTORY_KEY, []);
      list.push({
        role: String(role).slice(0, 20),
        text: String(text).slice(0, 3000),
        at: Date.now()
      });
      return write(HISTORY_KEY, list.slice(-80));
    },

    learned() {
      return read(LEARN_KEY, {});
    },

    learn(question, answer) {
      const q = String(question || "").trim().slice(0, 300);
      const a = String(answer || "").trim().slice(0, 1500);
      if (!q || !a) return false;

      const data = read(LEARN_KEY, {});
      data[q.toLowerCase()] = { question: q, answer: a };
      return write(LEARN_KEY, data);
    },

    forgetLearned() {
      try {
        localStorage.removeItem(LEARN_KEY);
        return true;
      } catch (_) {
        return false;
      }
    },

    clearHistory() {
      try {
        localStorage.removeItem(HISTORY_KEY);
        return true;
      } catch (_) {
        return false;
      }
    }
  };
})();
