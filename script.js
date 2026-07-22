// LocalStorage Data Setup (No external crashing SDKs)
let appState = {
  posts: JSON.parse(localStorage.getItem("superapp_posts")) || [
    {
      id: 1,
      type: "video",
      url: "https://assets.mixkit.co/videos/preview/mixkit-vertical-shot-of-a-neon-sign-41528-large.mp4",
      username: "umar_dev",
      desc: "Super App initial build running strong! 🚀",
      likes: 12,
      liked: false,
      comments: [{ author: "Ali", text: "Boht zabardast app hai!" }]
    }
  ],
  textPosts: JSON.parse(localStorage.getItem("superapp_text_posts")) || [
    { id: 1, author: "Umar", text: "Mehnat rang layegi, super app is live! 🔥", time: "Just now" }
  ],
  channels: [
    { name: "Forex Traders PK", msg: "XAUUSD buy signal active", time: "12:00" },
    { name: "Super App Updates", msg: "New features added!", time: "11:30" }
  ],
  currentSymbol: "OANDA:XAUUSD",
  activeCommentPostId: null
};

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  renderVideoFeed();
  renderTextFeed();
  renderMessages();
  initWeather();
  initCodeRunner();
  initMarket();
  initAIChat();
  initUpload();
  initWallet();
});

// NAVIGATION SYSTEM (Working 100%)
function initNavigation() {
  const allNavBtns = document.querySelectorAll("[data-target]");
  allNavBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");

      document.querySelectorAll(".app-page").forEach(page => page.classList.remove("active"));
      document.querySelectorAll(".nav-btn, .top-tab").forEach(b => b.classList.remove("active"));

      const targetPage = document.getElementById(targetId);
      if (targetPage) targetPage.classList.add("active");

      document.querySelectorAll(`[data-target="${targetId}"]`).forEach(b => b.classList.add("active"));

      if (targetId === "market-section") {
        loadTradingViewChart(appState.currentSymbol);
      }
    });
  });

  // Sub Tabs (For You / Text Feed)
  document.querySelectorAll(".sub-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".sub-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const sub = tab.getAttribute("data-sub");
      if (sub === "text-feed") {
        document.getElementById("video-feed-container").classList.add("hidden");
        document.getElementById("text-feed-container").classList.remove("hidden");
      } else {
        document.getElementById("text-feed-container").classList.add("hidden");
        document.getElementById("video-feed-container").classList.remove("hidden");
      }
    });
  });

  // Modal Closers
  document.querySelectorAll(".close-modal").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest(".modal-overlay").classList.remove("active");
    });
  });
}

