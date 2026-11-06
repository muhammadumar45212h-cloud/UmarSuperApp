(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.register=A.register||function(n,m){A.modules[n]=m;};
 A.normalize=A.normalize||function(s){return String(s||"").toLowerCase().replace(/\s+/g," ").trim();};
 A.register("scale-07-deduplicator", (function(){

return {run(items=[]) {
 const seen=new Set();
 return items.filter(x=>{
  const v=String(x.text||x.answer||x.title||JSON.stringify(x)).toLowerCase().replace(/\s+/g," ").trim();
  if(seen.has(v)) return false;
  seen.add(v); return true;
 });
}};

 })());
})();
