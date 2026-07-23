/* UMAR SUPER APP - ADVANCED CORE SYSTEM SCRIPT */

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
    
    // Load default public feeds
    loadVideoFeed();
    loadTextFeed();
});

// Helper Function: Convert Phone to Dummy Email for Firebase Auth
function phoneToEmail(phone) {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    return `phone_${cleanPhone}@umarsuperapp.internal`;
}

// 3. AUTHENTICATION & ACCESS ENGINE
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
            resetProfileUI();
        }
    });

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

    // Auth Submission
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

                    let avatarUrl = "https://via.placeholder.com/100";
                    if (avatarFileInput && avatarFileInput.files && avatarFileInput.files[0]) {
                        const file = avatarFileInput.files[0];
                        const storageRef = storage.ref(`avatars/${Date.now()}_${file.name}`);
                        const uploadTask = await storageRef.put(file);
                        avatarUrl = await uploadTask.ref.getDownloadURL();
                    }

                    const res = await auth.createUserWithEmailAndPassword(targetEmail, password);
                    
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
                        errorDiv.innerText = "Email ya Phone pehle se registered hai.";
                    } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
                        errorDiv.innerText = "Ghalat Details ya Password!";
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

    const logoutBtn = document.getElementById("menu-opt-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            auth.signOut();
            alert("Logout successful!");
        });
    }
}

function promptLogin() {
    const authModal = document.getElementById("auth-modal");
    if (authModal) authModal.classList.remove("hidden");
}

function resetProfileUI() {
    if (document.getElementById("my-profile-name")) document.getElementById("my-profile-name").innerText = "Guest User";
    if (document.getElementById("my-profile-username")) document.getElementById("my-profile-username").innerText = "@guest";
    if (document.getElementById("my-profile-img")) document.getElementById("my-profile-img").src = "https://via.placeholder.com/100";
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

// 4. NAVIGATION ENGINE (PROFILE RESTRICTION)
function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".app-section");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const target = item.getAttribute("data-target");
            
            // Profile restriction check
            if (target === "section-profile" && !currentUser) {
                alert("Profile dekhne ke liye pehle Login ya Sign Up karein.");
                promptLogin();
                return;
            }

            navItems.forEach(n => n.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active-section"));

            item.classList.add("active");
            if (document.getElementById(target)) document.getElementById(target).classList.add("active-section");
        });
    });
}

// 5. SEPARATE FEEDS ENGINE (TEXT & VIDEO)
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

function loadTextFeed() {
    const textFeedContainer = document.getElementById("text-feed-container");
    if (!textFeedContainer) return;

    db.collection("text_posts")
      .orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
          textFeedContainer.innerHTML = "";
          snapshot.forEach(doc => {
              const post = doc.data();
              const pCard = document.createElement("div");
              pCard.className = "text-post-card";
              pCard.innerHTML = `
                  <div class="post-header">
                      <img src="${post.avatar || 'https://via.placeholder.com/40'}" />
                      <strong>${post.username}</strong>
                  </div>
                  <p class="post-text-content">${post.text}</p>
              `;
              textFeedContainer.appendChild(pCard);
          });
      });
}

function createVideoCard(id, data) {
    const div = document.createElement("div");
    div.className = "video-card";
    
    div.innerHTML = `
        <video src="${data.url}" loop playsinline onclick="this.paused ? this.play() : this.pause()"></video>
        
        <div class="video-overlay-actions">
            <div class="action-btn-group">
                <img class="action-avatar" src="${data.authorAvatar || 'https://via.placeholder.com/40'}" />
                <button class="btn-subscribe-small" onclick="subscribeUser('${data.userId}')">+</button>
            </div>
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
            <strong>${data.username || '@user'}</strong>
            <p>${data.description || ''}</p>
        </div>
    `;
    return div;
}

async function likeVideo(videoId, currentLikes) {
    if(!currentUser) {
        alert("Pehle Login Karein!");
        promptLogin();
        return;
    }
    await db.collection("videos").doc(videoId).update({
        likes: currentLikes + 1,
        engagementScore: firebase.firestore.FieldValue.increment(2)
    });
}

function shareVideo(videoId, username) {
    const appLink = `https://umar-super-app.web.app/?v=${videoId}`;
    navigator.clipboard.writeText(appLink);
    alert(`Link Copied for ${username}: ${appLink}`);
}

function subscribeUser(userId) {
    if (!currentUser) {
        alert("Subscribe karne ke liye Login karein!");
        promptLogin();
        return;
    }
    alert("Subscribed!");
}

