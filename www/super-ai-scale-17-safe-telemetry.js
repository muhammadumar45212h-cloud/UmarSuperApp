(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.register=A.register||function(n,m){A.modules[n]=m;};
 A.normalize=A.normalize||function(s){return String(s||"").toLowerCase().replace(/\s+/g," ").trim();};
 A.register("scale-17-safe-telemetry", (function(){

return {run(event={}) {
 const allowed=["type","durationMs","success","module","statusCode"];
 const clean={time:new Date().toISOString()};
 for(const k of allowed) if(event[k]!==undefined) clean[k]=event[k];
 return clean;
}};

 })());
})();
