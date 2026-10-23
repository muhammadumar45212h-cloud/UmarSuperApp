from pathlib import Path
import json, itertools

OUT = Path("www/ai-knowledge/history")
OUT.mkdir(parents=True, exist_ok=True)

# Har topic mein 10 bunyadi facts; har fact ke 50 sawal banenge.
# Yeh 500 records hain, 500 alag historical facts nahi.
topics = [
("01-ancient-civilizations", "Qadeem tehzeebain", [
("Mesopotamia", "Mesopotamia Tigris aur Euphrates daryaaon ke darmiyan qadeem ilaqa tha."),
("Ancient Egypt", "Qadeem Misr Nile darya ke gird taraqqi karne wali tehzeeb thi."),
("Indus Valley", "Indus Valley Civilization mein Harappa aur Mohenjo-daro aham shehri markaz thay."),
("Mohenjo-daro", "Mohenjo-daro aaj ke Sindh, Pakistan mein waqia ek aham Harappan archaeological site hai."),
("Harappa", "Harappa Punjab, Pakistan mein waqia Indus Valley Civilization ka aham markaz tha."),
("Ancient China", "Qadeem Cheen mein mukhtalif dynasties ke daur mein hukoomati aur saqafati taraqqi hui."),
("Ancient Greece", "Qadeem Greece falsafay, siyasat, funoon aur science par apne asraat ke liye mashhoor hai."),
("Roman Empire", "Roman Empire Europe, North Africa aur West Asia ke wasee ilaqon par mukhtalif dauron mein hukoomat karta tha."),
("Maya civilization", "Maya tehzeeb Mesoamerica mein apne calendars, shehron aur writing system ke liye mashhoor thi."),
("Mesopotamian writing", "Cuneiform Mesopotamia mein istemal hone wale sab se purane maloom writing systems mein se ek tha.")
]),
("02-world-leaders", "Duniya ke rehnuma", [
("Nelson Mandela", "Nelson Mandela South Africa ke anti-apartheid rehnuma thay aur 1994 mein president bane."),
("Mahatma Gandhi", "Mahatma Gandhi British rule ke khilaf Hindustan ki azadi ki tehreek ke aham rehnuma thay."),
("Abraham Lincoln", "Abraham Lincoln American Civil War ke dauran US president thay aur ghulami ke khatme ki koshishon se wabasta thay."),
("Winston Churchill", "Winston Churchill World War II ke zyada tar daur mein United Kingdom ke prime minister thay."),
("Martin Luther King Jr.", "Martin Luther King Jr. America mein civil rights movement ke aham rehnuma thay."),
("Quaid-e-Azam", "Muhammad Ali Jinnah Pakistan ke baani aur pehle Governor-General thay."),
("Fatima Jinnah", "Fatima Jinnah dentist, siyasi rehnuma aur Quaid-e-Azam ki qareebi saathi thin."),
("Abraham Lincoln", "Lincoln 1861 se 1865 tak US president rahe."),
("Franklin D. Roosevelt", "Franklin D. Roosevelt World War II ke ibtidai aur darmiyani daur mein US president thay."),
("Sukarno", "Sukarno Indonesia ke azadi ke rehnuma aur pehle president thay.")
]),
("03-muslim-scholars", "Muslim ilm aur ulama", [
("Al-Khwarizmi", "Al-Khwarizmi algebra ki taraqqi ke bunyadi tareekhi scholars mein shumar hote hain."),
("Ibn Sina", "Ibn Sina ek mashhoor physician aur philosopher thay; unki kitab Canon of Medicine asar-angez rahi."),
("Ibn al-Haytham", "Ibn al-Haytham optics aur scientific investigation ke tareekhi scholars mein aham hain."),
("Al-Biruni", "Al-Biruni astronomy, mathematics, geography aur mukhtalif cultures ke mutaleay ke liye mashhoor thay."),
("Al-Razi", "Al-Razi ek physician aur scholar thay jinhon ne medicine par asar-angez kaam kiya."),
("Ibn Khaldun", "Ibn Khaldun apni kitab Muqaddimah aur society aur history ke tajziye ke liye mashhoor hain."),
("Jabir ibn Hayyan", "Jabir ibn Hayyan ka naam tareekhi Arabic alchemy literature se wabasta hai; un se mansoob kaamon ki nisbat par scholars mein bahas hai."),
("Fatima al-Fihri", "Fatima al-Fihri ko Fez mein al-Qarawiyyin ki bunyaad rakhne se mansoob kiya jata hai."),
("Al-Idrisi", "Al-Idrisi ek geographer aur cartographer thay jinhon ne medieval world mapping mein kaam kiya."),
("Omar Khayyam", "Omar Khayyam Persian mathematician, astronomer aur shair thay.")
]),
("04-inventors", "Inventors aur ijadaat", [
("Johannes Gutenberg", "Gutenberg ka movable-type printing system Europe mein kitabon ki printing ke phailao mein aham raha."),
("Thomas Edison", "Thomas Edison ek inventor aur businessman thay jin ka naam electric lighting aur recording technologies se wabasta hai."),
("Nikola Tesla", "Nikola Tesla alternating-current electrical systems ki taraqqi mein aham inventor thay."),
("Alexander Graham Bell", "Alexander Graham Bell telephone ki ibtidai taraqqi se wabasta inventor thay."),
("Wright brothers", "Orville aur Wilbur Wright ne 1903 mein powered airplane ki controlled flight hasil ki."),
("James Watt", "James Watt ne steam engine ko behtar banane mein aham kirdar ada kiya."),
("Tim Berners-Lee", "Tim Berners-Lee ne World Wide Web ka bunyadi nizam banaya."),
("Ada Lovelace", "Ada Lovelace ko early computing history ki aham shakhsiyat aur pehli computer programmers mein se ek mana jata hai."),
("Grace Hopper", "Grace Hopper computer programming languages aur compiler technology ki taraqqi mein aham thin."),
("Hedy Lamarr", "Hedy Lamarr aur George Antheil ne frequency-hopping communication idea ke liye patent hasil kiya.")
]),
("05-scientists", "Scientists aur science", [
("Isaac Newton", "Isaac Newton classical mechanics aur gravity ke qawaneen ki tashkeel ke liye mashhoor hain."),
("Albert Einstein", "Albert Einstein ne relativity ke theories pesh kiye aur 1921 ka Nobel Prize Physics hasil kiya."),
("Marie Curie", "Marie Curie radioactivity ki research ke liye mashhoor thin aur do mukhtalif sciences mein Nobel Prize jeetne wali pehli shakhsiyat thin."),
("Charles Darwin", "Charles Darwin evolution by natural selection ke scientific theory ki tashkeel se wabasta hain."),
("Galileo Galilei", "Galileo ne astronomy aur motion ke mutaleay mein aham kaam kiya."),
("Ibn al-Haytham", "Ibn al-Haytham ne roshni aur nazar ke mutaleay mein aham hissa dala."),
("Katherine Johnson", "Katherine Johnson NASA ke liye orbital calculations karne wali mathematician thin."),
("Rosalind Franklin", "Rosalind Franklin ke X-ray diffraction data ne DNA structure ki samajh mein aham kirdar ada kiya."),
("Dmitri Mendeleev", "Dmitri Mendeleev ne periodic table ki ibtidai shakal ko munazzam karne mein aham kaam kiya."),
("Chien-Shiung Wu", "Chien-Shiung Wu experimental physicist thin jinhon ne parity violation ke experiment mein aham kirdar ada kiya.")
]),
("06-explorers", "Musafireen aur explorers", [
("Ibn Battuta", "Ibn Battuta ek Moroccan traveler thay jinhon ne Asia aur Africa ke wasee ilaqon ka safar kiya."),
("Zheng He", "Zheng He Ming dynasty China ke admiral thay jinhon ne Hind Ocean mein bari naval expeditions ki."),
("Ferdinand Magellan", "Magellan ki expedition pehli duniya-gird safar ki expedition thi, jo unki maut ke baad 1522 mein mukammal hui."),
("Marco Polo", "Marco Polo Venetian traveler thay jin ke safar ke bayan Europe mein mashhoor hue."),
("Christopher Columbus", "Columbus ki 1492 Atlantic voyage ne Europe aur Americas ke darmiyan mustaqil rabton ke daur ko shuru karne mein kirdar ada kiya."),
("Roald Amundsen", "Roald Amundsen South Pole tak pohanchne wali pehli tasdeeq-shuda expedition ke leader thay."),
("Ibn Jubayr", "Ibn Jubayr Andalusi traveler thay jinka safarnama medieval Muslim duniya ke bare mein aham maloomat deta hai."),
("Sacagawea", "Sacagawea ne Lewis and Clark expedition mein guide aur interpreter ke taur par madad ki."),
("James Cook", "James Cook British naval captain aur explorer thay jinhon ne Pacific region ki mapping mein hissa liya."),
("Zheng He voyages", "Zheng He ki expeditions ne 15veen sadi mein China ke Hind Ocean ke saath diplomatic aur tijarati rabte barhaye.")
]),
("07-empires", "Saltanatein aur empires", [
("Ottoman Empire", "Ottoman Empire kai sadiyon tak Southeast Europe, West Asia aur North Africa ke hisson par hukoomat karta raha."),
("Mughal Empire", "Mughal Empire ne South Asia ki siyasat, architecture aur culture par gehra asar dala."),
("Mongol Empire", "Mongol Empire 13veen sadi mein duniya ki sab se wasee contiguous land empires mein se ek bana."),
("British Empire", "British Empire mukhtalif dauron mein duniya ke bohat se ilaqon par phaila hua tha."),
("Mali Empire", "Mali Empire West Africa ki ek daulatmand saltanat thi, jo gold trade se mashhoor hui."),
("Achaemenid Empire", "Achaemenid Persian Empire Cyrus the Great ne qaim ki aur yeh purani duniya ki bari saltanaton mein se ek thi."),
("Byzantine Empire", "Byzantine Empire mashriqi Roman siyasi aur saqafati riwayat ka silsila tha."),
("Abbasid Caliphate", "Abbasid daur mein Baghdad ilm, tarjume, adab aur tijarat ka aham markaz bana."),
("Umayyad Caliphate", "Umayyad Caliphate ke daur mein Muslim hukoomat ka ilaqa bohat wasee hua."),
("Aztec Empire", "Aztec Empire central Mexico mein tha aur 16veen sadi mein Spanish conquest ke dauran khatam hua.")
]),
("08-world-wars", "Jangein aur unke asraat", [
("World War I", "World War I 1914 se 1918 tak lari gayi."),
("World War II", "World War II 1939 se 1945 tak lari gayi."),
("Battle of Waterloo", "Battle of Waterloo 1815 mein hui aur Napoleon ki aakhri siyasi-fauji shikast ka sabab bani."),
("Battle of Hastings", "Battle of Hastings 1066 mein hui aur England ki Norman conquest mein faisla-kun thi."),
("Cold War", "Cold War America aur Soviet Union ke darmiyan geopolitical rivalry thi, jo aam tor par 1947 se 1991 tak samjhi jati hai."),
("Hiroshima", "Hiroshima par August 1945 mein atomic bomb giraya gaya; is se bohat bari civilian tabahi hui."),
("Pearl Harbor", "Japan ne 7 December 1941 ko Pearl Harbor par hamla kiya, jis ke baad America World War II mein dakhil hua."),
("United Nations", "United Nations 1945 mein international cooperation aur aman ke liye qaim hui."),
("League of Nations", "League of Nations World War I ke baad qaim hui magar doosri aalami jang rokne mein nakaam rahi."),
("Berlin Wall", "Berlin Wall 1961 mein bani aur 1989 mein khulne lagi; yeh Cold War ki aham alamat thi.")
]),
("09-independence-movements", "Azadi ki tehreekain", [
("Pakistan independence", "Pakistan 14 August 1947 ko British India ki taqseem ke natije mein qaim hua."),
("Indian independence", "India 15 August 1947 ko British rule se azad hua."),
("Bangladesh independence", "Bangladesh 1971 mein jang aur siyasi crisis ke baad ek mustaqil mulk bana."),
("American Revolution", "American Revolution ke natije mein 13 British colonies ne azadi hasil ki."),
("French Revolution", "French Revolution 1789 mein shuru hui aur France ki siyasat aur Europe par gehra asar dala."),
("Haitian Revolution", "Haitian Revolution ne Haiti ko French colonial rule se azad karaya aur ghulami ke khilaf tareekh mein aham maqam rakhti hai."),
("South African democracy", "South Africa mein 1994 ke elections ne apartheid ke baad pehli all-race democratic election ki nishandahi ki."),
("Ghana independence", "Ghana 1957 mein British colonial rule se azad hua."),
("Algerian independence", "Algeria ne 1962 mein France se azadi hasil ki."),
("Vietnam independence", "Vietnam ki azadi ka process kai jangon aur siyasi tabdeeliyon par mushtamil tha; 1975 mein Vietnam ki jang ka bara marhala khatam hua.")
]),
("10-philosophers", "Falsafa aur mufakkireen", [
("Socrates", "Socrates qadeem Greek philosopher thay jin ka sawal-jawab par mabni tareeqa mashhoor hai."),
("Plato", "Plato Greek philosopher aur Academy ke baani thay."),
("Aristotle", "Aristotle logic, biology, ethics aur philosophy ke bohat se mawazoo par likhne wale Greek thinker thay."),
("Confucius", "Confucius Chinese philosopher thay jin ki taleemat ethics aur social relationships par zor deti hain."),
("Rumi", "Jalaluddin Rumi Persian zaban ke mashhoor Sufi shair aur thinker thay."),
("Ibn Rushd", "Ibn Rushd Andalusi philosopher aur physician thay jinhon ne Aristotle ke kaam par tafseeli sharah likhi."),
("Al-Farabi", "Al-Farabi Muslim philosopher thay jinhon ne logic aur political philosophy par kaam kiya."),
("John Locke", "John Locke English philosopher thay jin ke ideas natural rights aur government ke nazariyat par asar انداز hue."),
("Hannah Arendt", "Hannah Arendt siyasi thinker thin jinhon ne totalitarianism aur political action par likha."),
("Simone de Beauvoir", "Simone de Beauvoir French philosopher aur writer thin jinka kaam feminism aur existentialism se wabasta hai.")
]),
("11-art-and-literature", "Funoon aur adab", [
("William Shakespeare", "William Shakespeare English playwright aur poet thay jinka kaam duniya bhar mein parhaya aur perform kiya jata hai."),
("Allama Iqbal", "Allama Muhammad Iqbal Urdu aur Persian ke shair aur thinker thay."),
("Mirza Ghalib", "Mirza Ghalib Urdu aur Persian ghazal ke sab se mashhoor shora mein shumar hote hain."),
("Rabindranath Tagore", "Rabindranath Tagore Bengali poet aur writer thay aur 1913 mein Literature ka Nobel Prize jeeta."),
("Leo Tolstoy", "Leo Tolstoy Russian novelist thay; War and Peace unki mashhoor kitabon mein se hai."),
("Jane Austen", "Jane Austen English novelist thin jo society aur relationships par apne novels ke liye mashhoor hain."),
("Maya Angelou", "Maya Angelou American poet aur memoirist thin jinka kaam civil rights aur identity se bhi wabasta hai."),
("Abdul Sattar Edhi", "Abdul Sattar Edhi Pakistani humanitarian thay jinhon ne Edhi Foundation ko taraqqi di."),
("Frida Kahlo", "Frida Kahlo Mexican painter thin jo apne self-portraits ke liye mashhoor hain."),
("Leonardo da Vinci", "Leonardo da Vinci Renaissance artist, engineer aur inventor thay.")
]),
("12-women-in-history", "Tareekh ki numaya khawateen", [
("Fatima Jinnah", "Fatima Jinnah Pakistan ki siyasi tareekh ki aham shakhsiyat aur women's political participation ki numaya misaal thin."),
("Marie Curie", "Marie Curie ne radioactivity ki research mein bunyadi kaam kiya aur do Nobel Prizes jeete."),
("Rosa Parks", "Rosa Parks ki bus mein apni seat na chhorne ki 1955 ki karwai America ke civil rights movement ki aham alamat bani."),
("Ada Lovelace", "Ada Lovelace ko computing history ki ibtidai programmers mein shumar kiya jata hai."),
("Malala Yousafzai", "Malala Yousafzai larkiyon ki taleem ki himayat ke liye mashhoor Pakistani activist hain aur 2014 mein Nobel Peace Prize jeeta."),
("Cleopatra", "Cleopatra VII Ptolemaic Egypt ki hukmaran thin aur Roman siyasat se unke gehre talluqat thay."),
("Harriet Tubman", "Harriet Tubman ne America mein ghulami se bhagne walon ki madad ke liye Underground Railroad network mein kaam kiya."),
("Empress Wu Zetian", "Wu Zetian China ki woh hukmaran thin jinhon ne apni dynasty ke naam se hukoomat ki."),
("Queen Elizabeth I", "Elizabeth I ne England par 1558 se 1603 tak hukoomat ki."),
("Wangari Maathai", "Wangari Maathai Kenyan environmentalist thin aur 2004 mein Nobel Peace Prize jeeta.")
]),
("13-religions-and-cultures", "Mazahib aur saqafati tareekh", [
("Buddhism", "Buddhism South Asia mein Gautama Buddha ki taleemat se ubharne wali riwayat hai."),
("Christianity history", "Christianity pehli sadi CE mein Roman Judea ke ilaqe mein ubhri."),
("Islam history", "Islam saatveen sadi CE mein Arabian Peninsula mein zahir hua."),
("Judaism history", "Judaism ek qadeem monotheistic religious tradition hai jis ki tareekh West Asia se wabasta hai."),
("Hindu traditions", "Hindu traditions South Asia mein sadiyon ke dauran mukhtalif matn, riwayat aur practices ke zariye taraqqi karti rahin."),
("Sikhism", "Sikhism 15veen sadi mein Punjab mein Guru Nanak ki taleemat se shuru hua."),
("Vatican", "Vatican City Rome ke andar ek sovereign city-state hai aur Roman Catholic Church ka markaz hai."),
("Nalanda", "Nalanda ancient India ka ek aham taleemi markaz tha."),
("House of Wisdom", "Baghdad ka Bayt al-Hikma Abbasid daur ki ilm aur tarjume ki riwayat se wabasta hai."),
("Silk Road", "Silk Road Asia, Africa aur Europe ke mukhtalif hisson ko jorne wale tijarati aur saqafati raston ka network tha.")
]),
("14-african-history", "Africa ki tareekh", [
("Mansa Musa", "Mansa Musa Mali Empire ka hukmaran tha aur 1324 ke Hajj safar aur saltanat ki daulat ke hawale se mashhoor hai."),
("Great Zimbabwe", "Great Zimbabwe southern Africa ka medieval shehri aur tijarati markaz tha."),
("Timbuktu", "Timbuktu West Africa ka tareekhi tijarati aur taleemi markaz tha."),
("Kingdom of Kush", "Kingdom of Kush Nile Valley mein qaim ek qadeem saltanat thi."),
("Axum", "Aksum ya Axum Horn of Africa ki qadeem saltanat thi jo tijarat aur apni writing tradition ke liye mashhoor thi."),
("Swahili coast", "Swahili coast Hind Ocean ki tijarat se mutasir East African shehri saqafat ka ilaqa tha."),
("Benin Kingdom", "Kingdom of Benin West Africa mein apne bronze artworks aur siyasi nizam ke liye mashhoor tha."),
("Ethiopia", "Ethiopia ki tareekh mein qadeem Aksumite civilization aur baad ki saltanaton ka aham maqam hai."),
("Trans-Saharan trade", "Trans-Saharan trade ne North Africa aur West Africa ko namak, sona aur doosri ashya ke zariye jora."),
("African decolonization", "20veen sadi mein Africa ke kai mulkon ne European colonial rule se azadi hasil ki.")
]),
("15-east-asian-history", "Mashriqi Asia ki tareekh", [
("Qin Shi Huang", "Qin Shi Huang ne 221 BCE mein China ko ek hukoomat ke neeche unite kiya."),
("Silk Road China", "Silk Road ne China ko Central Asia aur doosre regions se tijarati rabton mein jora."),
("Meiji Restoration", "Meiji Restoration 1868 mein Japan ke siyasi aur samaji nizam ki bari tabdeeli ka aghaz thi."),
("Samurai", "Samurai feudal Japan ke warrior class se talluq rakhte thay."),
("Ming dynasty", "Ming dynasty ne China par 1368 se 1644 tak hukoomat ki."),
("Tang dynasty", "Tang dynasty 618 se 907 tak China mein hukoomat karti rahi aur adab aur culture ke liye mashhoor hai."),
("Korean alphabet", "Hangul Korean writing system hai jo 15veen sadi mein King Sejong ke daur mein tayyar hua."),
("Hiroshima and Nagasaki", "Hiroshima aur Nagasaki par August 1945 mein atomic bombings hui thin."),
("Hong Kong history", "Hong Kong 1997 mein British administration se China ki sovereignty ke neeche transfer hua."),
("Japanese constitution", "Japan ka postwar constitution 1947 mein nafiz hua.")
]),
("16-americas-history", "North aur South America", [
("Maya", "Maya civilization Mesoamerica mein apne shehron, mathematics aur calendar traditions ke liye mashhoor thi."),
("Inca", "Inca Empire Andes region mein qaim tha aur Cusco uska aham markaz tha."),
("Aztec", "Aztec Empire central Mexico mein qaim tha aur 16veen sadi mein Spanish conquest ka samna kiya."),
("Declaration of Independence", "United States Declaration of Independence 4 July 1776 ko adopt hui."),
("US Civil War", "American Civil War 1861 se 1865 tak lari gayi."),
("Brazil independence", "Brazil ne 1822 mein Portugal se azadi ka elan kiya."),
("Simón Bolívar", "Simón Bolívar Latin America ki kai azadi ki tehreekon ke aham leader thay."),
("Toussaint Louverture", "Toussaint Louverture Haitian Revolution ke aham leaders mein shumar hote hain."),
("Canadian Confederation", "Canadian Confederation 1867 mein bani."),
("Panama Canal", "Panama Canal 1914 mein international shipping ke liye kholi gayi.")
]),
("17-european-history", "Europe ki tareekh", [
("Renaissance", "Renaissance Europe mein art, learning aur literature ki bari tehreek thi jo late medieval aur early modern dauron mein phaili."),
("Black Death", "Black Death 14veen sadi mein Europe aur aas paas ke ilaqon mein phailne wali plague pandemic thi."),
("Magna Carta", "Magna Carta 1215 mein England ke King John se manwayi gayi charter thi."),
("French Revolution", "French Revolution 1789 mein shuru hui aur France ki monarchy aur society ko badal diya."),
("Industrial Revolution", "Industrial Revolution Britain mein shuru hui aur production, technology aur urban life ko badal diya."),
("European Union", "European Union ki maujooda treaty-based shakal 1993 mein Maastricht Treaty ke nafaz ke saath bani."),
("Berlin Wall", "Berlin Wall 1961 mein bani aur 1989 mein khul gayi."),
("Viking Age", "Viking Age aam tor par late 8veen se 11veen sadi tak Northern Europe ki seafaring aur raids ke daur ko kehte hain."),
("Norman Conquest", "Norman Conquest 1066 mein England ki siyasat aur zaban par gehra asar chhor gayi."),
("Treaty of Versailles", "Treaty of Versailles 1919 mein Germany aur Allied powers ke darmiyan sign hui.")
]),
("18-modern-inventions", "Jadeed duniya aur technology", [
("Internet", "Internet mukhtalif computer networks ka global network hai jo protocols ke zariye data exchange karta hai."),
("World Wide Web", "World Wide Web webpages aur links ka system hai jo internet par chalta hai."),
("Printing press", "Printing press ne kitabon aur likhe hue matn ki bari paimane par nashr ko asaan banaya."),
("Vaccination", "Vaccination immune system ko kisi infection ke khilaf tayyar karne mein madad deti hai."),
("Penicillin", "Penicillin ki antibacterial properties Alexander Fleming ne 1928 mein discover ki thin."),
("Electric battery", "Electric battery chemical energy ko electrical energy mein tabdeel karti hai."),
("Steam engine", "Improved steam engines ne Industrial Revolution mein factories aur transport ko badalne mein hissa liya."),
("Radio", "Radio communication electromagnetic waves ke zariye signals transmit kar sakti hai."),
("Computer", "Modern computers data process karne ke liye hardware aur software istemal karte hain."),
("Artificial intelligence", "Artificial intelligence computer systems ko learning, pattern recognition aur decision-support jaise tasks karne ke liye banane ka field hai.")
]),
("19-pakistan-history", "Pakistan ki tareekh", [
("Pakistan Resolution", "Lahore Resolution 23 March 1940 ko All-India Muslim League ke ijlas mein pass hui."),
("Muhammad Ali Jinnah", "Muhammad Ali Jinnah Pakistan ke baani aur pehle Governor-General thay."),
("Liaquat Ali Khan", "Liaquat Ali Khan Pakistan ke pehle Prime Minister thay."),
("Pakistan independence", "Pakistan 14 August 1947 ko qaim hua."),
("Constitution of Pakistan", "Pakistan ka mojooda constitution 1973 mein adopt hua."),
("Mohenjo-daro", "Mohenjo-daro Sindh mein waqia Indus Valley Civilization ka qadeem shehar tha."),
("Allama Iqbal", "Allama Iqbal ne South Asian Muslim political thought aur Urdu-Persian adab par gehra asar dala."),
("Fatima Jinnah", "Fatima Jinnah Pakistan ki siyasi tareekh mein aham role rakhne wali leader thin."),
("Edhi Foundation", "Edhi Foundation Pakistan ki humanitarian aur ambulance services ke liye mashhoor hai."),
("Pakistan geography", "Pakistan South Asia mein waqia hai aur iske hamsaya mulkon mein India, Afghanistan, Iran aur China shamil hain.")
]),
("20-world-milestones", "Duniya ke aham tareekhi milestones", [
("First Moon landing", "Apollo 11 mission ne July 1969 mein pehli crewed Moon landing mukammal ki."),
("Sputnik 1", "Sputnik 1 Soviet Union ka pehla artificial satellite tha, jo 1957 mein launch hua."),
("Human genome project", "Human Genome Project ek international scientific effort tha jis ne human genome ki sequencing ko aage barhaya."),
("United Nations founding", "United Nations 1945 mein qaim hui."),
("Universal Declaration of Human Rights", "Universal Declaration of Human Rights United Nations General Assembly ne 1948 mein adopt ki."),
("Women voting rights", "Voting rights ke liye khawateen ki tehreekon ne mukhtalif mulkon mein mukhtalif waqt par qanooni tabdeeli hasil ki."),
("Abolition of slavery", "Ghulami ke qanooni khatme ka waqt mulk aur ilaqe ke mutabiq mukhtalif tha."),
("Industrialization", "Industrialization ne production ko factories aur machines ki taraf badla aur shehri abadi mein izafa kiya."),
("Globalization", "Globalization se murad economies, cultures aur societies ke darmiyan barhte hue global rabte hain."),
("Climate history", "Climate history mein ice cores, tree rings aur doosre records se guzre hue climate ka mutala kiya jata hai.")
])
]

