/* UMAR SUPER APP - CORE SYSTEM SCRIPT */

// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyB9ACAxelcW-esJWUDrD5lhL_7svxlyGxc",
  authDomain: "umarsuperapp.firebaseapp.com",
  projectId: "umarsuperapp",
  storageBucket: "umarsuperapp.firebasestorage.app",
  messagingSenderId: "812034119197",
  appId: "1:812034119197:web:60dc07304f30f29f6058f4",
  measurementId: "G-T8YZKR2SRR"
};

// Initialize Firebase App & Services
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Global App State
let currentUser = null;
let currentProfile = null;
let activeCommentVideoId = null;

// 2. DOM INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
    initAuthListeners();
    initNavigation();
    initTradingViewWidget("OANDA:XAUUSD");
    initEventHandlers();
    checkDeepLinkVideo();
});

// 3. AUTHENTICATION ENGINE
function initAuthListeners() {
    const authModal = document.getElementById("auth-modal");
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserProfile(user.uid);
            authModal.classList.add("hidden");
            loadVideoFeed();
            loadChatThreads();
        } else {
            currentUser = null;
            currentProfile = null;
            authModal.classList.remove("hidden");
        }
    });

    // Toggle Sign Up / Login Fields
    let isSignupMode = false;
    const toggleBtn = document.getElementById("auth-toggle-btn");
    const onboardingFields = document.getElementById("onboarding-fields");
    const authTitle = document.getElementById("auth-title");
    const authSubmit = document.getElementById("auth-submit-btn");

    toggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        isSignupMode = !isSignupMode;
        if (isSignupMode) {
            authTitle.innerText = "Create Umar Account";
            onboardingFields.classList.remove("hidden");
            authSubmit.innerText = "Sign Up";
            document.getElementById("auth-toggle-msg").innerText = "Pehle se account hai?";
            toggleBtn.innerText = "Login Karein";
        } else {
            authTitle.innerText = "Umar Super App Login";
            onboardingFields.classList.add("hidden");
            authSubmit.innerText = "Login";
            document.getElementById("auth-toggle-msg").innerText = "Account nahi hai?";
            toggleBtn.innerText = "Sign Up Karein";
        }
    });

    // Auth Submission
    authSubmit.addEventListener("click", async () => {
        const email = document.getElementById("auth-email").value.trim();
        const password = document.getElementById("auth-password").value.trim();
        const errorDiv = document.getElementById("auth-error");
        errorDiv.innerText = "";

        if (!email || !password) {
            errorDiv.innerText = "Please fill all required fields.";
            return;
        }

        try {
            if (isSignupMode) {
                const fullname = document.getElementById("auth-fullname").value.trim() || "User";
                const username = document.getElementById("auth-username").value.trim() || "@user";
                const avatar = document.getElementById("auth-avatar-url").value.trim() || "https://via.placeholder.com/100";

                const res = await auth.createUserWithEmailAndPassword(email, password);
                
                // Create Firestore Profile Document
                await db.collection("users").doc(res.user.uid).set({
                    uid: res.user.uid,
                    email: email,
                    fullname: fullname,
                    username: username,
                    avatar: avatar,
                    followersCount: 0,
                    followingCount: 0,
                    totalViews: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                await auth.signInWithEmailAndPassword(email, password);
            }
        } catch (err) {
            if (err.code === "auth/email-already-in-use") {
                errorDiv.innerText = "Already used this email. Please login instead.";
            } else {
                errorDiv.innerText = err.message;
            }
        }
    });

    // Logout Option
    document.getElementById("menu-opt-logout").addEventListener("click", () => {
        auth.signOut();
    });
}

// Fetch Profile Data
async function loadUserProfile(uid) {
    const doc = await db.collection("users").doc(uid).get();
    if (doc.exists) {
        currentProfile = doc.data();
        document.getElementById("my-profile-name").innerText = currentProfile.fullname;
        document.getElementById("my-profile-username").innerText = currentProfile.username;
        document.getElementById("my-profile-img").src = currentProfile.avatar;
        document.getElementById("stat-followers").innerText = currentProfile.followersCount || 0;
        document.getElementById("stat-following").innerText = currentProfile.followingCount || 0;
        document.getElementById("stat-views").innerText = currentProfile.totalViews || 0;
    }
}

// 4. NAVIGATION ENGINE
function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".app-section");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const target = item.getAttribute("data-target");
            navItems.forEach(n => n.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active-section"));

            item.classList.add("active");
            document.getElementById(target).classList.add("active-section");
        });
    });

    // Top Dropdown Menu
    const topMenuBtn = document.getElementById("btn-top-menu");
    const dropMenu = document.getElementById("top-dropdown-menu");
    topMenuBtn.addEventListener("click", () => {
        dropMenu.classList.toggle("hidden");
    });
}

