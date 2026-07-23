// Import Firebase Modular SDK v10.8.0
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    setDoc, 
    getDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase App Config
const firebaseConfig = {
  apiKey: "AIzaSyB9ACAxelcW-esJWUDrD5lhL_7svxlyGxc",
  authDomain: "umarsuperapp.firebaseapp.com",
  projectId: "umarsuperapp",
  storageBucket: "umarsuperapp.firebasestorage.app",
  messagingSenderId: "812034119197",
  appId: "1:812034119197:web:60dc07304f30f29f6058f4",
  measurementId: "G-T8YZKR2SRR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Application State Variables
let currentUser = null;
let activeCommentPostId = null;
let activeReplyToCommentId = null;

let selectedVideoBase64 = null;
let selectedProfilePhotoBase64 = null;
let selectedChannelPhotoBase64 = null;
let selectedGroupPhotoBase64 = null;

let postsData = [];

// Auth Listener
onAuthStateChanged(auth, async (user) => {
    const authModal = document.getElementById('authModal');
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            currentUser = { uid: user.uid, email: user.email, ...userSnap.data() };
            if (authModal) authModal.style.display = 'none';
            listenToReelsFeed();
        } else {
            if (authModal) authModal.style.display = 'none';
            document.getElementById('onboardingModal').style.display = 'flex';
        }
    } else {
        currentUser = null;
        if (authModal) authModal.style.display = 'flex';
    }
});

// Authentication Handler
window.handleAuthAction = async function(type) {
    const email = document.getElementById('authEmailInput').value.trim();
    const password = document.getElementById('authPasswordInput').value.trim();

    if (!email || !password) {
        alert("Enter both email and password.");
        return;
    }

    try {
        if (type === 'signup') {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Account created!");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Login successful!");
        }
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            alert("This email is already registered! Please login.");
        } else {
            alert("Auth Error: " + error.message);
        }
    }
};

// Profile Photo Selection from Mobile Gallery
window.triggerProfilePhotoPicker = function() {
    document.getElementById('profilePhotoInput').click();
};

window.handleProfilePhotoSelected = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        selectedProfilePhotoBase64 = e.target.result;
        document.getElementById('onboardPreviewImg').src = selectedProfilePhotoBase64;
    };
    reader.readAsDataURL(file);
};

// Complete Profile Registration
window.completeUserOnboarding = async function() {
    const name = document.getElementById('onboardNameInput').value.trim();
    const username = document.getElementById('onboardUsernameInput').value.trim();

    if (!name || !username) {
        alert("Name and Username are required.");
        return;
    }

    const userData = {
        name,
        username: username.startsWith('@') ? username : '@' + username,
        photoUrl: selectedProfilePhotoBase64 || 'https://via.placeholder.com/150',
        followersCount: 0,
        createdAt: Date.now()
    };

    await setDoc(doc(db, "users", auth.currentUser.uid), userData);
    currentUser = { uid: auth.currentUser.uid, email: auth.currentUser.email, ...userData };
    document.getElementById('onboardingModal').style.display = 'none';
    listenToReelsFeed();
};

window.handleLogout = function() {
    signOut(auth).then(() => location.reload());
};

// Real-Time Feed Engine
function listenToReelsFeed() {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        postsData = [];
        snapshot.forEach((docSnap) => {
            postsData.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        postsData.sort((a, b) => {
            const rankA = (a.likesCount || 0) * 2 + (a.comments ? a.comments.length : 0) * 3;
            const rankB = (b.likesCount || 0) * 2 + (b.comments ? b.comments.length : 0) * 3;
            return rankB - rankA;
        });

        renderReelsUI();
    });
}

