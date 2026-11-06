(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("11-math-parser", (function(){
    return {run(q){const s=String(q||"").trim();if(!/^[\d\s()+\-*/%.]+$/.test(s)||!/[+\-*/%]/.test(s))return null;try{const tokens=s.match(/\d+(?:\.\d+)?|[()+\-*/%]/g)||[];if(tokens.join("")!==s.replace(/\s/g,""))return null;return {expression:s,note:"Expression identified; use a dedicated safe parser for evaluation."};}catch(e){return null;}}};
  })());
})();
