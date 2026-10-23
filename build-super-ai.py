from pathlib import Path
import json, re

W = Path("www")
W.mkdir(exist_ok=True)

# 15 knowledge modules: local facts, not a pretrained language model.
domains = {
"science": [
("pani ka formula","Pani ka chemical formula H2O hai."),
("gravity kya hai","Gravity mass wali cheezon ke darmiyan kashish hai."),
("atom kya hai","Atom chemical element ki bunyadi unit hai."),
("photosynthesis kya hai","Pauday roshni ki madad se apni ghiza banate hain."),
("solar system kya hai","Solar System mein Suraj aur uski gravity se bandhe planets aur doosri cheezein hain."),
("light ki speed","Vacuum mein roshni ki raftaar taqreeban 300,000 kilometer per second hai."),
("force kya hai","Force push ya pull hai jo motion badal sakti hai."),
("energy kya hai","Energy kaam karne ya tabdeeli paida karne ki salahiyat hai.")],
"technology": [
("computer kya hai","Computer instructions ke mutabiq data process karta hai."),
("internet kya hai","Internet duniya bhar ke connected networks ka nizaam hai."),
("api kya hai","API software systems ke darmiyan communication ka interface hai."),
("javascript kya hai","JavaScript web aur apps mein interactive features banane wali programming language hai."),
("database kya hai","Database munazzam data ko store aur retrieve karne ka nizaam hai."),
("html kya hai","HTML web page ka structure define karta hai."),
("cybersecurity kya hai","Cybersecurity systems, networks aur data ko digital attacks se bachane ka amal hai."),
("cloud computing kya hai","Cloud computing internet ke zariye computing resources istemal karna hai.")],
"pakistan": [
("pakistan ka darul hukumat","Pakistan ka dar-ul-hukumat Islamabad hai."),
("pakistan ki currency","Pakistan ki currency Pakistani Rupee (PKR) hai."),
("pakistan ki qaumi zaban","Pakistan ki qaumi zaban Urdu hai."),
("pakistan kab bana","Pakistan 14 August 1947 ko azaad mulk bana."),
("pakistan ka sab se bara shehar","Abaadi ke lihaz se Karachi Pakistan ke sab se bare shehron mein se hai."),
("pakistan ka jhanda","Pakistan ke jhanday mein sabz field aur safed patti ke saath chand aur sitara hain.")],
"math": [
("math kya hai","Mathematics numbers, patterns, shapes aur relationships ka mutalea hai."),
("percentage kya hai","Percentage kisi quantity ko 100 ke hisaab se zahir karti hai."),
("fraction kya hai","Fraction kisi whole ke hissa ko zahir karta hai."),
("average kya hai","Aam arithmetic average nikalne ke liye numbers jama karke unki tadaad se divide karte hain."),
("prime number kya hai","Prime number 1 se bara integer hota hai jo sirf 1 aur khud se divide hota hai.")],
"biology": [
("cell kya hai","Cell zindagi ki bunyadi structural aur functional unit hai."),
("dna kya hai","DNA genetic information store karne wala molecule hai."),
("heart ka kaam","Heart khoon ko jism mein pump karta hai."),
("lungs ka kaam","Lungs saans ke zariye oxygen aur carbon dioxide ka tabadla karte hain."),
("vitamins kya hain","Vitamins aise nutrients hain jo jism ko mukhtalif functions ke liye kam miqdaar mein chahiye hote hain.")],
"space": [
("mars kya hai","Mars Suraj se chautha planet hai."),
("moon kya hai","Moon Zameen ka qudrati satellite hai."),
("black hole kya hai","Black hole space ka aisa ilaqa hai jahan gravity itni strong hoti hai ke event horizon se roshni bhi bahar nahi nikal sakti."),
("galaxy kya hai","Galaxy sitaron, gas, dust aur dark matter ka gravity se bandha hua majmua hai."),
("astronaut kya hai","Astronaut space missions mein hissa lene ke liye trained shakhs hota hai.")],
"history": [
("history kya hai","History guzre hue waqiat aur insani maazi ka mutalea hai."),
("indus valley civilization","Indus Valley Civilization South Asia ki qadeem tehzeeb thi; Harappa aur Mohenjo-daro aham markaz thay."),
("ancient egypt","Ancient Egypt Nile ke gird ubharne wali qadeem civilization thi."),
("printing press","Printing press ne likhe hue matn ko zyada copies mein phailana aasaan banaya."),
("industrial revolution","Industrial Revolution ne manufacturing aur technology mein bari tabdeeliyan paida ki.")],
"geography": [
("zameen kya hai","Zameen Suraj se teesra planet hai."),
("continents kitne hain","Aam model mein saat continents ginay jate hain."),
("ocean kya hai","Ocean duniya ke bohat bare khare pani ke ilaqe ko kehte hain."),
("equator kya hai","Equator Zameen ke gird 0 degree latitude ki khayali line hai."),
("weather aur climate ka farq","Weather short-term halaat hain; climate lambi muddat ke aam patterns hain.")],
"education": [
("study kaise karein","Chhote study sessions, active recall, practice questions aur breaks se madad mil sakti hai."),
("active recall kya hai","Active recall mein notes dekhe baghair yaad ki hui maloomat zehan se nikalne ki practice hoti hai."),
("revision kya hai","Revision pehle seekhi hui maloomat ko dobara dekhna aur test karna hai."),
("essay kya hai","Essay kisi topic par munazzam taur par likhi hui tehreer hai."),
("critical thinking kya hai","Critical thinking evidence aur reasoning ki madad se claims ka jaiza lena hai.")],
"language": [
("noun kya hai","Noun aam tor par shakhs, jagah, cheez ya concept ka naam hota hai."),
("verb kya hai","Verb action, event ya state ko zahir karta hai."),
("adjective kya hai","Adjective noun ya pronoun ki sifat batata hai."),
("translation kya hai","Translation ek zaban ke matn ya baat ko doosri zaban mein muntaqil karna hai."),
("grammar kya hai","Grammar zaban mein alfaaz aur jumlon ki banawat ke rules ka majmua hai.")],
"business": [
("business kya hai","Business goods ya services faraham karne ka nizaam hai, aksar aamdani hasil karne ke liye."),
("profit kya hai","Profit aam tor par revenue mein se costs nikalne ke baad bachne wali raqam hai."),
("budget kya hai","Budget aamdani aur kharch ka plan hai."),
("marketing kya hai","Marketing customers ki zaroorat samajhne aur products ya services ko un tak pohanchane ka amal hai."),
("customer service kya hai","Customer service users ke sawalon aur masail mein madad dene ka kaam hai.")],
"health": [
("neend kyun zaroori hai","Neend memory, mood aur jism ke normal functions ke liye aham hai."),
("pani peena","Pani ki zaroorat mausam, activity aur sehat ke mutabiq badalti hai."),
("exercise kya hai","Exercise jismani activity hai jo fitness aur sehat ko support kar sakti hai."),
("first aid kya hai","First aid emergency mein professional help aane tak di jane wali ibtidai madad hai."),
("medical advice","Online chatbot doctor ka badal nahi; serious symptoms mein qualified medical professional se rabta karein.")],
"security": [
("strong password kya hai","Har account ke liye lamba aur unique password use karein; password manager madadgar ho sakta hai."),
("two factor authentication kya hai","Two-factor authentication login ke liye password ke ilawa doosra verification factor mangti hai."),
("phishing kya hai","Phishing dhokay se passwords ya sensitive information hasil karne ki koshish hai."),
("otp share karna chahiye","Apna OTP ya verification code kisi doosre shakhs ko na dein."),
("backup kya hai","Backup data ki doosri copy hai jo loss ki surat mein recovery mein madad deti hai.")],
"environment": [
("climate change kya hai","Climate change climate ke long-term patterns mein tabdeeli hai; aaj ki global warming mein insani greenhouse gas emissions bara kirdar ada karte hain."),
("recycling kya hai","Recycling waste materials ko process karke dobara istemal ke qabil banane ka amal hai."),
("renewable energy kya hai","Renewable energy aise sources se aati hai jo qudrati tor par dobara replenish hote hain, jaise solar aur wind."),
("pollution kya hai","Pollution environment mein nuqsan-deh substances ya energy ka dakhil hona hai."),
("biodiversity kya hai","Biodiversity zindagi ki mukhtalif forms aur ecosystems ka tanawwu hai.")],
"social": [
("communication kya hai","Communication ideas, information ya feelings ka tabadla hai."),
("teamwork kya hai","Teamwork logon ka mil kar shared goal ke liye kaam karna hai."),
("time management kya hai","Time management waqt aur tasks ko priorities ke mutabiq plan karna hai."),
("conflict resolution kya hai","Conflict resolution disagreement ko samajh kar munasib hal dhoondhne ka amal hai."),
("empathy kya hai","Empathy doosre shakhs ke ehsaas aur nazariye ko samajhne ki koshish hai.")]
}

