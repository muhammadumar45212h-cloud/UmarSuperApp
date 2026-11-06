(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("12-code-inspector", (function(){
    return {run(code){const s=String(code||"");return {characters:s.length,lines:s.split(/\r?\n/).length,hasEval:/\beval\s*\(/.test(s),hasDynamicFunction:/new\s+Function\s*\(/.test(s),hasTODO:/TODO|FIXME/.test(s),warnings:[/\beval\s*\(/.test(s)?"eval() review required":null, /innerHTML\s*=/.test(s)?"innerHTML may need sanitization":null].filter(Boolean)};}};
  })());
})();
