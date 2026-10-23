from pathlib import Path
import shutil, datetime, json

W = Path("www")
if not W.is_dir():
    raise SystemExit("ERROR: www folder nahi mila; project path check karo.")

backup = Path("backup-super-ai-" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S"))
backup.mkdir()
for name in ["ai-chatbot.js", "super-ai-engine.js", "super-ai-memory.js"]:
    p = W / name
    if p.exists():
        shutil.copy2(p, backup / name)

# Har module apne aap ko shared registry mein register karta hai.
core = r"""
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
"""

modules = {
"01-text-normalizer": r"""
return {run(q){return String(q||"").normalize("NFKC").replace(/\s+/g," ").trim();}};
""",
"02-language-detector": r"""
return {run(q){q=String(q||"");return {urdu:/[\u0600-\u06FF]/.test(q),romanUrdu:/\b(kya|hai|hain|kaise|kyun|mujhe|tum|apko|bhego|samjhe)\b/i.test(q),english:/[a-z]/i.test(q)};}};
""",
"03-intent-router": r"""
const rules=[["greeting",/\b(hello|salam|assalam|hi|hey)\b/i],["math",/[0-9]+\s*[+\-*\/%]\s*[0-9]+/],["coding",/\b(code|javascript|python|bug|error|function|program)\b/i],["learning",/\b(learn|sikhao|samjhao|explain|seekhna)\b/i],["planning",/\b(plan|roadmap|steps|schedule|mansuba)\b/i]];
return {run(q){let s=String(q||"");return (rules.find(x=>x[1].test(s))||["general"])[0];}};
""",
"04-keyword-extractor": r"""
return {run(q){const stop=new Set(["the","and","hai","hain","ka","ki","ke","ko","me","mein","is","a","an","to","of","what","kya"]);return [...new Set(String(q||"").toLowerCase().match(/[\p{L}\p{N}]+/gu)||[])].filter(x=>x.length>2&&!stop.has(x)).slice(0,30);}};
""",
"05-context-window": r"""
return {run(q,c){const h=Array.isArray(c.history)?c.history:[];return {question:String(q||""),recent:h.slice(-12),count:h.length};}};
""",
"06-memory-bridge": r"""
return {run(q){const m=window.SuperAIMemory;if(!m)return {available:false};try{return {available:true,history:m.history(),learned:m.learned()};}catch(e){return {available:true,error:String(e)};}}};
""",
"07-learning-parser": r"""
return {run(q){const s=String(q||"");const m=s.match(/^\s*(?:SIKHAO|TEACH)\s*:\s*([^|]+)\|\s*(.+)$/i);return m?{valid:true,question:m[1].trim(),answer:m[2].trim()}:{valid:false};}};
""",
"08-answer-ranker": r"""
return {run(candidates){return (Array.isArray(candidates)?candidates:[]).map((x,i)=>({value:x,score:Math.max(0,1-i*0.08)})).sort((a,b)=>b.score-a.score);}};
""",
"09-clarification": r"""
return {run(q){const s=String(q||"").trim();if(s.length<3)return {needsClarification:true,reason:"question_too_short"};if(/^(it|this|that|ye|woh|usko|isko)$/i.test(s))return {needsClarification:true,reason:"missing_context"};return {needsClarification:false};}};
""",
"10-step-planner": r"""
return {run(goal){const g=String(goal||"").trim();if(!g)return [];return [{step:1,task:"Goal ko saaf taur par define karo",goal:g},{step:2,task:"Zaroori maloomat aur resources check karo"},{step:3,task:"Chhota safe prototype banao"},{step:4,task:"Tests chalao aur errors theek karo"},{step:5,task:"Result verify karke agla qadam lo"}];}};
""",
"11-math-parser": r"""
return {run(q){const s=String(q||"").trim();if(!/^[\d\s()+\-*/%.]+$/.test(s)||!/[+\-*/%]/.test(s))return null;try{const tokens=s.match(/\d+(?:\.\d+)?|[()+\-*/%]/g)||[];if(tokens.join("")!==s.replace(/\s/g,""))return null;return {expression:s,note:"Expression identified; use a dedicated safe parser for evaluation."};}catch(e){return null;}}};
""",
"12-code-inspector": r"""
return {run(code){const s=String(code||"");return {characters:s.length,lines:s.split(/\r?\n/).length,hasEval:/\beval\s*\(/.test(s),hasDynamicFunction:/new\s+Function\s*\(/.test(s),hasTODO:/TODO|FIXME/.test(s),warnings:[/\beval\s*\(/.test(s)?"eval() review required":null, /innerHTML\s*=/.test(s)?"innerHTML may need sanitization":null].filter(Boolean)};}};
""",
"13-security-check": r"""
return {run(q){const s=String(q||"");const flags=[];if(/password|api.?key|secret|token/i.test(s))flags.push("possible_secret");if(/eval\s*\(|innerHTML/i.test(s))flags.push("unsafe_code_pattern");return {flags,reviewRecommended:flags.length>0};}};
""",
"14-health-caution": r"""
return {run(q){const s=String(q||"");const sensitive=/chest pain|can't breathe|cannot breathe|suicide|overdose|severe bleeding|seene mein dard|saans nahi/i.test(s);return {urgent:sensitive,notice:sensitive?"Possible emergency: seek local emergency medical help now. This module is not a diagnosis.":""};}};
""",
"15-fact-confidence": r"""
return {run(answer, evidence){const hasEvidence=Array.isArray(evidence)&&evidence.length>0;const a=String(answer||"").trim();return {hasAnswer:!!a,hasEvidence,confidenceLabel:hasEvidence?"evidence_available":"unverified",reminder:hasEvidence?"Evidence ko answer ke saath verify karo.":"Bina evidence ke is jawab ko confirmed fact na samjho."};}};
""",
"16-summary-helper": r"""
return {run(text,max=5){const s=String(text||"");return s.split(/(?<=[.!?۔])\s+/).filter(Boolean).slice(0,Math.max(1,Math.min(10,Number(max)||5)));}};
""",
"17-translation-hints": r"""
return {run(q){const s=String(q||"");return {containsArabicScript:/[\u0600-\u06FF]/.test(s),romanUrdu:/\b(hai|hain|kya|kaise|mujhe|samjhao)\b/i.test(s),hint:"Language detect karna translation nahi hai; translation ke liye verified dictionary ya translation engine chahiye."};}};
""",
"18-conversation-state": r"""
return {run(q,c){const h=Array.isArray(c.history)?c.history:[];return {turnCount:h.length+1,hasPreviousTurn:h.length>0,lastRole:h.length?h[h.length-1].role:null,questionLength:String(q||"").length};}};
""",
"19-quality-audit": r"""
return {run(answer){const s=String(answer||"");const issues=[];if(!s.trim())issues.push("empty_answer");if(s.length<20)issues.push("very_short_answer");if(/guaranteed|100% certain|kabhi fail nahi/i.test(s))issues.push("overconfidence_language");return {passed:issues.length===0,issues};}};
"""
}

# Core + 19 feature files = exactly 20 new files.
created = []
p = W / "super-ai-advanced-00-core.js"
p.write_text(core, encoding="utf-8")
created.append(p.name)

for name, body in modules.items():
    filename = "super-ai-advanced-" + name + ".js"
    source = """(function(){
  const A = window.SuperAIAdvanced;
  if (!A) { console.warn("Load super-ai-advanced-00-core.js first"); return; }
  A.register(%s, (function(){
    %s
  })());
})();
""" % (json.dumps(name), body.strip())
    (W / filename).write_text(source, encoding="utf-8")
    created.append(filename)

print("Created:", len(created), "new files")
for f in created:
    print(" -", f)
print("Backup folder:", backup)
print("NOTE: Files are created but not yet connected to the chatbot or built.")
