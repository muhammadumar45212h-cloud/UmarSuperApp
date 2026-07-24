import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    setPersistence, 
    browserLocalPersistence, 
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
    getDocs, 
    deleteDoc, 
    onSnapshot, 
    query, 
    where, 
    orderBy, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Force local persistent login
setPersistence(auth, browserLocalPersistence);

let currentUser = null;
let activeCommentPostId = null;
let selectedVideoBase64 = null;
let selectedEditPhotoBase64 = null;
let postsData = [];
let savedVideosList = [];

function showToast(msg) {
    const toast = document.getElementById('toastNotification');
    if(!toast) return;
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// Global Auth State Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            currentUser = { uid: user.uid, email: user.email, ...userSnap.data() };
        } else {
            const defaultUser = {
                name: user.email.split('@')[0],
                username: '@' + user.email.split('@')[0],
                photoUrl: 'https://via.placeholder.com/150',
                bio: 'Hey there! Using Umar Super App',
                walletBalance: 0,
                createdAt: Date.now()
            };
            await setDoc(doc(db, "users", user.uid), defaultUser);
            currentUser = { uid: user.uid, email: user.email, ...defaultUser };
        }
        updateProfileUI();
        loadMyVideosGrid();
    } else {
        currentUser = null;
    }
});

function checkUserLoggedIn() {
    if (!currentUser && !auth.currentUser) {
        showToast("Pehle Login ya Sign Up karein!");
        document.getElementById('authModal').style.display = 'flex';
        return false;
    }
    return true;
}

document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    listenToReelsFeed();
    listenToGlobalChat();
    listenToChannels();
});