// 5. SHORT VIDEO FEED & ALGORITHM (VIRALITY ALGORITHM)
function loadVideoFeed() {
    const feedContainer = document.getElementById("video-feed-container");

    // Order videos based on engagement: (Likes + Comments + Shares)
    db.collection("videos")
      .orderBy("engagementScore", "desc")
      .onSnapshot(snapshot => {
          feedContainer.innerHTML = "";
          snapshot.forEach(doc => {
              const video = doc.data();
              const vCard = createVideoCard(doc.id, video);
              feedContainer.appendChild(vCard);
          });
      });
}

function createVideoCard(id, data) {
    const div = document.createElement("div");
    div.className = "video-card";
    
    // Video Filter Styles
    let filterStyle = "";
    if(data.filter === "sepia") filterStyle = "filter: sepia(0.8);";
    if(data.filter === "grayscale") filterStyle = "filter: grayscale(1);";
    if(data.filter === "blur") filterStyle = "filter: blur(2px);";

    div.innerHTML = `
        <video src="${data.url}" loop playsinline style="${filterStyle}" onclick="this.paused ? this.play() : this.pause()"></video>
        
        <div class="video-overlay-actions">
            <div class="action-btn-group">
                <button onclick="likeVideo('${id}', ${data.likes || 0})"><i class="fa-solid fa-heart"></i></button>
                <span>${data.likes || 0}</span>
            </div>
            <div class="action-btn-group">
                <button onclick="openCommentsModal('${id}')"><i class="fa-solid fa-comment"></i></button>
                <span>${data.commentsCount || 0}</span>
            </div>
            <div class="action-btn-group">
                <button onclick="shareVideo('${id}', '${data.username}')"><i class="fa-solid fa-share"></i></button>
                <span>Share</span>
            </div>
        </div>

        <div class="video-info-bottom">
            <div class="video-author-row">
                <img src="${data.authorAvatar || 'https://via.placeholder.com/40'}" />
                <strong>${data.username}</strong>
                <button class="btn-subscribe" onclick="subscribeUser('${data.userId}')">Subscribe</button>
            </div>
            <p>${data.description}</p>
        </div>
    `;
    return div;
}

// Video Like Handler
async function likeVideo(videoId, currentLikes) {
    if(!currentUser) return;
    const newLikes = currentLikes + 1;
    await db.collection("videos").doc(videoId).update({
        likes: newLikes,
        engagementScore: firebase.firestore.FieldValue.increment(2)
    });
}

// Direct App Video Link Sharing
function shareVideo(videoId, username) {
    const appLink = `https://umar-super-app.web.app/?v=${videoId}`;
    navigator.clipboard.writeText(appLink);
    alert(`Video Link Copied for ${username}! Share anywhere:\n${appLink}`);
}

// Deep Linking Check on Initial App Launch
function checkDeepLinkVideo() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    if (videoId) {
        console.log("Loading shared video target:", videoId);
        // Switch view to section feed
    }
}

// 6. TRADINGVIEW FOREX & CRYPTO CHARTS
function initTradingViewWidget(symbol) {
    document.getElementById("tradingview-widget-container").innerHTML = "";
    new TradingView.widget({
        "autosize": true,
        "symbol": symbol,
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "container_id": "tradingview-widget-container"
    });
}

// 7. TERMINAL & REAL-TIME COMPILER ENGINE
document.getElementById("btn-run-code").addEventListener("click", () => {
    const code = document.getElementById("code-editor-input").value;
    const outputConsole = document.getElementById("terminal-console-out");
    outputConsole.innerText = "> Executing script...\n";

    try {
        // Capture standard console.log
        let logs = [];
        const originalLog = console.log;
        console.log = function(...args) {
            logs.push(args.join(" "));
            originalLog.apply(console, args);
        };

        // Run JavaScript Code safely
        const result = new Function(code)();
        
        console.log = originalLog; // restore log
        outputConsole.innerText += logs.join("\n") + "\n> Process finished with result: " + (result !== undefined ? result : "Success");
    } catch (err) {
        outputConsole.innerText += "> Runtime Error: " + err.message;
    }
});

