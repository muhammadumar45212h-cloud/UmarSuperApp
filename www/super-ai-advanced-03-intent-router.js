(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("03-intent-router", (function(){
    const rules=[["greeting",/\b(hello|salam|assalam|hi|hey)\b/i],["math",/[0-9]+\s*[+\-*\/%]\s*[0-9]+/],["coding",/\b(code|javascript|python|bug|error|function|program)\b/i],["learning",/\b(learn|sikhao|samjhao|explain|seekhna)\b/i],["planning",/\b(plan|roadmap|steps|schedule|mansuba)\b/i]];
return {run(q){let s=String(q||"");return (rules.find(x=>x[1].test(s))||["general"])[0];}};
  })());
})();
