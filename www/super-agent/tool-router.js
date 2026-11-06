(function (root) {
  "use strict";

  const ROUTES = [
    {
      tool: "calculator",
      patterns: [/\bcalculate\b/i, /\bwhat is \d/i, /\bpercent(age)?\b/i,
                 /hisab/i, /kitna percent/i, /jama karo/i]
    },
    {
      tool: "code_helper",
      patterns: [/\b(code|debug|compile|javascript|python|html|css)\b/i,
                 /error fix/i, /bug fix/i, /termux/i]
    },
    {
      tool: "planner",
      patterns: [/\b(plan|roadmap|steps|schedule|strategy)\b/i,
                 /kaise shuru/i, /plan banao/i]
    },
    {
      tool: "knowledge",
      patterns: [/\b(explain|meaning|define|compare|why|how)\b/i,
                 /samjhao/i, /kya hota/i, /kyun/i, /farq batao/i]
    },
    {
      tool: "conversation",
      patterns: [/./]
    }
  ];

  function classify(input) {
    const text = String(input || "").trim();
    if (!text) {
      return { tool: "conversation", confidence: 0, reason: "empty_input" };
    }

    for (const route of ROUTES) {
      if (route.patterns.some(pattern => pattern.test(text))) {
        return {
          tool: route.tool,
          confidence: route.tool === "conversation" ? 0.35 : 0.75,
          reason: "matched_intent"
        };
      }
    }

    return {
      tool: "conversation",
      confidence: 0.3,
      reason: "default_route"
    };
  }

  root.SuperAIToolRouter = { version: "1.0.0", classify };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.SuperAIToolRouter;
  }
})(typeof window !== "undefined" ? window : globalThis);
