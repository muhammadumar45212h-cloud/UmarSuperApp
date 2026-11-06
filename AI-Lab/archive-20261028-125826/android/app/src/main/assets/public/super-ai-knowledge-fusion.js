(function(){
const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
A.register("knowledge-fusion",{
 run(q,ctx){
  const results=[];
  const modules=A.modules||{};
  for(const [name,m] of Object.entries(modules)){
   if(name==="knowledge-fusion"||!m||typeof m.run!=="function")continue;
   try{
    const r=m.run(q,ctx||{});
    if(Array.isArray(r)) for(const x of r) if(x&&x.answer)results.push({...x,module:name});
    else if(r&&r.answer)results.push({...r,module:name});
   }catch(e){console.warn("Knowledge module failed:",name,e);}
  }
  const unique=new Map();
  for(const r of results){
   const key=String(r.id||r.answer).slice(0,160);
   if(!unique.has(key)||Number(r.score||0)>Number(unique.get(key).score||0))unique.set(key,r);
  }
  return [...unique.values()].sort((a,b)=>Number(b.score||0)-Number(a.score||0)).slice(0,8);
 }
});
})();
