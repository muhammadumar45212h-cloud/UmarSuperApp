
(function(){
  const root = window.SuperAIAdvanced = window.SuperAIAdvanced || {};
  root.modules = root.modules || {};
  root.register = function(name, api) {
    if (name && api && typeof api === "object") root.modules[name] = api;
  };
  root.list = function() { return Object.keys(root.modules); };
  root.run = function(name, input, context) {
    const m = root.modules[name];
    if (!m || typeof m.run !== "function") return null;
    try { return m.run(input, context || {}); }
    catch(e) { console.warn("[SuperAI module]", name, e); return null; }
  };
  root.normalize = function(s) {
    return String(s == null ? "" : s).normalize("NFKC")
      .toLowerCase().replace(/[أإآ]/g,"ا").replace(/ى/g,"ي")
      .replace(/[^\p{L}\p{N}\s.+*/%=-]/gu," ")
      .replace(/\s+/g," ").trim();
  };
})();