function setupEventListeners() {
    // Navigation Tabs Switcher
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.currentTarget.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-tab'));
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

            document.getElementById(targetTab).classList.add('active-tab');
            e.currentTarget.classList.add('active');
        });
    });

    // CENTER (+) BUTTON FOR UPLOAD
    document.getElementById('centerPlusBtn').addEventListener('click', () => {
        if(checkUserLoggedIn()) {
            document.getElementById('uploadModal').style.display = 'flex';
        }
    });

    // Auth Buttons
    document.getElementById('loginSubmitBtn').addEventListener('click', () => handleAuthAction('login'));
    document.getElementById('signupSubmitBtn').addEventListener('click', () => handleAuthAction('signup'));
    document.getElementById('guestContinueBtn').addEventListener('click', () => {
        document.getElementById('authModal').style.display = 'none';
    });

    // Upload Reel Triggers
    document.getElementById('chooseVideoBtn').addEventListener('click', () => document.getElementById('galleryVideoInput').click());
    document.getElementById('galleryVideoInput').addEventListener('change', handleVideoFileSelected);
    document.getElementById('publishVideoBtn').addEventListener('click', publishVideoPost);
    document.getElementById('closeUploadBtn').addEventListener('click', () => document.getElementById('uploadModal').style.display = 'none');

    // Settings Modal
    document.getElementById('settingsMenuBtn').addEventListener('click', () => document.getElementById('settingsModal').style.display = 'flex');
    document.getElementById('closeSettingsBtn').addEventListener('click', () => document.getElementById('settingsModal').style.display = 'none');
    document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth).then(() => location.reload()));

    // Profile Edit Triggers
    document.getElementById('editProfileOpenBtn').addEventListener('click', () => {
        if(!checkUserLoggedIn()) return;
        document.getElementById('editNameInput').value = currentUser.name || '';
        document.getElementById('editUsernameInput').value = currentUser.username || '';
        document.getElementById('editBioInput').value = currentUser.bio || '';
        document.getElementById('editProfilePicPreview').src = currentUser.photoUrl || 'https://via.placeholder.com/100';
        document.getElementById('editProfileModal').style.display = 'flex';
    });
    document.getElementById('closeEditProfileBtn').addEventListener('click', () => document.getElementById('editProfileModal').style.display = 'none');
    document.getElementById('changePhotoBtn').addEventListener('click', () => document.getElementById('editPhotoInput').click());
    document.getElementById('editPhotoInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            selectedEditPhotoBase64 = evt.target.result;
            document.getElementById('editProfilePicPreview').src = selectedEditPhotoBase64;
        };
        reader.readAsDataURL(file);
    });
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfileChanges);

    // Wallet Handlers
    document.getElementById('walletDepositBtn').addEventListener('click', handleWalletDeposit);
    document.getElementById('walletWithdrawBtn').addEventListener('click', handleWalletWithdraw);

    // Forex Pair Selection
    document.getElementById('marketPairSelect').addEventListener('change', (e) => {
        const symbol = e.target.value;
        document.getElementById('tradingViewIframe').src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=${encodeURIComponent(symbol)}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC`;
    });

    // Weather Search
    document.getElementById('searchWeatherBtn').addEventListener('click', fetchWeatherInfo);

    // Terminal JS Runner
    document.getElementById('runCodeBtn').addEventListener('click', () => {
        runJSCompiler(document.getElementById('terminalCodeInput').value);
    });

    // Chat Tab Switching
    document.getElementById('subBtnChats').addEventListener('click', () => {
        document.getElementById('subBtnChats').classList.add('active');
        document.getElementById('subBtnChannels').classList.remove('active');
        document.getElementById('directChats').style.display = 'block';
        document.getElementById('channelsTab').style.display = 'none';
    });

    document.getElementById('subBtnChannels').addEventListener('click', () => {
        document.getElementById('subBtnChannels').classList.add('active');
        document.getElementById('subBtnChats').classList.remove('active');
        document.getElementById('directChats').style.display = 'none';
        document.getElementById('channelsTab').style.display = 'block';
    });

    // Send Message
    document.getElementById('sendMessageBtn').addEventListener('click', sendChatMessage);
    document.getElementById('createChannelBtn').addEventListener('click', createChannelPrompt);

    // Voice Message Preview & Call Actions
    document.getElementById('micRecordBtn').addEventListener('click', toggleVoiceRecord);
    document.getElementById('cancelVoiceBtn').addEventListener('click', () => document.getElementById('voicePreviewBox').style.display = 'none');
    document.getElementById('voiceCallBtn').addEventListener('click', () => showToast("Calling Voice..."));
    document.getElementById('videoCallBtn').addEventListener('click', () => showToast("Calling Video..."));

    // Comments Modal Close
    document.getElementById('closeCommentsBtn').addEventListener('click', () => document.getElementById('commentsModal').style.display = 'none');
    document.getElementById('submitCommentBtn').addEventListener('click', submitComment);
}

// Auth Actions
async function handleAuthAction(type) {
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
        }
        document.getElementById('authModal').style.display = 'none';
    } catch (error) {
        showToast("Auth Error: " + error.message);
    }
}

// Profile Save & Update
async function saveProfileChanges() {
    const name = document.getElementById('editNameInput').value.trim();
    const username = document.getElementById('editUsernameInput').value.trim();
    const bio = document.getElementById('editBioInput').value.trim();

    if (!name || !username) return showToast("Name aur username zaroori hain.");

    const updatedData = {
        name,
        username: username.startsWith('@') ? username : '@' + username,
        bio,
        photoUrl: selectedEditPhotoBase64 || (currentUser ? currentUser.photoUrl : 'https://via.placeholder.com/150')
    };

    if(currentUser) {
        await updateDoc(doc(db, "users", currentUser.uid), updatedData);
        currentUser = { ...currentUser, ...updatedData };
        updateProfileUI();
    }
    document.getElementById('editProfileModal').style.display = 'none';
    showToast("Profile Updated!");
}

function updateProfileUI() {
    if(!currentUser) return;
    document.getElementById('userDisplayName').innerText = currentUser.name || "User";
    document.getElementById('userHandle').innerText = currentUser.username || "@user";
    document.getElementById('userBioText').innerText = currentUser.bio || "No bio added yet.";
    document.getElementById('userProfilePic').src = currentUser.photoUrl || "https://via.placeholder.com/100";
    document.getElementById('walletBalanceVal').innerText = "Rs. " + (currentUser.walletBalance || 0);
}

// Wallet
async function handleWalletDeposit() {
    if(!checkUserLoggedIn()) return;
    const amount = prompt("Enter deposit amount (Rs.):");
    if (!amount || isNaN(amount)) return;

    const newBalance = (currentUser.walletBalance || 0) + parseFloat(amount);
    await updateDoc(doc(db, "users", currentUser.uid), { walletBalance: newBalance });
    currentUser.walletBalance = newBalance;
    updateProfileUI();
    showToast("Deposit Successful!");
}

async function handleWalletWithdraw() {
    if(!checkUserLoggedIn()) return;
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
}

// Reels Feed Logic
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
                    </div>
                    <div class="video-title">${post.description || ''}</div>
                </div>
                <div class="action-sidebar">
                    <img src="${post.userPhoto || 'https://via.placeholder.com/40'}" class="avatar" style="margin-bottom:10px;">
                    <button class="action-btn" data-action="like" data-id="${post.id}">
                        <i class="fa-solid fa-heart" style="color:${isLiked ? '#e91e63' : '#fff'}"></i>
                        <span>${post.likesCount || 0}</span>
                    </button>
                    <button class="action-btn" data-action="comment" data-id="${post.id}">
                        <i class="fa-solid fa-comment"></i>
                        <span>${post.comments ? post.comments.length : 0}</span>
                    </button>
                    <button class="action-btn" data-action="save" data-id="${post.id}">
                        <i class="fa-solid fa-download"></i>
                        <span>Save</span>
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;

    container.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.getAttribute('data-action');
            const postId = e.currentTarget.getAttribute('data-id');

            if (action === 'like') toggleLikePost(postId);
            if (action === 'comment') openCommentsModal(postId);
            if (action === 'save') downloadVideoOffline(postId);
        });
    });
}

async function toggleLikePost(postId) {
    if(!checkUserLoggedIn()) return;
    const postRef = doc(db, "posts", postId);
    const post = postsData.find(p => p.id === postId);
    if (!post) return;

    const likes = post.likes || {};
    if (likes[currentUser.uid]) {
        delete likes[currentUser.uid];
    } else {
        likes[currentUser.uid] = true;
    }

    const likesCount = Object.keys(likes).length;
    await updateDoc(postRef, { likes, likesCount });
}

function openCommentsModal(postId) {
    activeCommentPostId = postId;
    document.getElementById('commentsModal').style.display = 'flex';
    renderCommentsList();
}

function renderCommentsList() {
    const post = postsData.find(p => p.id === activeCommentPostId);
    const box = document.getElementById('commentsListContainer');
    if (!post || !box) return;

    let html = '';
    (post.comments || []).forEach(c => {
        html += `<div style="background:#0f172a; padding:6px 10px; border-radius:6px; margin-bottom:6px; text-align:left;">
            <b style="color:var(--accent-blue);">${c.username}:</b> ${c.text}
        </div>`;
    });
    box.innerHTML = html || '<p style="color:#aaa;">No comments yet.</p>';
}

async function submitComment() {
    if(!checkUserLoggedIn()) return;
    const text = document.getElementById('commentInput').value.trim();
    if(!text || !activeCommentPostId) return;

    const postRef = doc(db, "posts", activeCommentPostId);
    const post = postsData.find(p => p.id === activeCommentPostId);
    const comments = post.comments || [];

    comments.push({
        userId: currentUser.uid,
        username: currentUser.username,
        text,
        createdAt: Date.now()
    });

    await updateDoc(postRef, { comments });
    document.getElementById('commentInput').value = '';
    renderCommentsList();
}

async function loadMyVideosGrid() {
    if(!currentUser) return;
    const q = query(collection(db, "posts"), where("userId", "==", currentUser.uid));
    const snap = await getDocs(q);
    const box = document.getElementById('myVideosGrid');
    if(!box) return;

    let html = '';
    snap.forEach((docSnap) => {
        const p = docSnap.data();
        html += `
            <div class="user-video-item">
                <video src="${p.videoUrl}"></video>
                <button class="delete-video-btn" data-deleteid="${docSnap.id}">Delete</button>
            </div>
        `;
    });
    box.innerHTML = html || '<p style="color:#aaa; grid-column:span 3;">No uploaded videos.</p>';

    box.querySelectorAll('.delete-video-btn').forEach(b => {
        b.addEventListener('click', async (e) => {
            const deleteId = e.target.getAttribute('data-deleteid');
            await deleteDoc(doc(db, "posts", deleteId));
            showToast("Video Deleted!");
            loadMyVideosGrid();
        });
    });
}

function downloadVideoOffline(postId) {
    const post = postsData.find(p => p.id === postId);
    if (!post) return;

    if (savedVideosList.length >= 100) savedVideosList.shift();
    savedVideosList.push(post);
    showToast("Video Saved in Settings!");
    renderSavedVideos();
}

function renderSavedVideos() {
    const box = document.getElementById('savedVideosContainer');
    if (!box) return;

    let html = '';
    savedVideosList.forEach(p => {
        html += `<div style="background:#1e293b; padding:8px; border-radius:6px; margin-top:5px; text-align:left;">
            <span>${p.description || 'Saved Reel'}</span>
        </div>`;
    });
    box.innerHTML = html || '<p style="color:#aaa;">No saved videos.</p>';
}

function handleVideoFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        selectedVideoBase64 = e.target.result;
        document.getElementById('previewVideoTag').src = selectedVideoBase64;
        document.getElementById('videoPreviewContainer').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

async function publishVideoPost() {
    if(!checkUserLoggedIn()) return;
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
    document.getElementById('uploadModal').style.display = 'none';
    selectedVideoBase64 = null;
    document.getElementById('videoPreviewContainer').style.display = 'none';
    loadMyVideosGrid();
}

function listenToGlobalChat() {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    onSnapshot(q, (snapshot) => {
        const box = document.getElementById('chatMessagesBox');
        if(!box) return;

        let html = '';
        snapshot.forEach((docSnap) => {
            const m = docSnap.data();
            const isMe = currentUser && m.userId === currentUser.uid;
            html += `<div style="text-align:${isMe ? 'right' : 'left'}; margin-bottom:8px;">
                <span style="font-size:10px; color:var(--accent-blue);">${m.username}:</span><br>
                <div style="display:inline-block; background:${isMe ? 'var(--accent-pink)' : '#1e293b'}; color:#fff; padding:6px 12px; border-radius:12px; font-size:13px; max-width:80%;">
                    ${m.isVoice ? '🎤 <span style="letter-spacing:2px;">∆|||||||||•••</span> Voice Message' : m.text}
                </div>
            </div>`;
        });
        box.innerHTML = html;
        box.scrollTop = box.scrollHeight;
    });
}

async function sendChatMessage() {
    if(!checkUserLoggedIn()) return;
    const input = document.getElementById('chatMessageInput');
    const text = input.value.trim();
    if(!text) return;

    await addDoc(collection(db, "messages"), {
        userId: currentUser.uid,
        username: currentUser.username,
        text,
        isVoice: false,
        createdAt: Date.now()
    });

    input.value = '';
}

function toggleVoiceRecord() {
    if(!checkUserLoggedIn()) return;
    const preview = document.getElementById('voicePreviewBox');
    if (preview.style.display === 'flex') {
        addDoc(collection(db, "messages"), {
            userId: currentUser.uid,
            username: currentUser.username,
            text: 'Voice Note',
            isVoice: true,
            createdAt: Date.now()
        });
        preview.style.display = 'none';
        showToast("Voice Message Sent!");
    } else {
        preview.style.display = 'flex';
    }
}

function listenToChannels() {
    const q = query(collection(db, "channels"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const box = document.getElementById('channelsListContainer');
        if(!box) return;

        let html = '';
        snapshot.forEach((docSnap) => {
            const ch = docSnap.data();
            html += `<div style="background:#1e293b; padding:10px; border-radius:8px; margin-bottom:8px; text-align:left;">
                <b style="color:var(--accent-blue);">${ch.name}</b>
                <p style="font-size:11px; color:#aaa;">${ch.desc || 'Public Channel'}</p>
            </div>`;
        });
        box.innerHTML = html || '<p style="color:#aaa;">No Channels/Groups Created.</p>';
    });
}

async function createChannelPrompt() {
    if(!checkUserLoggedIn()) return;
    const name = prompt("Enter Channel/Group Name:");
    if(!name) return;
    const desc = prompt("Enter Channel Description:");

    await addDoc(collection(db, "channels"), {
        name,
        desc: desc || '',
        createdBy: currentUser.uid,
        createdAt: Date.now()
    });

    showToast("Channel Created!");
}

function fetchWeatherInfo() {
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
}

function runJSCompiler(code) {
    const outputBox = document.getElementById('compilerOutput');
    if(!code) {
        outputBox.innerText = "Code likhein terminal mein!";
        return;
    }
    try {
        let logs = [];
        const customConsole = { log: (...args) => logs.push(args.join(' ')) };
        const runFn = new Function('console', code);
        runFn(customConsole);
        outputBox.innerText = logs.join('\n') || "Executed successfully with no output.";
    } catch (err) {
        outputBox.innerText = "Error: " + err.message;
    }
}
