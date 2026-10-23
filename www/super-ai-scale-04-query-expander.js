(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.register=A.register||function(n,m){A.modules[n]=m;};
 A.normalize=A.normalize||function(s){return String(s||"").toLowerCase().replace(/\s+/g," ").trim();};
 A.register("scale-04-query-expander", (function(){

return {run(q) {
 const s=String(q||"").trim();
 const variants=[s];
 if(s.includes("?")) variants.push(s.replace(/\?/g,"").trim());
 if(s.length>8) variants.push(s.split(/\s+/).filter(x=>x.length>2).join(" "));
 return [...new Set(variants)].filter(Boolean).slice(0,5);
}};

 })());
})();
