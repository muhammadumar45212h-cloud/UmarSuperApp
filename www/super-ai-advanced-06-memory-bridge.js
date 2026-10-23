(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("06-memory-bridge", (function(){
    return {run(q){const m=window.SuperAIMemory;if(!m)return {available:false};try{return {available:true,history:m.history(),learned:m.learned()};}catch(e){return {available:true,error:String(e)};}}};
  })());
})();
