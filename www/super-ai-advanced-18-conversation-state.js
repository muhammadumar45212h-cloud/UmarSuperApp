(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("18-conversation-state", (function(){
    return {run(q,c){const h=Array.isArray(c.history)?c.history:[];return {turnCount:h.length+1,hasPreviousTurn:h.length>0,lastRole:h.length?h[h.length-1].role:null,questionLength:String(q||"").length};}};
  })());
})();
