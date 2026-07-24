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
    onSnapshot, 
    query, 
    where, 
    orderBy, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytesResumable, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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
const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence);

let currentUser = null;
let activeCommentPostId = null;
let selectedFile = null;
let isVideoFile = true;
let selectedEditPhotoFile = null;
let postsData = [];
let mediaRecorder = null;
let audioChunks = [];

function showToastBanner(msg) {
    const toast = document.getElementById('toastNotification');
    if(!toast) return;
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

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
                bio: 'Hey there! Using Super App',
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
        showToastBanner("Pehle Sign In/Log In karein.");
        document.getElementById('authModal').style.display = 'flex';
        return false;
    }
    return true;
}

document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    listenToReelsFeed();
    listenToTextPosts();
    listenToGlobalChat();
    listenToChannels();
});

function setupEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.currentTarget.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-tab'));
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

            document.getElementById(targetTab).classList.add('active-tab');
            e.currentTarget.classList.add('active');
        });
    });

    document.getElementById('centerPlusBtn').addEventListener('click', () => {
        if(checkUserLoggedIn()) document.getElementById('uploadModal').style.display = 'flex';
    });

    document.getElementById('loginSubmitBtn').addEventListener('click', () => handleAuthAction('login'));
    document.getElementById('signupSubmitBtn').addEventListener('click', () => handleAuthAction('signup'));
    document.getElementById('guestContinueBtn').addEventListener('click', () => document.getElementById('authModal').style.display = 'none');

    document.getElementById('chooseVideoBtn').addEventListener('click', () => document.getElementById('galleryVideoInput').click());
    document.getElementById('galleryVideoInput').addEventListener('change', handleMediaFileSelected);
    document.getElementById('publishVideoBtn').addEventListener('click', publishMediaPost);
    document.getElementById('closeUploadBtn').addEventListener('click', () => document.getElementById('uploadModal').style.display = 'none');

    document.getElementById('publishTextPostBtn').addEventListener('click', publishTextPost);

    document.getElementById('settingsMenuBtn').addEventListener('click', () => document.getElementById('settingsModal').style.display = 'flex');
    document.getElementById('closeSettingsBtn').addEventListener('click', () => document.getElementById('settingsModal').style.display = 'none');
    document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth).then(() => location.reload()));

    document.getElementById('openWithdrawPageBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').style.display = 'none';
        document.getElementById('withdrawalModal').style.display = 'flex';
    });
    document.getElementById('closeWithdrawBtn').addEventListener('click', () => document.getElementById('withdrawalModal').style.display = 'none');
    document.getElementById('confirmWithdrawBtn').addEventListener('click', processWithdrawal);

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
        selectedEditPhotoFile = e.target.files[0];
        if(selectedEditPhotoFile) {
            document.getElementById('editProfilePicPreview').src = URL.createObjectURL(selectedEditPhotoFile);
        }
    });
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfileChanges);

    document.getElementById('walletDepositBtn').addEventListener('click', handleWalletDeposit);

    document.getElementById('marketPairSelect').addEventListener('change', (e) => {
        const symbol = e.target.value;
        document.getElementById('tradingViewIframe').src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=${encodeURIComponent(symbol)}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC`;
    });

    document.getElementById('searchWeatherBtn').addEventListener('click', fetchWeatherInfo);

    document.getElementById('subBtnChats').addEventListener('click', () => {
        document.getElementById('subBtnChats').classList.add('active');
        document.getElementById('subBtnChannels').classList.remove('active');
        document.getElementById('directChatsView').style.display = 'block';
        document.getElementById('channelsView').style.display = 'none';
    });

    document.getElementById('subBtnChannels').addEventListener('click', () => {
        document.getElementById('subBtnChannels').classList.add('active');
        document.getElementById('subBtnChats').classList.remove('active');
        document.getElementById('directChatsView').style.display = 'none';
        document.getElementById('channelsView').style.display = 'block';
    });

    document.getElementById('sendMessageBtn').addEventListener('click', sendChatMessage);
    document.getElementById('saveChannelBtn').addEventListener('click', createChannelInPage);

    document.getElementById('micRecordBtn').addEventListener('click', handleMicrophoneRecord);

    document.getElementById('closeCommentsBtn').addEventListener('click', () => document.getElementById('commentsModal').style.display = 'none');
    document.getElementById('submitCommentBtn').addEventListener('click', submitComment);
}

async function handleAuthAction(type) {
    const email = document.getElementById('authEmailInput').value.trim();
    const password = document.getElementById('authPasswordInput').value.trim();

    if (!email || !password) return showToastBanner("Email aur Password likhein.");

    try {
        if (type === 'signup') {
            await createUserWithEmailAndPassword(auth, email, password);
            showToastBanner("Account Ban Gaya!");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            showToastBanner("Login Successful!");
        }
        document.getElementById('authModal').style.display = 'none';
    } catch (error) {
        showToastBanner("Auth Error: " + error.message);
    }
}

async function saveProfileChanges() {
    const name = document.getElementById('editNameInput').value.trim();
    const username = document.getElementById('editUsernameInput').value.trim();
    const bio = document.getElementById('editBioInput').value.trim();

    if (!name || !username) return showToastBanner("Name aur Username add karein.");

    let photoUrl = currentUser ? currentUser.photoUrl : 'https://via.placeholder.com/150';

    if (selectedEditPhotoFile) {
        const fileRef = ref(storage, `avatars/${currentUser.uid}_${Date.now()}`);
        await uploadBytesResumable(fileRef, selectedEditPhotoFile);
        photoUrl = await getDownloadURL(fileRef);
    }

    const updatedData = {
        name,
        username: username.startsWith('@') ? username : '@' + username,
        bio,
        photoUrl
    };

    if(currentUser) {
        await updateDoc(doc(db, "users", currentUser.uid), updatedData);
        currentUser = { ...currentUser, ...updatedData };
        updateProfileUI();
    }
    document.getElementById('editProfileModal').style.display = 'none';
    showToastBanner("Profile Update Ho Gayi!");
}

function updateProfileUI() {
    if(!currentUser) return;
    document.getElementById('userDisplayName').innerText = currentUser.name || "User";
    document.getElementById('userHandle').innerText = currentUser.username || "@user";
    document.getElementById('userBioText').innerText = currentUser.bio || "No bio added yet.";
    document.getElementById('userProfilePic').src = currentUser.photoUrl || "https://via.placeholder.com/100";
    document.getElementById('walletBalanceVal').innerText = "Rs. " + (currentUser.walletBalance || 0);
}

async function handleWalletDeposit() {
    if(!checkUserLoggedIn()) return;
    const amount = prompt("Deposit amount (Rs.):");
    if (!amount || isNaN(amount)) return;

    const newBalance = (currentUser.walletBalance || 0) + parseFloat(amount);
    await updateDoc(doc(db, "users", currentUser.uid), { walletBalance: newBalance });
    currentUser.walletBalance = newBalance;
    updateProfileUI();
    showToastBanner("Deposit Successful!");
}

async function processWithdrawal() {
    if(!checkUserLoggedIn()) return;
    const method = document.getElementById('withdrawMethodSelect').value;
    const accNum = document.getElementById('withdrawAccountNum').value.trim();
    const amount = parseFloat(document.getElementById('withdrawAmountVal').value);

    if(!accNum || isNaN(amount) || amount <= 0) return showToastBanner("Sahi details add karein.");

    if (amount > (currentUser.walletBalance || 0)) return showToastBanner("Balance kam hai!");

    const newBalance = currentUser.walletBalance - amount;
    await updateDoc(doc(db, "users", currentUser.uid), { walletBalance: newBalance });
    currentUser.walletBalance = newBalance;
    updateProfileUI();

    document.getElementById('withdrawalModal').style.display = 'none';
    showToastBanner(`Withdrawal Request (${method}) Done!`);
}

function handleMediaFileSelected(event) {
    selectedFile = event.target.files[0];
    if (!selectedFile) return;

    isVideoFile = selectedFile.type.startsWith('video');
    const objectUrl = URL.createObjectURL(selectedFile);

    if (isVideoFile) {
        document.getElementById('previewVideoTag').src = objectUrl;
        document.getElementById('previewVideoTag').style.display = 'block';
        document.getElementById('previewImageTag').style.display = 'none';
    } else {
        document.getElementById('previewImageTag').src = objectUrl;
        document.getElementById('previewImageTag').style.display = 'block';
        document.getElementById('previewVideoTag').style.display = 'none';
    }
    document.getElementById('videoPreviewContainer').style.display = 'block';
}

async function publishMediaPost() {
    if(!checkUserLoggedIn()) return;
    if (!selectedFile) return showToastBanner("Media File select karein.");

    const description = document.getElementById('videoDescriptionInput').value.trim();
    const speed = document.getElementById('videoSpeedSelect').value;
    const allowLikes = document.getElementById('toggleLikesPost').checked;
    const allowComments = document.getElementById('toggleCommentsPost').checked;

    const progressBar = document.getElementById('uploadProgressBar');
    const progressFill = document.getElementById('uploadProgressFill');
    progressBar.style.display = 'block';

    const storageRef = ref(storage, `media/${Date.now()}_${selectedFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressFill.style.width = progress + '%';
        }, 
        (error) => {
            showToastBanner("Upload Error: " + error.message);
            progressBar.style.display = 'none';
        }, 
        async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            await addDoc(collection(db, "posts"), {
                userId: currentUser.uid,
                username: currentUser.username,
                userPhoto: currentUser.photoUrl,
                mediaUrl: downloadURL,
                isVideo: isVideoFile,
                speed,
                description,
                allowLikes,
                allowComments,
                likes: {},
                likesCount: 0,
                comments: [],
                createdAt: Date.now()
            });

            progressBar.style.display = 'none';
            document.getElementById('uploadModal').style.display = 'none';
            document.getElementById('videoPreviewContainer').style.display = 'none';
            selectedFile = null;
            showToastBanner("Media Upload Completed Permanently!");
            loadMyVideosGrid();
        }
    );
}