// VIDEO FEED RENDER & INTERACTIONS
function renderVideoFeed() {
  const wrapper = document.getElementById("video-cards-wrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "";

  appState.posts.forEach((post) => {
    const card = document.createElement("div");
    card.className = "video-card-box";
    card.innerHTML = `
      <video src="${post.url}" loop muted playsinline></video>
      <div class="video-overlay-actions">
        <button class="action-btn btn-like ${post.liked ? 'active' : ''}"><i class="fa-solid fa-heart"></i><span>${post.likes}</span></button>
        <button class="action-btn btn-comment"><i class="fa-solid fa-comment"></i><span>${post.comments.length}</span></button>
      </div>
      <div class="video-bottom-info">
        <h4>@${post.username}</h4>
        <p>${post.desc}</p>
      </div>
    `;

    const videoEl = card.querySelector("video");
    card.addEventListener("click", (e) => {
      if (e.target.closest(".action-btn")) return;
      if (videoEl.paused) videoEl.play(); else videoEl.pause();
    });

    // Like Button Toggle
    card.querySelector(".btn-like").addEventListener("click", () => {
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      savePosts();
      renderVideoFeed();
    });

    // Comment Modal Trigger
    card.querySelector(".btn-comment").addEventListener("click", () => {
      appState.activeCommentPostId = post.id;
      openCommentsModal(post);
    });

    wrapper.appendChild(card);
  });
}

function openCommentsModal(post) {
  const modal = document.getElementById("comment-modal");
  const list = document.getElementById("comments-list-box");
  list.innerHTML = "";

  post.comments.forEach(c => {
    list.innerHTML += `<div class="comment-item"><strong>@${c.author}</strong><p>${c.text}</p></div>`;
  });

  modal.classList.add("active");
}

document.getElementById("comment-send-btn")?.addEventListener("click", () => {
  const input = document.getElementById("comment-user-input");
  if (!input.value.trim() || !appState.activeCommentPostId) return;

  const post = appState.posts.find(p => p.id === appState.activeCommentPostId);
  if (post) {
    post.comments.push({ author: "Umar", text: input.value.trim() });
    savePosts();
    openCommentsModal(post);
    renderVideoFeed();
    input.value = "";
  }
});

// TEXT FEED
function renderTextFeed() {
  const list = document.getElementById("text-posts-list");
  if (!list) return;
  list.innerHTML = "";

  appState.textPosts.forEach(p => {
    list.innerHTML += `
      <div class="post-card">
        <h4>@${p.author} <small>${p.time}</small></h4>
        <p>${p.text}</p>
      </div>
    `;
  });
}

document.getElementById("btn-submit-text-post")?.addEventListener("click", () => {
  const input = document.getElementById("text-post-input");
  if (!input.value.trim()) return;

  appState.textPosts.unshift({ author: "Umar", text: input.value.trim(), time: "Just now" });
  localStorage.setItem("superapp_text_posts", JSON.stringify(appState.textPosts));
  renderTextFeed();
  input.value = "";
});

// MESSAGES & CHANNELS
function renderMessages() {
  const list = document.getElementById("direct-msg-list");
  if (!list) return;
  list.innerHTML = "";

  appState.channels.forEach(ch => {
    list.innerHTML += `
      <div class="chat-row-item" onclick="openChatRoom('${ch.name}')">
        <div class="chat-row-avatar">${ch.name[0]}</div>
        <div class="chat-row-details">
          <div class="top-r"><h4>${ch.name}</h4><span>${ch.time}</span></div>
          <p>${ch.msg}</p>
        </div>
      </div>
    `;
  });
}

window.openChatRoom = function(title) {
  document.getElementById("chat-room-title").innerText = title;
  document.getElementById("chat-room-modal").classList.add("active");
};

// WEATHER SEARCH
function initWeather() {
  document.getElementById("weather-btn")?.addEventListener("click", () => {
    document.getElementById("weather-modal").classList.add("active");
  });

  document.getElementById("btn-fetch-weather")?.addEventListener("click", async () => {
    const city = document.getElementById("weather-city-input").value.trim();
    const resBox = document.getElementById("weather-result");
    if (!city) return;

    resBox.innerText = "Loading weather...";
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%t+%C`);
      const text = await res.text();
      resBox.innerText = `${city}: ${text}`;
      document.getElementById("weather-text").innerText = `${text} ${city}`;
    } catch {
      resBox.innerText = "Could not fetch city weather.";
    }
  });
}

// CODE TERMINAL EVALUATOR
function initCodeRunner() {
  document.getElementById("btn-run-code")?.addEventListener("click", () => {
    const code = document.getElementById("code-input").value;
    const output = document.getElementById("code-output");

    try {
      let logs = [];
      const customConsole = { log: (...args) => logs.push(args.join(" ")) };
      const runFn = new Function("console", code);
      runFn(customConsole);
      output.innerText = logs.length ? logs.join("\n") : "Executed cleanly (no console output).";
    } catch (err) {
      output.innerText = "Syntax / Runtime Error: " + err.message;
    }
  });
}

// FOREX TRADINGVIEW CHART
function initMarket() {
  document.querySelectorAll(".m-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".m-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      appState.currentSymbol = btn.getAttribute("data-symbol");
      loadTradingViewChart(appState.currentSymbol);
    });
  });
}

function loadTradingViewChart(symbol) {
  const container = document.getElementById("tradingview-widget-container");
  if (!container) return;
  container.innerHTML = "";
  if (window.TradingView) {
    new window.TradingView.widget({
      autosize: true,
      symbol: symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      toolbar_bg: "#f1f3f6",
      enable_publishing: false,
      hide_side_toolbar: false,
      container_id: "tradingview-widget-container"
    });
  }
}

// AI CHAT
function initAIChat() {
  document.getElementById("ai-send-btn")?.addEventListener("click", () => {
    const input = document.getElementById("ai-input");
    const logs = document.getElementById("ai-messages");
    if (!input.value.trim()) return;

    const val = input.value.trim();
    logs.innerHTML += `<div class="msg user-msg"><div class="msg-bubble">${val}</div></div>`;
    input.value = "";

    setTimeout(() => {
      logs.innerHTML += `<div class="msg ai-msg"><div class="msg-bubble">Super AI: Processing your request regarding "${val}"...</div></div>`;
      logs.scrollTop = logs.scrollHeight;
    }, 400);
  });
}

// UPLOAD FUNCTION
function initUpload() {
  document.getElementById("btn-open-upload")?.addEventListener("click", () => {
    document.getElementById("upload-modal").classList.add("active");
  });

  document.getElementById("btn-publish-video")?.addEventListener("click", () => {
    const input = document.getElementById("upload-file-input");
    const desc = document.getElementById("upload-desc").value;

    if (!input.files[0]) {
      alert("Please select a file!");
      return;
    }

    const fileUrl = URL.createObjectURL(input.files[0]);
    appState.posts.unshift({
      id: Date.now(),
      type: "video",
      url: fileUrl,
      username: "Umar",
      desc: desc || "New Super App Video",
      likes: 0,
      liked: false,
      comments: []
    });

    savePosts();
    renderVideoFeed();
    document.getElementById("upload-modal").classList.remove("active");
  });
}

// WALLET
function initWallet() {
  document.getElementById("btn-withdraw-payout")?.addEventListener("click", () => {
    const acc = document.getElementById("payout-account").value;
    const amt = document.getElementById("payout-amount").value;
    if (!acc || !amt) return alert("Please fill all wallet fields!");
    alert(`Payout request of $${amt} submitted to ${acc}!`);
  });
}

function savePosts() {
  localStorage.setItem("superapp_posts", JSON.stringify(appState.posts));
}