function openCommentsModal(videoId) {
    if (!currentUser) {
        alert("Comment karne ke liye Login karein!");
        promptLogin();
        return;
    }
    activeCommentVideoId = videoId;
    alert("Opening comments for video ID: " + videoId);
}

// 6. TRADINGVIEW FOREX ENGINE
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
            "container_id": "tradingview-widget-container"
        });
    }
}

// 7. COMPILER ENGINE (OUTPUT AT BOTTOM FULL SCREEN)
const runBtn = document.getElementById("btn-run-code");
if (runBtn) {
    runBtn.addEventListener("click", () => {
        const codeInput = document.getElementById("code-editor-input");
        const outputConsole = document.getElementById("terminal-console-out");
        if (!codeInput || !outputConsole) return;
        
        outputConsole.innerText = "> Executing script...\n";

        try {
            let logs = [];
            const originalLog = console.log;
            console.log = function(...args) {
                logs.push(args.join(" "));
                originalLog.apply(console, args);
            };

            const result = new Function(codeInput.value)();
            console.log = originalLog;
            outputConsole.innerText += logs.join("\n") + "\n> Output: " + (result !== undefined ? result : "Success");
        } catch (err) {
            outputConsole.innerText += "> Runtime Error: " + err.message;
        }
    });
}

// 8. CHAT ENGINE WITH THREE DOTS (GROUPS / CHANNELS)
const chatThreeDots = document.getElementById("btn-chat-options");
if (chatThreeDots) {
    chatThreeDots.addEventListener("click", () => {
        const option = prompt("Choose Option:\n1. Create Channel\n2. Create Group\n3. Broadcast Message");
        if (option === "1") alert("Channel creation opened.");
        if (option === "2") alert("Group creation opened.");
    });
}

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
                    <p style="font-size:0.75rem; color:#aaa;">${u.username}</p>
                </div>
            `;
            d.onclick = () => openChatWindow(u);
            threadsList.appendChild(d);
        });
    });
}

function openChatWindow(targetUser) {
    if (!currentUser) {
        alert("Chat karne ke liye Login Karein!");
        promptLogin();
        return;
    }

    const win = document.getElementById("chat-active-window");
    if (win) win.classList.remove("hidden");
    if (document.getElementById("chat-header-name")) document.getElementById("chat-header-name").innerText = targetUser.fullname;

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
}

// 9. UPLOAD WITH REALTIME PROGRESS BAR (0% - 100%)
function initEventHandlers() {
    const openUploadBtn = document.getElementById("btn-open-upload-modal");
    if (openUploadBtn) {
        openUploadBtn.addEventListener("click", () => {
            if (!currentUser) {
                alert("Upload karne ke liye Login Karein!");
                promptLogin();
                return;
            }
            document.getElementById("upload-modal").classList.remove("hidden");
        });
    }

    const submitPostBtn = document.getElementById("btn-submit-post");
    if (submitPostBtn) {
        submitPostBtn.addEventListener("click", async () => {
            if (!currentUser) {
                alert("Login Required!");
                promptLogin();
                return;
            }

            const fileInput = document.getElementById("input-video-file");
            const desc = document.getElementById("input-video-desc") ? document.getElementById("input-video-desc").value : "";

            if(!fileInput || !fileInput.files || !fileInput.files[0]) {
                alert("Video file select karein.");
                return;
            }

            const file = fileInput.files[0];
            const storageRef = storage.ref(`videos/${Date.now()}_${file.name}`);
            const uploadTask = storageRef.put(file);

            // Progress bar DOM
            const progressBar = document.getElementById("upload-progress-bar");
            const progressText = document.getElementById("upload-progress-text");
            const progressContainer = document.getElementById("upload-progress-container");

            if (progressContainer) progressContainer.classList.remove("hidden");

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (progressBar) progressBar.style.width = progress + "%";
                    if (progressText) progressText.innerText = Math.round(progress) + "% Uploading...";
                }, 
                (error) => {
                    alert("Upload error: " + error.message);
                }, 
                async () => {
                    const videoUrl = await uploadTask.snapshot.ref.getDownloadURL();
                    await db.collection("videos").add({
                        userId: currentUser.uid,
                        username: currentProfile ? currentProfile.username : "@user",
                        authorAvatar: currentProfile ? currentProfile.avatar : "https://via.placeholder.com/40",
                        url: videoUrl,
                        description: desc,
                        likes: 0,
                        commentsCount: 0,
                        engagementScore: 0,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    alert("Video Posted Successfully!");
                    if (progressContainer) progressContainer.classList.add("hidden");
                    document.getElementById("upload-modal").classList.add("hidden");
                }
            );
        });
    }
}
