(() => {
  "use strict";
  if (window.__superAIChatLoaded) return;
  window.__superAIChatLoaded = true;

  const css = document.createElement("style");
  css.textContent = `
    #super-ai-button {
      position:fixed;right:14px;bottom:115px;z-index:2147483000;
      width:58px;height:58px;border:2px solid #fff;border-radius:50%;
      background:linear-gradient(145deg,#6845e8,#08a9c9);color:#fff;
      font-size:28px;box-shadow:0 4px 18px #0005;cursor:pointer
    }
    #super-ai-window {
      position:fixed;z-index:2147483001;right:10px;bottom:100px;
      width:min(360px,calc(100vw - 20px));height:min(520px,70dvh);
      display:none;flex-direction:column;background:#fff;color:#182033;
      border-radius:18px;overflow:hidden;box-shadow:0 8px 35px #0006;
      font-family:Arial,sans-serif
    }
    #super-ai-window *{box-sizing:border-box}
    #super-ai-head{padding:12px;color:#fff;background:#5142d9;
      display:flex;justify-content:space-between;align-items:center}
    #super-ai-head small{display:block;opacity:.85;margin-top:4px}
    #super-ai-close{font-size:26px;color:#fff;background:none;border:0}
    #super-ai-messages{flex:1;overflow:auto;padding:12px;background:#f3f5fb}
    .super-ai-msg{max-width:90%;width:fit-content;padding:10px 12px;
      margin:7px 0;border-radius:14px;white-space:pre-wrap;
      overflow-wrap:anywhere;line-height:1.45;font-size:14px}
    .super-ai-bot{background:#fff;border:1px solid #e1e5ef}
    .super-ai-user{margin-left:auto;background:#5142d9;color:#fff}
    #super-ai-form{display:flex;gap:7px;padding:10px;border-top:1px solid #ddd}
    #super-ai-input{flex:1;min-width:0;border:1px solid #d4d9e5;
      border-radius:22px;padding:11px;font-size:14px;background:#fff;color:#111}
    #super-ai-send{width:44px;border:0;border-radius:50%;
      background:#5142d9;color:#fff;font-size:19px}
    #super-ai-tools{display:flex;gap:8px;padding:5px 10px;
      font-size:11px;background:#fff;color:#555}
    #super-ai-tools button{border:0;background:#f0edff;color:#4332b8;
      border-radius:10px;padding:7px}
  `;
  document.head.appendChild(css);

  function start() {
    if (!window.SuperAIEngine || !window.SuperAIMemory) {
      window.__superAIChatLoaded = false;
      console.error("Super AI files missing. Check script order.");
      return;
    }

    const button = document.createElement("button");
    button.id = "super-ai-button";
    button.textContent = "✦";
    button.title = "Super AI Chat";
    button.setAttribute("aria-label", "Super AI chat kholo");

    const panel = document.createElement("section");
    panel.id = "super-ai-window";
    panel.innerHTML = `
      <div id="super-ai-head">
        <div><strong>✦ Super AI</strong>
          <small>Apna local chatbot</small></div>
        <button id="super-ai-close" aria-label="Band karein">×</button>
      </div>
      <div id="super-ai-messages" aria-live="polite"></div>
      <div id="super-ai-tools">
        <button id="super-ai-clear">Chat saaf karo</button>
        <span>Local memory is device par save hoti hai</span>
      </div>
      <form id="super-ai-form">
        <input id="super-ai-input" maxlength="1000"
          placeholder="Sawal likhein..." autocomplete="off" required>
        <button id="super-ai-send" aria-label="Send">➤</button>
      </form>
    `;
    document.body.append(button, panel);

    const list = panel.querySelector("#super-ai-messages");
    const input = panel.querySelector("#super-ai-input");
    const form = panel.querySelector("#super-ai-form");
    const send = panel.querySelector("#super-ai-send");

    function add(text, role, save = true) {
      const el = document.createElement("div");
      el.className = "super-ai-msg super-ai-" + role;
      el.textContent = text;
      list.appendChild(el);
      list.scrollTop = list.scrollHeight;
      if (save) window.SuperAIMemory.saveMessage(role, text);
      return el;
    }

    function renderHistory() {
      list.replaceChildren();
      const history = window.SuperAIMemory.history();
      if (!history.length) {
        add("Assalam-o-alaikum! Main Super AI hoon. Mujhse sawal poochhein. Agar mujhe jawab na aaye to aap mujhe sikha bhi sakte hain.", "bot");
        return;
      }
      history.slice(-40).forEach(m => {
        const el = document.createElement("div");
        el.className = "super-ai-msg super-ai-" +
          (m.role === "user" ? "user" : "bot");
        el.textContent = m.text;
        list.appendChild(el);
      });
      list.scrollTop = list.scrollHeight;
    }

    button.addEventListener("click", () => {
      panel.style.display = "flex";
      button.style.display = "none";
      if (!list.childElementCount) renderHistory();
      input.focus();
    });

    panel.querySelector("#super-ai-close").addEventListener("click", () => {
      panel.style.display = "none";
      button.style.display = "block";
    });

    panel.querySelector("#super-ai-clear").addEventListener("click", () => {
      if (!confirm("Kya aap is device ki saved chat history delete karna chahte hain?")) return;
      window.SuperAIMemory.clearHistory();
      renderHistory();
    });

    function handleLearning(q) {
      if (window.SuperAILearningBrain) {
        const result = window.SuperAILearningBrain.teachCommand(q);
        if (result) {
          return result.ok
            ? "Shukriya! Maine sawal aur jawab device par save kar liya hai."
            : result.message;
        }
      }

      const match = q.match(/^sikhao\s*:\s*(.+?)\s*\|\s*(.+)$/i);
      if (!match) return null;

      const ok = window.SuperAIMemory.learn(match[1], match[2]);
      return ok
        ? "Shukriya! Jawab local memory mein save ho gaya."
        : "Jawab save nahi ho saka. Device storage check karein.";
    }

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;

      add(q, "user");
      input.value = "";
      input.disabled = true;
      send.disabled = true;
      const pending = add("Soch raha hoon…", "bot");

      try {
        let response = handleLearning(q);
        if (!response) {
          response = window.SuperAIEngine.reply(q);
        }
        pending.textContent = response;
        window.SuperAIMemory.saveMessage("bot", response);
      } catch (err) {
        pending.textContent = "Maazrat, jawab dene mein error aaya.";
        console.error("Super AI error:", err);
      } finally {
        input.disabled = false;
        send.disabled = false;
        input.focus();
        list.scrollTop = list.scrollHeight;
      }
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Script load failed: " + src));
      document.head.appendChild(s);
    });
  }

  Promise.resolve()
    .then(() => loadScript("super-ai-memory.js"))
    .then(() => loadScript("super-ai-normalizer.js")).then(() => loadScript("super-ai-intent.js")).then(() => loadScript("super-ai-similarity.js")).then(() => loadScript("super-ai-math.js")).then(() => loadScript("super-ai-safety.js")).then(() => loadScript("super-ai-knowledge-science.js")).then(() => loadScript("super-ai-knowledge-technology.js")).then(() => loadScript("super-ai-knowledge-pakistan.js")).then(() => loadScript("super-ai-knowledge-math.js")).then(() => loadScript("super-ai-knowledge-biology.js")).then(() => loadScript("super-ai-knowledge-space.js")).then(() => loadScript("super-ai-knowledge-history.js")).then(() => loadScript("super-ai-knowledge-geography.js")).then(() => loadScript("super-ai-knowledge-education.js")).then(() => loadScript("super-ai-knowledge-language.js")).then(() => loadScript("super-ai-knowledge-business.js")).then(() => loadScript("super-ai-knowledge-health.js")).then(() => loadScript("super-ai-knowledge-security.js")).then(() => loadScript("super-ai-knowledge-environment.js")).then(() => loadScript("super-ai-knowledge-social.js")).then(() => loadScript("super-ai-engine.js"))
    .then(start)
    .catch(err => {
      console.error(err);
      window.__superAIChatLoaded = false;
    });
})();
