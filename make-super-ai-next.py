from pathlib import Path

root = Path("www")
root.mkdir(exist_ok=True)

files = {
"super-ai-next-21-policy.js": r'''
(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.Policy={
  version:1,
  limits:{questionChars:12000,contextItems:12,answerChars:24000},
  check(q){
   q=String(q??"");
   if(!q.trim())return {ok:false,reason:"empty_question"};
   if(q.length>this.limits.questionChars)return {ok:false,reason:"question_too_long"};
   return {ok:true,normalized:q.trim()};
  },
  clampText(s,max=this.limits.answerChars){
   return String(s??"").slice(0,max);
  }
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-21-policy",A.Policy);
})();
''',
"super-ai-next-22-session.js": r'''
(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 const sessions=new Map();
 const MAX=1000;
 function get(id){
  id=String(id||"anonymous").slice(0,160);
  if(!sessions.has(id)){
   if(sessions.size>=MAX)sessions.delete(sessions.keys().next().value);
   sessions.set(id,{id,createdAt:Date.now(),updatedAt:Date.now(),turns:0,metadata:{}});
  }
  const s=sessions.get(id);s.updatedAt=Date.now();return s;
 }
 A.Session={
  get,
  nextTurn(id){const s=get(id);s.turns++;return s.turns;},
  setMetadata(id,key,value){
   const s=get(id);if(!/^[a-zA-Z0-9_-]{1,50}$/.test(key))return false;
   s.metadata[key]=value;return true;
  },
  snapshot(id){return JSON.parse(JSON.stringify(get(id)));},
  clear(id){return sessions.delete(String(id||"anonymous").slice(0,160));},
  stats(){return {activeSessions:sessions.size,maxSessions:MAX};}
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-22-session",A.Session);
})();
''',
"super-ai-next-23-memory.js": r'''
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
''',
"super-ai-next-24-planner.js": r'''
(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.Planner={
  plan(question){
   const q=String(question||"").trim();
   if(!q)return {kind:"empty",steps:[]};
   const steps=["understand_question","identify_topic","retrieve_relevant_knowledge","check_evidence","compose_answer"];
   const multi=/compare|difference|versus|\bvs\b|pros and cons|step by step|موازنہ|فرق/i.test(q);
   if(multi)steps.splice(2,0,"split_into_subquestions");
   if(/latest|today|current|news|price|weather|آج|تازہ/i.test(q))steps.splice(3,0,"check_freshness_requirement");
   if(/code|program|script|debug|error/i.test(q))steps.splice(3,0,"inspect_code_requirements");
   return {kind:multi?"multi_part":"standard",steps,question:q,createdAt:Date.now()};
  }
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-24-planner",A.Planner);
})();
''',
"super-ai-next-25-tools.js": r'''
(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 const tools=new Map();
 A.ToolRegistry={
  register(name,description,handler){
   if(!/^[a-z][a-z0-9_-]{1,50}$/.test(name)||typeof handler!=="function")return false;
   tools.set(name,{name,description:String(description||"").slice(0,300),handler});
   return true;
  },
  list(){return [...tools.values()].map(({name,description})=>({name,description}))},
  async run(name,input,options={}){
   const t=tools.get(name);if(!t)throw Error("Unknown tool: "+name);
   if(options.allow!==true)throw Error("Tool execution requires explicit allow:true");
   return await t.handler(input);
  },
  remove(name){return tools.delete(name)}
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-25-tools",A.ToolRegistry);
})();
''',
"super-ai-next-26-quality.js": r'''
(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.AnswerQuality={
  inspect(question,answer,meta={}){
   const q=String(question||"").trim(),a=String(answer||"").trim(),issues=[];
   if(!q)issues.push("missing_question");
   if(!a)issues.push("empty_answer");
   if(a.length<25&&q.length>35)issues.push("possibly_too_short");
   if(/definitely guaranteed|100% accurate|certainly true/i.test(a))issues.push("overconfident_language");
   if(meta.needsFreshness&&!meta.sources?.length)issues.push("fresh_data_not_cited");
   if(meta.highStakes&&!meta.reviewed)issues.push("high_stakes_needs_review");
   return {ok:issues.length===0,issues,answerLength:a.length,checkedAt:Date.now()};
  }
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-26-quality",A.AnswerQuality);
})();
''',
"super-ai-next-27-feedback.js": r'''
(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 const KEY="super_ai_feedback_v1",MAX=500;
 function read(){try{let x=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(x)?x:[]}catch(e){return []}}
 A.Feedback={
  add({requestId="",rating=0,category="general",note=""}={}){
   rating=Math.max(-1,Math.min(1,Number(rating)||0));
   const a=read();a.push({requestId:String(requestId).slice(0,100),rating,category:String(category).slice(0,60),note:String(note).slice(0,500),at:Date.now()});
   try{localStorage.setItem(KEY,JSON.stringify(a.slice(-MAX)));return true}catch(e){return false}
  },
  summary(){
   const a=read();return {count:a.length,positive:a.filter(x=>x.rating>0).length,negative:a.filter(x=>x.rating<0).length,neutral:a.filter(x=>x.rating===0).length};
  },
  export(){return read()},
  clear(){try{localStorage.removeItem(KEY);return true}catch(e){return false}}
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-27-feedback",A.Feedback);
})();
''',
"super-ai-next-28-rate-limit.js": r'''
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
''',
"super-ai-next-29-events.js": r'''
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
''',
"super-ai-next-30-self-test.js": r'''
(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.SelfTest={
  run(){
   const checks=[];
   function test(name,fn){try{checks.push({name,ok:!!fn()})}catch(e){checks.push({name,ok:false,error:String(e)})}}
   test("registry",()=>!!A.modules);
   test("policy",()=>!!A.Policy&&A.Policy.check("hello").ok);
   test("planner",()=>!!A.Planner&&A.Planner.plan("compare two things").steps.length>=5);
   test("quality",()=>!!A.AnswerQuality&&Array.isArray(A.AnswerQuality.inspect("q","a sufficiently detailed answer for checking").issues));
   test("events",()=>!!A.Events&&typeof A.Events.emit==="function");
   test("rate-limit",()=>!!A.LocalRateLimit&&A.LocalRateLimit.check("self-test-"+Date.now()).ok);
   test("session",()=>!!A.Session&&A.Session.get("self-test").turns===0);
   return {passed:checks.filter(x=>x.ok).length,total:checks.length,checks,at:new Date().toISOString()};
  }
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-30-self-test",A.SelfTest);
})();
'''
}

for name, content in files.items():
    path = root / name
    if path.exists():
        print("SKIP (already exists):", path)
        continue
    path.write_text(content.strip() + "\n", encoding="utf-8")
    print("CREATED:", path)

print("\nNext-level pack finished. No existing files overwritten; no APK build performed.")
