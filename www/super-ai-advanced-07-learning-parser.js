(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("07-learning-parser", (function(){
    return {run(q){const s=String(q||"");const m=s.match(/^\s*(?:SIKHAO|TEACH)\s*:\s*([^|]+)\|\s*(.+)$/i);return m?{valid:true,question:m[1].trim(),answer:m[2].trim()}:{valid:false};}};
  })());
})();