// 8. AI ASSISTANT CHAT ENGINE
document.getElementById("btn-send-ai").addEventListener("click", sendAiMessage);
function sendAiMessage() {
    const input = document.getElementById("ai-input-text");
    const text = input.value.trim();
    if(!text) return;

    const history = document.getElementById("ai-chat-history");
    
    // User Message
    const uDiv = document.createElement("div");
    uDiv.className = "ai-bubble ai-user";
    uDiv.innerText = text;
    history.appendChild(uDiv);
    
    input.value = "";

    // Simulated Smart Assistant Response
    setTimeout(() => {
        const aiDiv = document.createElement("div");
        aiDiv.className = "ai-bubble ai-reply";
        aiDiv.innerText = getAiResponse(text);
        history.appendChild(aiDiv);
        history.scrollTop = history.scrollHeight;
    }, 600);
}

function getAiResponse(query) {
    const q = query.toLowerCase();
    if(q.includes("forex") || q.includes("gold") || q.includes("xauusd")) {
        return "Forex markets mein XAUUSD key technical indicators current level support level ko retest kar rahe hain. Aap Market tab check karein.";
    } else if(q.includes("code") || q.includes("script")) {
        return "Aap Super App ke 'Compiler' tab mein JavaScript code likh kar real-time output check kar sakte hain.";
    } else {
        return "Main aapki kya madad kar sakta hoon? Umar Super App active hai aur sabhi real-time services sync hain.";
    }
}