def write(name, content):
    (W/name).write_text(content, encoding="utf-8")

# 15 knowledge files.
for domain, rows in domains.items():
    payload = json.dumps([{"question":q,"answer":a} for q,a in rows], ensure_ascii=False)
    write("super-ai-knowledge-"+domain+".js",
          "window.SAIKnowledgeModules=window.SAIKnowledgeModules||[];\n"
          "window.SAIKnowledgeModules.push(..."+payload+");\n")

# 5 core helpers.
write("super-ai-normalizer.js", r'''
window.SAINormalizer={
 normalize(s){return String(s||"").toLowerCase().normalize("NFKC")
 .replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}\s.+*/%()-]/gu," ")
 .replace(/\s+/g," ").trim();},
 tokens(s){return this.normalize(s).split(/\s+/).filter(Boolean);}
};
''')
write("super-ai-intent.js", r'''
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
''')
write("super-ai-similarity.js", r'''
window.SAISimilarity={score(a,b){
 const A=new Set(window.SAINormalizer.tokens(a)),B=new Set(window.SAINormalizer.tokens(b));
 if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;
 return 2*n/(A.size+B.size);
},best(q,items){let item=null,score=0;for(const x of items){
 const s=this.score(q,x.question);if(s>score){item=x;score=s;}}
 return {item,score};
}};
''')
write("super-ai-math.js", r'''
window.SAIMath={calculate(s){
 s=String(s).trim().replace(/,/g,"");
 if(s.length>80||!/^[\d\s.+*/%()\-]+$/.test(s)||!/\d/.test(s)||!/[+\-*/%]/.test(s))return null;
 const t=s.match(/\d+(?:\.\d+)?|[()+*/%\-]/g);
 if(!t||t.join("")!==s.replace(/\s/g,""))return null;
 let i=0;
 function f(){if(t[i]==="-"){i++;return-f();}if(t[i]==="+"){i++;return f();}
 if(t[i]==="("){i++;let n=e();if(t[i++]!==")")throw 0;return n;}
 let x=t[i++];if(!x||!/^\d/.test(x))throw 0;return +x;}
 function m(){let n=f();while(["*","/","%"].includes(t[i])){
 let o=t[i++],r=f();if((o==="/"||o==="%")&&!r)throw 0;
 n=o==="*"?n*r:o==="/"?n/r:n%r;}return n;}
 function e(){let n=m();while(t[i]==="+"||t[i]==="-"){
 let o=t[i++],r=m();n=o==="+"?n+r:n-r;}return n;}
 try{let n=e();return i===t.length&&Number.isFinite(n)?"Jawab: "+n:null;}catch(_){return null;}
}};
''')
write("super-ai-safety.js", r'''
window.SAISafety={review(answer){
 if(!answer||!String(answer).trim())return "Meri local knowledge mein iska pakka jawab nahi mila.";
 return String(answer)+"\n\nNote: Zaroori maloomat ko trusted source se verify karein.";
}};
''')

