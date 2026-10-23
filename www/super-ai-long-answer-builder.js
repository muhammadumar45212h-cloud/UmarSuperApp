(function(){
const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
A.register("long-answer-builder",{
 run(q,results,ctx){
  const list=Array.isArray(results)?results:[];
  const seen=new Set(), usable=[];
  for(const r of list){
   const a=String(r&&r.answer||"").trim();
   if(a&&!seen.has(a)){seen.add(a);usable.push(r);}
  }
  if(!usable.length)return {answer:null,hasEvidence:false};
  const sections=usable.slice(0,4).map((r,i)=>
   (usable.length>1?`${i+1}. ${r.topic||r.id||"Related information"}\n`:"")+r.answer
  );
  return {
   answer:sections.join("\n\n"),
   hasEvidence:true,
   matchedTopics:usable.map(x=>x.topic||x.id).filter(Boolean),
   note:"Yeh jawab local knowledge entries se tayyar hua hai; current ya high-stakes facts ko independent source se verify karein."
  };
 }
});
})();
