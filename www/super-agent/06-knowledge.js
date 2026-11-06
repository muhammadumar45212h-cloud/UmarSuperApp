(function(r){
"use strict";
const topics={
programming:["code","javascript","python","api","debug","termux","html","css"],
science:["science","physics","chemistry","atom","energy","experiment"],
mathematics:["math","calculate","equation","percentage","algebra","formula","hisab"],
space:["space","planet","earth","mars","moon","rocket","gravity","universe","orbit"],
business:["business","startup","customer","marketing","sales","profit","revenue"],
security:["security","privacy","password","encryption","permission"],
writing:["write","story","poem","caption","article","email","translate"],
education:["learn","study","lesson","teach","course","school"]
};
function search(s){
const words=new Set((String(s||"").toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]));
return Object.entries(topics).map(([topic,terms])=>{
const matches=terms.filter(t=>words.has(t));
return {topic,score:matches.length,matches};
}).filter(x=>x.score).sort((a,b)=>b.score-a.score).slice(0,5);
}
r.SAKnowledge={search,topics:Object.keys(topics)};
if(typeof module!=="undefined")module.exports=r.SAKnowledge;
})(typeof window!=="undefined"?window:globalThis);
