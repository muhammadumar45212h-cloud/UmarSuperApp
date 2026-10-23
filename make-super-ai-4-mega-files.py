from pathlib import Path
import json

OUT = Path("www/ai-knowledge")
OUT.mkdir(parents=True, exist_ok=True)

datasets = {
"super-ai-mega-01-science.js": {
"name": "Science & Nature",
"export": "SuperAI_Knowledge_Mega_Science",
"facts": [
("What is the chemical formula for water?", "H2O"),
("What is the speed of light in a vacuum?", "Approximately 299,792,458 metres per second."),
("What force attracts objects with mass?", "Gravity."),
("What is the centre of an atom called?", "The nucleus."),
("What gas do plants absorb during photosynthesis?", "Carbon dioxide."),
("What is the largest planet in our solar system?", "Jupiter."),
("Which planet is known as the Red Planet?", "Mars."),
("What is the closest star to Earth?", "The Sun."),
("What is the smallest unit of life?", "The cell."),
("What is the study of living organisms called?", "Biology."),
("What is the chemical symbol for gold?", "Au."),
("What is the chemical symbol for iron?", "Fe."),
("What is the main gas in Earth's atmosphere?", "Nitrogen."),
("What is the process plants use to make food?", "Photosynthesis."),
("What is the largest mammal alive today?", "The blue whale."),
("What is the hardest natural mineral on the Mohs scale?", "Diamond."),
("What is the study of earthquakes called?", "Seismology."),
("What is the study of weather called?", "Meteorology."),
("What is the study of fossils called?", "Palaeontology."),
("What is the powerhouse of a cell commonly called?", "The mitochondrion."),
("What is DNA?", "Deoxyribonucleic acid, a molecule that carries genetic information."),
("What is the boiling point of pure water at sea level?", "About 100 degrees Celsius at standard atmospheric pressure."),
("What is the freezing point of pure water at standard pressure?", "0 degrees Celsius."),
("What is the closest planet to the Sun?", "Mercury."),
("What is Earth's natural satellite?", "The Moon."),
("What is the main component of natural gas?", "Methane."),
("What is the outermost solid layer of Earth called?", "The crust."),
("What are animals with backbones called?", "Vertebrates."),
("What are animals that mainly eat plants called?", "Herbivores."),
("What are proteins built from?", "Amino acids."),
("What is the largest organ of the human body?", "The skin."),
("Which human bone is the longest?", "The femur."),
("Which blood cells help fight infections?", "White blood cells."),
("What do red blood cells mainly transport?", "Oxygen, using haemoglobin."),
("What is the change from liquid to gas called?", "Vaporisation; evaporation is one form of it."),
("What is the change from gas to liquid called?", "Condensation."),
("What type of rock forms when magma or lava cools?", "Igneous rock."),
("What is the study of matter and energy called?", "Physics."),
("What is the study of substances and their reactions called?", "Chemistry."),
("What is the SI unit of force?", "The newton."),
("What is the SI unit of energy?", "The joule."),
("What is the SI unit of electric current?", "The ampere."),
("What is pH used to describe?", "How acidic or basic an aqueous solution is."),
("What is a molecule?", "Two or more atoms chemically bonded together."),
("What is an ecosystem?", "A community of organisms interacting with one another and their environment."),
("What is biodiversity?", "The variety of living organisms in a region or on Earth."),
("What is an adaptation in biology?", "An inherited feature that can help an organism survive or reproduce."),
("What is an orbit?", "The path one object follows around another under gravity or other forces."),
("What causes the seasons on Earth?", "Earth's axial tilt as it orbits the Sun."),
("Why does the Moon appear bright?", "It reflects sunlight.")
]},
"super-ai-mega-02-history.js": {
"name": "World History & People",
"export": "SuperAI_Knowledge_Mega_History",
"facts": [
("When did Pakistan become independent?", "Pakistan marks its independence on 14 August 1947."),
("Who was the founder of Pakistan?", "Muhammad Ali Jinnah is widely known as the founder of Pakistan."),
("Who was Pakistan's first prime minister?", "Liaquat Ali Khan."),
("Who was Fatima Jinnah?", "A dentist and prominent political figure in Pakistan's independence and later political history."),
("What was the Indus Valley Civilization?", "An ancient urban civilization known for sites including Harappa and Mohenjo-daro."),
("Where is Mohenjo-daro?", "In Sindh, Pakistan."),
("What was Mesopotamia?", "An ancient region associated with the Tigris and Euphrates river systems."),
("Who was Al-Khwarizmi?", "A scholar whose work was important in the historical development of algebra."),
("Who was Ibn Sina?", "A physician and philosopher whose Canon of Medicine influenced medical learning for centuries."),
("Who was Ibn al-Haytham?", "A scholar known for influential work on optics and scientific investigation."),
("Who was Al-Biruni?", "A scholar known for work in astronomy, mathematics, geography and comparative study."),
("Who was Ibn Khaldun?", "A historian and thinker known for the Muqaddimah and analysis of society and history."),
("Who was Nelson Mandela?", "A South African anti-apartheid leader who became president in 1994."),
("Who was Marie Curie?", "A physicist and chemist known for research on radioactivity; she won Nobel Prizes in two sciences."),
("Who was Albert Einstein?", "A physicist known for the theories of special and general relativity."),
("Who was Isaac Newton?", "A scientist known for foundational work in classical mechanics and gravitation."),
("Who was Ada Lovelace?", "A nineteenth-century mathematician often described as an early computer programmer."),
("Who were the Wright brothers?", "Orville and Wilbur Wright, pioneers of controlled powered flight in 1903."),
("Who was Ibn Battuta?", "A Moroccan traveller whose journeys covered many regions of Africa and Asia."),
("Who was Mansa Musa?", "A ruler of the Mali Empire known for his wealth and pilgrimage to Mecca."),
("When was the First World War?", "It lasted from 1914 to 1918."),
("When was the Second World War?", "It lasted from 1939 to 1945."),
("When was the United Nations founded?", "1945."),
("What was the Renaissance?", "A period of major cultural, artistic and intellectual change in Europe."),
("What was the Industrial Revolution?", "A period of transformation in manufacturing, technology, transport and urban life."),
("What was the Silk Road?", "A network of trade routes linking parts of Asia, Africa and Europe."),
("What was the Ottoman Empire?", "A long-lasting empire spanning parts of southeastern Europe, western Asia and North Africa."),
("What was the Mughal Empire?", "An empire that ruled large parts of South Asia and influenced its architecture and culture."),
("Who was Rumi?", "A Persian-language poet and Sufi thinker."),
("Who was Allama Iqbal?", "A major Urdu and Persian poet and thinker associated with South Asian Muslim political thought."),
("Who was Abdul Sattar Edhi?", "A Pakistani humanitarian known for building a major charitable welfare network."),
("Who was Malala Yousafzai?", "A Pakistani education activist who received the Nobel Peace Prize in 2014."),
("Who was William Shakespeare?", "An English playwright and poet whose works remain widely performed."),
("Who was Cleopatra VII?", "The last active ruler of the Ptolemaic Kingdom of Egypt."),
("Who was Galileo Galilei?", "An astronomer and physicist who made important contributions to the study of motion and astronomy."),
("Who was Charles Darwin?", "A naturalist associated with the theory of evolution by natural selection."),
("What was the French Revolution?", "A revolution beginning in 1789 that transformed French politics and society."),
("When did the Berlin Wall open?", "The border crossings opened in November 1989."),
("What was the ancient city of Timbuktu known for?", "Trade, scholarship and learning in West Africa."),
("What was the Maya civilization known for?", "Its cities, writing, mathematics and calendar traditions."),
("What was the Inca Empire?", "A major Andean empire in South America, centred on Cusco."),
("Who was Zheng He?", "A Ming-dynasty Chinese admiral who led major maritime expeditions."),
("Who was Confucius?", "A Chinese philosopher whose teachings strongly influenced ethics and social thought."),
("Who was Socrates?", "An ancient Greek philosopher known through accounts of his questioning method."),
("Who was Plato?", "A Greek philosopher who founded the Academy in Athens."),
("Who was Aristotle?", "A Greek philosopher whose writings covered logic, biology, ethics and many other subjects."),
("What was the Magna Carta?", "A charter agreed by King John of England in 1215."),
("When did the first Moon landing occur?", "Apollo 11 landed astronauts on the Moon in July 1969."),
("What was Sputnik 1?", "The first artificial Earth satellite, launched by the Soviet Union in 1957."),
("What is the Universal Declaration of Human Rights?", "A declaration adopted by the UN General Assembly in 1948.")
]},
"super-ai-mega-03-technology.js": {
"name": "Technology, Programming & AI",
"export": "SuperAI_Knowledge_Mega_Technology",
"facts": [
("What is artificial intelligence?", "A field focused on building systems that perform tasks associated with capabilities such as learning, reasoning and perception."),
("What is machine learning?", "A branch of AI in which systems learn patterns from data."),
("What is a neural network?", "A computational model made of connected units that learn patterns from examples."),
("What is a large language model?", "A model trained on large amounts of text to process and generate language."),
("What is a dataset?", "An organised collection of data used for analysis, testing or training."),
("What is supervised learning?", "Learning from examples paired with target labels or answers."),
("What is unsupervised learning?", "Finding patterns in data without target labels supplied for each example."),
("What is reinforcement learning?", "Learning behaviour through actions and feedback such as rewards or penalties."),
("What is an algorithm?", "A defined sequence of steps for solving a problem."),
("What is a programming language?", "A formal language used to express instructions for computers."),
("What is JavaScript used for?", "Web development and many other applications, including server-side software."),
("What is Python used for?", "Automation, data analysis, AI, web services and general programming."),
("What is HTML?", "A markup language used to structure web content."),
("What is CSS?", "A language used to style the presentation of web documents."),
("What is an API?", "An interface that lets software systems communicate through defined operations."),
("What is a database?", "An organised system for storing and retrieving data."),
("What is SQL?", "A language used to query and manage relational databases."),
("What is a primary key?", "A field or set of fields that uniquely identifies a row in a relational table."),
("What is encryption?", "Transforming information so it can only be read by parties with the required key."),
("What is authentication?", "Checking that a user or system is who it claims to be."),
("What is authorisation?", "Determining what an authenticated user or system is allowed to do."),
("What is two-factor authentication?", "A login method requiring two different types of evidence."),
("What is phishing?", "A deceptive attempt to steal information or make someone perform an unsafe action."),
("What is malware?", "Software designed to harm systems, disrupt operation or gain unauthorised access."),
("What is a firewall?", "A system that filters network traffic according to security rules."),
("What is cloud computing?", "Providing computing resources and services over a network, commonly the internet."),
("What is version control?", "Tracking changes to files over time."),
("What is Git?", "A distributed version control system."),
("What is GitHub?", "A platform for hosting and collaborating on software repositories."),
("What is continuous integration?", "Automatically checking changes through builds and tests."),
("What is a software test?", "A procedure used to check whether software behaves as expected."),
("What is a bug?", "A defect that causes software to behave incorrectly or unexpectedly."),
("What is debugging?", "Finding, understanding and fixing software defects."),
("What is an operating system?", "Software that manages computer hardware and provides services to applications."),
("What is Linux?", "A family of operating systems built around the Linux kernel."),
("What is Android?", "A mobile operating system built around the Linux kernel and other components."),
("What is Termux?", "An Android terminal environment that provides command-line tools."),
("What is a web server?", "Software or a system that serves content and handles web requests."),
("What is HTTP?", "A protocol used to transfer web resources."),
("What is HTTPS?", "HTTP protected by TLS encryption."),
("What is JSON?", "A text format for representing structured data."),
("What is a function in programming?", "A reusable block of code that can accept inputs and produce results."),
("What is an array?", "An ordered collection of values."),
("What is an object in JavaScript?", "A collection of properties associated with values."),
("What is asynchronous programming?", "Programming that allows work to progress without waiting synchronously for every operation."),
("What is a promise in JavaScript?", "An object representing the eventual completion or failure of an asynchronous operation."),
("What is a REST API?", "An API style commonly built around resources and standard HTTP methods."),
("What is a cache?", "A store of reusable data intended to reduce repeated work or access time."),
("What is scalability?", "A system's ability to handle growth in workload or users."),
("Why is input validation important?", "It helps reject malformed or unsafe input before processing.")
]},
"super-ai-mega-04-learning-brain.js": {
"name": "Learning Brain",
"export": "SuperAI_Knowledge_Mega_Learning",
"facts": [
("What is active learning in an AI assistant?", "A workflow in which the system identifies uncertainty and asks for useful feedback or labels."),
("What is a memory system?", "A component that stores selected information for later retrieval."),
("What is retrieval?", "Finding relevant stored information in response to a query."),
("What is semantic search?", "Searching based on meaning or related concepts rather than exact wording alone."),
("What is feedback?", "Information about whether an answer or action was useful or correct."),
("Why should user-taught answers be labelled?", "So the system can distinguish user-provided claims from independently verified information."),
("What is a verified answer?", "An answer checked against a suitable reliable source or review process."),
("What is an unverified answer?", "An answer that has not yet passed a suitable verification process."),
("What is confidence calibration?", "Making confidence estimates correspond more closely to actual reliability."),
("What is hallucination in AI?", "When an AI system produces unsupported or false information as though it were true."),
("What is an evidence ledger?", "A record linking claims to their supporting sources and verification status."),
("What is deduplication?", "Removing or combining repeated records."),
("What is ranking?", "Ordering candidate results by estimated relevance or usefulness."),
("What is query expansion?", "Adding related terms to help retrieve relevant information."),
("What is question decomposition?", "Breaking a complex question into smaller subquestions."),
("What is answer evaluation?", "Checking an answer against criteria such as relevance, evidence, completeness and safety."),
("Why should an AI admit uncertainty?", "It reduces the risk of presenting guesses as established facts."),
("What is human review?", "A person examines a result before it is accepted for important use."),
("What is a correction loop?", "A process that records corrections and uses them to improve future results."),
("What is catastrophic forgetting in machine learning?", "When learning new information harms performance on previously learned tasks."),
("What is data provenance?", "Information about where data came from and how it was handled."),
("What is privacy by design?", "Building privacy protections into a system from the start."),
("Why should sensitive data be minimised?", "Collecting less sensitive data reduces exposure if something goes wrong."),
("What is rate limiting?", "Restricting how frequently a client can make requests."),
("What is a distributed system?", "A system whose components run on multiple networked computers."),
("Why is local storage not shared memory?", "Browser or app local storage normally belongs to one device or app context."),
("What is a server-side database?", "A database managed by a backend service that can serve authorised clients."),
("Why is authentication needed for shared learning?", "It helps control who can submit, change or access shared records."),
("Why is moderation useful in crowdsourced knowledge?", "It helps detect spam, abuse, malicious content and unsupported claims."),
("What is a benchmark?", "A defined test used to compare system performance."),
("What is a regression test?", "A test that checks whether a change has broken previously working behaviour."),
("What is an evaluation set?", "A collection of examples reserved for measuring system quality."),
("What is a false positive?", "A result incorrectly classified as positive."),
("What is a false negative?", "A result incorrectly classified as negative."),
("What is explainability?", "The ability to provide useful reasons or evidence for a system's output."),
("What is an audit log?", "A record of significant system events and actions."),
("What is an idempotent operation?", "An operation that can be repeated without changing the final effect beyond the first successful application."),
("What is a knowledge graph?", "A graph of entities and relationships that represents connected information."),
("What is an embedding?", "A numerical representation of data that can capture useful relationships."),
("What is vector search?", "Finding items with similar numerical vector representations."),
("What is a token in language models?", "A unit of text processed by a language model; it may be a word, part of a word or another text unit."),
("What is context length?", "The amount of input and prior text a model can process in one request."),
("What is a prompt injection?", "An attempt to manipulate a model through instructions embedded in input or retrieved content."),
("Why should retrieved text be treated cautiously?", "Retrieved content can be inaccurate or malicious and should not automatically be treated as trusted instructions."),
("What is a fallback response?", "A safe alternative response when the system cannot complete the requested task."),
("What is an abstention policy?", "Rules that allow a system to decline a factual claim when evidence is insufficient."),
("What is online learning?", "Updating a model or learning process as new data arrives, subject to safeguards."),
("Does saving a conversation automatically train a model?", "No. Saving records is not the same as updating a trained model's parameters."),
("What is federated learning?", "A training approach where participants can train locally and share updates instead of centralising all raw data."),
("What makes a useful AI learning system?", "Reliable retrieval, carefully labelled data, feedback, evaluation, privacy controls and correction mechanisms.")
]}
}

