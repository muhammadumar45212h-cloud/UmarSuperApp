(function (root) {
  "use strict";

  const RULES = [
    {
      name: "financial_action",
      pattern: /\b(pay|payment|transfer|withdraw|purchase|buy now|send money)\b|paisa bhej|paise bhej|payment karo/i
    },
    {
      name: "destructive_action",
      pattern: /\b(delete|erase|remove all|format disk|drop database)\b|sab mita|database ura/i
    },
    {
      name: "account_or_security_change",
      pattern: /\b(change password|reset password|disable security|revoke access)\b|password badlo/i
    },
    {
      name: "external_publication",
      pattern: /\b(publish|post publicly|send email|message everyone|deploy to production)\b|public post karo/i
    },
    {
      name: "device_or_system_control",
      pattern: /\b(run shell|execute command|install package|control device|shutdown computer)\b|command chalao/i
    }
  ];

  function review(action) {
    const text = String(action || "").trim();
    const matches = RULES.filter(rule => rule.pattern.test(text));

    return {
      allowedToPlan: true,
      mayExecuteAutomatically: matches.length === 0,
      requiresConfirmation: matches.length > 0,
      matchedRules: matches.map(rule => rule.name),
      message: matches.length
        ? "Sensitive action: explain the action and obtain explicit user confirmation before execution."
        : "No sensitive keyword detected. This is not proof that the action is safe."
    };
  }

  root.SuperAIActionPolicy = { version: "1.0.0", review };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.SuperAIActionPolicy;
  }
})(typeof window !== "undefined" ? window : globalThis);
