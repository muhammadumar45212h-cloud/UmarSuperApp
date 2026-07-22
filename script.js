import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB9ACAxelcW-esJWUDrD5lhL_7svxlyGxc",
  authDomain: "umarsuperapp.firebaseapp.com",
  projectId: "umarsuperapp",
  storageBucket: "umarsuperapp.firebasestorage.app",
  messagingSenderId: "812034119197",
  appId: "1:812034119197:web:60dc07304f30f29f6058f4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentUserData = null;
let activePostIdForComment = null;
let activeSelectedComment = null;
let currentSymbol = "OANDA:XAUUSD";

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupAuth();
  setupFeeds();
  setupComments();
  setupMessagesAndChannels();
  setupUpload();
  setupWeather();
  setupCodeEditor();
  setupMarket();
  setupAI();
});

// NAVIGATION
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

  document.querySelectorAll(".sub-tab[data-sub]").forEach(tab => {
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

  document.querySelectorAll(".close-modal").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest(".modal-overlay")?.classList.remove("active");
    });
  });
}

// MULTI-STEP AUTH & PROFILE DATA SAVING
function setupAuth() {
  const authModal = document.getElementById("auth-modal");
  const step1 = document.getElementById("auth-step-1");
  const step2 = document.getElementById("auth-step-2");
  const authError = document.getElementById("auth-error");

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        currentUserData = userSnap.data();
        document.getElementById("profile-display-name").innerText = currentUserData.username || "User";
        document.getElementById("profile-avatar-img").src = currentUserData.avatar || "https://via.placeholder.com/100";
      } else {
        currentUserData = { username: user.email.split("@")[0], avatar: "https://via.placeholder.com/100" };
      }
      authModal.classList.remove("active");
    } else {
      authModal.classList.add("active");
    }
  });

  document.getElementById("btn-login-submit")?.addEventListener("click", async () => {
    try {
      authError.innerText = "";
      const email = document.getElementById("auth-email").value;
      const pass = document.getElementById("auth-password").value;
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      authError.innerText = err.message;
    }
  });

  document.getElementById("btn-signup-next")?.addEventListener("click", () => {
    step1.classList.add("hidden");
    step2.classList.remove("hidden");
    document.getElementById("auth-step-title").innerText = "Profile Setup";
  });

  document.getElementById("btn-signup-complete")?.addEventListener("click", async () => {
    try {
      authError.innerText = "";
      const email = document.getElementById("auth-email").value;
      const pass = document.getElementById("auth-password").value;
      const username = document.getElementById("auth-username").value || email.split("@")[0];
      const avatar = document.getElementById("auth-avatar").value || "https://via.placeholder.com/100";

      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await setDoc(doc(db, "users", res.user.uid), {
        email, username, avatar, createdAt: new Date()
      });
    } catch (err) {
      authError.innerText = err.message;
    }
  });
}

// REALTIME VIDEO FEED & LIKE TOGGLE
function setupFeeds() {
  const videoCardsWrapper = document.getElementById("video-cards-wrapper");

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    videoCardsWrapper.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const pId = docSnap.id;

      if (post.type === "video") {
        const card = document.createElement("div");
        card.className = "video-card-box";
        card.innerHTML = `
          ${post.attachedComment ? `<div class="sticker-comment-overlay"><strong>@${post.attachedComment.author}:</strong> ${post.attachedComment.text}</div>` : ""}
          <video src="${post.url}" loop muted playsinline></video>
          <div class="video-overlay-actions">
            <div class="user-avatar-btn"><img src="${post.avatar || 'https://via.placeholder.com/50'}"/></div>
            <button class="action-btn btn-like ${post.likedBy?.includes(currentUser?.uid) ? 'active' : ''}"><i class="fa-solid fa-heart"></i><span>${post.likes || 0}</span></button>
            <button class="action-btn btn-comment"><i class="fa-solid fa-comment"></i><span>${post.commentsCount || 0}</span></button>
          </div>
          <div class="video-bottom-info">
            <h4>@${post.username}</h4>
            <p>${post.desc}</p>
          </div>
        `;

        // Video click toggle play
        const videoEl = card.querySelector("video");
        card.addEventListener("click", (e) => {
          if (e.target.closest(".action-btn")) return;
          if (videoEl.paused) videoEl.play(); else videoEl.pause();
        });

        // Like/Unlike Toggle
        card.querySelector(".btn-like").addEventListener("click", async () => {
          if (!currentUser) return;
          const postRef = doc(db, "posts", pId);
          let likedBy = post.likedBy || [];
          let likes = post.likes || 0;

          if (likedBy.includes(currentUser.uid)) {
            likedBy = likedBy.filter(id => id !== currentUser.uid);
            likes = Math.max(0, likes - 1);
          } else {
            likedBy.push(currentUser.uid);
            likes += 1;
          }
          await updateDoc(postRef, { likes, likedBy });
        });

        // Open Comment Box
        card.querySelector(".btn-comment").addEventListener("click", () => {
          activePostIdForComment = pId;
          document.getElementById("comment-modal").classList.add("active");
          listenToComments(pId);
        });

        videoCardsWrapper.appendChild(card);
      }
    });
  });
}