# Replace engine with an engine that uses the 15 knowledge modules.
write("super-ai-engine.js", r'''
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
  const math=window.SAIMath.calculate(s);
  if(math)return math;
  if(/\b(waqt|time|kitne baje)\b/.test(s))return "Phone ka waqt: "+new Date().toLocaleString();
  if(/\b(tareekh|date|today)\b/.test(s))return "Aaj ki tareekh: "+new Date().toLocaleDateString();
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
''')

# Update chatbot's dynamic loader to load every module before the engine.
p = W/"ai-chatbot.js"
if not p.exists():
    raise SystemExit("ERROR: www/ai-chatbot.js nahi mili. Pehle chatbot wali file banayein.")
s = p.read_text(encoding="utf-8")
old = '.then(() => loadScript("super-ai-engine.js"))'
files = [
"super-ai-normalizer.js","super-ai-intent.js","super-ai-similarity.js",
"super-ai-math.js","super-ai-safety.js"
] + ["super-ai-knowledge-"+d+".js" for d in domains]
chain = "".join('.then(() => loadScript('+json.dumps(f)+'))' for f in files)
chain += old
if old not in s:
    raise SystemExit("ERROR: ai-chatbot.js ka loader expected format mein nahi mila. Backup safe hai; file manually check karein.")
s = s.replace(old, chain, 1)
p.write_text(s, encoding="utf-8")

print("Created 20 new Super AI modules.")
print("Knowledge entries:", sum(len(x) for x in domains.values()))
print("Existing chatbot and memory files preserved.")
