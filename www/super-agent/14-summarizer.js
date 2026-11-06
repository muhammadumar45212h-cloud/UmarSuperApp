(function(r){
"use strict";
function summarize(text,maxSentences){
const s=String(text||"").trim();
if(!s)return "";
const n=Math.max(1,Math.min(12,Number(maxSentences)||4));
const sentences=s.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[s];
return sentences.map(x=>x.trim()).filter(Boolean).slice(0,n).join(" ");
}
r.SASummarizer={summarize};
if(typeof module!=="undefined")module.exports=r.SASummarizer;
})(typeof window!=="undefined"?window:globalThis);