// COMMENTS SYSTEM & LONG PRESS MENU
function listenToComments(postId) {
  const box = document.getElementById("comments-list-box");
  const q = query(collection(db, `posts/${postId}/comments`), orderBy("createdAt", "asc"));

  onSnapshot(q, (snapshot) => {
    box.innerHTML = "";
    snapshot.forEach(docSnap => {
      const c = docSnap.data();
      const item = document.createElement("div");
      item.className = "comment-item";
      item.innerHTML = `
        <strong>@${c.author}</strong>
        <p>${c.text}</p>
        <button class="like-c-btn"><i class="fa-solid fa-heart"></i> ${c.likes || 0}</button>
      `;

      // Long press context menu trigger
      let timer;
      item.addEventListener("touchstart", () => {
        timer = setTimeout(() => showContextMenu(c, postId), 1000);
      });
      item.addEventListener("touchend", () => clearTimeout(timer));

      box.appendChild(item);
    });
  });
}

function showContextMenu(comment, postId) {
  const menu = document.getElementById("comment-context-menu");
  menu.classList.remove("hidden");
  menu.style.top = "50%";
  menu.style.left = "50%";

  document.getElementById("ctx-create-video").onclick = () => {
    menu.classList.add("hidden");
    document.getElementById("comment-modal").classList.remove("active");
    const uploadModal = document.getElementById("upload-modal");
    uploadModal.classList.add("active");
    const badge = document.getElementById("attached-comment-badge");
    badge.classList.remove("hidden");
    badge.innerText = `Replying to @${comment.author}: "${comment.text}"`;
    uploadModal.dataset.attachedComment = JSON.stringify(comment);
  };
}

function setupComments() {
  document.getElementById("comment-send-btn")?.addEventListener("click", async () => {
    const input = document.getElementById("comment-user-input");
    if (!input.value.trim() || !activePostIdForComment || !currentUserData) return;

    await addDoc(collection(db, `posts/${activePostIdForComment}/comments`), {
      author: currentUserData.username,
      text: input.value.trim(),
      likes: 0,
      createdAt: new Date()
    });
    input.value = "";
  });
}

// MESSAGES & WHATSAPP STYLE CHANNELS
function setupMessagesAndChannels() {
  const directList = document.getElementById("direct-msg-list");
  const channelsList = document.getElementById("channels-list");

  document.getElementById("tab-direct-msg").onclick = () => {
    document.getElementById("tab-direct-msg").classList.add("active");
    document.getElementById("tab-channels").classList.remove("active");
    directList.classList.remove("hidden");
    channelsList.classList.add("hidden");
  };

  document.getElementById("tab-channels").onclick = () => {
    document.getElementById("tab-channels").classList.add("active");
    document.getElementById("tab-direct-msg").classList.remove("active");
    channelsList.classList.remove("hidden");
    directList.classList.add("hidden");
  };

  // Mock list rendering matching WhatsApp style
  const dummyChats = [
    { name: "Ali Khan", msg: "Bhai video dekhi?", time: "11:15", badge: 2 },
    { name: "Ahmed", msg: "Market kaisa chal raha?", time: "10:30", badge: 0 },
    { name: "Sana", msg: "Text post mast hai!", time: "Yesterday", badge: 1 }
  ];

  directList.innerHTML = "";
  dummyChats.forEach(c => {
    directList.innerHTML += `
      <div class="chat-row-item" onclick="openChatRoom('${c.name}')">
        <div class="chat-row-avatar">${c.name[0]}</div>
        <div class="chat-row-details">
          <div class="top-r"><h4>${c.name}</h4><span>${c.time}</span></div>
          <p>${c.msg}</p>
        </div>
        ${c.badge ? `<span class="badge-count">${c.badge}</span>` : ""}
      </div>
    `;
  });

  document.getElementById("btn-create-channel")?.addEventListener("click", async () => {
    const name = prompt("Enter Channel Name:");
    if (!name) return;
    await addDoc(collection(db, "channels"), { name, createdAt: new Date() });
    alert("Channel created successfully!");
  });
}

