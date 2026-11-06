(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("01-text-normalizer", (function(){
    return {run(q){return String(q||"").normalize("NFKC").replace(/\s+/g," ").trim();}};
  })());
})();
