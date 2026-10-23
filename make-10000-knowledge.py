from pathlib import Path
import json

OUT = Path("www/ai-knowledge")
OUT.mkdir(parents=True, exist_ok=True)

# Har topic ke seed answers ko baad mein verified data se expand kar sakte ho.
topics = {
"01-science": [
("Science kya hai?","Science observation, experiments aur evidence se natural duniya ko samajhne ka tareeqa hai."),
("Scientific method kya hai?","Is mein sawal, hypothesis, experiment, data aur conclusion shamil hote hain."),
("Atom kya hai?","Atom matter ka bunyadi unit hai; is mein nucleus aur electrons hote hain."),
("Energy kya hai?","Energy kaam karne ya tabdeeli paida karne ki salahiyat hai."),
("Force kya hai?","Force push ya pull hai jo motion ya shape badal sakti hai."),
("Gravity kya hai?","Gravity mass rakhne wali cheezon ke darmiyan attraction hai."),
("Light kya hai?","Light electromagnetic radiation hai jo insani aankh dekh sakti hai."),
("Sound kya hai?","Sound medium mein phailne wali mechanical wave hai."),
("Experiment kyun hota hai?","Experiment kisi hypothesis ko observations aur measurable results se test karta hai."),
("Evidence kyun zaroori hai?","Evidence kisi claim ko support ya challenge karne ke liye check ki ja sakne wali maloomat deta hai.")
],
"02-technology": [
("Technology kya hai?","Technology tools, systems aur methods ka istemal hai jo masail hal karte hain."),
("Computer kya hai?","Computer instructions ke mutabiq data process karne wala electronic system hai."),
("Operating system kya hai?","Operating system hardware aur applications ke darmiyan resources manage karta hai."),
("Software kya hai?","Software programs aur instructions ka majmua hai."),
("Hardware kya hai?","Hardware computer ya device ke physical parts hain."),
("Internet kya hai?","Internet duniya bhar ke networks ka connected system hai."),
("Cloud computing kya hai?","Cloud computing remote servers se computing, storage ya services hasil karna hai."),
("Database kya hai?","Database organized data collection hai jise store, search aur update kiya ja sakta hai."),
("API kya hai?","API defined rules deta hai jin se software systems ek doosre se baat karte hain."),
("Open source kya hai?","Open-source software ka source code license ki sharaait ke mutabiq dekhna ya modify karna mumkin hota hai.")
],
"03-pakistan": [
("Pakistan ka dar-ul-hukumat kya hai?","Pakistan ka dar-ul-hukumat Islamabad hai."),
("Pakistan kab azaad hua?","Pakistan 14 August 1947 ko azaad hua."),
("Pakistan ki qaumi zaban kya hai?","Pakistan ki qaumi zaban Urdu hai; mulk mein kai regional zabanen bhi boli jati hain."),
("Pakistan ke soobay kitne hain?","Pakistan ke chaar soobay hain: Punjab, Sindh, Khyber Pakhtunkhwa aur Balochistan."),
("Sindh ka dar-ul-hukumat kya hai?","Sindh ka dar-ul-hukumat Karachi hai."),
("Pakistan ki currency kya hai?","Pakistan ki currency Pakistani rupee hai."),
("Constitution kya hota hai?","Constitution mulk ke bunyadi qawaneen aur hukoomati idaron ke ikhtiyarat tay karta hai."),
("Local government kya hai?","Local government shehri ya ilaqai satah par kuch public services aur masail manage karti hai."),
("Agriculture kya hai?","Agriculture faslon ki kasht aur janwaron ki parwarish se related kaam hai."),
("Water conservation kya hai?","Water conservation pani bachane aur uske zaya hone ko kam karne ke tareeqe hain.")
],
"04-mathematics": [
("Mathematics kya hai?","Mathematics numbers, patterns, structures, quantities aur logical relationships ka mutalea hai."),
("Prime number kya hai?","Prime number 1 se bara integer hai jo sirf 1 aur khud se divide hota hai."),
("Fraction kya hai?","Fraction kisi quantity ke hissa ko numerator aur denominator se dikhata hai."),
("Percentage kya hai?","Percentage kisi quantity ko 100 ke hisson mein zahir karta hai."),
("Algebra kya hai?","Algebra symbols aur variables se quantities ke relationships ko represent karta hai."),
("Equation kya hai?","Equation do mathematical expressions ki equality batati hai."),
("Average kya hai?","Arithmetic average values ke total ko values ki tadaad se divide karke milta hai."),
("Area kya hai?","Area kisi 2D surface ke andar ki jagah ka measure hai."),
("Perimeter kya hai?","Perimeter kisi 2D shape ki boundary ki total length hai."),
("Probability kya hai?","Probability kisi event ke hone ke imkaan ka mathematical measure hai.")
],
"05-biology": [
("Biology kya hai?","Biology living organisms aur life processes ka scientific study hai."),
("Cell kya hai?","Cell zindagi ki bunyadi structural aur functional unit hai."),
("DNA kya hai?","DNA genetic information store karne wala molecule hai."),
("Photosynthesis kya hai?","Plants aur kuch doosre organisms light energy se chemical energy banate hain."),
("Ecosystem kya hai?","Ecosystem living organisms aur unke physical environment ke interactions par mushtamil hota hai."),
("Bacteria kya hain?","Bacteria single-celled organisms hain; kuch faidemand aur kuch disease-causing ho sakte hain."),
("Virus kya hai?","Virus genetic material aur protein coat par mushtamil infectious agent hai jo host cells istemal karta hai."),
("Evolution kya hai?","Evolution generations ke dauran populations ki inherited characteristics mein tabdeeli hai."),
("Food chain kya hai?","Food chain dikhati hai ke ecosystem mein energy ek organism se doosre tak kaise jati hai."),
("Biodiversity kya hai?","Biodiversity genes, species aur ecosystems ki variety ko kehte hain.")
],
"06-space": [
("Solar system kya hai?","Solar system mein Sun aur uski gravity se bandhe planets, moons aur doosre objects shamil hain."),
("Galaxy kya hai?","Galaxy stars, gas, dust aur dark matter ka gravity se bandha bara system hai."),
("Milky Way kya hai?","Milky Way woh galaxy hai jismein hamara Solar System maujood hai."),
("Black hole kya hai?","Black hole space ka aisa region hai jahan gravity itni mazboot hoti hai ke event horizon ke andar se light bhi escape nahi kar sakti."),
("Orbit kya hai?","Orbit gravity ke asar mein kisi object ka doosre object ke gird path hai."),
("Light-year kya hai?","Light-year woh distance hai jo light vacuum mein ek saal mein tay karti hai."),
("Mars kya hai?","Mars Sun se chautha planet hai aur iski satah thandi aur zyada tar rocky hai."),
("Moon kya hai?","Moon Earth ka natural satellite hai."),
("Rocket kaise chalta hai?","Rocket mass ko high speed se peeche nikal kar thrust paida karta hai."),
("Exoplanet kya hai?","Exoplanet hamare Solar System se bahar kisi doosre star ke gird ghoomne wala planet hai.")
],
"07-history": [
("History kya hai?","History guzre hue waqiat ka records aur evidence ki bunyaad par mutalea hai."),
("Archaeology kya hai?","Archaeology past societies ko artifacts, buildings aur doosre material remains se study karti hai."),
("Primary source kya hai?","Primary source us daur ka original record ya evidence hota hai jiska mutalea kiya ja raha ho."),
("Secondary source kya hai?","Secondary source aam tor par primary evidence ki baad mein ki gayi tashreeh ya analysis hota hai."),
("Timeline kya hai?","Timeline waqiat ko waqt ya tareekh ke mutabiq arrange karti hai."),
("Civilization kya hai?","Civilization ek complex society hoti hai jismein institutions, settlements aur mukhtalif social systems ho sakte hain."),
("Trade routes kyun aham thay?","Trade routes saman, ideas, technologies aur culture ko ilaqon ke darmiyan le jane mein madad dete thay."),
("Historical evidence kyun check karein?","Sources ko compare karna ghalat fehmi, bias aur unsupported claims ko pehchanne mein madad deta hai."),
("Museum kya hai?","Museum objects aur records ko preserve, study aur public ke samne pesh karta hai."),
("Cultural heritage kya hai?","Cultural heritage kisi community ki inherited traditions, places, objects aur practices hain.")
],
"08-geography": [
("Geography kya hai?","Geography Earth ke places, environments aur insani activities ke spatial relationships ka study hai."),
("Continent kya hai?","Continent Earth ka bara landmass hota hai; continents ki tadaad classification ke mutabiq batayi jati hai."),
("Latitude kya hai?","Latitude Equator se north ya south angular distance batati hai."),
("Longitude kya hai?","Longitude Prime Meridian se east ya west angular distance batati hai."),
("Climate kya hai?","Climate kisi ilaqe ke weather patterns ka lambi muddat ka average aur variation hai."),
("Weather kya hai?","Weather kisi jagah ke atmosphere ki short-term condition hai."),
("River delta kya hai?","Delta aam tor par river ke mouth par sediment jama hone se banta hai."),
("Desert kya hai?","Desert aisa ilaqa hai jahan precipitation bohat kam hoti hai."),
("Map scale kya hai?","Map scale map ki distance aur zameen par asal distance ka ratio batata hai."),
("Earthquake kya hai?","Earthquake Earth ke andar energy release hone se ground ka hilna hai.")
],
"09-education": [
("Learning kya hai?","Learning knowledge, skills ya understanding mein tajurbe aur practice se tabdeeli hai."),
("Active recall kya hai?","Active recall bina notes dekhe information yaad se nikalne ki practice hai."),
("Spaced repetition kya hai?","Spaced repetition review ko waqt ke faslon par dohrati hai taake retention behtar ho."),
("Critical thinking kya hai?","Critical thinking claims aur evidence ko logical tareeqe se evaluate karti hai."),
("Research question kya hai?","Research question woh focused sawal hai jiska study ke zariye jawab dhoonda jata hai."),
("Citation kya hai?","Citation source ko credit deta aur reader ko original material dhoondne mein madad karta hai."),
("Plagiarism kya hai?","Plagiarism doosron ke ideas ya words ko munasib attribution ke baghair apna zahir karna hai."),
("Note-taking ka faida kya hai?","Achhe notes important ideas ko organize karte aur baad mein revision asaan banate hain."),
("Study plan kya hai?","Study plan topics, practice aur revision ke liye waqt aur priorities tay karta hai."),
("Feedback kya hai?","Feedback performance ke bare mein maloomat deta hai jisse agla attempt behtar banaya ja sakta hai.")
],
"10-language": [
("Language kya hai?","Language symbols aur rules ka system hai jisse log meaning communicate karte hain."),
("Grammar kya hai?","Grammar language ke structure aur words ko jorne ke rules ka majmua hai."),
("Vocabulary kya hai?","Vocabulary kisi zaban ke words aur unke meanings ka collection hai."),
("Synonym kya hai?","Synonym aisa lafz hai jiska meaning doosre lafz ke qareeb ya milta-julta ho."),
("Antonym kya hai?","Antonym aisa lafz hai jiska meaning doosre lafz ke opposite ho."),
("Translation kya hai?","Translation ek zaban ke meaning ko doosri zaban mein transfer karna hai."),
("Context kyun aham hai?","Context lafz ya jumle ka intended meaning samajhne mein madad karta hai."),
("Pronunciation kya hai?","Pronunciation kisi zaban ke sounds ko bolne ka tareeqa hai."),
("Metaphor kya hai?","Metaphor ek cheez ko doosri cheez ke taur par describe karke comparison ya meaning paida karta hai."),
("Summarizing kya hai?","Summarizing lambi information ke main points ko mukhtasar taur par bayan karna hai.")
],
"11-business": [
("Business kya hai?","Business goods ya services provide karta hai, aam tor par revenue hasil karne ke liye."),
("Revenue kya hai?","Revenue business ki sales ya services se aane wali income hai, expenses minus karne se pehle."),
("Profit kya hai?","Profit revenue mein se relevant costs aur expenses nikalne ke baad bachta hai."),
("Cash flow kya hai?","Cash flow business mein cash ke aane aur jane ka record hai."),
("Marketing kya hai?","Marketing customers ki needs samajhne, value pesh karne aur products ko promote karne ka kaam hai."),
("Customer service kya hai?","Customer service customers ke sawalat aur issues ko handle karne mein madad deti hai."),
("Market research kya hai?","Market research customers, competitors aur demand ke bare mein evidence jama karti hai."),
("Business plan kya hai?","Business plan goals, customers, operations, risks aur financial assumptions ko document karta hai."),
("Inventory kya hai?","Inventory woh goods ya materials hain jo business sale ya production ke liye rakhta hai."),
("Risk management kya hai?","Risk management risks ko identify, assess aur control karne ka process hai.")
],
"12-health": [
("Public health kya hai?","Public health populations mein disease prevention aur health improvement par focus karti hai."),
("Balanced diet kya hai?","Balanced diet mukhtalif foods se energy aur zaroori nutrients munasib miqdar mein hasil karne ki koshish hai."),
("Hydration kya hai?","Hydration body mein pani ki munasib miktar maintain karna hai."),
("Sleep kyun zaroori hai?","Sleep memory, mood, attention aur body ke normal functions ko support karti hai."),
("Exercise ka aam faida kya hai?","Regular physical activity fitness aur overall health ko support kar sakti hai."),
("Vaccination kya hai?","Vaccination immune system ko kisi pathogen ke khilaf protection develop karne mein madad deti hai."),
("Hygiene kya hai?","Hygiene practices infection risk aur gandagi ko kam karne mein madad deti hain."),
("Mental wellbeing kya hai?","Mental wellbeing emotions, stress, relationships aur daily functioning se related hai."),
("First aid kya hai?","First aid professional medical help milne tak di jane wali initial assistance hai."),
("Medical advice ka source kya hona chahiye?","Personal diagnosis aur treatment ke liye qualified healthcare professional se mashwara karna chahiye.")
],
"13-cybersecurity": [
("Cybersecurity kya hai?","Cybersecurity systems, networks aur data ko digital threats se protect karne ka amal hai."),
("Phishing kya hai?","Phishing dhokay se passwords ya sensitive data hasil karne ki koshish hai."),
("Strong password kaisa hota hai?","Strong password lamba, unique aur doosre accounts ke passwords se alag hota hai."),
("Two-factor authentication kya hai?","2FA login ke liye password ke ilawa ek doosra proof mangti hai."),
("Encryption kya hai?","Encryption data ko key ke zariye aisi form mein badalti hai jo bina munasib key ke samajhna mushkil ho."),
("Backup kyun zaroori hai?","Backup data loss, device failure ya accidental deletion ke baad recovery mein madad deta hai."),
("Malware kya hai?","Malware aisa software hai jo systems ko nuqsan dene, data churanay ya unwanted actions ke liye banaya jata hai."),
("Software update kyun karein?","Updates bugs fix kar sakti hain aur security weaknesses ko patch kar sakti hain."),
("Least privilege kya hai?","Least privilege ka principle user ya service ko sirf zaroori permissions deta hai."),
("Privacy kya hai?","Privacy personal information ke collection, use aur sharing par munasib control se related hai.")
],
"14-environment": [
("Environment kya hai?","Environment living organisms ke gird natural aur human-made surroundings hain."),
("Climate change kya hai?","Climate change climate patterns mein lambi muddat ki tabdeeli hai; modern warming mein human greenhouse-gas emissions ka bara kirdar hai."),
("Greenhouse effect kya hai?","Greenhouse gases Earth se nikalne wali heat ka kuch hissa absorb aur re-emit karti hain."),
("Renewable energy kya hai?","Renewable energy aise sources se aati hai jo natural processes se dobara replenish hote hain."),
("Solar energy kya hai?","Solar energy Sun ki radiation se hasil ki jati hai."),
("Recycling kya hai?","Recycling waste material ko process karke dobara usable material banana hai."),
("Air pollution kya hai?","Air pollution hawa mein harmful substances ki mojoodgi hai."),
("Deforestation kya hai?","Deforestation forests ka large-scale removal ya doosre land use mein tabdeel hona hai."),
("Water pollution kya hai?","Water pollution pani mein harmful substances ya organisms ke shamil hone ko kehte hain."),
("Conservation kya hai?","Conservation natural resources aur biodiversity ko protect aur sustainable use karne ki koshish hai.")
],
"15-ai-machine-learning": [
("Artificial intelligence kya hai?","AI aise computer systems ka field hai jo language, prediction, perception ya decision support jaise tasks karte hain."),
("Machine learning kya hai?","Machine learning data se patterns seekhne wale algorithms ka field hai."),
("Training data kya hai?","Training data woh examples hain jin se machine-learning model apne parameters seekhta hai."),
("Model inference kya hai?","Inference trained model ka input se output ya prediction banana hai."),
("Neural network kya hai?","Neural network connected computational units ki layers se patterns model karta hai."),
("Overfitting kya hai?","Overfitting tab hoti hai jab model training examples ko zyada fit kar leta hai aur naye data par kamzor hota hai."),
("Evaluation data kyun chahiye?","Alag evaluation data model ki performance ko training data se bahar check karne mein madad deta hai."),
("Hallucination kya hai?","AI hallucination aisa output hai jo confident lagta hai magar ghalat ya unsupported ho sakta hai."),
("Retrieval kya hai?","Retrieval relevant stored documents ya records ko query ke mutabiq dhoondna hai."),
("AI ki limitation kya hai?","AI systems ghalat jawab, bias aur missing context ka shikar ho sakte hain; outputs verify karna zaroori hai.")
],
"16-programming": [
("Programming kya hai?","Programming computer ko instructions dene ke liye code likhne aur test karne ka process hai."),
("JavaScript kya hai?","JavaScript web browsers aur doosre runtimes mein interactive applications banane ke liye istemal hoti hai."),
("Variable kya hai?","Variable code mein value ko naam ke zariye refer karne ka tareeqa hai."),
("Function kya hai?","Function reusable code block hai jo input le sakta aur output de sakta hai."),
("Array kya hai?","Array ordered collection hai jismein multiple values rakhi ja sakti hain."),
("Object kya hai?","JavaScript object properties ke zariye related data aur functions ko group kar sakta hai."),
("Bug kya hai?","Bug software mein aisi ghalti hai jo unwanted behavior ya failure paida karti hai."),
("Debugging kya hai?","Debugging problem ko reproduce, locate aur fix karne ka process hai."),
("Version control kya hai?","Version control files ki tabdeeliyon ko track karta hai aur collaboration mein madad deta hai."),
("Unit test kya hai?","Unit test software ke chhote hisson ke expected behavior ko check karta hai.")
],
"17-databases": [
("SQL kya hai?","SQL relational databases mein data query aur manage karne ke liye istemal hone wali language hai."),
("Table kya hai?","Relational database table rows aur columns mein data rakhti hai."),
("Primary key kya hai?","Primary key table ke har record ko uniquely identify karti hai."),
("Index kya hai?","Database index kuch queries ko tez kar sakta hai, lekin storage aur write cost bhi hoti hai."),
("Transaction kya hai?","Database transaction operations ka group hai jise defined consistency rules ke mutabiq handle kiya jata hai."),
("Backup aur replication mein farq kya hai?","Backup recovery ke liye copy hai; replication data ko doosre system par copy ya synchronize karti hai."),
("NoSQL kya hai?","NoSQL non-relational data models ke liye istemal hone wali database technologies ka broad group hai."),
("Data validation kya hai?","Data validation check karti hai ke input expected rules aur formats par pura utarta hai."),
("Migration kya hai?","Database migration schema ya data ko ek version ya structure se doosre mein tabdeel karti hai."),
("Connection pooling kya hai?","Connection pooling database connections ko reuse karke overhead kam kar sakti hai.")
],
"18-economics-finance": [
("Economics kya hai?","Economics resources, choices, production, distribution aur consumption ka study hai."),
("Inflation kya hai?","Inflation waqt ke sath general price level mein sustained rise hai."),
("Interest rate kya hai?","Interest rate borrowing ki cost ya saving par milne wali return ka rate hai."),
("Budget kya hai?","Budget expected income aur expenses ka plan hai."),
("Supply kya hai?","Supply kisi price par sellers ki provide karne ki willingness aur ability ko describe karti hai."),
("Demand kya hai?","Demand kisi price par buyers ki purchase karne ki willingness aur ability ko describe karti hai."),
("Diversification kya hai?","Diversification investments ya risks ko mukhtalif assets mein spread karna hai."),
("Compound interest kya hai?","Compound interest mein pehle jama interest par bhi baad ke periods mein interest mil sakta hai."),
("Liquidity kya hai?","Liquidity kisi asset ko jaldi aur kam value loss ke sath cash mein tabdeel karne ki asani hai."),
("Financial risk kya hai?","Financial risk mein loss, uncertainty ya expected return hasil na hone ka imkaan shamil hai.")
],
"19-social-media": [
("Social media kya hai?","Social media online platforms hain jahan users content share aur doosron se interact karte hain."),
("Algorithmic feed kya hai?","Algorithmic feed software rules aur signals se decide karti hai ke kaunsa content pehle dikhaya jaye."),
("Engagement kya hai?","Engagement likes, comments, shares, clicks aur doosri user interactions ko describe karta hai."),
("Content moderation kya hai?","Content moderation platform rules ke mutabiq content ko review aur handle karna hai."),
("Misinformation kya hai?","Misinformation ghalat ya misleading information hai, chahe use jaan boojh kar share kiya gaya ho ya nahi."),
("Digital footprint kya hai?","Digital footprint online activities se reh jane wale data aur records hain."),
("Creator attribution kya hai?","Creator attribution content ke asal creator ko credit dene ka tareeqa hai."),
("Accessibility kya hai?","Accessibility content aur services ko mukhtalif abilities wale logon ke liye usable banane par focus karti hai."),
("Online harassment kya hai?","Online harassment digital channels par targeted abusive ya threatening behavior hai."),
("Privacy settings kyun check karein?","Privacy settings account ki visibility aur information sharing par control dene mein madad karti hain.")
],
"20-engineering-physics": [
("Engineering kya hai?","Engineering science aur mathematics ko practical systems aur solutions design karne ke liye apply karti hai."),
("Circuit kya hai?","Circuit connected components ka path hai jismein electric current flow kar sakta hai."),
("Voltage kya hai?","Voltage do points ke darmiyan electric potential difference hai."),
("Current kya hai?","Electric current electric charge ke flow ki rate hai."),
("Resistance kya hai?","Resistance current ke flow ki mukhalifat ka measure hai."),
("Thermodynamics kya hai?","Thermodynamics heat, work, temperature aur energy ke relationships ka study hai."),
("Momentum kya hai?","Momentum mass aur velocity ka product hai."),
("Acceleration kya hai?","Acceleration velocity mein waqt ke sath tabdeeli ki rate hai."),
("Material strength kya hai?","Material strength applied stress ko failure ke baghair withstand karne ki salahiyat se related hai."),
("Prototype kya hai?","Prototype kisi design ka early model hai jise testing aur improvement ke liye banaya jata hai.")
]
}