prefixes = [
    "Asaan alfaaz mein samjhao: ",
    "Is topic ke bare mein batao: ",
    "Tareekhi sawal: ",
    "Mukhtasar jawab do: ",
    "Mujhe samjhao: "
]
suffixes = [
    "", " kya hai?", " ki tareekh kya hai?", " kyun aham hai?",
    " ke bare mein maloomat do?", " ka kirdar kya tha?",
    " ka asar kya raha?", " kis daur se talluq rakhta hai?",
    " is topic ko samjhao.", " ke aham nuqaat batao."
]

manifest = []
for slug, title, facts in topics:
    path = OUT / f"super-ai-history-{slug}.js"
    records = []
    for idx, (subject, answer) in enumerate(facts, 1):
        questions = []
        for p, s in itertools.product(prefixes, suffixes):
            questions.append(p + subject + s)
        for n, question in enumerate(questions[:50], 1):
            records.append({
                "id": f"{slug}-{idx:02d}-{n:02d}",
                "topic": title,
                "subject": subject,
                "question": question,
                "answer": answer,
                "sourceType": "starter-reference",
                "verified": False
            })
    if len(records) != 500:
        raise RuntimeError(f"{path}: expected 500 records, got {len(records)}")
    if path.exists():
        print("SKIP existing:", path)
        continue
    content = (
        "window.SuperAIHistory = window.SuperAIHistory || {};\n"
        f"window.SuperAIHistory[{json.dumps(slug)}] = "
        + json.dumps(records, ensure_ascii=False, indent=2)
        + ";\n"
    )
    path.write_text(content, encoding="utf-8")
    manifest.append(str(path))
    print("CREATED:", path, "records=", len(records))

print("New history files:", len(manifest))
print("Note: 500 records/file, based on 10 core facts and question variations.")