// 9. WEATHER ENGINE
document.getElementById("btn-search-weather").addEventListener("click", fetchWeather);
async function fetchWeather() {
    const city = document.getElementById("weather-city-input").value.trim() || "Karachi";
    try {
        // Public Weather API Endpoint
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=24.8607&longitude=67.0011&current_weather=true`);
        const data = await res.json();
        
        document.getElementById("weather-city").innerText = city.toUpperCase();
        document.getElementById("weather-temp").innerText = `${data.current_weather.temperature}°C`;
        document.getElementById("weather-desc").innerText = `Wind Speed: ${data.current_weather.windspeed} km/h`;
    } catch(e) {
        alert("Unable to fetch weather data.");
    }
}

// 10. REAL-TIME CHAT & MESSAGING ENGINE
function loadChatThreads() {
    const threadsList = document.getElementById("chat-threads-list");
    db.collection("users").limit(10).onSnapshot(snapshot => {
        threadsList.innerHTML = "";
        snapshot.forEach(doc => {
            const u = doc.data();
            if(u.uid === currentUser.uid) return;

            const d = document.createElement("div");
            d.className = "thread-item";
            d.innerHTML = `
                <img src="${u.avatar || 'https://via.placeholder.com/40'}" />
                <div>
                    <strong>${u.fullname}</strong>
                    <p style="font-size:0.75rem; color:var(--text-sub);">${u.username}</p>
                </div>
            `;
            d.onclick = () => openChatWindow(u);
            threadsList.appendChild(d);
        });
    });
}

function openChatWindow(targetUser) {
    const win = document.getElementById("chat-active-window");
    win.classList.remove("hidden");
    document.getElementById("chat-header-name").innerText = targetUser.fullname;
    document.getElementById("chat-header-avatar").src = targetUser.avatar;

    // Load Live Messages Real-time
    const chatId = [currentUser.uid, targetUser.uid].sort().join("_");
    db.collection("chats").doc(chatId).collection("messages")
      .orderBy("timestamp", "asc")
      .onSnapshot(snapshot => {
          const area = document.getElementById("chat-messages-scroll");
          area.innerHTML = "";
          snapshot.forEach(doc => {
              const m = doc.data();
              const b = document.createElement("div");
              b.className = `msg-bubble ${m.senderId === currentUser.uid ? 'msg-mine' : 'msg-other'}`;
              b.innerText = m.text;
              area.appendChild(b);
          });
          area.scrollTop = area.scrollHeight;
      });

    // Send Message
    document.getElementById("btn-send-chat").onclick = async () => {
        const txt = document.getElementById("chat-msg-input").value.trim();
        if(!txt) return;
        document.getElementById("chat-msg-input").value = "";

        await db.collection("chats").doc(chatId).collection("messages").add({
            senderId: currentUser.uid,
            text: txt,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    };
}

// 11. UPLOAD & COMMUNITY MODALS
function initEventHandlers() {
    // Open Upload Modal
    document.getElementById("btn-open-upload-modal").addEventListener("click", () => {
        document.getElementById("upload-modal").classList.remove("hidden");
    });
    document.getElementById("btn-close-upload").addEventListener("click", () => {
        document.getElementById("upload-modal").classList.add("hidden");
    });

    // Tab Switching in Upload Modal
    document.getElementById("tab-video-upload").addEventListener("click", () => {
        document.getElementById("tab-video-upload").classList.add("active");
        document.getElementById("tab-livestream").classList.remove("active");
        document.getElementById("form-video-upload").classList.remove("hidden");
        document.getElementById("form-livestream").classList.add("hidden");
    });

    document.getElementById("tab-livestream").addEventListener("click", () => {
        document.getElementById("tab-livestream").classList.add("active");
        document.getElementById("tab-video-upload").classList.remove("active");
        document.getElementById("form-livestream").classList.remove("hidden");
        document.getElementById("form-video-upload").classList.add("hidden");
    });

    // Video Post Submission
    document.getElementById("btn-submit-post").addEventListener("click", async () => {
        const fileInput = document.getElementById("input-video-file");
        const desc = document.getElementById("input-video-desc").value;
        const filter = document.getElementById("select-video-filter").value;
        const privacy = document.getElementById("select-video-privacy").value;

        if(!fileInput.files[0]) {
            alert("Please select a video file first.");
            return;
        }

        const file = fileInput.files[0];
        const storageRef = storage.ref(`videos/${Date.now()}_${file.name}`);
        
        alert("Uploading video to Firebase storage...");
        const uploadTask = await storageRef.put(file);
        const downloadURL = await uploadTask.ref.getDownloadURL();

        await db.collection("videos").add({
            userId: currentUser.uid,
            username: currentProfile.username,
            authorAvatar: currentProfile.avatar,
            url: downloadURL,
            description: desc,
            filter: filter,
            privacy: privacy,
            likes: 0,
            commentsCount: 0,
            engagementScore: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Video Posted Successfully!");
        document.getElementById("upload-modal").classList.add("hidden");
    });

    // Forex Pair Buttons
    document.querySelectorAll(".pair-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".pair-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            initTradingViewWidget(btn.getAttribute("data-symbol"));
        });
    });
}

// 12. COMMENTS SYSTEM
function openCommentsModal(videoId) {
    activeCommentVideoId = videoId;
    document.getElementById("comments-modal").classList.remove("hidden");
    
    db.collection("videos").doc(videoId).collection("comments")
      .orderBy("createdAt", "asc")
      .onSnapshot(snapshot => {
          const scroll = document.getElementById("comments-list-scroll");
          scroll.innerHTML = "";
          document.getElementById("comments-count").innerText = snapshot.size;
          
          snapshot.forEach(doc => {
              const c = doc.data();
              const d = document.createElement("div");
              d.style.marginBottom = "8px";
              d.innerHTML = `<strong>${c.username}:</strong> <span>${c.text}</span>`;
              scroll.appendChild(d);
          });
      });
}

document.getElementById("btn-close-comments").addEventListener("click", () => {
    document.getElementById("comments-modal").classList.add("hidden");
});

document.getElementById("btn-post-comment").addEventListener("click", async () => {
    const input = document.getElementById("comment-input-text");
    const txt = input.value.trim();
    if(!txt || !activeCommentVideoId) return;

    input.value = "";
    await db.collection("videos").doc(activeCommentVideoId).collection("comments").add({
        userId: currentUser.uid,
        username: currentProfile.username,
        text: txt,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await db.collection("videos").doc(activeCommentVideoId).update({
        commentsCount: firebase.firestore.FieldValue.increment(1),
        engagementScore: firebase.firestore.FieldValue.increment(3)
    });
});
