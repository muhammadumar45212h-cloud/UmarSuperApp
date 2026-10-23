(function(w){
"use strict";
const KEY="super_ai_learning_memory_v1";
const M=w.SuperAILearningMemory={};
const clean=(x,n)=>String(x||"").trim().slice(0,n);
const norm=x=>clean(x,2000).toLowerCase().replace(/\s+/g," ").trim();
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(x)?x:[]}catch(e){return[]}}
function save(x){try{localStorage.setItem(KEY,JSON.stringify(x.slice(-5000)));return true}catch(e){return false}}
M.teach=function(q,a,meta){
q=clean(q,2000);a=clean(a,8000);if(!q||!a)return{ok:false,error:"empty"};
let x=read(),key=norm(q),i=x.findIndex(r=>r.kind==="taught"&&norm(r.q)===key);
let r={kind:"taught",q,a,verified:!!(meta&&meta.verified),trust:(meta&&meta.verified)?"reviewed":"user-taught-unverified",updatedAt:new Date().toISOString()};
if(i>=0)x[i]=r;else x.push(r);
return{ok:save(x),record:r};
};
M.record=function(q,a){
q=clean(q,2000);a=clean(a,8000);if(!q||!a)return{ok:false};
let x=read();x.push({kind:"exchange",q,a,verified:false,updatedAt:new Date().toISOString()});
return{ok:save(x)};
};
M.find=function(q){
let k=norm(q),x=read();
return x.slice().reverse().find(r=>r.kind==="taught"&&norm(r.q)===k)||
x.slice().reverse().find(r=>r.kind==="exchange"&&norm(r.q)===k)||null;
};
M.correct=function(q,a){return M.teach(q,a,{verified:false})};
M.search=function(q){
let terms=norm(q).split(" ").filter(Boolean);
return read().map(r=>({record:r,score:terms.filter(t=>norm(r.q).includes(t)).length/Math.max(1,terms.length)}))
.filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,20);
};
M.stats=function(){let x=read();return{total:x.length,taught:x.filter(r=>r.kind==="taught").length,exchanges:x.filter(r=>r.kind==="exchange").length}};
M.forget=function(){try{localStorage.removeItem(KEY);return true}catch(e){return false}};
})(window);
