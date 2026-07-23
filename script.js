// Firebase SDK v10.8.0
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let activeCommentPostId = null;
let selectedVideoBase64 = null;
let selectedProfilePhotoBase64 = null;
let postsData = [];
let savedVideosList = [];

function showToast(msg) {
    const toast = document.getElementById('toastNotification');
    if(!toast) return;
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    listenToReelsFeed();
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            currentUser = { uid: user.uid, email: user.email, ...userSnap.data() };
            updateProfileUI();
        } else {
            document.getElementById('onboardingModal').style.display = 'flex';
        }
    } else {
        currentUser = null;
    }
});

function requireAuth(actionCallback) {
    if (!currentUser) {
        showToast("Pehle Login ya Sign Up karein!");
        document.getElementById('authModal').style.display = 'flex';
        return false;
    }
    if (actionCallback) actionCallback();
    return true;
}

// Navigation Tabs Switcher
window.switchTab = function(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-tab'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active-tab');
    if (element) element.classList.add('active');
};

// Auth Actions
window.handleAuthAction = async function(type) {
    const email = document.getElementById('authEmailInput').value.trim();
    const password = document.getElementById('authPasswordInput').value.trim();

    if (!email || !password) return showToast("Email aur password likhein.");

    try {
        if (type === 'signup') {
            await createUserWithEmailAndPassword(auth, email, password);
            showToast("Account Ban Gaya!");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            showToast("Login Successful!");
            document.getElementById('authModal').style.display = 'none';
        }
    } catch (error) {
        showToast("Auth Error: " + error.message);
    }
};

// Profile & Onboarding
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

    if (!name || !username) return showToast("Name aur username zaroori hain.");

    const userData = {
        name,
        username: username.startsWith('@') ? username : '@' + username,
        photoUrl: selectedProfilePhotoBase64 || 'https://via.placeholder.com/150',
        walletBalance: 0,
        createdAt: Date.now()
    };

    await setDoc(doc(db, "users", auth.currentUser.uid), userData);
    currentUser = { uid: auth.currentUser.uid, email: auth.currentUser.email, ...userData };
    document.getElementById('onboardingModal').style.display = 'none';
    updateProfileUI();
};

function updateProfileUI() {
    if(!currentUser) return;
    document.getElementById('userDisplayName').innerText = currentUser.name || "User";
    document.getElementById('userHandle').innerText = currentUser.username || "@user";
    document.getElementById('userProfilePic').src = currentUser.photoUrl || "https://via.placeholder.com/100";
    document.getElementById('walletBalanceVal').innerText = "Rs. " + (currentUser.walletBalance || 0);
}

// Wallet Operations
window.handleWalletDeposit = function() {
    requireAuth(async () => {
        const amount = prompt("Enter deposit amount (Rs.):");
        if (!amount || isNaN(amount)) return;

        const newBalance = (currentUser.walletBalance || 0) + parseFloat(amount);
        await updateDoc(doc(db, "users", currentUser.uid), { walletBalance: newBalance });
        currentUser.walletBalance = newBalance;
        updateProfileUI();
        showToast("Deposit Successful!");
    });
};

window.handleWalletWithdraw = function() {
    requireAuth(async () => {
        const amount = prompt("Enter withdrawal amount (Rs.):");
        if (!amount || isNaN(amount)) return;

        if (parseFloat(amount) > (currentUser.walletBalance || 0)) {
            return showToast("Insufficient balance!");
        }

        const newBalance = currentUser.walletBalance - parseFloat(amount);
        await updateDoc(doc(db, "users", currentUser.uid), { walletBalance: newBalance });
        currentUser.walletBalance = newBalance;
        updateProfileUI();
        showToast("Withdrawal Successful!");
    });
};

