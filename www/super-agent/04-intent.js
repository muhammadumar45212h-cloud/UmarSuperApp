(function(r){
"use strict";
const rules=[
["coding",/\b(code|coding|javascript|python|html|css|debug|compile|bug|termux|program)\b/i],
["calculation",/\b(calculate|math|equation|percentage|multiply|divide|sum|average)\b|hisab|kitna percent/i],
["planning",/\b(plan|roadmap|milestone|strategy|schedule|steps)\b|plan banao/i],
["learning",/\b(explain|teach|learn|meaning|define|why|how|compare)\b|samjhao|kya hota/i],
["space",/\b(planet|space|rocket|gravity|orbit|universe|galaxy|mars|moon)\b/i],
["business",/\b(business|startup|customer|marketing|sales|revenue|profit)\b/i],
["writing",/\b(write|story|poem|caption|article|email|translate)\b/i]
];
function classify(s){
s=String(s||"").trim();
for(const [intent,pattern] of rules)if(pattern.test(s))
return {intent,confidence:0.78};
return {intent:"conversation",confidence:s?0.4:0};
}
r.SAIntent={classify};
if(typeof module!=="undefined")module.exports=r.SAIntent;
})(typeof window!=="undefined"?window:globalThis);
