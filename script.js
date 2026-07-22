import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9ACAxelcW-esJWUDrD5lhL_7svxlyGxc",
  authDomain: "umarsuperapp.firebaseapp.com",
  projectId: "umarsuperapp",
  storageBucket: "umarsuperapp.firebasestorage.app",
  messagingSenderId: "812034119197",
  appId: "1:812034119197:web:60dc07304f30f29f6058f4",
  measurementId: "G-T8YZKR2SRR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// APP STATE
let currentUser = null;
let currentSymbol = "OANDA:XAUUSD";
let dummyVideos = [
  {
    id: 1,
    url: "https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4",
    user: "umar_official",
    desc: "Welcome to Umar Super App! #superapp #tech",
    likes: 12400,
    comments: 320,
    shares: 85
  }
];

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupAuth();
  setupMarket();
  setupAI();
  setupChat();
  setupUpload();
  setupWeather();
  setupCodeEditor();
  setupProfile();
  renderVideos();
});

// NAVIGATION LOGIC
function setupNavigation() {
  const navBtns = document.querySelectorAll(".nav-btn[data-target], .top-tab[data-target]");
  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      document.querySelectorAll(".app-page").forEach(p => p.classList.remove("active"));
      document.querySelectorAll(".nav-btn, .top-tab").forEach(b => b.classList.remove("active"));
      
      document.getElementById(target)?.classList.add("active");
      document.querySelectorAll(`[data-target="${target}"]`).forEach(b => b.classList.add("active"));

      if (target === "market-section") {
        loadTradingViewWidget(currentSymbol);
      }
    });
  });

  // Sub tabs (Text Feed vs Video Feed)
  document.querySelectorAll(".sub-tab[data-sub]").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".sub-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const sub = tab.getAttribute("data-sub");
      if (sub === "text-posts") {
        document.getElementById("video-container").classList.add("hidden");
        document.getElementById("text-feed-container").classList.remove("hidden");
      } else {
        document.getElementById("text-feed-container").classList.add("hidden");
        document.getElementById("video-container").classList.remove("hidden");
      }
    });
  });
}

// STRICT FIREBASE AUTHENTICATION
function setupAuth() {
  const authModal = document.getElementById("auth-modal");
  const emailInput = document.getElementById("auth-email");
  const passInput = document.getElementById("auth-password");
  const authError = document.getElementById("auth-error");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      authModal.classList.remove("active");
      document.getElementById("profile-display-name").innerText = user.email.split("@")[0];
    } else {
      authModal.classList.add("active");
    }
  });

  document.getElementById("btn-login-submit").addEventListener("click", async () => {
    try {
      authError.innerText = "";
      await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
    } catch (err) {
      authError.innerText = err.message;
    }
  });

  document.getElementById("btn-signup-submit").addEventListener("click", async () => {
    try {
      authError.innerText = "";
      await createUserWithEmailAndPassword(auth, emailInput.value, passInput.value);
    } catch (err) {
      authError.innerText = err.message;
    }
  });
}

// TRADINGVIEW FOREX CHARTS FIX
function setupMarket() {
  document.querySelectorAll(".m-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".m-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSymbol = btn.getAttribute("data-symbol");
      loadTradingViewWidget(currentSymbol);
    });
  });
}

function loadTradingViewWidget(symbol) {
  const container = document.getElementById("tradingview-widget-container");
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

// AI CHAT SYSTEM FIX
function setupAI() {
  const sendBtn = document.getElementById("ai-send-btn");
  const input = document.getElementById("ai-input");
  const chatLogs = document.getElementById("ai-messages");

  const handleAISend = () => {
    const text = input.value.trim();
    if (!text) return;

    // Append User Message
    chatLogs.innerHTML += `
      <div class="msg user-msg">
        <div class="msg-bubble">${text}</div>
      </div>`;
    input.value = "";
    chatLogs.scrollTop = chatLogs.scrollHeight;

    // Dynamic AI Response
    setTimeout(() => {
      let aiReply = "Aapka sawal mil gaya hai! Umar Super App AI aapki khidmat mein hazir hai.";
      if (text.toLowerCase().includes("code") || text.toLowerCase().includes("compiler")) {
        aiReply = "Aap Terminal / Code tab mein ja kar real-time JavaScript run kar sakte hain!";
      } else if (text.toLowerCase().includes("market") || text.toLowerCase().includes("forex")) {
        aiReply = "Market tab mein XAUUSD (Gold), BTCUSD, aur EURUSD ke live TradingView charts available hain.";
      }

      chatLogs.innerHTML += `
        <div class="msg ai-msg">
          <div class="msg-bubble">${aiReply}</div>
        </div>`;
      chatLogs.scrollTop = chatLogs.scrollHeight;
    }, 600);
  };

  sendBtn.addEventListener("click", handleAISend);
  input.addEventListener("keypress", (e) => { if (e.key === "Enter") handleAISend(); });
}

// REAL-TIME CHAT & MESSAGING
function setupChat() {
  const sendBtn = document.getElementById("chat-send-btn");
  const input = document.getElementById("chat-user-input");
  const chatLogs = document.getElementById("user-chat-logs");

  sendBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return;

    chatLogs.innerHTML += `
      <div class="msg user-msg">
        <div class="msg-bubble">${text}</div>
      </div>`;
    input.value = "";
    chatLogs.scrollTop = chatLogs.scrollHeight;
  });

  // Dropdown Channel/Group Menu
  document.getElementById("chat-three-dots").addEventListener("click", () => {
    document.getElementById("chat-menu").classList.toggle("hidden");
  });

  document.getElementById("btn-create-channel").addEventListener("click", () => {
    document.getElementById("channel-modal").classList.add("active");
  });
}

