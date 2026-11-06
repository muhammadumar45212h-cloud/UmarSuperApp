(function(){
const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
A.register("question-decomposer",{
 run(q){
  const s=String(q||"").trim();
  const parts=s.split(/\?\s+|;\s+|\n+|(?:\band\b|\baur\b|\balso\b)\s+/i)
    .map(x=>x.trim()).filter(x=>x.length>3).slice(0,8);
  return {original:s,parts:parts.length?parts:[s],multiPart:parts.length>1};
 }
});
})();
