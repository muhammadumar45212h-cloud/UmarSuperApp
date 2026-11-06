(function (root) {
  "use strict";

  function getModule(name) {
    return root[name] || null;
  }

  function makePlan(question, route) {
    const steps = [
      "Understand the user's goal and constraints.",
      "Choose the relevant knowledge or tool.",
      "Check missing information and safety requirements.",
      "Prepare the answer or proposed action.",
      "Verify the result before reporting completion."
    ];

    if (route.tool === "code_helper") {
      steps[1] = "Inspect the existing code and identify the relevant files.";
      steps[2] = "Check compatibility, backups and possible side effects.";
      steps[3] = "Prepare a minimal patch and syntax tests.";
    } else if (route.tool === "calculator") {
      steps[1] = "Identify the numbers, units and requested operation.";
      steps[2] = "Check the calculation method and assumptions.";
      steps[3] = "Calculate the result and show the working when useful.";
    } else if (route.tool === "planner") {
      steps[1] = "Break the goal into achievable milestones.";
      steps[2] = "Identify dependencies, risks and required resources.";
      steps[3] = "Order the milestones into a practical action plan.";
    }

    return {
      goal: question,
      selectedTool: route.tool,
      steps,
      status: "proposed_not_executed"
    };
  }

  function assess(question) {
    const input = String(question || "").trim();

    if (!input) {
      return {
        ok: false,
        error: "empty_question",
        message: "Please enter a question or task."
      };
    }

    const router = getModule("SuperAIToolRouter");
    const policy = getModule("SuperAIActionPolicy");
    const memory = getModule("SuperAIContextMemory");

    const route = router
      ? router.classify(input)
      : { tool: "conversation", confidence: 0.2, reason: "router_not_loaded" };

    const safety = policy
      ? policy.review(input)
      : {
          requiresConfirmation: true,
          mayExecuteAutomatically: false,
          matchedRules: ["safety_module_missing"]
        };

    const context = memory
      ? memory.recent(6)
      : [];

    return {
      ok: true,
      version: "1.0.0",
      question: input,
      intent: route,
      plan: makePlan(input, route),
      safety,
      context,
      execution: {
        performed: false,
        note: "This brain plans and assesses tasks; it does not execute tools or perform external actions."
      }
    };
  }

  root.SuperAIBrain = {
    version: "1.0.0",
    assess
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.SuperAIBrain;
  }
})(typeof window !== "undefined" ? window : globalThis);
