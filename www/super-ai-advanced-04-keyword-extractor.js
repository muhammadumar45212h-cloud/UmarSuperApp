(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register("04-keyword-extractor", (function(){
    return {run(q){const stop=new Set(["the","and","hai","hain","ka","ki","ke","ko","me","mein","is","a","an","to","of","what","kya"]);return [...new Set(String(q||"").toLowerCase().match(/[\p{L}\p{N}]+/gu)||[])].filter(x=>x.length>2&&!stop.has(x)).slice(0,30);}};
  })());
})();
