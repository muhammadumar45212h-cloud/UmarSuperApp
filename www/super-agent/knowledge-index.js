(function (root) {
  "use strict";

  const topics = [
    {name:"programming", words:["code","javascript","python","html","css","bug","debug","programming","termux","api"]},
    {name:"science", words:["science","physics","chemistry","experiment","atom","energy","research"]},
    {name:"mathematics", words:["math","calculate","equation","algebra","geometry","percentage","hisab","formula"]},
    {name:"space", words:["space","planet","earth","mars","moon","rocket","gravity","universe","orbit","galaxy"]},
    {name:"business", words:["business","startup","customer","marketing","sales","shop","product","revenue","profit"]},
    {name:"finance", words:["finance","budget","payment","wallet","trading","risk","price","investment"]},
    {name:"education", words:["learn","study","lesson","explain","teach","course","school","education"]},
    {name:"security", words:["security","privacy","password","permission","encryption","attack","secure"]},
    {name:"writing", words:["write","story","poem","caption","post","article","email","translate"]},
    {name:"planning", words:["plan","steps","roadmap","goal","strategy","schedule","organize"]}
  ];

  function tokenize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFKC")
      .match(/[\p{L}\p{N}]+/gu) || [];
  }

  function search(query) {
    const words = new Set(tokenize(query));
    return topics.map(topic => {
      const matches = topic.words.filter(word => words.has(word));
      return {
        topic: topic.name,
        score: matches.length,
        matchedTerms: matches
      };
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  root.SuperAIKnowledgeIndex = {
    version: "1.0.0",
    search,
    topics: topics.map(x => x.name)
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.SuperAIKnowledgeIndex;
  }
})(typeof window !== "undefined" ? window : globalThis);
