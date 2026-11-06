(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.SelfTest={
  run(){
   const checks=[];
   function test(name,fn){try{checks.push({name,ok:!!fn()})}catch(e){checks.push({name,ok:false,error:String(e)})}}
   test("registry",()=>!!A.modules);
   test("policy",()=>!!A.Policy&&A.Policy.check("hello").ok);
   test("planner",()=>!!A.Planner&&A.Planner.plan("compare two things").steps.length>=5);
   test("quality",()=>!!A.AnswerQuality&&Array.isArray(A.AnswerQuality.inspect("q","a sufficiently detailed answer for checking").issues));
   test("events",()=>!!A.Events&&typeof A.Events.emit==="function");
   test("rate-limit",()=>!!A.LocalRateLimit&&A.LocalRateLimit.check("self-test-"+Date.now()).ok);
   test("session",()=>!!A.Session&&A.Session.get("self-test").turns===0);
   return {passed:checks.filter(x=>x.ok).length,total:checks.length,checks,at:new Date().toISOString()};
  }
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-30-self-test",A.SelfTest);
})();
