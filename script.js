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
    
    // Direct Feed Loading so app opens immediately without blocking login
    loadVideoFeed();
});

// Helper Function: Convert Phone to Dummy Email for Firebase Auth
function phoneToEmail(phone) {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    return `phone_${cleanPhone}@umarsuperapp.internal`;
}

// 3. AUTHENTICATION ENGINE (Email / Phone / Username + Gallery Photo)
function initAuthListeners() {
    const authModal = document.getElementById("auth-modal");
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserProfile(user.uid);
            if (authModal) authModal.classList.add("hidden");
            loadVideoFeed();
            loadChatThreads();
        } else {
            currentUser = null;
            currentProfile = null;
            // App opens directly without forcing login modal on startup
            if (authModal) authModal.classList.add("hidden");
        }
    });

    // Close / Skip Auth Modal Button (Optional Guest Access)
    const closeAuthBtn = document.getElementById("btn-close-auth");
    if (closeAuthBtn && authModal) {
        closeAuthBtn.addEventListener("click", () => {
            authModal.classList.add("hidden");
        });
    }

    // Toggle Sign Up / Login Fields
    let isSignupMode = false;
    const toggleBtn = document.getElementById("auth-toggle-btn");
    const onboardingFields = document.getElementById("onboarding-fields");
    const authTitle = document.getElementById("auth-title");
    const authSubmit = document.getElementById("auth-submit-btn");

    if (toggleBtn) {
        toggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            isSignupMode = !isSignupMode;
            if (isSignupMode) {
                if (authTitle) authTitle.innerText = "Create Umar Account";
                if (onboardingFields) onboardingFields.classList.remove("hidden");
                if (authSubmit) authSubmit.innerText = "Sign Up";
                if (document.getElementById("auth-toggle-msg")) document.getElementById("auth-toggle-msg").innerText = "Pehle se account hai?";
                toggleBtn.innerText = "Login Karein";
            } else {
                if (authTitle) authTitle.innerText = "Umar Super App Login";
                if (onboardingFields) onboardingFields.classList.add("hidden");
                if (authSubmit) authSubmit.innerText = "Login";
                if (document.getElementById("auth-toggle-msg")) document.getElementById("auth-toggle-msg").innerText = "Account nahi hai?";
                toggleBtn.innerText = "Sign Up Karein";
            }
        });
    }

    // Auth Submission (Login & Signup)
    if (authSubmit) {
        authSubmit.addEventListener("click", async () => {
            const identifier = document.getElementById("auth-email") ? document.getElementById("auth-email").value.trim() : "";
            const password = document.getElementById("auth-password") ? document.getElementById("auth-password").value.trim() : "";
            const errorDiv = document.getElementById("auth-error");
            if (errorDiv) errorDiv.innerText = "";

            if (!identifier || !password) {
                if (errorDiv) errorDiv.innerText = "Please fill all required fields.";
                return;
            }

            authSubmit.innerText = "Processing...";
            authSubmit.disabled = true;

            try {
                if (isSignupMode) {
                    const fullname = (document.getElementById("auth-fullname") && document.getElementById("auth-fullname").value.trim()) || "User";
                    let username = (document.getElementById("auth-username") && document.getElementById("auth-username").value.trim()) || "@user";
                    if (!username.startsWith("@")) username = "@" + username;

                    const phoneInput = document.getElementById("auth-phone") ? document.getElementById("auth-phone").value.trim() : "";
                    const avatarFileInput = document.getElementById("auth-avatar-file");

                    let targetEmail = identifier;
                    let userPhone = phoneInput;

                    if (!identifier.includes("@")) {
                        targetEmail = phoneToEmail(identifier);
                        userPhone = identifier;
                    }

                    // Gallery Image Upload to Firebase Storage
                    let avatarUrl = "https://via.placeholder.com/100";
                    if (avatarFileInput && avatarFileInput.files && avatarFileInput.files[0]) {
                        const file = avatarFileInput.files[0];
                        const storageRef = storage.ref(`avatars/${Date.now()}_${file.name}`);
                        const uploadTask = await storageRef.put(file);
                        avatarUrl = await uploadTask.ref.getDownloadURL();
                    }

                    // Create User in Firebase Auth
                    const res = await auth.createUserWithEmailAndPassword(targetEmail, password);
                    
                    // Save complete profile to Firestore
                    await db.collection("users").doc(res.user.uid).set({
                        uid: res.user.uid,
                        email: identifier.includes("@") ? identifier : "",
                        phone: userPhone,
                        fullname: fullname,
                        username: username,
                        avatar: avatarUrl,
                        followersCount: 0,
                        followingCount: 0,
                        totalViews: 0,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                } else {
                    // LOGIN LOGIC: Check Email, Phone, or Username
                    let targetEmail = identifier;

                    if (!identifier.includes("@")) {
                        const userByUsername = await db.collection("users").where("username", "==", identifier.startsWith("@") ? identifier : "@" + identifier).get();
                        const userByPhone = await db.collection("users").where("phone", "==", identifier).get();

                        if (!userByUsername.empty) {
                            const userData = userByUsername.docs[0].data();
                            targetEmail = userData.email || phoneToEmail(userData.phone);
                        } else if (!userByPhone.empty) {
                            const userData = userByPhone.docs[0].data();
                            targetEmail = userData.email || phoneToEmail(userData.phone);
                        } else {
                            targetEmail = phoneToEmail(identifier);
                        }
                    }

                    await auth.signInWithEmailAndPassword(targetEmail, password);
                }
            } catch (err) {
                if (errorDiv) {
                    if (err.code === "auth/email-already-in-use") {
                        errorDiv.innerText = "Email ya Phone pehle se registered hai. Login karein.";
                    } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
                        errorDiv.innerText = "Ghalat Login Details ya Password! Dobara check karein.";
                    } else {
                        errorDiv.innerText = err.message;
                    }
                }
            } finally {
                authSubmit.innerText = isSignupMode ? "Sign Up" : "Login";
                authSubmit.disabled = false;
            }
        });
    }

    // Logout Option
    const logoutBtn = document.getElementById("menu-opt-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            auth.signOut();
            alert("Logout successful!");
        });
    }
}

