(function (root) {
  "use strict";

  const MAX_HISTORY = 12;
  const history = [];

  function safeText(value, max) {
    return String(value == null ? "" : value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .trim()
      .slice(0, max || 12000);
  }

  function addHistory(role, content) {
    if (!["user", "assistant"].includes(role)) return;
    const text = safeText(content, 3000);
    if (!text) return;

    history.push({ role, content: text });
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }
  }

  function analyze(question) {
    if (!root.SAOrchestrator) {
      return {
        ok: false,
        error: "agent_modules_not_loaded",
        message: "Super AI modules have not loaded in the expected order."
      };
    }

    return root.SAOrchestrator.analyze(safeText(question));
  }

  async function ask(question, options) {
    const q = safeText(question);
    if (!q) return { ok: false, error: "empty_question" };

    if (!root.SAOrchestrator) {
      return { ok: false, error: "agent_modules_not_loaded" };
    }

    addHistory("user", q);

    const result = await root.SAOrchestrator.ask(q, {
      ...(options || {}),
      history: history.slice(-MAX_HISTORY)
    });

    const data = result && result.answer;
    const answerText = data && (
      data.answer || data.reply || data.response ||
      (data.message && data.message.content)
    );

    if (result && result.ok && typeof answerText === "string" && answerText.trim()) {
      addHistory("assistant", answerText);
    }

    return result;
  }

  function status() {
    const diagnostics = root.SADiagnostics
      ? root.SADiagnostics.run()
      : { loaded: 0, total: 0, modules: {} };

    return {
      bridge: "ready",
      version: "1.0.0",
      diagnostics,
      backendPath: root.SAConfig && root.SAConfig.backend,
      historyMessages: history.length
    };
  }

  function clearHistory() {
    history.length = 0;
    return true;
  }

  root.SuperAIAdvanced = {
    version: "1.0.0",
    analyze,
    ask,
    status,
    clearHistory
  };
})(typeof window !== "undefined" ? window : globalThis);
