(function(r){
"use strict";
r.SAConfig=Object.freeze({
version:"1.0.0",maxInput:12000,maxHistory:20,
backend:"/api/super-ai",requestTimeoutMs:45000,
allowedRoles:["user","assistant"]
});
if(typeof module!=="undefined")module.exports=r.SAConfig;
})(typeof window!=="undefined"?window:globalThis);