// RENDER VIDEO FEED
function renderVideos() {
  const container = document.getElementById("video-container");
  container.innerHTML = dummyVideos.map(v => `
    <div class="video-card">
      <video src="${v.url}" loop autoplay muted playsinline></video>
      <div class="video-overlay-right">
        <img class="video-user-avatar" src="https://via.placeholder.com/50" />
        <button class="action-icon-btn"><i class="fa-solid fa-heart"></i><span>${v.likes}</span></button>
        <button class="action-icon-btn"><i class="fa-solid fa-comment"></i><span>${v.comments}</span></button>
        <button class="action-icon-btn"><i class="fa-solid fa-share"></i><span>${v.shares}</span></button>
      </div>
      <div class="video-bottom-info">
        <h4>@${v.user}</h4>
        <p>${v.desc}</p>
      </div>
    </div>
  `).join("");
}

// UPLOAD / MEDIA MODAL SYSTEM
function setupUpload() {
  const modal = document.getElementById("upload-modal");
  document.getElementById("btn-open-upload").addEventListener("click", () => modal.classList.add("active"));
  
  document.querySelectorAll(".close-modal").forEach(c => {
    c.addEventListener("click", () => {
      document.querySelectorAll(".modal").forEach(m => m.classList.remove("active"));
    });
  });

  document.getElementById("video-file-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const preview = document.getElementById("upload-preview-video");
      preview.src = url;
      document.getElementById("media-preview-container").classList.remove("hidden");
    }
  });

  document.getElementById("btn-publish-video").addEventListener("click", () => {
    const desc = document.getElementById("upload-desc").value;
    const preview = document.getElementById("upload-preview-video");
    if (preview.src) {
      dummyVideos.unshift({
        id: Date.now(),
        url: preview.src,
        user: currentUser ? currentUser.email.split("@")[0] : "umar_creator",
        desc: desc || "My new video post!",
        likes: 1,
        comments: 0,
        shares: 0
      });
      renderVideos();
      modal.classList.remove("active");
      alert("Video published successfully!");
    }
  });
}

// WEATHER SYSTEM
function setupWeather() {
  const modal = document.getElementById("weather-modal");
  document.getElementById("weather-btn").addEventListener("click", () => modal.classList.add("active"));

  document.getElementById("btn-fetch-weather").addEventListener("click", async () => {
    const city = document.getElementById("weather-city-input").value.trim();
    if (!city) return;
    try {
      const res = await fetch(`https://wttr.in/${city}?format=%t+%C`);
      const data = await res.text();
      document.getElementById("weather-result").innerText = `Weather in ${city}: ${data}`;
      document.getElementById("weather-text").innerText = `${data} ${city}`;
    } catch {
      document.getElementById("weather-result").innerText = "Unable to fetch weather data.";
    }
  });
}

// REAL-TIME CODE COMPILER
function setupCodeEditor() {
  document.getElementById("btn-run-code").addEventListener("click", () => {
    const code = document.getElementById("code-input").value;
    const output = document.getElementById("code-output");
    try {
      let logs = [];
      const customConsole = { log: (...args) => logs.push(args.join(" ")) };
      const runFn = new Function("console", code);
      runFn(customConsole);
      output.innerText = logs.length > 0 ? logs.join("\n") : "Code executed successfully with no output.";
    } catch (err) {
      output.innerText = "Error: " + err.message;
    }
  });
}

// PROFILE LOGIC
function setupProfile() {
  document.getElementById("btn-edit-profile").addEventListener("click", () => {
    document.getElementById("edit-profile-modal").classList.add("active");
  });

  document.getElementById("btn-save-profile").addEventListener("click", () => {
    const name = document.getElementById("edit-name-input").value;
    const bio = document.getElementById("edit-bio-input").value;

    if (name) document.getElementById("profile-display-name").innerText = name;
    if (bio) document.getElementById("profile-bio-text").innerText = bio;

    document.getElementById("edit-profile-modal").classList.remove("active");
  });
}