// Fetch Profile Data
async function loadUserProfile(uid) {
    try {
        const doc = await db.collection("users").doc(uid).get();
        if (doc.exists) {
            currentProfile = doc.data();
            if (document.getElementById("my-profile-name")) document.getElementById("my-profile-name").innerText = currentProfile.fullname;
            if (document.getElementById("my-profile-username")) document.getElementById("my-profile-username").innerText = currentProfile.username;
            if (document.getElementById("my-profile-img")) document.getElementById("my-profile-img").src = currentProfile.avatar;
            if (document.getElementById("stat-followers")) document.getElementById("stat-followers").innerText = currentProfile.followersCount || 0;
            if (document.getElementById("stat-following")) document.getElementById("stat-following").innerText = currentProfile.followingCount || 0;
            if (document.getElementById("stat-views")) document.getElementById("stat-views").innerText = currentProfile.totalViews || 0;
        }
    } catch (e) {
        console.log("Error loading user profile:", e);
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
            if (document.getElementById(target)) document.getElementById(target).classList.add("active-section");
        });
    });

    // Top Dropdown Menu
    const topMenuBtn = document.getElementById("btn-top-menu");
    const dropMenu = document.getElementById("top-dropdown-menu");
    if (topMenuBtn && dropMenu) {
        topMenuBtn.addEventListener("click", () => {
            dropMenu.classList.toggle("hidden");
        });
    }
}

// 5. SHORT VIDEO FEED & ALGORITHM
function loadVideoFeed() {
    const feedContainer = document.getElementById("video-feed-container");
    if (!feedContainer) return;

    db.collection("videos")
      .orderBy("engagementScore", "desc")
      .onSnapshot(snapshot => {
          feedContainer.innerHTML = "";
          if (snapshot.empty) {
              feedContainer.innerHTML = `<div style="color:#fff; text-align:center; padding:40px;">Koi videos available nahi hain. Upload karein!</div>`;
              return;
          }
          snapshot.forEach(doc => {
              const video = doc.data();
              const vCard = createVideoCard(doc.id, video);
              feedContainer.appendChild(vCard);
          });
      }, err => {
          console.log("Feed load error:", err);
      });
}

