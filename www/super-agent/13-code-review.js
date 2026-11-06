(function(r){
"use strict";
function review(source){
const s=String(source||"");
const warnings=[];
if(!s.trim())warnings.push("empty_source");
if(/\beval\s*\(/.test(s))warnings.push("dynamic_eval");
if(/\bnew Function\s*\(/.test(s))warnings.push("dynamic_function");
if(/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(s))
warnings.push("possible_private_key");
if(/\b(password|api_key|secret)\s*[:=]\s*["'][^"']{8,}/i.test(s))
warnings.push("possible_hardcoded_secret");
if(/\binnerHTML\s*=/.test(s))warnings.push("review_html_injection_risk");
return {warnings,passedBasicChecks:warnings.length===0,
note:"Static heuristics only; this is not a full security audit."};
}
r.SACodeReview={review};
if(typeof module!=="undefined")module.exports=r.SACodeReview;
})(typeof window!=="undefined"?window:globalThis);
