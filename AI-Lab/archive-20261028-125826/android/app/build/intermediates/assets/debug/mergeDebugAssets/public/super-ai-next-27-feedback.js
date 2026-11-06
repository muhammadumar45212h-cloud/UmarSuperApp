(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 const KEY="super_ai_feedback_v1",MAX=500;
 function read(){try{let x=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(x)?x:[]}catch(e){return []}}
 A.Feedback={
  add({requestId="",rating=0,category="general",note=""}={}){
   rating=Math.max(-1,Math.min(1,Number(rating)||0));
   const a=read();a.push({requestId:String(requestId).slice(0,100),rating,category:String(category).slice(0,60),note:String(note).slice(0,500),at:Date.now()});
   try{localStorage.setItem(KEY,JSON.stringify(a.slice(-MAX)));return true}catch(e){return false}
  },
  summary(){
   const a=read();return {count:a.length,positive:a.filter(x=>x.rating>0).length,negative:a.filter(x=>x.rating<0).length,neutral:a.filter(x=>x.rating===0).length};
  },
  export(){return read()},
  clear(){try{localStorage.removeItem(KEY);return true}catch(e){return false}}
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-27-feedback",A.Feedback);
})();
