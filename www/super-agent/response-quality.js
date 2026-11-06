(function (root) {
  "use strict";

  function review(answer) {
    const text = String(answer == null ? "" : answer).trim();
    const issues = [];

    if (!text) issues.push("empty_answer");
    if (text.length > 12000) issues.push("answer_too_long");

    const unsupportedClaims = [
      /\bI have (?:sent|paid|deleted|installed|published)\b/i,
      /\bI successfully (?:ran|deployed|connected|booked)\b/i
    ];

    if (unsupportedClaims.some(pattern => pattern.test(text))) {
      issues.push("verify_action_claim");
    }

    return {
      ok: issues.length === 0,
      characterCount: text.length,
      issues,
      suggestion: issues.includes("verify_action_claim")
        ? "Claim the action only after a real tool confirms success."
        : issues.includes("empty_answer")
          ? "Generate a useful answer before displaying it."
          : "Answer passed basic checks; this is not a factuality guarantee."
    };
  }

  root.SuperAIResponseQuality = { version: "1.0.0", review };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.SuperAIResponseQuality;
  }
})(typeof window !== "undefined" ? window : globalThis);
