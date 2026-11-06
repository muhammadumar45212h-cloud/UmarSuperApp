(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("16-summary-helper", (function(){
    return {run(text,max=5){const s=String(text||"");return s.split(/(?<=[.!?۔])\s+/).filter(Boolean).slice(0,Math.max(1,Math.min(10,Number(max)||5)));}};
  })());
})();
