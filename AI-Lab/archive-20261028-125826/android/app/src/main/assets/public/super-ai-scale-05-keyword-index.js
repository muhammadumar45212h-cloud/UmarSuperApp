(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.register=A.register||function(n,m){A.modules[n]=m;};
 A.normalize=A.normalize||function(s){return String(s||"").toLowerCase().replace(/\s+/g," ").trim();};
 A.register("scale-05-keyword-index", (function(){

return {run(records=[]) {
 const index={};
 for(const [i,r] of records.entries()) {
  const s=String((r.title||"")+" "+(r.text||"")+" "+(r.topic||"")).toLowerCase();
  for(const w of s.match(/[\p{L}\p{N}]{3,}/gu)||[]) {
   (index[w]=index[w]||[]).push(i);
  }
 }
 return index;
}};

 })());
})();
