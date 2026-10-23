(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("13-security-check", (function(){
    return {run(q){const s=String(q||"");const flags=[];if(/password|api.?key|secret|token/i.test(s))flags.push("possible_secret");if(/eval\s*\(|innerHTML/i.test(s))flags.push("unsafe_code_pattern");return {flags,reviewRecommended:flags.length>0};}};
  })());
})();
