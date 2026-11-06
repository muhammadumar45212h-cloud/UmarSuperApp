(function(r){
"use strict";
function calculate(input){
let s=String(input||"").replace(/,/g,"").trim();
if(!s||s.length>100)throw Error("Invalid expression");
if(!/^[0-9+\-*/().%\s]+$/.test(s))throw Error("Only arithmetic expressions are supported");
if(!/[0-9]/.test(s))throw Error("No numbers found");
if(/\/\s*0(?:\.0*)?(?![0-9])/.test(s))throw Error("Division by zero");
s=s.replace(/(\d+(?:\.\d+)?)\s*%/g,"($1/100)");
const tokens=s.match(/\d+(?:\.\d+)?|[()+\-*/]/g)||[];
if(tokens.join("")!==s.replace(/\s/g,""))throw Error("Invalid expression");
let i=0;
function atom(){
const t=tokens[i++];
if(t==="+")return atom();
if(t==="-")return -atom();
if(t==="("){const v=expr();if(tokens[i++]!==")")throw Error("Missing )");return v;}
if(t===undefined||!/^\d/.test(t))throw Error("Expected a number");
return Number(t);
}
function term(){
let v=atom();
while(tokens[i]==="*"||tokens[i]==="/"){
const op=tokens[i++],b=atom();
if(op==="/"&&b===0)throw Error("Division by zero");
v=op==="*"?v*b:v/b;
}
return v;
}
function expr(){
let v=term();
while(tokens[i]==="+"||tokens[i]==="-"){
const op=tokens[i++],b=term();v=op==="+"?v+b:v-b;
}
return v;
}
const result=expr();
if(i!==tokens.length||!Number.isFinite(result))throw Error("Invalid expression");
return {expression:input,result};
}
r.SACalculator={calculate};
if(typeof module!=="undefined")module.exports=r.SACalculator;
})(typeof window!=="undefined"?window:globalThis);
