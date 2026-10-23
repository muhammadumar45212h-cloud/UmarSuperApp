(function(){
const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
A.register("unknown-handler",{
 run(q,results,ctx){
  const hits=Array.isArray(results)?results:[];
  const strong=hits.filter(x=>Number(x.score||0)>=2);
  if(strong.length)return {known:true,needsSearch:false,results:strong};
  const searchAvailable=!!(window.SuperAIWebSearch&&typeof window.SuperAIWebSearch.search==="function");
  return {
   known:false,
   needsSearch:true,
   searchAvailable,
   question:String(q||""),
   message:searchAvailable
    ?"Mere local knowledge mein pakka jawab nahi mila. Main configured search source se maloomat dhoondhne ki koshish karunga."
    :"Mere local knowledge mein is sawal ka verified jawab nahi mila. Internet search abhi connected nahi hai; reliable source ya API connect karni hogi. Main andaza laga kar fact nahi banaunga."
  };
 }
});
})();