window.openChatRoom = function(name) {
  document.getElementById("chat-room-title").innerText = name;
  document.getElementById("chat-room-modal").classList.add("active");
};

// UPLOAD FUNCTIONALITY
function setupUpload() {
  document.getElementById("btn-open-upload")?.addEventListener("click", () => {
    document.getElementById("upload-modal").classList.add("active");
  });

  document.getElementById("btn-publish-video")?.addEventListener("click", async () => {
    const fileInput = document.getElementById("upload-file-input");
    const desc = document.getElementById("upload-desc").value;
    const uploadModal = document.getElementById("upload-modal");
    const attachedData = uploadModal.dataset.attachedComment ? JSON.parse(uploadModal.dataset.attachedComment) : null;

    if (!fileInput.files[0]) {
      alert("Please select a file first!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      await addDoc(collection(db, "posts"), {
        type: "video",
        url: e.target.result,
        desc: desc || "Super App Post",
        username: currentUserData?.username || "User",
        avatar: currentUserData?.avatar || "https://via.placeholder.com/50",
        likes: 0,
        commentsCount: 0,
        attachedComment: attachedData,
        createdAt: new Date()
      });
      uploadModal.classList.remove("active");
    };
    reader.readAsDataURL(fileInput.files[0]);
  });
}

// WEATHER FIX
function setupWeather() {
  document.getElementById("weather-btn")?.addEventListener("click", () => {
    document.getElementById("weather-modal").classList.add("active");
  });

  document.getElementById("btn-fetch-weather")?.addEventListener("click", async () => {
    const city = document.getElementById("weather-city-input").value.trim();
    const resBox = document.getElementById("weather-result");
    if (!city) return;

    resBox.innerText = "Fetching temperature...";
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%t+%C`);
      const data = await res.text();
      resBox.innerText = `Weather in ${city}: ${data}`;
      document.getElementById("weather-text").innerText = `${data} ${city}`;
    } catch {
      resBox.innerText = "Error fetching city weather.";
    }
  });
}

// TERMINAL EVALUATOR
function setupCodeEditor() {
  document.getElementById("btn-run-code")?.addEventListener("click", () => {
    const code = document.getElementById("code-input").value;
    const output = document.getElementById("code-output");

    try {
      let logs = [];
      const customConsole = {
        log: (...args) => logs.push(args.join(" "))
      };
      // Normalize python syntax print() to JS console.log
      let convertedCode = code.replace(/print\((.*?)\)/g, "console.log($1)");
      const runFn = new Function("console", convertedCode);
      runFn(customConsole);

      output.innerText = logs.length > 0 ? logs.join("\n") : "Executed cleanly with no output.";
    } catch (err) {
      output.innerText = "Execution Error: " + err.message;
    }
  });
}

// UNTOUCHED FOREX MARKET
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
function setupAI() {
  document.getElementById("ai-send-btn")?.addEventListener("click", () => {
    const input = document.getElementById("ai-input");
    const logs = document.getElementById("ai-messages");
    if (!input.value.trim()) return;

    logs.innerHTML += `<div class="msg user-msg"><div class="msg-bubble">${input.value}</div></div>`;
    const userVal = input.value;
    input.value = "";

    setTimeout(() => {
      logs.innerHTML += `<div class="msg ai-msg"><div class="msg-bubble">Super AI: Response for "${userVal}" processed.</div></div>`;
      logs.scrollTop = logs.scrollHeight;
    }, 400);
  });
}
