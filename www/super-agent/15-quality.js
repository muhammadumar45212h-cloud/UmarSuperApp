(function(r){
"use strict";
function review(answer){
const s=String(answer||"").trim(),issues=[];
if(!s)issues.push("empty_answer");
if(s.length>12000)issues.push("answer_too_long");
if(/\bI have (sent|paid|deleted|installed|published)\b/i.test(s))
issues.push("verify_action_claim");
return {ok:issues.length===0,issues,characters:s.length,
note:"Passing these checks does not establish factual accuracy."};
}
r.SAQuality={review};
if(typeof module!=="undefined")module.exports=r.SAQuality;
})(typeof window!=="undefined"?window:globalThis);
