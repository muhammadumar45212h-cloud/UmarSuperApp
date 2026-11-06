(function(r){
"use strict";
const KEY="super_ai_memory_v2",MAX=30;
function read(){
try{
const x=JSON.parse(r.localStorage.getItem(KEY)||"[]");
return Array.isArray(x)?x.slice(-MAX):[];
}catch(_){return [];}
}
function add(role,text){
if(!["user","assistant"].includes(role))return false;
text=String(text||"").trim().slice(0,1600);
if(!text)return false;
const a=read();a.push({role,text,at:Date.now()});
try{r.localStorage.setItem(KEY,JSON.stringify(a.slice(-MAX)));return true;}
catch(_){return false;}
}
function recent(n){return read().slice(-Math.max(1,Math.min(20,n||8)));}
function clear(){
try{r.localStorage.removeItem(KEY);return true;}catch(_){return false;}
}
r.SAMemory={add,recent,clear,count:()=>read().length};
if(typeof module!=="undefined")module.exports=r.SAMemory;
})(typeof window!=="undefined"?window:globalThis);
