(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("17-translation-hints", (function(){
    return {run(q){const s=String(q||"");return {containsArabicScript:/[\u0600-\u06FF]/.test(s),romanUrdu:/\b(hai|hain|kya|kaise|mujhe|samjhao)\b/i.test(s),hint:"Language detect karna translation nahi hai; translation ke liye verified dictionary ya translation engine chahiye."};}};
  })());
})();
