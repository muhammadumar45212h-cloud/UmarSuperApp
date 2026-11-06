(function(r){
"use strict";
function detect(s){
s=String(s||"");
if(/[\u0600-\u06FF]/.test(s))return "arabic-script";
if(/[\u0900-\u097F]/.test(s))return "devanagari";
if(/\b(aur|kya|kaise|hai|hain|bhejo|mujhe|batao|karna|chahiye)\b/i.test(s))
return "roman-urdu-hindi";
if(/\b(the|what|how|why|please|help|make|build|explain)\b/i.test(s))
return "english";
return "unknown";
}
r.SALanguage={detect};
if(typeof module!=="undefined")module.exports=r.SALanguage;
})(typeof window!=="undefined"?window:globalThis);
