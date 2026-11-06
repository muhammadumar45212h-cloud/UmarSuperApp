(function(r){
"use strict";
function normalize(s){
return String(s==null?"":s).normalize("NFKC")
.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"")
.replace(/\s+/g," ").trim().slice(0,12000);
}
function tokens(s){
return normalize(s).toLocaleLowerCase()
.match(/[\p{L}\p{N}]+/gu)||[];
}
r.SANormalizer={normalize,tokens};
if(typeof module!=="undefined")module.exports=r.SANormalizer;
})(typeof window!=="undefined"?window:globalThis);
