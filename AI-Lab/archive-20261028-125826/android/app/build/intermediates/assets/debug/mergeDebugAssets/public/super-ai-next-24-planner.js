(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 A.Planner={
  plan(question){
   const q=String(question||"").trim();
   if(!q)return {kind:"empty",steps:[]};
   const steps=["understand_question","identify_topic","retrieve_relevant_knowledge","check_evidence","compose_answer"];
   const multi=/compare|difference|versus|\bvs\b|pros and cons|step by step|موازنہ|فرق/i.test(q);
   if(multi)steps.splice(2,0,"split_into_subquestions");
   if(/latest|today|current|news|price|weather|آج|تازہ/i.test(q))steps.splice(3,0,"check_freshness_requirement");
   if(/code|program|script|debug|error/i.test(q))steps.splice(3,0,"inspect_code_requirements");
   return {kind:multi?"multi_part":"standard",steps,question:q,createdAt:Date.now()};
  }
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-24-planner",A.Planner);
})();
