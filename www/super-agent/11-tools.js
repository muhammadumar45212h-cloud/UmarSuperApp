(function(r){
"use strict";
const registry=new Map();
function register(name,description,handler){
if(!/^[a-z][a-z0-9_-]{1,39}$/.test(name)||typeof handler!=="function")
return {ok:false,error:"invalid_tool"};
registry.set(name,{name,description:String(description||"").slice(0,200),handler});
return {ok:true,name};
}
function list(){return Array.from(registry.values()).map(({name,description})=>({name,description}));}
async function call(name,args,options){
const tool=registry.get(name);
if(!tool)return {ok:false,error:"tool_not_found"};
if(!options||options.confirmed!==true)
return {ok:false,error:"explicit_confirmation_required"};
try{return {ok:true,result:await tool.handler(args)};}
catch(e){return {ok:false,error:"tool_failed",message:String(e&&e.message||"Unknown error").slice(0,300)};}
}
r.SATools={register,list,call};
if(typeof module!=="undefined")module.exports=r.SATools;
})(typeof window!=="undefined"?window:globalThis);
