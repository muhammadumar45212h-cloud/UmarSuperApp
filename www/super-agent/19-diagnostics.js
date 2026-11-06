(function(r){
"use strict";
function run(){
const names=["SAConfig","SANormalizer","SALanguage","SAIntent","SAEntities",
"SAKnowledge","SAMemory","SATasks","SAPlanner","SASafety","SATools",
"SACalculator","SACodeReview","SASummarizer","SAQuality","SAPromptBuilder",
"SABackendClient","SAConversation","SAOrchestrator"];
const modules={};
for(const name of names)modules[name]=!!r[name];
return {version:"1.0.0",modules,
loaded:Object.values(modules).filter(Boolean).length,
total:names.length,
backendConfigured:!!(r.SAConfig&&r.SAConfig.backend)};
}
r.SADiagnostics={run};
if(typeof module!=="undefined")module.exports=r.SADiagnostics;
})(typeof window!=="undefined"?window:globalThis);
