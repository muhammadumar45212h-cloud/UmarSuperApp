(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("02-language-detector", (function(){
    return {run(q){q=String(q||"");return {urdu:/[\u0600-\u06FF]/.test(q),romanUrdu:/\b(kya|hai|hain|kaise|kyun|mujhe|tum|apko|bhego|samjhe)\b/i.test(q),english:/[a-z]/i.test(q)};}};
  })());
})();
