(() => {
  "use strict";
  if (window.__superAIChatV2) return;
  window.__superAIChatV2 = true;

  const STYLE = `
  #super-ai-button {
    position:fixed;right:18px;bottom:100px;z-index:2147483000;
    width:62px;height:62px;border:2px solid #ffffff80;border-radius:22px;
    background:linear-gradient(135deg,#7c3aed,#2563eb,#06b6d4);
    color:white;font-size:29px;box-shadow:0 8px 30px #4338ca66;
    cursor:pointer;transition:transform .2s
  }
  #super-ai-button:active{transform:scale(.94)}
  #super-ai-window {
    position:fixed;z-index:2147483001;right:10px;bottom:95px;
    width:min(410px,calc(100vw - 20px));
    height:min(690px,78dvh);min-height:360px;
    display:none;flex-direction:column;overflow:hidden;
    border:1px solid #8b8bff45;border-radius:24px;
    background:#0c1020;color:#f8fafc;
    box-shadow:0 20px 70px #0009;font-family:Inter,system-ui,Arial,sans-serif
  }
  #super-ai-window *{box-sizing:border-box}
  #super-ai-head{
    display:flex;align-items:center;gap:11px;padding:15px;
    background:linear-gradient(125deg,#4c1d95,#1d4ed8,#0e7490);
    border-bottom:1px solid #ffffff20
  }
  #super-ai-avatar{
    width:43px;height:43px;flex-shrink:0;border-radius:15px;
    display:grid;place-items:center;font-size:23px;
    background:#ffffff20;border:1px solid #ffffff50
  }
  #super-ai-title{font-size:16px;font-weight:800;letter-spacing:.2px}
  #super-ai-status{font-size:11px;color:#dbeafe;margin-top:4px}
  #super-ai-close{
    margin-left:auto;width:35px;height:35px;border:0;border-radius:12px;
    background:#ffffff18;color:white;font-size:24px;cursor:pointer
  }
  #super-ai-messages{
    flex:1;overflow-y:auto;padding:14px;
    background:radial-gradient(ellipse at top,#1e1b4b70,transparent 55%),#0c1020;
    scroll-behavior:smooth
  }
  .super-ai-row{display:flex;gap:8px;margin:12px 0;align-items:flex-end}
  .super-ai-row.user{justify-content:flex-end}
  .super-ai-mini{
    flex-shrink:0;width:27px;height:27px;border-radius:10px;
    display:grid;place-items:center;background:#312e81;font-size:13px
  }
  .super-ai-msg{
    max-width:84%;padding:11px 13px;border-radius:17px;
    white-space:pre-wrap;overflow-wrap:anywhere;
    line-height:1.55;font-size:13px
  }
  .super-ai-bot{
    color:#e5e7eb;background:#171d32;border:1px solid #ffffff12;
    border-bottom-left-radius:5px
  }
  .super-ai-user{
    color:white;background:linear-gradient(135deg,#6d28d9,#2563eb);
    border-bottom-right-radius:5px
  }
  #super-ai-welcome{padding:5px 0 12px}
  #super-ai-welcome h3{font-size:20px;margin:3px 0 7px}
  #super-ai-welcome p{font-size:12px;color:#a5b4fc;line-height:1.6;margin:0 0 13px}
  #super-ai-suggestions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .super-ai-suggest{
    min-height:48px;text-align:left;padding:9px;
    border:1px solid #6366f155;border-radius:13px;
    background:#171d32;color:#dbeafe;font-size:11px;cursor:pointer
  }
  .super-ai-suggest:active{background:#312e81}
  #super-ai-footer{background:#101629;border-top:1px solid #ffffff15}
  #super-ai-tools{
    display:flex;align-items:center;gap:8px;padding:8px 12px;
    color:#94a3b8;font-size:10px
  }
  #super-ai-clear{
    border:1px solid #ffffff18;background:#1e293b;color:#cbd5e1;
    padding:6px 9px;border-radius:9px;font-size:10px;cursor:pointer
  }
  #super-ai-form{display:flex;gap:8px;padding:8px 11px 12px}
  #super-ai-input{
    flex:1;min-width:0;min-height:43px;max-height:100px;
    border:1px solid #475569;border-radius:15px;padding:12px;
    outline:none;background:#171d32;color:white;font-size:13px
  }
  #super-ai-input:focus{border-color:#818cf8}
  #super-ai-input::placeholder{color:#94a3b8}
  #super-ai-send{
    width:45px;min-width:45px;border:0;border-radius:15px;
    background:linear-gradient(135deg,#7c3aed,#2563eb);
    color:white;font-size:21px;cursor:pointer
  }
  #super-ai-send:disabled{opacity:.45}
  #super-ai-note{padding:0 13px 9px;color:#64748b;font-size:9px;text-align:center}
  .super-ai-dots{display:inline-flex;gap:4px;padding:4px}
  .super-ai-dots i{width:5px;height:5px;border-radius:50%;background:#a5b4fc;animation:superAiPulse .9s infinite alternate}
  .super-ai-dots i:nth-child(2){animation-delay:.2s}
  .super-ai-dots i:nth-child(3){animation-delay:.4s}
  @keyframes superAiPulse{to{opacity:.25;transform:translateY(-3px)}}
  @media(max-width:420px){
    #super-ai-window{right:6px;bottom:82px;width:calc(100vw - 12px);height:76dvh}
  }
  `;
  const style = document.createElement("style");
  style.textContent = STYLE;
  document.head.appendChild(style);

  const STORAGE = "SUPER_AI_CHAT_HISTORY_V2";
  let history = [];
  let busy = false;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || "[]");
    if (Array.isArray(saved)) history = saved.slice(-60);
  } catch (_) {}

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(history.slice(-60)));
    } catch (_) {}
  }

  function addMessage(text, role, persist = true) {
    const row = document.createElement("div");
    row.className = "super-ai-row " + (role === "user" ? "user" : "bot");

    if (role !== "user") {
      const mini = document.createElement("div");
      mini.className = "super-ai-mini";
      mini.textContent = "✦";
      row.appendChild(mini);
    }

    const bubble = document.createElement("div");
    bubble.className = "super-ai-msg " +
      (role === "user" ? "super-ai-user" : "super-ai-bot");
    bubble.textContent = String(text);
    row.appendChild(bubble);
    document.querySelector("#super-ai-messages").appendChild(row);
    scrollBottom();

    if (persist) {
      history.push({ role, text: String(text).slice(0, 6000) });
      history = history.slice(-60);
      saveHistory();
    }
    return bubble;
  }

  function scrollBottom() {
    const list = document.querySelector("#super-ai-messages");
    if (list) list.scrollTop = list.scrollHeight;
  }

  function identityAnswer(q) {
    const s = q.toLowerCase().replace(/[?!.,،؟]/g, " ").trim();

    if (/(who (made|created|built|developed) you|who is your (creator|developer)|tumhe kis(ne)? banaya|kisne banaya|tumhara creator|aapko kisne banaya|banane wala kaun)/i.test(s)) {
      return "Mujhe Muhammad Umar ne banaya hai. Main Super AI hoon.";
    }

    if (/(father|walid|abba|baap).*(name|naam)|((name|naam).*(father|walid|abba|baap))/i.test(s)) {
      return "Mere creator Muhammad Umar ke walid ka naam Ghulam Hussain hai.";
    }

    if (/(where are you from|which country|kahan se ho|kahan ke ho|kis mulk|kis desh|tumhara shehar|aap kahan se)/i.test(s)) {
      return "Mere creator Muhammad Umar Thull, Sindh, Pakistan se hain.";
    }

    if (/(your name|tumhara naam|aapka naam|who are you|tum kaun ho|ap kaun ho)/i.test(s)) {
      return "Main Super AI hoon, Muhammad Umar ke Super App ke liye banaya gaya AI assistant.";
    }

    return null;
  }

  function localLearning(q) {
    const m = q.match(/^sikhao\s*:\s*(.+?)\s*\|\s*(.+)$/i);
    if (!m) return null;
    try {
      if (window.SuperAIMemory && typeof window.SuperAIMemory.learn === "function") {
        window.SuperAIMemory.learn(m[1], m[2]);
      }
    } catch (_) {}
    return "Shukriya! Aapki di hui maloomat is device par save karne ki koshish ki gayi hai. Is se underlying AI model automatically train nahi hota.";
  }

  async function askBackend(q) {
    const identity = identityAnswer(q);
    if (identity) return identity;

    const learned = localLearning(q);
    if (learned) return learned;

    const apiHistory = history
      .filter(m => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text
      }));

    let result;

    if (window.SAOrchestrator &&
        typeof window.SAOrchestrator.ask === "function") {
      result = await window.SAOrchestrator.ask(q, { history: apiHistory });
      if (!result || !result.ok) {
        throw new Error(result && (result.message || result.error) ||
          "Super AI backend se jawab nahi mila.");
      }
      result = result.answer;
    } else {
      const response = await fetch("/api/super-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history: apiHistory })
      });
      result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || ("Backend HTTP " + response.status));
      }
    }

    const answer = typeof result === "string"
      ? result
      : result && (result.answer || result.reply || result.response);

    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("AI backend ne khaali jawab diya.");
    }
    return answer.trim();
  }

  function renderHistory() {
    const list = document.querySelector("#super-ai-messages");
    list.replaceChildren();

    if (!history.length) {
      const welcome = document.createElement("div");
      welcome.id = "super-ai-welcome";
      welcome.innerHTML =
        "<h3>Assalam-o-alaikum! ✨</h3>" +
        "<p>Main Super AI hoon. Sawal poochhein, ideas discuss karein, " +
        "coding ya general knowledge mein madad lein.</p>" +
        '<div id="super-ai-suggestions">' +
        '<button class="super-ai-suggest">🌍 Science aur universe samjhao</button>' +
        '<button class="super-ai-suggest">💻 Coding mein madad karo</button>' +
        '<button class="super-ai-suggest">🧠 AI kaise kaam karta hai?</button>' +
        '<button class="super-ai-suggest">✍️ Mere liye ek plan banao</button>' +
        "</div>";
      list.appendChild(welcome);

      welcome.querySelectorAll("button").forEach((b, i) => {
        const prompts = [
          "Universe aur planets ko Roman Urdu mein samjhao.",
          "Meri coding problem solve karne mein madad karo.",
          "Artificial intelligence kaise kaam karti hai?",
          "Mujhe ek practical step-by-step plan banao."
        ];
        b.addEventListener("click", () => sendQuestion(prompts[i]));
      });
      return;
    }

    history.slice(-60).forEach(m => {
      const row = document.createElement("div");
      row.className = "super-ai-row " + (m.role === "user" ? "user" : "bot");
      if (m.role !== "user") {
        const mini = document.createElement("div");
        mini.className = "super-ai-mini";
        mini.textContent = "✦";
        row.appendChild(mini);
      }
      const bubble = document.createElement("div");
      bubble.className = "super-ai-msg " +
        (m.role === "user" ? "super-ai-user" : "super-ai-bot");
      bubble.textContent = m.text;
      row.appendChild(bubble);
      list.appendChild(row);
    });
    scrollBottom();
  }

  function buildUI() {
    if (document.querySelector("#super-ai-window")) return;

    const button = document.createElement("button");
    button.id = "super-ai-button";
    button.textContent = "✦";
    button.title = "Super AI kholo";
    button.setAttribute("aria-label", "Super AI chat kholo");

    const panel = document.createElement("section");
    panel.id = "super-ai-window";
    panel.innerHTML = `
      <div id="super-ai-head">
        <div id="super-ai-avatar">✦</div>
        <div>
          <div id="super-ai-title">Super AI</div>
          <div id="super-ai-status">AI assistant · Roman Urdu supported</div>
        </div>
        <button id="super-ai-close" aria-label="Close">×</button>
      </div>
      <div id="super-ai-messages" aria-live="polite"></div>
      <div id="super-ai-footer">
        <div id="super-ai-tools">
          <button id="super-ai-clear">Chat saaf karein</button>
          <span>Conversation is device par save hoti hai</span>
        </div>
        <form id="super-ai-form">
          <input id="super-ai-input" maxlength="2000"
            placeholder="Super AI se kuch poochhein..." autocomplete="off" required>
          <button id="super-ai-send" aria-label="Send">➤</button>
        </form>
        <div id="super-ai-note">AI ke jawab ghalat bhi ho sakte hain — zaroori maloomat verify karein.</div>
      </div>`;

    document.body.append(button, panel);
    renderHistory();

    button.addEventListener("click", () => {
      panel.style.display = "flex";
      button.style.display = "none";
      document.querySelector("#super-ai-input").focus();
    });

    panel.querySelector("#super-ai-close").addEventListener("click", () => {
      panel.style.display = "none";
      button.style.display = "block";
    });

    panel.querySelector("#super-ai-clear").addEventListener("click", () => {
      if (!confirm("Kya aap Super AI ki saved chat history clear karna chahte hain?")) return;
      history = [];
      saveHistory();
      renderHistory();
    });

    panel.querySelector("#super-ai-form").addEventListener("submit", e => {
      e.preventDefault();
      const input = panel.querySelector("#super-ai-input");
      sendQuestion(input.value);
    });
  }

  async function sendQuestion(question) {
    if (busy) return;
    const input = document.querySelector("#super-ai-input");
    const send = document.querySelector("#super-ai-send");
    const q = String(question || (input && input.value) || "").trim();
    if (!q) return;

    busy = true;
    if (input) {
      input.value = "";
      input.disabled = true;
    }
    if (send) send.disabled = true;

    const welcome = document.querySelector("#super-ai-welcome");
    if (welcome) welcome.remove();

    addMessage(q, "user");

    const pending = addMessage("Soch raha hoon…", "bot", false);
    pending.innerHTML = '<span class="super-ai-dots"><i></i><i></i><i></i></span>';

    try {
      const answer = await askBackend(q);
      pending.textContent = answer;
      history.push({ role: "assistant", text: answer.slice(0, 6000) });
      history = history.slice(-60);
      saveHistory();
    } catch (err) {
      const message = String(err && err.message || err);
      pending.textContent = "Jawab nahi mil saka: " + message.slice(0, 220);
      console.error("Super AI backend error:", err);
    } finally {
      busy = false;
      if (input) {
        input.disabled = false;
        input.focus();
      }
      if (send) send.disabled = false;
      scrollBottom();
    }
  }

  function init() {
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", init, { once: true });
      return;
    }
    buildUI();
  }

  init();
  window.SuperAIChat = { ask: askBackend, clear: () => {
    history = [];
    saveHistory();
    renderHistory();
  }};
})();
