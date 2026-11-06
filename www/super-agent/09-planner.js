(function(r){
"use strict";
function create(goal,intent){
goal=String(goal||"").trim();
const steps=[
"Confirm the goal and success criteria.",
"Inspect available information and project constraints.",
"Break the work into small, verifiable tasks.",
"Perform only authorized steps and test each change.",
"Report actual results, errors and remaining work."
];
if(intent==="coding")steps[1]="Inspect existing files, dependencies and backups.";
if(intent==="calculation")steps[1]="Identify values, units and the requested operation.";
if(intent==="business")steps[1]="Identify customers, costs, risks and measurable outcomes.";
return {goal,intent:intent||"general",steps,status:"proposed"};
}
r.SAPlanner={create};
if(typeof module!=="undefined")module.exports=r.SAPlanner;
})(typeof window!=="undefined"?window:globalThis);
