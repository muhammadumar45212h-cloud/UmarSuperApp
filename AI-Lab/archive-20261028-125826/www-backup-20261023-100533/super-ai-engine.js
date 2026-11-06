(function () {
  "use strict";

  const facts = [
    {
      keys: ["tum kya ho", "aap kya ho", "who are you", "tum kon ho", "ap kon ho"],
      answer: "Main Super AI hoon, Super App ka apna chatbot engine. Main basic guftagu, sawal-jawab aur apni knowledge mein maujood maloomat se madad karta hoon."
    },
    {
      keys: ["kis ne banaya", "tumhe kisne banaya", "who made you"],
      answer: "Mujhe Super App ke liye banaya gaya hai. Mera current version rules, local knowledge aur user ke sikhaye hue jawab use karta hai."
    },
    {
      keys: ["api key", "api key chahiye"],
      answer: "Mere current local engine ko API key ki zaroorat nahi. Lekin main abhi full generative AI model nahi hoon."
    },
    {
      keys: ["internet ke baghair", "offline chalte ho", "offline kaam"],
      answer: "Mere local rules aur saved answers offline chal sakte hain. Naye facts, online search aur current information ke liye internet ya updated knowledge chahiye."
    },
    {
      keys: ["super app kya hai", "superapp kya hai"],
      answer: "Super App aapka app project hai. Main iske andar users ke sawalon ka jawab dene ke liye chatbot assistant hoon."
    },
    {
      keys: ["pakistan ka darul hukumat", "capital of pakistan", "pakistan ki capital"],
      answer: "Pakistan ka dar-ul-hukumat Islamabad hai."
    },
    {
      keys: ["pakistan ki currency", "currency of pakistan"],
      answer: "Pakistan ki currency Pakistani Rupee hai, jiska code PKR hai."
    },
    {
      keys: ["pani ka formula", "water formula"],
      answer: "Pani ka chemical formula H₂O hai: har molecule mein do hydrogen atoms aur ek oxygen atom hota hai."
    },
    {
      keys: ["suraj kya hai", "what is the sun"],
      answer: "Suraj ek sitara hai. Ye roshni aur garmi deta hai aur hamara Solar System iski gravity se bandha hua hai."
    },
    {
      keys: ["zameen kya hai", "what is earth"],
      answer: "Zameen ek planet hai jo Suraj ke gird chakkar lagata hai. Is par liquid water aur zindagi ke liye munasib halaat maujood hain."
    },
    {
      keys: ["ai kya hai", "what is ai", "artificial intelligence kya hai"],
      answer: "AI yani Artificial Intelligence computer systems ko aise kaam karne deta hai jin mein aam tor par insani zehni salahiyat chahiye hoti hai, jaise language samajhna, patterns pehchanna aur planning."
    },
    {
      keys: ["machine learning kya hai"],
      answer: "Machine learning AI ka ek hissa hai. Is mein system data se patterns seekhta hai, bajaye iske ke har rule manually likha jaye."
    },
    {
      keys: ["internet kya hai"],
      answer: "Internet duniya bhar ke computers aur networks ko jorne wala network hai. Websites, messages aur online services iske zariye chalti hain."
    },
    {
      keys: ["mobile slow hai", "phone slow hai"],
      answer: "Phone restart karein, storage khaali rakhein, ghair-zaroori apps band karein aur sirf trusted apps install karein. Zaroori files delete karne se pehle backup bana lein."
    },
    {
      keys: ["password safe kaise", "account secure kaise", "account safety"],
      answer: "Har account ka alag strong password rakhein, two-factor authentication on karein, aur apna password ya verification code kisi ko na dein."
    },
    {
      keys: ["good morning", "subah bakhair"],
      answer: "Subah bakhair! Umeed hai aapka din achha guzre. Aaj main kis tarah madad karoon?"
    },
    {
      keys: ["good night", "shab bakhair"],
      answer: "Shab bakhair! Khayal rakhein. Jab chahein dobara baat kar sakte hain."
    },
    {
      keys: ["shukriya", "thank you", "thanks"],
      answer: "Khushi hui ke main madad kar saka! 😊"
    }
  ];

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[’‘]/g, "'")
      .replace(/[^\p{L}\p{N}\s.+*/%()-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function words(text) {
    return normalize(text).split(/\s+/).filter(Boolean);
  }

  function similarity(a, b) {
    const A = new Set(words(a));
    const B = new Set(words(b));
    if (!A.size || !B.size) return 0;

    let common = 0;
    for (const w of A) if (B.has(w)) common++;
    return (2 * common) / (A.size + B.size);
  }

  function calculate(text) {
    const s = String(text).trim().replace(/,/g, "");
    if (s.length > 80 || !/^[\d\s.+*/%()\-]+$/.test(s)) return null;
    if (!/\d/.test(s) || !/[+*/%\-]/.test(s)) return null;

    const tokens = s.match(/\d+(?:\.\d+)?|[()+*/%\-]/g);
    if (!tokens || tokens.join("") !== s.replace(/\s/g, "")) return null;

    let i = 0;
    function factor() {
      if (tokens[i] === "+") { i++; return factor(); }
      if (tokens[i] === "-") { i++; return -factor(); }
      if (tokens[i] === "(") {
        i++;
        const n = expression();
        if (tokens[i++] !== ")") throw Error("bracket");
        return n;
      }
      const t = tokens[i++];
      if (!t || !/^\d/.test(t)) throw Error("number");
      return Number(t);
    }
    function term() {
      let n = factor();
      while (["*", "/", "%"].includes(tokens[i])) {
        const op = tokens[i++];
        const r = factor();
        if ((op === "/" || op === "%") && r === 0) throw Error("zero");
        n = op === "*" ? n * r : op === "/" ? n / r : n % r;
      }
      return n;
    }
    function expression() {
      let n = term();
      while (tokens[i] === "+" || tokens[i] === "-") {
        const op = tokens[i++];
        const r = term();
        n = op === "+" ? n + r : n - r;
      }
      return n;
    }

    try {
      const result = expression();
      return i === tokens.length && Number.isFinite(result)
        ? "Jawab: " + result
        : null;
    } catch (_) {
      return null;
    }
  }

  function reply(question) {
    const q = normalize(question);
    if (!q) return "Apna sawal likhein.";

    const memory = window.SuperAIMemory;

    if (memory) {
      const learned = memory.learned();
      if (learned[q] && learned[q].answer) {
        return learned[q].answer + "\n\n(Ye jawab aapki local learning memory se hai.)";
      }
    }

    const calc = calculate(q);
    if (calc) return calc;

    if (/^(hi|hello|hey|salam|assalam|aoa|assalamu alaikum)\b/.test(q)) {
      return "Assalam-o-alaikum! 😊 Aap kaise hain? Kya poochna chahte hain?";
    }

    if (/\b(time|kitne baje|waqt kya)\b/.test(q)) {
      return "Phone ka local waqt: " + new Date().toLocaleString();
    }

    if (/\b(date|aaj ki tareekh|today's date)\b/.test(q)) {
      return "Aaj ki tareekh: " + new Date().toLocaleDateString();
    }

    if (/\b(mera naam|my name is)\b/.test(q)) {
      const match = q.match(/(?:mera naam|my name is)\s+(.+)/);
      if (match && match[1] && memory) {
        memory.learn("mera naam kya hai", "Aapne bataya tha ke aapka naam " + match[1] + " hai.");
        return "Theek hai. Maine aapka bataya hua naam is device ki local learning memory mein save kar diya.";
      }
    }

    let best = null;
    let bestScore = 0;

    for (const item of facts) {
      for (const key of item.keys) {
        const score = similarity(q, key);
        if (q.includes(key) || key.includes(q)) {
          const exactScore = Math.max(score, q === key ? 1 : 0.86);
          if (exactScore > bestScore) {
            bestScore = exactScore;
            best = item;
          }
        } else if (score > bestScore) {
          bestScore = score;
          best = item;
        }
      }
    }

    if (best && bestScore >= 0.52) return best.answer;

    if (/^(sikho|seekho|learn|yaad rakho|remember)\s*:/i.test(question)) {
      return "Naya jawab sikhane ke liye likhein:\n" +
        "SIKHAO: sawal | jawab\n\nMisal:\n" +
        "SIKHAO: tumhara naam kya hai | Mera naam Super AI hai";
    }

    return "Main aapka sawal samajhne ki koshish kar raha hoon, lekin meri local knowledge mein iska pakka jawab nahi mila.\n\n" +
      "Aap sawal ko doosre alfaaz mein pooch sakte hain, ya mujhe jawab sikha sakte hain:\n" +
      "SIKHAO: sawal | sahi jawab\n\n" +
      "Yaad rahe: main abhi rules aur local knowledge wala chatbot hoon, full generative AI model nahi.";
  }

  window.SuperAIEngine = { reply, normalize, factsCount: facts.length };
})();
