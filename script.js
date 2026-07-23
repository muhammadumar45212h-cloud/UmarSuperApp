// Import Firebase Modular SDK v10.8.0
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
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
  appId: "1:812034119197:web:60dc07304f30f29f6058f4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Application State Variables
let currentUser = null;
let activeCommentPostId = null;

let selectedVideoBase64 = null;
let selectedProfilePhotoBase64 = null;
let selectedChannelPhotoBase64 = null;
let selectedGroupPhotoBase64 = null;

let postsData = [];

// App Startup: Guest Mode Active By Default
document.addEventListener("DOMContentLoaded", () => {
    // Hide Auth modal by default so app opens directly
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.style.display = 'none';
    
    // Start loading public reels feed immediately
    listenToReelsFeed();
});

// Auth Listener - Silent Background Check
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            currentUser = { uid: user.uid, email: user.email, ...userSnap.data() };
            document.getElementById('authModal').style.display = 'none';
            document.getElementById('onboardingModal').style.display = 'none';
        } else {
            document.getElementById('authModal').style.display = 'none';
            document.getElementById('onboardingModal').style.display = 'flex';
        }
    } else {
        currentUser = null;
    }
});

// Helper Function: Check if user is logged in before allowing action
function requireAuth(actionCallback) {
    if (!currentUser) {
        alert("Please Login or Sign Up first to perform this action!");
        document.getElementById('authModal').style.display = 'flex';
        return false;
    }
    if (actionCallback) actionCallback();
    return true;
}

// Authentication Handler with Better Error Catching
window.handleAuthAction = async function(type) {
    const email = document.getElementById('authEmailInput').value.trim();
    const password = document.getElementById('authPasswordInput').value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        if (type === 'signup') {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Account created successfully!");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Login successful!");
        }
    } catch (error) {
        console.error("Auth error code:", error.code);
        if (error.code === 'auth/email-already-in-use') {
            alert("This email is already registered! Click 'Log In' instead of Sign Up.");
        } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            alert("Incorrect password or email. Please check your credentials.");
        } else if (error.code === 'auth/user-not-found') {
            alert("No account found with this email. Click 'Sign Up' to create one.");
        } else {
            alert("Auth Error: " + error.message);
        }
    }
};

// Profile Setup Handlers
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
        createdAt: Date.now()
    };

    await setDoc(doc(db, "users", auth.currentUser.uid), userData);
    currentUser = { uid: auth.currentUser.uid, email: auth.currentUser.email, ...userData };
    document.getElementById('onboardingModal').style.display = 'none';
};

window.handleLogout = function() {
    signOut(auth).then(() => location.reload());
};

// Real-Time Reels Feed Engine (Public Viewable)
function listenToReelsFeed() {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        postsData = [];
        snapshot.forEach((docSnap) => {
            postsData.push({ id: docSnap.id, ...docSnap.data() });
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

        html += `
            <div class="reel-card" id="reel-${post.id}">
                <div class="video-container">
                    <video src="${post.videoUrl}" style="filter: ${post.filter || 'none'}" loop playsinline onclick="this.paused ? this.play() : this.pause()"></video>
                </div>
                <div class="video-overlay">
                    <div class="channel-info">
                        <img src="${post.userPhoto || 'https://via.placeholder.com/40'}" class="avatar">
                        <span class="username">${post.username || '@user'}</span>
                        <button class="btn-subscribe" onclick="requireAuth()">Subscribe</button>
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
                    <button class="action-btn" onclick="sharePostLink('${post.id}')">
                        <i class="fa-solid fa-share"></i>
                        <span>Share</span>
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Protected Actions (Triggers Login Prompt if Guest)
window.toggleLikePost = function(postId) {
    requireAuth(async () => {
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
    });
};

window.openUploadModal = function() {
    requireAuth(() => {
        document.getElementById('uploadModal').style.display = 'flex';
    });
};

window.triggerGalleryVideoPicker = function() { document.getElementById('galleryVideoInput').click(); };
window.triggerCameraVideoPicker = function() { document.getElementById('cameraVideoInput').click(); };

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

window.publishVideoPost = function() {
    requireAuth(async () => {
        if (!selectedVideoBase64) return alert("Please select a video file first.");

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
        alert("Reel Published!");
        closeUploadModal();
    });
};

// Comments System
window.openCommentsModal = function(postId) {
    activeCommentPostId = postId;
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

window.submitComment = function() {
    requireAuth(async () => {
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
    });
};

// Chat & Terminal Require Login
window.sendDirectMessage = function() {
    requireAuth(() => {
        const input = document.getElementById('chatMessageInput');
        const msg = input.value.trim();
        if (!msg) return;

        const box = document.getElementById('chatMessagesBox');
        box.innerHTML += `<div style="text-align:right; color:var(--accent-blue);"><b>You:</b> ${msg}</div>`;
        input.value = '';
        box.scrollTop = box.scrollHeight;
    });
};

window.runJSCompiler = function(code) {
    requireAuth(() => {
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
    });
};

// Navigation & Modals Controls
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active-tab'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active-tab');
    if (event) event.currentTarget.classList.add('active');
};

window.closeUploadModal = function() { 
    document.getElementById('uploadModal').style.display = 'none';
    selectedVideoBase64 = null;
};

window.toggleSettings = function() { 
    const m = document.getElementById('settingsModal');
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
};

window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; };

window.sharePostLink = function(postId) {
    const url = `${window.location.origin}?reel=${postId}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        alert("Reel link copied!");
    }
};
