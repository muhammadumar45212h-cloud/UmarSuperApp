(function(r){
"use strict";
const KEY="super_ai_tasks_v2";
function read(){
try{const a=JSON.parse(r.localStorage.getItem(KEY)||"[]");return Array.isArray(a)?a:[];}
catch(_){return [];}
}
function list(){return read();}
function add(title){
title=String(title||"").trim().slice(0,500);
if(!title)return {ok:false,error:"empty_title"};
const a=read(),task={id:"t"+Date.now().toString(36)+Math.random().toString(36).slice(2,7),
title,status:"planned",createdAt:Date.now()};
a.push(task);
try{r.localStorage.setItem(KEY,JSON.stringify(a.slice(-100)));return {ok:true,task};}
catch(_){return {ok:false,error:"storage_unavailable"};}
}
function update(id,status){
if(!["planned","in_progress","completed","blocked"].includes(status))
return {ok:false,error:"invalid_status"};
const a=read(),t=a.find(x=>x.id===id);
if(!t)return {ok:false,error:"not_found"};
t.status=status;
try{r.localStorage.setItem(KEY,JSON.stringify(a));return {ok:true,task:t};}
catch(_){return {ok:false,error:"storage_unavailable"};}
}
r.SATasks={list,add,update};
if(typeof module!=="undefined")module.exports=r.SATasks;
})(typeof window!=="undefined"?window:globalThis);
