(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 const KEY="super_ai_next_memory_v1",MAX=300;
 function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(x)?x:[]}catch(e){return []}}
 function write(a){try{localStorage.setItem(KEY,JSON.stringify(a.slice(-MAX)));return true}catch(e){return false}}
 A.LongMemory={
  add(text,tags=[]){
   text=String(text||"").trim().slice(0,3000);if(!text)return false;
   const a=read();a.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),text,tags:Array.isArray(tags)?tags.slice(0,10):[],createdAt:Date.now()});
   return write(a);
  },
  search(q,limit=5){
   const terms=String(q||"").toLowerCase().split(/\W+/).filter(x=>x.length>2);
   return read().map(x=>({...x,score:terms.reduce((n,t)=>n+(x.text.toLowerCase().includes(t)?1:0),0)}))
    .filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,Math.max(1,Math.min(20,limit)));
  },
  list(){return read()},
  remove(id){return write(read().filter(x=>x.id!==id))},
  clear(){try{localStorage.removeItem(KEY);return true}catch(e){return false}}
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-23-memory",A.LongMemory);
})();
