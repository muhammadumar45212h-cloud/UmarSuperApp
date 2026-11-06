(function(r){
"use strict";
function analyze(question){
const normalizer=r.SANormalizer;
const q=normalizer?normalizer.normalize(question):String(question||"").trim();
if(!q)return {ok:false,error:"empty_question"};
const intent=r.SAIntent?r.SAIntent.classify(q):{intent:"conversation",confidence:0};
const safety=r.SASafety?r.SASafety.review(q):{requiresConfirmation:true};
const entities=r.SAEntities?r.SAEntities.extract(q):{};
const knowledge=r.SAKnowledge?r.SAKnowledge.search(q):[];
const plan=r.SAPlanner?r.SAPlanner.create(q,intent.intent):{goal:q,steps:[]};
return {ok:true,question:q,intent,safety,entities,knowledge,plan,
execution:{started:false,note:"Analysis only; no action executed."}};
}
async function ask(question,options){
const result=analyze(question);
if(!result.ok)return result;
if(!r.SABackendClient)return {ok:false,error:"backend_client_not_loaded",analysis:result};
const history=options&&Array.isArray(options.history)?options.history:[];
try{
const answer=await r.SABackendClient.ask(result.question,history,options);
return {ok:true,analysis:result,answer};
}catch(e){
return {ok:false,error:"backend_request_failed",message:String(e&&e.message||e).slice(0,300),analysis:result};
}
}
r.SAOrchestrator={analyze,ask};
if(typeof module!=="undefined")module.exports=r.SAOrchestrator;
})(typeof window!=="undefined"?window:globalThis);
