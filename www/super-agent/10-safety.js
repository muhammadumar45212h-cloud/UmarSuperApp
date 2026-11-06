(function(r){
"use strict";
const rules=[
["financial",/\b(pay|transfer|withdraw|purchase|buy now|send money)\b|paisa bhej|payment karo/i],
["destructive",/\b(delete all|erase all|format disk|drop database|wipe data)\b|sab mita/i],
["account_security",/\b(change password|reset password|disable security|revoke access)\b/i],
["public_send",/\b(publish|post publicly|send email|message everyone|production deploy)\b/i],
["system_command",/\b(run shell|execute command|shutdown computer|install package)\b/i]
];
function review(s){
const hits=rules.filter(x=>x[1].test(String(s||""))).map(x=>x[0]);
return {requiresConfirmation:hits.length>0,matchedRules:hits,
executionAllowedWithoutConfirmation:hits.length===0,
note:"Keyword checks are not a complete security boundary."};
}
r.SASafety={review};
if(typeof module!=="undefined")module.exports=r.SASafety;
})(typeof window!=="undefined"?window:globalThis);
