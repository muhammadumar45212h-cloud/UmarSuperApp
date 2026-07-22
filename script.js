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

    // Auth Submission (Login & Signup)
    authSubmit.addEventListener("click", async () => {
        const identifier = document.getElementById("auth-email").value.trim(); // Email / Phone / Username
        const password = document.getElementById("auth-password").value.trim();
        const errorDiv = document.getElementById("auth-error");
        errorDiv.innerText = "";

        if (!identifier || !password) {
            errorDiv.innerText = "Please fill all required fields.";
            return;
        }

        authSubmit.innerText = "Processing...";
        authSubmit.disabled = true;

        try {
            if (isSignupMode) {
                const fullname = document.getElementById("auth-fullname").value.trim() || "User";
                let username = document.getElementById("auth-username").value.trim() || "@user";
                if (!username.startsWith("@")) username = "@" + username;

                const phoneInput = document.getElementById("auth-phone") ? document.getElementById("auth-phone").value.trim() : "";
                const avatarFileInput = document.getElementById("auth-avatar-file");

                let targetEmail = identifier;
                let userPhone = phoneInput;

                // Agar identifier Email nahi hai, to Check Phone
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
                    // Check if identifier is Username or Phone in Firestore
                    const userByUsername = await db.collection("users").where("username", "==", identifier.startsWith("@") ? identifier : "@" + identifier).get();
                    const userByPhone = await db.collection("users").where("phone", "==", identifier).get();

                    if (!userByUsername.empty) {
                        const userData = userByUsername.docs[0].data();
                        targetEmail = userData.email || phoneToEmail(userData.phone);
                    } else if (!userByPhone.empty) {
                        const userData = userByPhone.docs[0].data();
                        targetEmail = userData.email || phoneToEmail(userData.phone);
                    } else {
                        // Default fallback to phone format
                        targetEmail = phoneToEmail(identifier);
                    }
                }

                await auth.signInWithEmailAndPassword(targetEmail, password);
            }
        } catch (err) {
            if (err.code === "auth/email-already-in-use") {
                errorDiv.innerText = "Email ya Phone pehle se registered hai. Login karein.";
            } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
                errorDiv.innerText = "Ghalat Login Details ya Password! Dobara check karein.";
            } else {
                errorDiv.innerText = err.message;
            }
        } finally {
            authSubmit.innerText = isSignupMode ? "Sign Up" : "Login";
            authSubmit.disabled = false;
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
        if (document.getElementById("my-profile-name")) document.getElementById("my-profile-name").innerText = currentProfile.fullname;
        if (document.getElementById("my-profile-username")) document.getElementById("my-profile-username").innerText = currentProfile.username;
        if (document.getElementById("my-profile-img")) document.getElementById("my-profile-img").src = currentProfile.avatar;
        if (document.getElementById("stat-followers")) document.getElementById("stat-followers").innerText = currentProfile.followersCount || 0;
        if (document.getElementById("stat-following")) document.getElementById("stat-following").innerText = currentProfile.followingCount || 0;
        if (document.getElementById("stat-views")) document.getElementById("stat-views").innerText = currentProfile.totalViews || 0;
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

async function likeVideo(videoId, currentLikes) {
    if(!currentUser) return;
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

// 6. TRADINGVIEW FOREX & CRYPTO CHARTS
function initTradingViewWidget(symbol) {
    const container = document.getElementById("tradingview-widget-container");
    if (!container) return;
    container.innerHTML = "";
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
const runBtn = document.getElementById("btn-run-code");
if (runBtn) {
    runBtn.addEventListener("click", () => {
        const code = document.getElementById("code-editor-input").value;
        const outputConsole = document.getElementById("terminal-console-out");
        outputConsole.innerText = "> Executing script...\n";

        try {
            let logs = [];
            const originalLog = console.log;
            console.log = function(...args) {
                logs.push(args.join(" "));
                originalLog.apply(console, args);
            };

            const result = new Function(code)();
            console.log = originalLog;
            outputConsole.innerText += logs.join("\n") + "\n> Process finished with result: " + (result !== undefined ? result : "Success");
        } catch (err) {
            outputConsole.innerText += "> Runtime Error: " + err.message;
        }
    });
}

// 8. AI ASSISTANT CHAT ENGINE
const aiBtn = document.getElementById("btn-send-ai");
if (aiBtn) aiBtn.addEventListener("click", sendAiMessage);

function sendAiMessage() {
    const input = document.getElementById("ai-input-text");
    const text = input.value.trim();
    if(!text) return;

    const history = document.getElementById("ai-chat-history");
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
    const city = document.getElementById("weather-city-input").value.trim() || "Karachi";
    try {
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
    if (!threadsList) return;

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
    const openUploadBtn = document.getElementById("btn-open-upload-modal");
    if (openUploadBtn) {
        openUploadBtn.addEventListener("click", () => {
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
    }

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

const closeCommentsBtn = document.getElementById("btn-close-comments");
if (closeCommentsBtn) {
    closeCommentsBtn.addEventListener("click", () => {
        document.getElementById("comments-modal").classList.add("hidden");
    });
}

const postCommentBtn = document.getElementById("btn-post-comment");
if (postCommentBtn) {
    postCommentBtn.addEventListener("click", async () => {
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
}