function createVideoCard(id, data) {
    const div = document.createElement("div");
    div.className = "video-card";
    
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
                <strong>${data.username || '@user'}</strong>
                <button class="btn-subscribe" onclick="subscribeUser('${data.userId}')">Subscribe</button>
            </div>
            <p>${data.description || ''}</p>
        </div>
    `;
    return div;
}

async function likeVideo(videoId, currentLikes) {
    if(!currentUser) {
        alert("Video like karne ke liye pehle Login Karein.");
        promptLogin();
        return;
    }
    const newLikes = currentLikes + 1;
    await db.collection("videos").doc(videoId).update({
        likes: newLikes,
        engagementScore: firebase.firestore.FieldValue.increment(2)
    });
}

function shareVideo(videoId, username) {
    const appLink = `https://umar-super-app.web.app/?v=${videoId}`;
    navigator.clipboard.writeText(appLink);
    alert(`Video Link Copied for ${username}! Share anywhere:\n${appLink}`);
}

function checkDeepLinkVideo() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    if (videoId) {
        console.log("Loading shared video target:", videoId);
    }
}

function promptLogin() {
    const authModal = document.getElementById("auth-modal");
    if (authModal) authModal.classList.remove("hidden");
}

function subscribeUser(userId) {
    if (!currentUser) {
        alert("Subscribe karne ke liye login karein!");
        promptLogin();
        return;
    }
    alert("Subscribed successfully!");
}

function openCommentsModal(videoId) {
    activeCommentVideoId = videoId;
    alert("Comments feature active for video ID: " + videoId);
}