// Weather Fetcher
window.fetchWeatherInfo = function() {
    const city = document.getElementById('weatherCityInput').value.trim();
    if (!city) return showToast("City name likhein.");

    fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
        .then(res => res.json())
        .then(data => {
            const current = data.current_condition[0];
            document.getElementById('weatherCityName').innerText = city.toUpperCase();
            document.getElementById('weatherTempDisplay').innerText = `${current.temp_C}°C`;
            document.getElementById('weatherDesc').innerText = current.weatherDesc[0].value;
        })
        .catch(() => showToast("City weather nahi mila."));
};

// Terminal JS Compiler
window.runJSCompiler = function(code) {
    requireAuth(() => {
        const outputBox = document.getElementById('compilerOutput');
        try {
            let logs = [];
            const customConsole = { log: (...args) => logs.push(args.join(' ')) };
            const runFn = new Function('console', code);
            runFn(customConsole);
            outputBox.innerText = logs.join('\n') || "Executed successfully.";
        } catch (err) {
            outputBox.innerText = "Error: " + err.message;
        }
    });
};

// Real-time Reels Feed
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
        container.innerHTML = `<div class="reel-card" style="display:flex; align-items:center; justify-content:center;"><h3>No Reels Published Yet</h3></div>`;
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
                        <button class="btn-subscribe" onclick="requireAuth()">Subscribe</button>
                    </div>
                    <div class="video-title">${post.description || ''}</div>
                </div>
                <div class="action-sidebar">
                    <img src="${post.userPhoto || 'https://via.placeholder.com/40'}" class="avatar" style="margin-bottom:10px;">
                    <button class="action-btn" onclick="toggleLikePost('${post.id}')">
                        <i class="fa-solid fa-heart" style="color:${isLiked ? '#e91e63' : '#fff'}"></i>
                        <span>${post.likesCount || 0}</span>
                    </button>
                    <button class="action-btn" onclick="openCommentsModal('${post.id}')">
                        <i class="fa-solid fa-comment"></i>
                        <span>${post.comments ? post.comments.length : 0}</span>
                    </button>
                    <button class="action-btn" onclick="downloadVideoOffline('${post.id}')">
                        <i class="fa-solid fa-download"></i>
                        <span>Save</span>
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Download Video Offline
window.downloadVideoOffline = function(postId) {
    const post = postsData.find(p => p.id === postId);
    if (!post) return;

    if (savedVideosList.length >= 100) {
        savedVideosList.shift(); // Max 100 limit
    }

    savedVideosList.push(post);
    showToast("Video Saved in Profile!");
    renderSavedVideos();
};

function renderSavedVideos() {
    const box = document.getElementById('savedVideosContainer');
    if (!box) return;

    let html = '';
    savedVideosList.forEach(p => {
        html += `<div style="background:#0f172a; padding:8px; border-radius:6px; margin-top:5px; text-align:left;">
            <span>${p.description || 'Saved Reel'}</span>
        </div>`;
    });
    box.innerHTML = html || '<p style="color:#aaa;">No saved videos.</p>';
}

// Upload Modal
window.openUploadModal = function() { requireAuth(() => { document.getElementById('uploadModal').style.display = 'flex'; }); };
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
        if (!selectedVideoBase64) return showToast("Video choose karein.");

        const description = document.getElementById('videoDescriptionInput').value.trim();
        const filter = document.getElementById('videoEffectFilter').value;

        const newPost = {
            userId: currentUser.uid,
            username: currentUser.username,
            userPhoto: currentUser.photoUrl,
            videoUrl: selectedVideoBase64,
            description,
            filter,
            likes: {},
            likesCount: 0,
            comments: [],
            createdAt: Date.now()
        };

        await addDoc(collection(db, "posts"), newPost);
        showToast("Video Published!");
        closeUploadModal();
    });
};

// General Helper Modals
window.toggleSettings = function() { const m = document.getElementById('settingsModal'); m.style.display = m.style.display === 'flex' ? 'none' : 'flex'; };
window.openNotifications = function() { showToast("No new notifications."); };
window.handleLogout = function() { signOut(auth).then(() => location.reload()); };
window.closeUploadModal = function() { document.getElementById('uploadModal').style.display = 'none'; };
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; };