function renderReelsUI() {
    const container = document.getElementById('reelsFeedContainer');
    if (!container) return;

    if (postsData.length === 0) {
        container.innerHTML = `
            <div class="reel-card" style="display:flex; align-items:center; justify-content:center; text-align:center;">
                <div>
                    <h3>No Videos Published Yet</h3>
                    <p style="color:var(--text-muted);">Tap (+) to post a reel from Gallery!</p>
                </div>
            </div>`;
        return;
    }

    let html = '';
    postsData.forEach((post) => {
        const isLiked = post.likes && currentUser && post.likes[currentUser.uid];
        const shareLink = `${window.location.origin}?reelId=${post.id}&ref=${currentUser ? currentUser.username : 'app'}`;

        html += `
            <div class="reel-card" id="reel-${post.id}">
                <div class="video-container">
                    <video src="${post.videoUrl}" style="filter: ${post.filter || 'none'}" loop playsinline onclick="this.paused ? this.play() : this.pause()"></video>
                </div>
                <div class="video-overlay">
                    <div class="channel-info">
                        <img src="${post.userPhoto || 'https://via.placeholder.com/40'}" class="avatar">
                        <span class="username">${post.username || '@user'}</span>
                        <button class="btn-subscribe">Subscribe</button>
                    </div>
                    <div class="video-title">${post.description || ''}</div>
                </div>
                <div class="action-sidebar">
                    <button class="action-btn" onclick="toggleLikePost('${post.id}')">
                        <i class="fa-solid fa-heart" style="color:${isLiked ? '#e91e63' : '#fff'}"></i>
                        <span>${post.likesCount || 0}</span>
                    </button>
                    <button class="action-btn" onclick="openCommentsModal('${post.id}')">
                        <i class="fa-solid fa-comment"></i>
                        <span>${post.comments ? post.comments.length : 0}</span>
                    </button>
                    <button class="action-btn" onclick="sharePostLink('${shareLink}')">
                        <i class="fa-solid fa-share"></i>
                        <span>Share</span>
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.toggleLikePost = async function(postId) {
    if (!currentUser) return alert("Log in to like videos!");
    const postRef = doc(db, "posts", postId);
    const post = postsData.find(p => p.id === postId);
    if (!post) return;

    const likes = post.likes || {};
    let likesCount = post.likesCount || 0;

    if (likes[currentUser.uid]) {
        delete likes[currentUser.uid];
        likesCount = Math.max(0, likesCount - 1);
    } else {
        likes[currentUser.uid] = true;
        likesCount++;
    }

    await updateDoc(postRef, { likes, likesCount });
};

// Video Gallery & Camera Selection Handlers
window.triggerGalleryVideoPicker = function() {
    document.getElementById('galleryVideoInput').click();
};

window.triggerCameraVideoPicker = function() {
    document.getElementById('cameraVideoInput').click();
};

window.handleVideoFileSelected = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        selectedVideoBase64 = e.target.result;
        const videoTag = document.getElementById('previewVideoTag');
        videoTag.src = selectedVideoBase64;
        document.getElementById('videoPreviewContainer').style.display = 'block';
    };
    reader.readAsDataURL(file);
};

window.publishVideoPost = async function() {
    if (!selectedVideoBase64) {
        alert("Please select a video file from Gallery or Camera.");
        return;
    }

    const description = document.getElementById('videoDescriptionInput').value.trim();
    const filter = document.getElementById('videoEffectFilter').value;
    const visibility = document.getElementById('videoVisibilitySelect').value;

    const newPost = {
        userId: currentUser.uid,
        username: currentUser.username,
        userPhoto: currentUser.photoUrl,
        videoUrl: selectedVideoBase64,
        description,
        filter,
        visibility,
        likes: {},
        likesCount: 0,
        comments: [],
        createdAt: Date.now()
    };

    await addDoc(collection(db, "posts"), newPost);
    alert("Video Reel Published!");
    closeUploadModal();
};

// Channel & Group Photo Pickers from Gallery
window.triggerChannelPhotoPicker = function() { document.getElementById('channelPhotoInput').click(); };
window.handleChannelPhotoSelected = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (evt) => {
        selectedChannelPhotoBase64 = evt.target.result;
        document.getElementById('channelPreviewImg').src = selectedChannelPhotoBase64;
    };
    r.readAsDataURL(file);
};

window.triggerGroupPhotoPicker = function() { document.getElementById('groupPhotoInput').click(); };
window.handleGroupPhotoSelected = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (evt) => {
        selectedGroupPhotoBase64 = evt.target.result;
        document.getElementById('groupPreviewImg').src = selectedGroupPhotoBase64;
    };
    r.readAsDataURL(file);
};

window.saveNewChannel = async function() {
    const name = document.getElementById('channelName').value.trim();
    if (!name) return alert("Enter channel name");

    await addDoc(collection(db, "channels"), {
        name,
        photo: selectedChannelPhotoBase64 || '',
        owner: currentUser.uid,
        createdAt: Date.now()
    });
    alert("Channel created!");
    closeModal('channelModal');
};

window.saveNewGroup = async function() {
    const name = document.getElementById('groupName').value.trim();
    if (!name) return alert("Enter group name");

    await addDoc(collection(db, "groups"), {
        name,
        photo: selectedGroupPhotoBase64 || '',
        owner: currentUser.uid,
        createdAt: Date.now()
    });
    alert("Group created!");
    closeModal('groupModal');
};

// Comments Modal System
window.openCommentsModal = function(postId) {
    activeCommentPostId = postId;
    activeReplyToCommentId = null;
    document.getElementById('commentsModal').style.display = 'flex';
    renderCommentsList();
};

window.closeCommentsModal = function() {
    document.getElementById('commentsModal').style.display = 'none';
};

function renderCommentsList() {
    const listContainer = document.getElementById('commentsListContainer');
    const post = postsData.find(p => p.id === activeCommentPostId);
    if (!post || !post.comments || post.comments.length === 0) {
        listContainer.innerHTML = '<div style="color:var(--text-muted); text-align:center;">No comments yet.</div>';
        return;
    }

    let html = '';
    post.comments.forEach(c => {
        html += `
            <div style="background:#1e293b; padding:8px 12px; border-radius:10px; margin-bottom:8px;">
                <div style="font-weight:bold; color:var(--accent-blue); font-size:12px;">${c.username}</div>
                <div style="font-size:13px;">${c.text}</div>
            </div>
        `;
    });
    listContainer.innerHTML = html;
}

window.submitComment = async function() {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if (!text || !activeCommentPostId) return;

    const postRef = doc(db, "posts", activeCommentPostId);
    const post = postsData.find(p => p.id === activeCommentPostId);

    if (!post.comments) post.comments = [];
    post.comments.push({
        id: 'c_' + Date.now(),
        username: currentUser.username,
        text: text
    });

    await updateDoc(postRef, { comments: post.comments });
    input.value = '';
    renderCommentsList();
};

// AI Assistant Response System
window.sendAIMessage = function() {
    const input = document.getElementById('aiQueryInput');
    const queryStr = input.value.trim();
    if (!queryStr) return;

    const box = document.getElementById('aiChatBox');
    box.innerHTML += `<div><strong>You:</strong> ${queryStr}</div>`;
    input.value = '';

    setTimeout(() => {
        let reply = "I am Super App AI. Direct gallery upload and real-time database are fully active!";
        const q = queryStr.toLowerCase();
        if (q.includes("hello") || q.includes("hi")) reply = `Hello ${currentUser ? currentUser.name : ''}! How can I help you?`;
        
        box.innerHTML += `<div style="color:var(--accent-green);"><strong>AI:</strong> ${reply}</div>`;
        box.scrollTop = box.scrollHeight;
    }, 400);
};

// Termux Execution Terminal
window.runJSCompiler = function(code) {
    const outputBox = document.getElementById('compilerOutput');
    if (!code.trim()) {
        outputBox.innerText = "Error: Input string empty.";
        outputBox.style.color = "#ff4d4d";
        return;
    }
    try {
        let logs = [];
        const customConsole = {
            log: (...args) => logs.push(args.join(' ')),
            error: (...args) => logs.push("Error: " + args.join(' '))
        };
        const runFn = new Function('console', code);
        runFn(customConsole);
        outputBox.innerText = logs.length > 0 ? logs.join('\n') : "Executed successfully.";
        outputBox.style.color = "#00ffcc";
    } catch (err) {
        outputBox.innerText = "Execution Error: " + err.message;
        outputBox.style.color = "#ff4d4d";
    }
};

window.searchWeather = function() {
    const city = document.getElementById('weatherCityInput').value.trim();
    const display = document.getElementById('weatherDisplay');
    if (!city) return;

    const temp = Math.floor(Math.random() * 15) + 25;
    display.innerHTML = `
        <h4 style="margin:6px 0;">City: ${city}</h4>
        <p style="font-size:20px; color:var(--accent-gold); margin:0;">${temp}°C</p>
    `;
};

window.sendDirectMessage = function() {
    const input = document.getElementById('chatMessageInput');
    const msg = input.value.trim();
    if (!msg) return;

    const box = document.getElementById('chatMessagesBox');
    box.innerHTML += `<div style="text-align:right; color:var(--accent-blue);"><b>You:</b> ${msg}</div>`;
    input.value = '';
    box.scrollTop = box.scrollHeight;
};

window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active-tab'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active-tab');
    event.currentTarget.classList.add('active');
};

window.openUploadModal = function() { document.getElementById('uploadModal').style.display = 'flex'; };
window.closeUploadModal = function() { 
    document.getElementById('uploadModal').style.display = 'none';
    selectedVideoBase64 = null;
};
window.toggleSettings = function() { 
    const m = document.getElementById('settingsModal');
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
};
window.toggleChatMenu = function() {
    const d = document.getElementById('chatMenuDropdown');
    d.style.display = d.style.display === 'block' ? 'none' : 'block';
};
window.openCreateChannelModal = function() { document.getElementById('channelModal').style.display = 'flex'; };
window.openCreateGroupModal = function() { document.getElementById('groupModal').style.display = 'flex'; };
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; };

window.sharePostLink = function(url) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        alert("Direct reel link copied to clipboard!");
    }
};
