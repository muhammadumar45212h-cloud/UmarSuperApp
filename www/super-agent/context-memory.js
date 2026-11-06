(function (root) {
  "use strict";

  const KEY = "super_ai_context_v1";
  const MAX_ITEMS = 30;
  const MAX_TEXT = 1600;

  function clean(value) {
    return String(value == null ? "" : value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .slice(0, MAX_TEXT);
  }

  function read() {
    try {
      if (!root.localStorage) return [];
      const data = JSON.parse(root.localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data.slice(-MAX_ITEMS) : [];
    } catch (_) {
      return [];
    }
  }

  function write(items) {
    try {
      if (!root.localStorage) return false;
      root.localStorage.setItem(KEY, JSON.stringify(items.slice(-MAX_ITEMS)));
      return true;
    } catch (_) {
      return false;
    }
  }

  const api = {
    version: "1.0.0",

    add(role, text) {
      const allowed = ["user", "assistant"];
      if (!allowed.includes(role)) return false;

      const value = clean(text).trim();
      if (!value) return false;

      const items = read();
      items.push({ role, text: value, at: Date.now() });
      return write(items);
    },

    recent(limit) {
      const n = Math.max(1, Math.min(20, Number(limit) || 8));
      return read().slice(-n).map(x => ({
        role: x.role,
        text: x.text,
        at: x.at
      }));
    },

    clear() {
      try {
        if (root.localStorage) root.localStorage.removeItem(KEY);
        return true;
      } catch (_) {
        return false;
      }
    },

    stats() {
      return { entries: read().length, maxEntries: MAX_ITEMS };
    }
  };

  root.SuperAIContextMemory = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
