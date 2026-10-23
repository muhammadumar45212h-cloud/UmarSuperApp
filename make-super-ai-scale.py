from pathlib import Path

W = Path("www")
if not W.is_dir():
    raise SystemExit("ERROR: www folder nahi mila.")

modules = {
"01-config": r'''
return {run(input={}) {
 return {
  version:1,
  maxQuestionChars:12000,
  maxContextItems:20,
  defaultTimeoutMs:15000,
  maxRetries:2,
  cacheTtlMs:60000,
  ...input
 };
}};
''',
"02-request-id": r'''
return {run() {
 return "req-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);
}};
''',
"03-question-router": r'''
return {run(q) {
 const s=String(q||"").toLowerCase();
 const routes=[
  ["coding",/\b(code|javascript|python|bug|program|error)\b/],
  ["math",/\d+\s*[+\-*\/%]\s*\d+/],
  ["science",/\b(science|physics|chemistry|biology)\b/],
  ["space",/\b(space|planet|rocket|universe|orbit)\b/],
  ["health",/\b(health|medicine|symptom|doctor|medical)\b/],
  ["business",/\b(business|customer|selling|profit|order)\b/],
  ["education",/\b(explain|learn|teach|study|samjhao|sikhao)\b/]
 ];
 const matches=routes.filter(x=>x[1].test(s)).map(x=>x[0]);
 return {primary:matches[0]||"general",topics:matches,questionLength:s.length};
}};
''',
"04-query-expander": r'''
return {run(q) {
 const s=String(q||"").trim();
 const variants=[s];
 if(s.includes("?")) variants.push(s.replace(/\?/g,"").trim());
 if(s.length>8) variants.push(s.split(/\s+/).filter(x=>x.length>2).join(" "));
 return [...new Set(variants)].filter(Boolean).slice(0,5);
}};
''',
"05-keyword-index": r'''
return {run(records=[]) {
 const index={};
 for(const [i,r] of records.entries()) {
  const s=String((r.title||"")+" "+(r.text||"")+" "+(r.topic||"")).toLowerCase();
  for(const w of s.match(/[\p{L}\p{N}]{3,}/gu)||[]) {
   (index[w]=index[w]||[]).push(i);
  }
 }
 return index;
}};
''',
"06-retrieval-ranker": r'''
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
''',
"07-deduplicator": r'''
return {run(items=[]) {
 const seen=new Set();
 return items.filter(x=>{
  const v=String(x.text||x.answer||x.title||JSON.stringify(x)).toLowerCase().replace(/\s+/g," ").trim();
  if(seen.has(v)) return false;
  seen.add(v); return true;
 });
}};
''',
"08-context-budget": r'''
return {run(items=[],maxChars=12000) {
 let used=0,out=[];
 for(const item of items) {
  const s=typeof item==="string"?item:JSON.stringify(item);
  if(used+s.length>maxChars) continue;
  out.push(item); used+=s.length;
 }
 return {items:out,usedChars:used,maxChars};
}};
''',
"09-cache": r'''
const cache=new Map();
return {
 run(key,value,ttl=60000) {
  const k=String(key||"");
  if(arguments.length>=2) {
   cache.set(k,{value,expires:Date.now()+Math.max(0,ttl)});
   return value;
  }
  const hit=cache.get(k);
  if(!hit) return null;
  if(hit.expires<Date.now()){cache.delete(k);return null;}
  cache.delete(k);cache.set(k,hit);
  return hit.value;
 },
 clear(){cache.clear();},
 size(){return cache.size;}
};
''',
"10-concurrency-queue": r'''
let active=0;
const queue=[];
return {
 run(task,maxConcurrent=3) {
  if(typeof task!=="function") return Promise.reject(new Error("task must be a function"));
  return new Promise((resolve,reject)=>{
   queue.push({task,resolve,reject});
   pump(Math.max(1,maxConcurrent));
  });
 },
 pending(){return queue.length;},
 active(){return active;}
};
function pump(limit){
 while(active<limit&&queue.length){
  const item=queue.shift();active++;
  Promise.resolve().then(item.task).then(item.resolve,item.reject)
   .finally(()=>{active--;pump(limit);});
 }
}
''',
"11-retry-policy": r'''
return {run(attempt=0,maxRetries=2,baseMs=300) {
 const n=Math.max(0,Math.min(Number(attempt)||0,Number(maxRetries)||0));
 return {retry:n<maxRetries,delayMs:Math.min(5000,baseMs*(2**n))};
}};
''',
"12-timeout": r'''
return {run(promise,ms=15000) {
 let timer;
 return Promise.race([
  Promise.resolve(promise),
  new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("Request timed out")),ms);})
 ]).finally(()=>clearTimeout(timer));
}};
''',
"13-unknown-answer": r'''
return {run(results=[]) {
 const found=Array.isArray(results)&&results.some(x=>x&&Number(x.score||0)>0);
 return {found,needsRetrieval:!found,needsClarification:!found,
  message:found?"Relevant local records mil gaye.":"Local knowledge mein matching record nahi mila; configured search ya user clarification chahiye."};
}};
''',
"14-evidence-ledger": r'''
return {run(items=[]) {
 return items.map((x,i)=>({
  id:x.id||("source-"+(i+1)),
  title:String(x.title||"Untitled"),
  url:x.url||null,
  date:x.date||null,
  text:String(x.text||x.snippet||""),
  verified:false
 }));
}};
''',
"15-answer-assembler": r'''
return {run(question,items=[]) {
 const usable=items.filter(x=>x&&(x.text||x.answer||x.snippet));
 if(!usable.length) return {answer:null,sourceCount:0,verified:false};
 return {
  question:String(question||""),
  answer:usable.slice(0,8).map((x,i)=>
   (i+1)+". "+String(x.text||x.answer||x.snippet)).join("\n\n"),
  sources:usable.map(x=>({title:x.title||"Source",url:x.url||null})),
  sourceCount:usable.length,
  verified:false,
  note:"Sources aur claims ki verification abhi zaroori hai."
 };
}};
''',
"16-privacy-filter": r'''
return {run(text) {
 const s=String(text||"");
 return s
  .replace(/\b(sk-[A-Za-z0-9_-]{12,})\b/g,"[REDACTED_API_KEY]")
  .replace(/\b\d{13,19}\b/g,"[REDACTED_NUMBER]")
  .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,"[REDACTED_PRIVATE_KEY]");
}};
''',
"17-safe-telemetry": r'''
return {run(event={}) {
 const allowed=["type","durationMs","success","module","statusCode"];
 const clean={time:new Date().toISOString()};
 for(const k of allowed) if(event[k]!==undefined) clean[k]=event[k];
 return clean;
}};
''',
"18-health-check": r'''
return {run() {
 const A=window.SuperAIAdvanced;
 return {
  registryAvailable:!!A,
  registeredModules:A&&A.modules?Object.keys(A.modules).length:0,
  engineAvailable:!!window.SuperAIEngine,
  memoryAvailable:!!window.SuperAIMemory,
  webSearchAvailable:!!(window.SuperAIWebSearch&&typeof window.SuperAIWebSearch.search==="function")
 };
}};
''',
"19-api-adapter": r'''
return {
 async run(endpoint,payload={},options={}) {
  if(!endpoint) throw new Error("Backend endpoint configure nahi hai.");
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),options.timeoutMs||15000);
  try {
   const response=await fetch(endpoint,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload),
    signal:controller.signal
   });
   if(!response.ok) throw new Error("Backend HTTP "+response.status);
   return await response.json();
  } finally {clearTimeout(timeout);}
 }
};
''',
"20-self-test": r'''
return {run() {
 const A=window.SuperAIAdvanced;
 const checks=[
  ["registry",!!A],
  ["normalizer",!!(A&&typeof A.normalize==="function")],
  ["moduleList",!!(A&&typeof A.list==="function")]
 ];
 return {passed:checks.filter(x=>x[1]).length,total:checks.length,checks};
}};
'''
}

for name,body in modules.items():
    path=W/("super-ai-scale-"+name+".js")
    if path.exists():
        raise SystemExit("STOP: file pehle se hai: "+str(path))
    source = r'''(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.register=A.register||function(n,m){A.modules[n]=m;};
 A.normalize=A.normalize||function(s){return String(s||"").toLowerCase().replace(/\s+/g," ").trim();};
 A.register("scale-'''+name+r'''", (function(){
'''+body+r'''
 })());
})();
'''
    path.write_text(source,encoding="utf-8")

print("Created",len(modules),"new scale modules.")
print("Existing files were not overwritten.")
print("No build was run.")
