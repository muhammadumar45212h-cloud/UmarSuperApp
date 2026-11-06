(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 const hits=new Map();
 A.LocalRateLimit={
  check(key,{max=30,windowMs=60000}={}){
   key=String(key||"anonymous").slice(0,160);
   const now=Date.now(),cut=now-windowMs;
   let a=(hits.get(key)||[]).filter(t=>t>cut);
   if(a.length>=max){hits.set(key,a);return {ok:false,retryAfterMs:Math.max(1,a[0]+windowMs-now)}}
   a.push(now);hits.set(key,a);
   if(hits.size>2000){for(const [k,v] of hits)if(!v.some(t=>t>cut))hits.delete(k)}
   return {ok:true,remaining:Math.max(0,max-a.length)};
  },
  reset(key){return hits.delete(String(key||"anonymous").slice(0,160))}
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-28-rate-limit",A.LocalRateLimit);
})();