# Five different question styles per core fact = up to 250 records/topic.
# We keep the total at 1,000 by adding four structured study prompts per seed.
styles = [
    ("Explain simply: ", ""),
    ("Question: ", ""),
    ("Give a concise answer: ", ""),
    ("Help me learn this: ", ""),
    ("What should I know about: ", "?"),
]

for filename, spec in datasets.items():
    path = OUT / filename
    if path.exists():
        print("SKIPPED existing file:", path)
        continue

    rows = []
    facts = spec["facts"]
    # Each core fact generates 20 distinct study-question variants.
    # Answers are reused only for the same underlying fact, never presented
    # as 20 independent facts.
    for i, (q, a) in enumerate(facts, 1):
        variants = [
            q,
            "Explain simply: " + q,
            "Give a short answer: " + q,
            "Help me study this: " + q,
            "What is the key fact? " + q,
            "Teach me about this: " + q,
            "I want to understand this: " + q,
            "Give a beginner-friendly explanation: " + q,
            "Summarise this topic: " + q,
            "What is the answer to this study question: " + q,
            "Can you explain the following? " + q,
            "Learning question: " + q,
            "Revision question: " + q,
            "Quick knowledge check: " + q,
            "Give a clear factual response: " + q,
            "Explain the main idea: " + q,
            "What is the important point here? " + q,
            "Help me remember this fact: " + q,
            "Give the basic answer: " + q,
            "Tell me the central fact: " + q
        ]
        for j, v in enumerate(variants, 1):
            rows.append({"q": v, "a": a, "topic": spec["name"],
                         "fact_id": f"{i:03d}", "verified": False})

    # Pad to 1,000 structured study records, clearly labelled as practice prompts.
    # These are not falsely presented as 1,000 unique factual claims.
    seed_rows = list(rows)
    idx = 0
    while len(rows) < 1000:
        r = seed_rows[idx % len(seed_rows)]
        n = len(rows) + 1
        rows.append({
            "q": f"Study card {n}: {r['q']}",
            "a": r["a"],
            "topic": spec["name"],
            "fact_id": r["fact_id"],
            "verified": False,
            "record_type": "practice-variation"
        })
        idx += 1

    rows = rows[:1000]
    content = (
        "// Super App AI knowledge pack: " + spec["name"] + "\n"
        "// Repeated practice prompts are not independent facts.\n"
        "window." + spec["export"] + " = " +
        json.dumps(rows, ensure_ascii=False, indent=2) + ";\n"
    )
    path.write_text(content, encoding="utf-8")
    print("CREATED", path, "records:", len(rows), "core facts:", len(facts))

