// Import Firebase Modular SDK
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

// State Variables
let currentUser = null;
let activeCommentPostId = null;
let selectedVideoBase64 = null;
let selectedProfilePhotoBase64 = null;
let postsData = [];

// Toast Notification Helper
function showToast(message) {
    const toast = document.getElementById('toastNotification');
    if(!toast) return;
    toast.innerText = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// App Startup
document.addEventListener("DOMContentLoaded", () => {
    listenToReelsFeed();
});

// Auth Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            currentUser = { uid: user.uid, email: user.email, ...userSnap.data() };
            document.getElementById('authModal').style.display = 'none';
        } else {
            document.getElementById('authModal').style.display = 'none';
            document.getElementById('onboardingModal').style.display = 'flex';
        }
    } else {
        currentUser = null;
    }
});

// Auth Guard
function requireAuth(actionCallback) {
    if (!currentUser) {
        showToast("Pehle Login ya Sign Up karein!");
        document.getElementById('authModal').style.display = 'flex';
        return false;
    }
    if (actionCallback) actionCallback();
    return true;
}

// Tabs Controller
window.switchTab = function(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-tab'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const activeContent = document.getElementById(tabId);
    if (activeContent) activeContent.classList.add('active-tab');
    if (element) element.classList.add('active');
};

// Auth Actions
window.handleAuthAction = async function(type) {
    const email = document.getElementById('authEmailInput').value.trim();
    const password = document.getElementById('authPasswordInput').value.trim();

    if (!email || !password) {
        showToast("Email aur Password dono likhein.");
        return;
    }

    try {
        if (type === 'signup') {
            await createUserWithEmailAndPassword(auth, email, password);
            showToast("Account ban gaya!");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            showToast("Login ho gaya!");
            document.getElementById('authModal').style.display = 'none';
        }
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            showToast("Email registered hai! Log In dabaayein.");
        } else if (error.code === 'auth/invalid-credential') {
            showToast("Password ya Email ghalt hai.");
        } else {
            showToast("Auth Error: " + error.message);
        }
    }
};

// Profile Setup
window.triggerProfilePhotoPicker = function() { document.getElementById('profilePhotoInput').click(); };

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
        showToast("Name aur Username required hain.");
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
    showToast("Profile Complete!");
};

// Reels Feed
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
                    <h3>No Videos Found</h3>
                    <p style="color:var(--text-muted);">(+) button se reel post karein</p>
                </div>
            </div>`;
        return;
    }

    let html = '';
    postsData.forEach((post) => {
        const isLiked = post.likes && currentUser && post.likes[currentUser.uid];

        html += `
            <div class="reel-card">
                <div class="video-container">
                    <video src="${post.videoUrl}" style="filter: ${post.filter || 'none'}" loop playsinline onclick="this.paused ? this.play() : this.pause()"></video>
                </div>
                <div class="video-overlay">
                    <div class="channel-info">
                        <img src="${post.userPhoto || 'https://via.placeholder.com/40'}" class="avatar">
                        <span class="username">${post.username || '@user'}</span>
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
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Like Post
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

// Upload Modal
window.openUploadModal = function() {
    requireAuth(() => {
        document.getElementById('uploadModal').style.display = 'flex';
    });
};

window.triggerGalleryVideoPicker = function() { document.getElementById('galleryVideoInput').click(); };

window.handleVideoFileSelected = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedVideoBase64 = e.target.result;
        document.getElementById('previewVideoTag').src = selectedVideoBase64;
        document.getElementById('videoPreviewContainer').style.display = 'block';
    };
    reader.readAsDataURL(file);
};

window.publishVideoPost = function() {
    requireAuth(async () => {
        if (!selectedVideoBase64) return showToast("Video select karein.");

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
        showToast("Video Upload Ho Gayi!");
        closeUploadModal();
    });
};

// Comments
window.openCommentsModal = function(postId) {
    activeCommentPostId = postId;
    document.getElementById('commentsModal').style.display = 'flex';
    renderCommentsList();
};

window.closeCommentsModal = function() { document.getElementById('commentsModal').style.display = 'none'; };

function renderCommentsList() {
    const listContainer = document.getElementById('commentsListContainer');
    const post = postsData.find(p => p.id === activeCommentPostId);
    if (!post || !post.comments || post.comments.length === 0) {
        listContainer.innerHTML = '<div style="color:var(--text-muted); text-align:center;">No comments.</div>';
        return;
    }

    let html = '';
    post.comments.forEach(c => {
        html += `
            <div style="background:#0f172a; padding:8px 12px; border-radius:8px; margin-bottom:8px;">
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
        post.comments.push({ id: 'c_' + Date.now(), username: currentUser.username, text: text });

        await updateDoc(postRef, { comments: post.comments });
        input.value = '';
        renderCommentsList();
    });
};

// Controls & Settings
window.sendDirectMessage = function() {
    requireAuth(() => {
        const input = document.getElementById('chatMessageInput');
        const msg = input.value.trim();
        if (!msg) return;

        const box = document.getElementById('chatMessagesBox');
        box.innerHTML += `<div style="text-align:right; color:var(--accent-blue); margin-bottom:5px;"><b>You:</b> ${msg}</div>`;
        input.value = '';
        box.scrollTop = box.scrollHeight;
    });
};

window.runJSCompiler = function(code) {
    requireAuth(() => {
        const outputBox = document.getElementById('compilerOutput');
        try {
            let logs = [];
            const customConsole = { log: (...args) => logs.push(args.join(' ')) };
            const runFn = new Function('console', code);
            runFn(customConsole);
            outputBox.innerText = logs.join('\n') || "Done.";
        } catch (err) {
            outputBox.innerText = "Error: " + err.message;
        }
    });
};

window.toggleSettings = function() {
    const m = document.getElementById('settingsModal');
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
};

window.handleLogout = function() {
    signOut(auth).then(() => location.reload());
};

window.closeUploadModal = function() { document.getElementById('uploadModal').style.display = 'none'; };
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; };
