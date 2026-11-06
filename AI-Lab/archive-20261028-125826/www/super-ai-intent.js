
window.SAIIntent={detect(q){
 const s=window.SAINormalizer.normalize(q);
 if(/^(hi|hello|hey|salam|assalam|aoa)\b/.test(s))return "greeting";
 if(/^(bye|allah hafiz|khuda hafiz)\b/.test(s))return "goodbye";
 if(/^(thanks|thank you|shukriya)\b/.test(s))return "thanks";
 if(/^sikhao\s*:/.test(s))return "learning";
 if(/\d/.test(s)&&/[+\-*/%]/.test(s))return "math";
 if(/\b(kaise|how to|tareeqa)\b/.test(s))return "howto";
 if(/\b(kya hai|what is|meaning)\b/.test(s))return "definition";
 return "unknown";
}};
