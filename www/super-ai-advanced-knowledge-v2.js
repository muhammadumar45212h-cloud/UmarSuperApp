(function(){
const A = window.SuperAIAdvanced = window.SuperAIAdvanced || {};
const entries = [
{
id:"ai-basics", topic:"artificial intelligence",
q:["what is artificial intelligence","ai kya hai","artificial intelligence samjhao"],
keywords:["ai","artificial intelligence","machine learning","neural network"],
answer:`Artificial Intelligence (AI) computer systems ko aise tasks karne ke qabil banane ka field hai jin mein aam tor par insani zehni salahiyat chahiye hoti hai, jaise language samajhna, patterns pehchanna, planning aur problem solving.

AI ki mukhtalif qisamain hain:
1. Rule-based systems: pehle se likhe rules follow karte hain.
2. Machine learning: data se patterns seekhti hai.
3. Deep learning: neural networks ke zariye complex patterns seekhti hai.
4. Generative AI: naya text, code, images ya doosra content generate kar sakti hai.

Sirf bohat si JavaScript files likhne se model automatically train nahi hota. Ek powerful generative model ke liye architecture, training data, compute, evaluation aur safety testing darkar hoti hai.

Apne Super App mein hum pehle modular knowledge engine, memory, question analysis aur verified information retrieval bana sakte hain.`
},
{
id:"ai-training", topic:"artificial intelligence",
q:["how is ai trained","ai ko train kaise karte hain"],
keywords:["training","dataset","model","weights","training data","ai"],
answer:`AI training ka aam process:
1. Maqsad define karein: model ko kis tarah ke tasks karne hain.
2. Data jama karein: relevant, lawful aur high-quality examples.
3. Data clean karein: duplicates, errors aur sensitive information ka jaiza.
4. Model aur architecture select karein.
5. Training mein model ke parameters update hote hain.
6. Validation data se overfitting aur weaknesses check ki jati hain.
7. Independent tests, safety evaluations aur monitoring hoti hai.

Bara language model train karna costly aur compute-intensive hota hai. Chhote project mein pehle search, retrieval, rule-based reasoning aur existing data par tests banana practical hai.`
},
{
id:"reasoning", topic:"reasoning",
q:["how to solve a complex problem","mushkil sawal kaise hal karen"],
keywords:["reasoning","complex problem","steps","analysis","logic"],
answer:`Mushkil problem solve karne ka ek reliable tareeqa:
1. Sawal ko apne alfaaz mein define karein.
2. Usay chhote, wazeh sub-questions mein divide karein.
3. Har hissa ke facts, assumptions aur missing information alag karein.
4. Har sub-question ka jawab evidence ya calculation se nikalein.
5. Jawabon ke darmiyan contradictions check karein.
6. Combined conclusion banayein.
7. Jo hissa confirm nahi, usay uncertainty ke saath mark karein.

Yeh procedure problem ko organize karta hai; is se har result automatically sahi nahi ho jata. High-stakes decisions mein independent verification zaroori hai.`
},
{
id:"internet", topic:"internet",
q:["how does the internet work","internet kaise kaam karta hai"],
keywords:["internet","dns","ip","router","http","server"],
answer:`Internet interconnected computer networks ka global system hai. Device Wi-Fi ya mobile network ke zariye router/carrier tak jata hai. Data chhote packets mein IP networks ke through route hota hai. DNS domain name ko IP address se resolve karne mein madad deta hai. HTTPS browser aur server ke darmiyan connection encrypt karta hai aur certificate se server identity verify karta hai.

Jab tum website kholte ho, browser request bhejta hai, server response deta hai, aur browser HTML, CSS, JavaScript aur media ko render karta hai. APIs isi tarah apps ko servers se data lene ya bhejne deti hain.

Internet access hona aur har website/API ko programmatically access kar pana alag baatein hain: authentication, permissions, CORS, rate limits aur service terms apply ho sakte hain.`
},
{
id:"programming", topic:"programming",
q:["how to build reliable software","reliable software kaise banayein"],
keywords:["programming","software","testing","debugging","code","reliable"],
answer:`Reliable software ke liye:
1. Requirements aur expected behavior likho.
2. Code ko chhote modules mein divide karo.
3. Har module ke inputs, outputs aur errors define karo.
4. Unit tests aur integration tests likho.
5. Invalid inputs aur network failures simulate karo.
6. Logs rakho, magar passwords aur API secrets logs mein mat likho.
7. Changes se pehle backup aur version control use karo.
8. Real device par performance aur permissions test karo.

File count quality ka reliable measure nahi. Behtar software woh hai jiska behavior test ho, errors samajh aayein aur updates ke baad purane features na tootain.`
},
{
id:"javascript", topic:"programming",
q:["what is javascript","javascript kya hai"],
keywords:["javascript","js","browser","node","programming"],
answer:`JavaScript ek programming language hai jo browsers mein interactive interfaces, forms, events aur web application logic chalati hai. Node.js ke zariye JavaScript server-side tools bhi bana sakti hai. Mobile frameworks jaise Capacitor web code ko native Android/iOS capabilities se connect kar sakte hain.

JavaScript mein variables, functions, objects, arrays, promises aur modules common concepts hain. Async network requests fail ho sakti hain, is liye try/catch, timeouts, error handling aur input validation zaroori hain.

Client-side JavaScript mein secret API keys rakhna safe nahi, kyun ke app package se code inspect ho sakta hai. Private keys server-side rakhi jani chahiye.`
},
{
id:"databases", topic:"technology",
q:["what is a database","database kya hai"],
keywords:["database","sql","nosql","storage","records","query"],
answer:`Database structured ya semi-structured information ko store aur retrieve karne ka system hai. Relational databases tables, rows, columns aur SQL use karte hain. Document databases JSON-jaisi documents rakh sakte hain. Local storage simple device preferences ke liye useful hai, lekin critical data ke liye security, backup aur synchronization design chahiye.

App mein users, messages, orders aur payments ke records alag models mein rakhe ja sakte hain. Access control, validation, indexes, backups aur data retention rules important hain. Payment status ko sirf client ke bheje hue success message par trust nahi karna chahiye; server ya payment provider se verify karna chahiye.`
},
{
id:"cybersecurity", topic:"security",
q:["how to protect an app","app ko secure kaise karein"],
keywords:["security","password","api key","encryption","authentication","authorization"],
answer:`App security ke bunyadi qadam:
1. HTTPS use karein.
2. Passwords ko server par strong password hashing ke saath store karein; plain text nahi.
3. Authentication aur authorization dono implement karein.
4. API secrets client bundle mein na rakhein.
5. Input validate aur output safely render karein.
6. Dependencies update aur audit karein.
7. Rate limiting aur abuse monitoring rakhein.
8. Backups aur incident response plan banayein.
9. User data minimum collect karein aur delete/export rules clear rakhein.

Encryption akela complete security solution nahi. Threat model aur actual tests bhi zaroori hain.`
},
{
id:"space", topic:"space",
q:["how do rockets reach orbit","rocket orbit mein kaise jata hai"],
keywords:["space","rocket","orbit","gravity","velocity","atmosphere"],
answer:`Rocket thrust paida karne ke liye mass ko peeche ki taraf eject karta hai, jis se rocket aage accelerate hota hai. Launch ke dauran rocket gravity aur atmospheric drag ke khilaf kaam karta hai. Orbit mein rehne ke liye sirf bohat upar jana kaafi nahi: spacecraft ko planet ke gird required horizontal velocity bhi chahiye.

Low Earth orbit ki speed aam tor par takreeban 7.8 km/s hoti hai, lekin exact value altitude aur orbit par depend karti hai. Rocket staging dead mass kam karti hai. Real mission mein guidance, navigation, control, thermal protection aur fuel budgets sab matter karte hain.`
},
{
id:"solar-system", topic:"space",
q:["what is the solar system","solar system samjhao"],
keywords:["solar system","sun","planet","earth","mars","jupiter"],
answer:`Solar System mein Sun, aath recognized planets, unke moons, dwarf planets, asteroids, comets aur doosre chhote bodies shamil hain. Planets ka order Sun se: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus aur Neptune.

Inner planets rocky hain; outer giant planets mein Jupiter aur Saturn gas giants hain, jabke Uranus aur Neptune ice giants kehlate hain. Planets ki distance, atmosphere aur temperature mukhtalif hain. Earth par liquid surface water aur known life ke liye suitable conditions hain. Doosri jagahon par life ki discovery abhi confirm nahi hui.`
},
{
id:"climate", topic:"environment",
q:["what causes climate change","climate change kyun hoti hai"],
keywords:["climate","warming","carbon dioxide","methane","environment","emissions"],
answer:`Current global warming ka major driver human activities se greenhouse gases ka barhna hai, khaas taur par fossil fuels jalana, land-use changes aur kuch industrial/agricultural processes. Carbon dioxide aur methane Earth se nikalne wali heat ka kuch hissa atmosphere mein rok kar energy balance ko badalte hain.

Impacts mein average temperatures ka barhna, heatwaves ka risk, sea-level rise aur rainfall patterns mein tabdeeli shamil ho sakti hai. Har local weather event ka sabab sirf climate change nahi hota, lekin warming kai extremes ki probability ya intensity barha sakti hai. Emissions reduction, clean energy, efficiency aur adaptation important responses hain.`
},
{
id:"health-info", topic:"health",
q:["how to evaluate health information","health information kaise check karein"],
keywords:["health","medical","doctor","medicine","diagnosis","symptom"],
answer:`Health information evaluate karte waqt source, publication date, evidence quality aur qualified medical guidance dekhein. Online information general education ke liye useful hai, magar individual diagnosis ke liye medical history, examination aur zaroorat par tests chahiye ho sakte hain.

Medicine start/stop karne, dose badalne ya emergency symptoms ko ignore karne ka faisla chatbot ke jawab par akelay na karein. Severe breathing difficulty, suspected stroke, severe chest pain, major bleeding ya overdose ki surat mein local emergency help hasil karein.`
},
{
id:"business", topic:"business",
q:["how to start an online business","online business kaise shuru karein"],
keywords:["business","online store","customers","marketing","orders","profit"],
answer:`Online business ko chhote validated experiment se shuru karein:
1. Customer aur problem identify karein.
2. Demand ko interviews, searches ya small test se validate karein.
3. Product cost, shipping, fees, returns aur taxes ke baad margin calculate karein.
4. Trustworthy checkout, privacy policy aur support process banayein.
5. Small marketing test chala kar conversion aur customer acquisition cost measure karein.
6. Orders, refunds aur stock ko reconcile karein.
7. Results achhe hon to scale karein.

Revenue profit nahi hota. Payment providers ki availability aur legal requirements country ke mutabiq badalti hain; launch se pehle current provider rules verify karein.`
},
{
id:"math", topic:"mathematics",
q:["how to solve a word problem","math word problem kaise hal karein"],
keywords:["math","mathematics","equation","calculate","problem","formula"],
answer:`Word problem hal karne ka tareeqa:
1. Sawal mein di hui quantities aur units likho.
2. Unknown value ko variable do.
3. Relationship ko equation ya diagram mein badlo.
4. Equation solve karo aur intermediate steps check karo.
5. Answer ko original question mein substitute karke verify karo.
6. Units aur reasonable range check karo.

Agar data missing ho, to assumptions clearly likho. Approximation aur exact result ko alag rakho. Financial ya engineering calculation ke liye independent calculation se verify karna behtar hai.`
},
{
id:"learning", topic:"education",
q:["how to learn a difficult subject","mushkil subject kaise seekhein"],
keywords:["education","study","learning","practice","revision","memory"],
answer:`Mushkil subject seekhne ke liye:
1. Topic ko chhote learning goals mein divide karein.
2. Pehle basic concepts aur vocabulary samjhein.
3. Notes dobara parhne ke bajaye active recall karein.
4. Spaced repetition se waqt ke saath revision karein.
5. Easy se difficult practice questions ki taraf jayein.
6. Galtiyon ka log banayein aur har galti ki wajah samjhein.
7. Concept kisi aur ko apne alfaaz mein samjhane ki koshish karein.

Sirf hours lagana mastery ki guarantee nahi. Progress ko practice performance aur delayed recall se measure karein.`
},
{
id:"privacy", topic:"privacy",
q:["how to protect personal data online","online personal data kaise bachayein"],
keywords:["privacy","personal data","tracking","permissions","account","security"],
answer:`Online privacy ke liye har account ka unique password aur password manager use karein, jahan available ho multi-factor authentication enable karein, app permissions review karein aur unknown links/attachments se ehtiyat karein.

Public posts mein address, identity documents, private keys aur financial details share na karein. App developers ko sirf zaroori data collect karna, clear purpose batana, secure storage, limited access aur deletion process dena chahiye. Data breach ka risk zero nahi hota, is liye recovery plan aur backups bhi important hain.`
},
{
id:"multiverse", topic:"cosmology",
q:["is the multiverse proven","multiverse sach mein hai"],
keywords:["multiverse","universe","cosmology","evidence","physics"],
answer:`Multiverse ka idea kuch cosmological aur theoretical physics frameworks mein aata hai, lekin multiverse ki existence abhi established observational fact nahi hai. Mukhtalif theories mein "multiple universes" ka matlab bhi mukhtalif ho sakta hai.

Scientific claim ko assess karne ke liye testable predictions, observations aur alternative explanations dekhi jati hain. Is waqt hum apne observable universe ke baare mein bohat kuch measure kar sakte hain, magar doosre universes ka direct verified evidence available nahi. Is liye possibility aur proof ko alag rakhna chahiye.`
},
{
id:"ai-limits", topic:"artificial intelligence",
q:["can an ai answer every question","kya ai har sawal ka sahi jawab de sakta hai"],
keywords:["ai limitations","every question","accuracy","hallucination","unknown"],
answer:`Koi AI system har sawal ka sahi jawab dene ki guarantee nahi de sakta. Model ki knowledge incomplete ya outdated ho sakti hai, sawal ambiguous ho sakta hai, aur generated jawab plausible lag kar bhi ghalat ho sakta hai.

Reliable system ko confidence ke bajaye evidence track karna chahiye, current facts ke liye suitable sources retrieve karne chahiye, calculations test karni chahiye aur unknown cases mein uncertainty batani chahiye. Super App ka local knowledge pack bhi sirf apne stored material se har topic cover nahi kar sakta.`
},
{
id:"retrieval", topic:"knowledge systems",
q:["how can an ai combine multiple sources","ai kai sources se jawab kaise banaye"],
keywords:["retrieval","sources","knowledge","combine","evidence","answer"],
answer:`Multi-source answering ke liye system:
1. User question ko clear search queries mein convert karta hai.
2. Relevant documents ya records retrieve karta hai.
3. Har source ka date, authority aur relevance assess karta hai.
4. Duplicate facts ko merge karta hai.
5. Sources ke darmiyan conflicts identify karta hai.
6. Conclusion ko supporting evidence se jorta hai.
7. Missing evidence aur uncertainty ko explicitly batata hai.

Sirf bohat se paragraphs concatenate karna reasoning nahi. Source quality aur contradiction checks ke baghair combined answer bhi ghalat ho sakta hai.`
},
{
id:"mobile-app", topic:"mobile development",
q:["how to build an android app with web technologies","web code se android app kaise banti hai"],
keywords:["android","capacitor","cordova","apk","web app","mobile app"],
answer:`Web technology se Android app banane ke liye HTML interface, CSS styling aur JavaScript logic likhe ja sakte hain. Capacitor ya Cordova web application ko Android project ke saath package karte hain aur plugins ke zariye selected native capabilities dete hain.

Development flow mein project configuration, dependency installation, native synchronization, Gradle build aur device testing shamil hote hain. APK ban jana is baat ka proof nahi ke login, payments, ads, permissions aur backend sab sahi kaam karte hain. Har important feature ko device par separately test karna chahiye.`
},
{
id:"payments", topic:"payments",
q:["how to make app payments reliable","app payment system reliable kaise banayein"],
keywords:["payments","checkout","webhook","transaction","refund","payment"],
answer:`Reliable payment system mein server-side order creation, provider-hosted ya secure checkout, signed webhook verification, unique transaction identifiers, idempotency aur reconciliation zaroori hain.

Client app ka "payment successful" message akela payment confirm karne ke liye kaafi nahi. Server ko provider ke trusted response ya verified webhook se status check karna chahiye. Refunds, failed payments, duplicate callbacks, pending states aur audit logs ke liye bhi clear handling honi chahiye. Provider ki country availability aur merchant terms ko current official documentation se verify karein.`
},
{
id:"evidence", topic:"critical thinking",
q:["how to check if a claim is true","kisi baat ki sachai kaise check karein"],
keywords:["evidence","fact check","claim","source","verify","truth"],
answer:`Claim verify karne ke liye:
1. Exact claim ko narrow aur testable banayein.
2. Original source dhoondein.
3. Independent credible sources compare karein.
4. Date aur context check karein.
5. Opinion, speculation aur measured fact ko alag karein.
6. Contradictory evidence ko bhi dekhein.
7. Evidence insufficient ho to conclusion ko uncertain rakhein.

Search results mein hona kisi claim ke sach hone ka proof nahi. Original documents, official datasets aur high-quality research ko context ke saath assess karna chahiye.`
}
];
A.knowledgeV2 = entries;
A.register && A.register("knowledge-v2", {
 run(q){
   const norm = A.normalize ? A.normalize(q) : String(q||"").toLowerCase();
   const words = norm.split(/\s+/).filter(Boolean);
   return entries.map(e=>{
     let score=0;
     for(const phrase of e.q) if(norm===((A.normalize&&A.normalize(phrase))||phrase.toLowerCase())) score+=8;
     for(const k of e.keywords) {
       const nk=(A.normalize&&A.normalize(k))||k.toLowerCase();
       if(norm.includes(nk)) score+=2;
     }
     for(const w of words) if(w.length>3 && e.topic.includes(w)) score+=0.5;
     return {id:e.id,topic:e.topic,answer:e.answer,score};
   }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
 }
});
})();
