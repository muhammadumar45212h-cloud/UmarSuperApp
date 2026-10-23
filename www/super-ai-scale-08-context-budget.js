(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.register=A.register||function(n,m){A.modules[n]=m;};
 A.normalize=A.normalize||function(s){return String(s||"").toLowerCase().replace(/\s+/g," ").trim();};
 A.register("scale-08-context-budget", (function(){

return {run(items=[],maxChars=12000) {
 let used=0,out=[];
 for(const item of items) {
  const s=typeof item==="string"?item:JSON.stringify(item);
  if(used+s.length>maxChars) continue;
  out.push(item); used+=s.length;
 }
 return {items:out,usedChars:used,maxChars};
}};

 })());
})();