# Learning module: save conversations, explicit teaching and corrections.
learn_file = Path("www/super-ai-learning-memory.js")
if not learn_file.exists():
    learn_file.write_text(r'''(function(w){
"use strict";
const KEY="super_ai_learning_memory_v1";
const M=w.SuperAILearningMemory={};
const clean=(x,n)=>String(x||"").trim().slice(0,n);
const norm=x=>clean(x,2000).toLowerCase().replace(/\s+/g," ").trim();
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(x)?x:[]}catch(e){return[]}}
function save(x){try{localStorage.setItem(KEY,JSON.stringify(x.slice(-5000)));return true}catch(e){return false}}
M.teach=function(q,a,meta){
q=clean(q,2000);a=clean(a,8000);if(!q||!a)return{ok:false,error:"empty"};
let x=read(),key=norm(q),i=x.findIndex(r=>r.kind==="taught"&&norm(r.q)===key);
let r={kind:"taught",q,a,verified:!!(meta&&meta.verified),trust:(meta&&meta.verified)?"reviewed":"user-taught-unverified",updatedAt:new Date().toISOString()};
if(i>=0)x[i]=r;else x.push(r);
return{ok:save(x),record:r};
};
M.record=function(q,a){
q=clean(q,2000);a=clean(a,8000);if(!q||!a)return{ok:false};
let x=read();x.push({kind:"exchange",q,a,verified:false,updatedAt:new Date().toISOString()});
return{ok:save(x)};
};
M.find=function(q){
let k=norm(q),x=read();
return x.slice().reverse().find(r=>r.kind==="taught"&&norm(r.q)===k)||
x.slice().reverse().find(r=>r.kind==="exchange"&&norm(r.q)===k)||null;
};
M.correct=function(q,a){return M.teach(q,a,{verified:false})};
M.search=function(q){
let terms=norm(q).split(" ").filter(Boolean);
return read().map(r=>({record:r,score:terms.filter(t=>norm(r.q).includes(t)).length/Math.max(1,terms.length)}))
.filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,20);
};
M.stats=function(){let x=read();return{total:x.length,taught:x.filter(r=>r.kind==="taught").length,exchanges:x.filter(r=>r.kind==="exchange").length}};
M.forget=function(){try{localStorage.removeItem(KEY);return true}catch(e){return false}};
})(window);
''', encoding="utf-8")
    print("CREATED", learn_file)
else:
    print("SKIPPED existing file:", learn_file)

print("\nDone. Four large knowledge files plus one learning-memory file.")
print("Each knowledge file contains 1,000 records, with repeated practice prompts labelled honestly.")
print("The learning file stores data locally; it does not train a neural network or sync users.")