// 6. TRADINGVIEW FOREX & CRYPTO CHARTS
function initTradingViewWidget(symbol) {
    const container = document.getElementById("tradingview-widget-container");
    if (!container) return;
    container.innerHTML = "";
    if (typeof TradingView !== "undefined") {
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
}

// 7. TERMINAL & REAL-TIME COMPILER ENGINE
const runBtn = document.getElementById("btn-run-code");
if (runBtn) {
    runBtn.addEventListener("click", () => {
        const codeInput = document.getElementById("code-editor-input");
        if (!codeInput) return;
        const code = codeInput.value;
        const outputConsole = document.getElementById("terminal-console-out");
        if (outputConsole) outputConsole.innerText = "> Executing script...\n";

        try {
            let logs = [];
            const originalLog = console.log;
            console.log = function(...args) {
                logs.push(args.join(" "));
                originalLog.apply(console, args);
            };

            const result = new Function(code)();
            console.log = originalLog;
            if (outputConsole) outputConsole.innerText += logs.join("\n") + "\n> Process finished with result: " + (result !== undefined ? result : "Success");
        } catch (err) {
            if (outputConsole) outputConsole.innerText += "> Runtime Error: " + err.message;
        }
    });
}

// 8. AI ASSISTANT CHAT ENGINE
const aiBtn = document.getElementById("btn-send-ai");
if (aiBtn) aiBtn.addEventListener("click", sendAiMessage);

function sendAiMessage() {
    const input = document.getElementById("ai-input-text");
    if (!input) return;
    const text = input.value.trim();
    if(!text) return;

    const history = document.getElementById("ai-chat-history");
    if (history) {
        const uDiv = document.createElement("div");
        uDiv.className = "ai-bubble ai-user";
        uDiv.innerText = text;
        history.appendChild(uDiv);
        
        input.value = "";

        setTimeout(() => {
            const aiDiv = document.createElement("div");
            aiDiv.className = "ai-bubble ai-reply";
            aiDiv.innerText = getAiResponse(text);
            history.appendChild(aiDiv);
            history.scrollTop = history.scrollHeight;
        }, 600);
    }
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
const weatherBtn = document.getElementById("btn-search-weather");
if (weatherBtn) weatherBtn.addEventListener("click", fetchWeather);

async function fetchWeather() {
    const cityInput = document.getElementById("weather-city-input");
    const city = cityInput ? cityInput.value.trim() || "Karachi" : "Karachi";
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=24.8607&longitude=67.0011&current_weather=true`);
        const data = await res.json();
        
        if (document.getElementById("weather-city")) document.getElementById("weather-city").innerText = city.toUpperCase();
        if (document.getElementById("weather-temp")) document.getElementById("weather-temp").innerText = `${data.current_weather.temperature}°C`;
        if (document.getElementById("weather-desc")) document.getElementById("weather-desc").innerText = `Wind Speed: ${data.current_weather.windspeed} km/h`;
    } catch(e) {
        alert("Unable to fetch weather data.");
    }
}

// 10. REAL-TIME CHAT & MESSAGING ENGINE
function loadChatThreads() {
    const threadsList = document.getElementById("chat-threads-list");
    if (!threadsList) return;

    db.collection("users").limit(10).onSnapshot(snapshot => {
        threadsList.innerHTML = "";
        snapshot.forEach(doc => {
            const u = doc.data();
            if(currentUser && u.uid === currentUser.uid) return;

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
    if (!currentUser) {
        alert("Chat karne ke liye pehle Login Karein!");
        promptLogin();
        return;
    }

    const win = document.getElementById("chat-active-window");
    if (win) win.classList.remove("hidden");
    if (document.getElementById("chat-header-name")) document.getElementById("chat-header-name").innerText = targetUser.fullname;
    if (document.getElementById("chat-header-avatar")) document.getElementById("chat-header-avatar").src = targetUser.avatar;

    const chatId = [currentUser.uid, targetUser.uid].sort().join("_");
    db.collection("chats").doc(chatId).collection("messages")
      .orderBy("timestamp", "asc")
      .onSnapshot(snapshot => {
          const area = document.getElementById("chat-messages-scroll");
          if (!area) return;
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

    const sendChatBtn = document.getElementById("btn-send-chat");
    if (sendChatBtn) {
        sendChatBtn.onclick = async () => {
            const msgInput = document.getElementById("chat-msg-input");
            const txt = msgInput ? msgInput.value.trim() : "";
            if(!txt) return;
            if (msgInput) msgInput.value = "";

            await db.collection("chats").doc(chatId).collection("messages").add({
                senderId: currentUser.uid,
                text: txt,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        };
    }
}

// 11. UPLOAD & COMMUNITY MODALS
function initEventHandlers() {
    const openUploadBtn = document.getElementById("btn-open-upload-modal");
    if (openUploadBtn) {
        openUploadBtn.addEventListener("click", () => {
            if (!currentUser) {
                alert("Video upload karne ke liye pehle Login Karein!");
                promptLogin();
                return;
            }
            document.getElementById("upload-modal").classList.remove("hidden");
        });
    }

    const closeUploadBtn = document.getElementById("btn-close-upload");
    if (closeUploadBtn) {
        closeUploadBtn.addEventListener("click", () => {
            document.getElementById("upload-modal").classList.add("hidden");
        });
    }

    // Video Post Submission
    const submitPostBtn = document.getElementById("btn-submit-post");
    if (submitPostBtn) {
        submitPostBtn.addEventListener("click", async () => {
            if (!currentUser) {
                alert("Please login first to upload a video.");
                promptLogin();
                return;
            }

            const fileInput = document.getElementById("input-video-file");
            const desc = document.getElementById("input-video-desc") ? document.getElementById("input-video-desc").value : "";
            const filter = document.getElementById("select-video-filter") ? document.getElementById("select-video-filter").value : "none";
            const privacy = document.getElementById("select-video-privacy") ? document.getElementById("select-video-privacy").value : "public";

            if(!fileInput || !fileInput.files || !fileInput.files[0]) {
                alert("Please select a video file first.");
                return;
            }

            const file = fileInput.files[0];
            const storageRef = storage.ref(`videos/${Date.now()}_${file.name}`);
            
            submitPostBtn.innerText = "Uploading...";
            submitPostBtn.disabled = true;

            try {
                const uploadTask = await storageRef.put(file);
                const videoUrl = await uploadTask.ref.getDownloadURL();

                await db.collection("videos").add({
                    userId: currentUser.uid,
                    username: currentProfile ? currentProfile.username : "@user",
                    authorAvatar: currentProfile ? currentProfile.avatar : "https://via.placeholder.com/40",
                    url: videoUrl,
                    description: desc,
                    filter: filter,
                    privacy: privacy,
                    likes: 0,
                    commentsCount: 0,
                    engagementScore: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert("Video published successfully!");
                document.getElementById("upload-modal").classList.add("hidden");
                fileInput.value = "";
                if (document.getElementById("input-video-desc")) document.getElementById("input-video-desc").value = "";
            } catch (err) {
                alert("Upload failed: " + err.message);
            } finally {
                submitPostBtn.innerText = "Publish Video";
                submitPostBtn.disabled = false;
            }
        });
    }
}
