(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("09-clarification", (function(){
    return {run(q){const s=String(q||"").trim();if(s.length<3)return {needsClarification:true,reason:"question_too_short"};if(/^(it|this|that|ye|woh|usko|isko)$/i.test(s))return {needsClarification:true,reason:"missing_context"};return {needsClarification:false};}};
  })());
})();
