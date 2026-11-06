(function(r){
"use strict";
async function ask(question,history,options){
if(typeof r.fetch!=="function")throw Error("Fetch is unavailable");
const config=r.SAConfig||{backend:"/api/super-ai",requestTimeoutMs:45000};
const controller=typeof AbortController!=="undefined"?new AbortController():null;
const timer=controller?setTimeout(()=>controller.abort(),config.requestTimeoutMs||45000):null;
try{
const response=await r.fetch(config.backend||"/api/super-ai",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({question:String(question||"").slice(0,12000),
history:Array.isArray(history)?history.slice(-8):[],
options:options||{}}),
signal:controller?controller.signal:undefined
});
const data=await response.json().catch(()=>({}));
if(!response.ok)throw Error(data.error||("Backend HTTP "+response.status));
return data;
}finally{if(timer)clearTimeout(timer);}
}
r.SABackendClient={ask};
if(typeof module!=="undefined")module.exports=r.SABackendClient;
})(typeof window!=="undefined"?window:globalThis);
