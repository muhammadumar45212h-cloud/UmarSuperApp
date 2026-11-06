(function(r){
"use strict";
function extract(s){
s=String(s||"");
const numbers=(s.match(/-?\d+(?:[.,]\d+)?/g)||[])
.slice(0,50).map(x=>Number(x.replace(",","."))).filter(Number.isFinite);
const urls=(s.match(/https?:\/\/[^\s<>"']+/gi)||[]).slice(0,10);
const emails=(s.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi)||[]).slice(0,10);
return {numbers,urls,emails};
}
r.SAEntities={extract};
if(typeof module!=="undefined")module.exports=r.SAEntities;
})(typeof window!=="undefined"?window:globalThis);
