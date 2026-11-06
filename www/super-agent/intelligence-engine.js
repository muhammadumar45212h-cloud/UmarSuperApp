(function (root) {
  "use strict";

  const MAX_INPUT = 12000;

  function moduleOf(name) {
    return root[name] || null;
  }

  function clean(text) {
    return String(text == null ? "" : text)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .trim()
      .slice(0, MAX_INPUT);
  }

  function analyze(question) {
    const input = clean(question);
    if (!input) {
      return {ok:false, error:"empty_input", message:"Please enter a task."};
    }

    const router = moduleOf("SuperAIToolRouter");
    const brain = moduleOf("SuperAIBrain");
    const policy = moduleOf("SuperAIActionPolicy");
    const index = moduleOf("SuperAIKnowledgeIndex");
    const memory = moduleOf("SuperAIContextMemory");

    const intent = router
      ? router.classify(input)
      : {tool:"conversation", confidence:0.2, reason:"router_missing"};

    const safety = policy
      ? policy.review(input)
      : {requiresConfirmation:true, matchedRules:["policy_module_missing"]};

    const plan = brain
      ? brain.assess(input)
      : {plan:{goal:input, steps:["Understand request","Prepare response","Verify result"]}};

    const topics = index ? index.search(input) : [];
    const context = memory ? memory.recent(8) : [];

    return {
      ok:true,
      engine:"SuperAI Intelligence Engine",
      version:"1.0.0",
      analysis:{
        characterCount:input.length,
        intent,
        relevantTopics:topics,
        contextAvailable:context.length > 0
      },
      plan:plan.plan || plan,
      safety,
      context,
      execution:{
        started:false,
        toolsCalled:[],
        reason:"Analysis only; no external action was executed."
      }
    };
  }

  function summarize(question) {
    const result = analyze(question);
    if (!result.ok) return result.message;

    const topics = result.analysis.relevantTopics
      .map(item => item.topic)
      .join(", ") || "general";

    const steps = result.plan.steps || [];

    return [
      "Super AI task analysis",
      "Intent: " + result.analysis.intent.tool,
      "Relevant topics: " + topics,
      "Plan:",
      ...steps.map((step, i) => (i + 1) + ". " + step),
      result.safety.requiresConfirmation
        ? "Safety: confirmation may be required before action."
        : "Safety: no sensitive keyword detected; review is still necessary.",
      "Note: this analysis does not execute actions."
    ].join("\n");
  }

  root.SuperAIIntelligenceEngine = {
    version:"1.0.0",
    analyze,
    summarize
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.SuperAIIntelligenceEngine;
  }
})(typeof window !== "undefined" ? window : globalThis);
