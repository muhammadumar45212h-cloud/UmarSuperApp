
window.SuperAIEngine={
 reply(q){
  const s=window.SAINormalizer.normalize(q);
  const intent=window.SAIIntent.detect(s);
  if(intent==="greeting")return "Assalam-o-alaikum! Main Super AI hoon. Aap kya poochna chahte hain?";
  if(intent==="goodbye")return "Allah Hafiz! Jab chahein dobara baat karein.";
  if(intent==="thanks")return "Khushi hui ke main madad kar saka!";
  const learned=window.SuperAIMemory?window.SuperAIMemory.learned():{};
  if(learned[s])return learned[s].answer;
  if(intent==="learning")return "Jawab sikhane ka format: SIKHAO: sawal | jawab";
  if(window.SuperAILearningBrain){
   const brainHit=window.SuperAILearningBrain.find(q);
   if(brainHit.found&&brainHit.answer){
    return window.SAISafety?window.SAISafety.review(brainHit.answer):brainHit.answer;
   }
  }
  const math=window.SAIMath.calculate(s);
  if(math)return math;
  if(/\b(waqt|time|kitne baje)\b/.test(s))return "Phone ka waqt: "+new Date().toLocaleString();
  if(/\b(tareekh|date|today)\b/.test(s))return "Aaj ki tareekh: "+new Date().toLocaleDateString();
  if(window.SuperAIKnowledgeHub){
   const hub=window.SuperAIKnowledgeHub.ask(q);
   if(hub.found&&hub.answer)return window.SAISafety.review(hub.answer);
  }
  const all=(window.SAIKnowledgeModules||[]).slice();
  if(window.SuperAIMemory){
   const extra=window.SuperAIMemory.learned();
   for(const x of Object.values(extra))all.push({question:x.question,answer:x.answer});
  }
  const hit=window.SAISimilarity.best(s,all);
  if(hit.item&&hit.score>=0.48)return window.SAISafety.review(hit.item.answer);
  return "Mujhe apni local knowledge mein is sawal ka pakka jawab nahi mila. Aap mujhe sikhane ke liye likhein:\nSIKHAO: sawal | jawab\n\nMain abhi local knowledge-based chatbot hoon, full generative AI model nahi.";
 }
};
