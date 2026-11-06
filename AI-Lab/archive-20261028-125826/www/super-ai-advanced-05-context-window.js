(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("05-context-window", (function(){
    return {run(q,c){const h=Array.isArray(c.history)?c.history:[];return {question:String(q||""),recent:h.slice(-12),count:h.length};}};
  })());
})();