function listenToReelsFeed() {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        postsData = [];
        snapshot.forEach((docSnap) => postsData.push({ id: docSnap.id, ...docSnap.data() }));
        renderReelsUI();
    });
}

function renderReelsUI() {
    const container = document.getElementById('reelsFeedContainer');
    if (!container) return;

    if (postsData.length === 0) {
        container.innerHTML = `<div style="padding:40px; text-align:center; color:#aaa;">No video posts available yet. Upload using (+) button.</div>`;
        return;
    }

    let html = '';
    postsData.forEach((post) => {
        const isLiked = post.likes && currentUser && post.likes[currentUser.uid];
        const isVideo = post.isVideo !== false;

        html += `
            <div class="reel-card">
                <div class="video-container">
                    ${isVideo ? `<video src="${post.mediaUrl}" loop playsinline onclick="this.paused ? this.play() : this.pause()"></video>` : `<img src="${post.mediaUrl}">`}
                </div>
                <div class="video-overlay">
                    <div class="channel-info">
                        <img src="${post.userPhoto || 'https://via.placeholder.com/40'}" class="avatar">
                        <span class="username">${post.username || '@user'}</span>
                    </div>
                    <div class="video-title">${post.description || ''}</div>
                </div>
                <div class="action-sidebar">
                    ${post.allowLikes !== false ? `
                    <button class="action-btn" data-action="like" data-id="${post.id}">
                        <i class="fa-solid fa-heart" style="color:${isLiked ? '#ec4899' : '#fff'}"></i>
                        <span>${post.likesCount || 0}</span>
                    </button>` : ''}
                    ${post.allowComments !== false ? `
                    <button class="action-btn" data-action="comment" data-id="${post.id}">
                        <i class="fa-solid fa-comment"></i>
                        <span>${post.comments ? post.comments.length : 0}</span>
                    </button>` : ''}
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
        });
    });
}

async function publishTextPost() {
    if(!checkUserLoggedIn()) return;
    const text = document.getElementById('textPostInput').value.trim();
    if(!text) return showToastBanner("Post message likhein.");

    await addDoc(collection(db, "textPosts"), {
        userId: currentUser.uid,
        username: currentUser.username,
        userPhoto: currentUser.photoUrl,
        text,
        createdAt: Date.now()
    });

    document.getElementById('textPostInput').value = '';
    showToastBanner("Text Post Published!");
}

function listenToTextPosts() {
    const q = query(collection(db, "textPosts"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const box = document.getElementById('textPostsContainer');
        if(!box) return;

        let html = '';
        snapshot.forEach((docSnap) => {
            const p = docSnap.data();
            html += `<div style="background:#111827; padding:12px; border-radius:8px; margin-bottom:10px; border:1px solid #1f2937;">
                <b style="color:var(--accent-blue);">${p.username}:</b>
                <p style="margin-top:6px; font-size:14px;">${p.text}</p>
            </div>`;
        });
        box.innerHTML = html || '<p style="color:#aaa;">No text posts yet.</p>';
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
        html += `<div style="background:#070a12; padding:8px; border-radius:6px; margin-bottom:6px;">
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
        html += `<div class="user-video-item">${p.isVideo !== false ? `<video src="${p.mediaUrl}"></video>` : `<img src="${p.mediaUrl}">`}</div>`;
    });
    box.innerHTML = html || '<p style="color:#aaa; grid-column:span 3;">No media uploaded.</p>';
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
            html += `<div style="text-align:${isMe ? 'right' : 'left'}; margin-bottom:10px;">
                <span style="font-size:10px; color:var(--accent-blue);">${m.username}:</span><br>
                <div style="display:inline-block; background:${isMe ? 'var(--accent-pink)' : '#1f2937'}; color:#fff; padding:8px 12px; border-radius:12px; font-size:13px; max-width:85%;">
                    ${m.isVoice ? `<audio controls src="${m.voiceUrl}" style="max-width:200px; height:32px;"></audio>` : m.text}
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

async function handleMicrophoneRecord() {
    if(!checkUserLoggedIn()) return;

    if (!mediaRecorder) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const audioRef = ref(storage, `voices/${Date.now()}_voice.mp3`);
                
                showToastBanner("Uploading Voice Note...");
                await uploadBytesResumable(audioRef, audioBlob);
                const voiceUrl = await getDownloadURL(audioRef);

                await addDoc(collection(db, "messages"), {
                    userId: currentUser.uid,
                    username: currentUser.username,
                    voiceUrl,
                    isVoice: true,
                    createdAt: Date.now()
                });

                showToastBanner("Voice Note Sent!");
            };

            mediaRecorder.start();
            document.getElementById('recordingStatus').style.display = 'block';
        } catch (err) {
            showToastBanner("Microphone Access Denied!");
        }
    } else {
        mediaRecorder.stop();
        mediaRecorder = null;
        document.getElementById('recordingStatus').style.display = 'none';
    }
}

async function createChannelInPage() {
    if(!checkUserLoggedIn()) return;
    const name = document.getElementById('channelNameInput').value.trim();
    const desc = document.getElementById('channelDescInput').value.trim();

    if(!name) return showToastBanner("Channel Title likhein.");

    await addDoc(collection(db, "channels"), {
        name,
        desc,
        createdBy: currentUser.uid,
        createdAt: Date.now()
    });

    document.getElementById('channelNameInput').value = '';
    document.getElementById('channelDescInput').value = '';
    showToastBanner("Channel Created Successfully!");
}

function listenToChannels() {
    const q = query(collection(db, "channels"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const box = document.getElementById('channelsListContainer');
        if(!box) return;

        let html = '';
        snapshot.forEach((docSnap) => {
            const ch = docSnap.data();
            html += `<div style="background:#111827; padding:12px; border-radius:8px; margin-bottom:8px; border:1px solid #1f2937;">
                <b style="color:var(--accent-pink);">${ch.name}</b>
                <p style="font-size:12px; color:#aaa; margin-top:4px;">${ch.desc || 'Public Channel'}</p>
            </div>`;
        });
        box.innerHTML = html || '<p style="color:#aaa;">No Channels Available.</p>';
    });
}

function fetchWeatherInfo() {
    const city = document.getElementById('weatherCityInput').value.trim();
    if (!city) return showToastBanner("City name add karein.");

    fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
        .then(res => res.json())
        .then(data => {
            const current = data.current_condition[0];
            document.getElementById('weatherCityName').innerText = city.toUpperCase();
            document.getElementById('weatherTempDisplay').innerText = `${current.temp_C}°C`;
            document.getElementById('weatherDesc').innerText = current.weatherDesc[0].value;
        })
        .catch(() => showToastBanner("Weather info fetch nahi ho saki."));
}