# 10 x 50 = 500 records per file.
# Har seed question ko 50 mukhtalif wording styles milte hain.
prefixes = [
"Jawab dein: ", "Asaan alfaaz mein samjhayen: ",
"Is sawal ki wazahat karein: ", "Tafseel se batayen: ",
"Beginner ko samjhayen: ", "Mukhtasar jawab dein: ",
"Learning ke liye samjhayen: ", "Is topic par guide karein: ",
"Seedha jawab dein: ", "Is concept ko explain karein: "
]
suffixes = [
"", " Asaan misaal ke sath.", " Buniyadi satah par.",
" Student ke liye.", " Mukhtasar taur par.",
" Tafseeli context ke sath."
]
# 10 prefixes x 6 suffixes = 60 combinations; use first 50.

created = 0
for filename, seeds in topics.items():
    if len(seeds) != 10:
        raise ValueError(f"{filename}: exactly 10 seed Q&A expected")
    path = OUT / f"super-ai-{filename}.js"
    if path.exists():
        print("SKIP existing:", path)
        continue

    records = []
    for question, answer in seeds:
        variants = [p + question + s for p in prefixes for s in suffixes][:50]
        for i, variant in enumerate(variants):
            records.append({
                "id": f"{filename}-{len(records)+1:04d}",
                "question": variant,
                "answer": answer,
                "topic": filename,
                "seedQuestion": question,
                "variant": i + 1,
                "sourceType": "starter_knowledge_needs_review"
            })

    assert len(records) == 500, (filename, len(records))
    data = "window.SuperAIKnowledge = window.SuperAIKnowledge || {};\n"
    data += "window.SuperAIKnowledge[" + json.dumps(filename) + "] = "
    data += json.dumps(records, ensure_ascii=False, separators=(",", ":")) + ";\n"
    path.write_text(data, encoding="utf-8")
    created += 1
    print(f"CREATED {path} — {len(records)} records")

print(f"\nCreated this run: {created} files")
print("Each created file has exactly 500 records.")
print("Existing files were not overwritten. APK was not built.")
