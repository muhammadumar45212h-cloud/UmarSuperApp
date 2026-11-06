(function(r){
"use strict";
const sessions=new Map();
function get(id){
id=String(id||"default").slice(0,100);
if(!sessions.has(id))sessions.set(id,[]);
return sessions.get(id);
}
function add(id,role,content){
if(!["user","assistant"].includes(role))return false;
content=String(content||"").trim().slice(0,4000);
if(!content)return false;
const a=get(id);a.push({role,content,at:Date.now()});
if(a.length>40)a.splice(0,a.length-40);
return true;
}
function history(id,n){
return get(id).slice(-Math.max(1,Math.min(20,n||10)))
.map(({role,content})=>({role,content}));
}
function clear(id){return sessions.delete(String(id||"default").slice(0,100));}
r.SAConversation={add,history,clear};
if(typeof module!=="undefined")module.exports=r.SAConversation;
})(typeof window!=="undefined"?window:globalThis);
