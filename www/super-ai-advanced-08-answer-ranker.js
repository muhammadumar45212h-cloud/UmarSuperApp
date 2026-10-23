(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("08-answer-ranker", (function(){
    return {run(candidates){return (Array.isArray(candidates)?candidates:[]).map((x,i)=>({value:x,score:Math.max(0,1-i*0.08)})).sort((a,b)=>b.score-a.score);}};
  })());
})();
