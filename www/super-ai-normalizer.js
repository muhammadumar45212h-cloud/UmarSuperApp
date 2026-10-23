
window.SAINormalizer={
 normalize(s){return String(s||"").toLowerCase().normalize("NFKC")
 .replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}\s.+*/%()-]/gu," ")
 .replace(/\s+/g," ").trim();},
 tokens(s){return this.normalize(s).split(/\s+/).filter(Boolean);}
};
