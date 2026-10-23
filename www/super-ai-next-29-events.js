(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 const handlers=new Map();
 A.Events={
  on(name,fn){
   if(typeof fn!=="function")return ()=>{};
   if(!handlers.has(name))handlers.set(name,new Set());
   handlers.get(name).add(fn);return ()=>handlers.get(name)?.delete(fn);
  },
  emit(name,payload){
   for(const fn of handlers.get(name)||[]){
    try{fn(payload)}catch(e){console.error("SuperAI event handler failed",name,e)}
   }
  },
  clear(name){if(name)handlers.delete(name);else handlers.clear()},
  names(){return [...handlers.keys()]}
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-29-events",A.Events);
})();
