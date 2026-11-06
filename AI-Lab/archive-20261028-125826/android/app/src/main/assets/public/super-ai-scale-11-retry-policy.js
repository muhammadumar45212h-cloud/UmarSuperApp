(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.register=A.register||function(n,m){A.modules[n]=m;};
 A.normalize=A.normalize||function(s){return String(s||"").toLowerCase().replace(/\s+/g," ").trim();};
 A.register("scale-11-retry-policy", (function(){

return {run(attempt=0,maxRetries=2,baseMs=300) {
 const n=Math.max(0,Math.min(Number(attempt)||0,Number(maxRetries)||0));
 return {retry:n<maxRetries,delayMs:Math.min(5000,baseMs*(2**n))};
}};

 })());
})();
