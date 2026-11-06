(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.Policy={
  version:1,
  limits:{questionChars:12000,contextItems:12,answerChars:24000},
  check(q){
   q=String(q??"");
   if(!q.trim())return {ok:false,reason:"empty_question"};
   if(q.length>this.limits.questionChars)return {ok:false,reason:"question_too_long"};
   return {ok:true,normalized:q.trim()};
  },
  clampText(s,max=this.limits.answerChars){
   return String(s??"").slice(0,max);
  }
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-21-policy",A.Policy);
})();
