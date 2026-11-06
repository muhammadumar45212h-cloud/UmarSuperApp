(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("14-health-caution", (function(){
    return {run(q){const s=String(q||"");const sensitive=/chest pain|can't breathe|cannot breathe|suicide|overdose|severe bleeding|seene mein dard|saans nahi/i.test(s);return {urgent:sensitive,notice:sensitive?"Possible emergency: seek local emergency medical help now. This module is not a diagnosis.":""};}};
  })());
})();
