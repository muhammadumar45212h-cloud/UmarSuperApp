(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.register=A.register||function(n,m){A.modules[n]=m;};
 A.normalize=A.normalize||function(s){return String(s||"").toLowerCase().replace(/\s+/g," ").trim();};
 A.register("scale-06-retrieval-ranker", (function(){

return {run(q,records=[]) {
 const words=new Set(String(q||"").toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[]);
 return records.map((r,i)=>{
  const s=String((r.title||"")+" "+(r.text||"")+" "+(r.topic||"")).toLowerCase();
  let score=0;
  for(const w of words) if(s.includes(w)) score+=1+(w.length>6?0.25:0);
  if(String(r.title||"").toLowerCase()===String(q||"").toLowerCase()) score+=5;
  return {record:r,score,index:i};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,10);
}};

 })());
})();
