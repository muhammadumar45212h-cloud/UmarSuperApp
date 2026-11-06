(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.register=A.register||function(n,m){A.modules[n]=m;};
 A.normalize=A.normalize||function(s){return String(s||"").toLowerCase().replace(/\s+/g," ").trim();};
 A.register("scale-03-question-router", (function(){

return {run(q) {
 const s=String(q||"").toLowerCase();
 const routes=[
  ["coding",/\b(code|javascript|python|bug|program|error)\b/],
  ["math",/\d+\s*[+\-*\/%]\s*\d+/],
  ["science",/\b(science|physics|chemistry|biology)\b/],
  ["space",/\b(space|planet|rocket|universe|orbit)\b/],
  ["health",/\b(health|medicine|symptom|doctor|medical)\b/],
  ["business",/\b(business|customer|selling|profit|order)\b/],
  ["education",/\b(explain|learn|teach|study|samjhao|sikhao)\b/]
 ];
 const matches=routes.filter(x=>x[1].test(s)).map(x=>x[0]);
 return {primary:matches[0]||"general",topics:matches,questionLength:s.length};
}};

 })());
})();
