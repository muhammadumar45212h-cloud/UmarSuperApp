// Import Firebase Modules directly via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB9ACAxelcW-esJWUDrD5lhL_7svxlyGxc",
  authDomain: "umarsuperapp.firebaseapp.com",
  projectId: "umarsuperapp",
  storageBucket: "umarsuperapp.firebasestorage.app",
  messagingSenderId: "812034119197",
  appId: "1:812034119197:web:60dc07304f30f29f6058f4",
  measurementId: "G-T8YZKR2SRR"
};

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Global App State
let currentUser = null;
let chartInstance = null;
let isSignUpMode = true;

// DOM Element Selectors
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authFullName = document.getElementById('authFullName');
const authUsername = document.getElementById('authUsername');
const extraAuthFields = document.getElementById('extraAuthFields');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const authErrorMsg = document.getElementById('authErrorMsg');

// --- 1. AUTHENTICATION CONTROLLER ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    authModal.classList.add('hidden');
    loadUserProfile(user.uid);
    initVideoFeed();
    initTradingChart();
  } else {
    currentUser = null;
    authModal.classList.remove('hidden');
  }
});

toggleAuthMode.addEventListener('click', (e) => {
  e.preventDefault();
  isSignUpMode = !isSignUpMode;
  if (isSignUpMode) {
    authTitle.innerText = "Welcome to Umar Super App";
    extraAuthFields.classList.remove('hidden');
    authSubmitBtn.innerText = "Sign Up / Register";
  } else {
    authTitle.innerText = "Login to Your Account";
    extraAuthFields.classList.add('hidden');
    authSubmitBtn.innerText = "Login";
  }
});

authSubmitBtn.addEventListener('click', async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();
  authErrorMsg.classList.add('hidden');

  try {
    if (isSignUpMode) {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", res.user.uid), {
        fullName: authFullName.value.trim() || "User",
        username: authUsername.value.trim() || "user_" + Date.now(),
        email: email,
        walletBalance: 25400.00,
        followers: 0,
        following: 0,
        likes: 0,
        createdAt: serverTimestamp()
      });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (err) {
    authErrorMsg.innerText = err.message;
    authErrorMsg.classList.remove('hidden');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

// --- 2. USER PROFILE LOADER ---
async function loadUserProfile(uid) {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    document.getElementById('profileDisplayName').innerText = data.fullName;
    document.getElementById('profileUsername').innerText = "@" + data.username;
    document.getElementById('profileEmail').innerText = data.email;
    document.getElementById('followersCount').innerText = data.followers;
    document.getElementById('followingCount').innerText = data.following;
    document.getElementById('likesCount').innerText = data.likes;
    document.getElementById('userWalletBalance').innerText = data.walletBalance.toLocaleString();
  }
}

// --- 3. VIDEO FEED & UPLOADS ---
async function initVideoFeed() {
  const container = document.getElementById('videoContainer');
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  
  onSnapshot(q, (snapshot) => {
    container.innerHTML = "";
    if(snapshot.empty) {
      container.innerHTML = `<div style="padding:40px; text-align:center;">No videos uploaded yet. Click + to post!</div>`;
      return;
    }
    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const card = document.createElement('div');
      card.className = "video-card";
      card.innerHTML = `
        <video src="${post.videoUrl}" loop autoplay muted style="filter: ${post.filter || 'none'}"></video>
        <div class="video-overlay">
          <h4>@${post.username}</h4>
          <p>${post.description}</p>
        </div>
        <div class="video-side-actions">
          <button class="action-btn"><i class="fa-solid fa-heart"></i><span>${post.likes || 0}</span></button>
          <button class="action-btn"><i class="fa-solid fa-comment"></i><span>${post.comments || 0}</span></button>
          <button class="action-btn"><i class="fa-solid fa-share"></i><span>Share</span></button>
        </div>
      `;
      container.appendChild(card);
    });
  });
}

// Upload Form Handler
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!currentUser) return;

  const file = document.getElementById('videoFileInput').files[0];
  const desc = document.getElementById('videoDescription').value;
  const filter = document.getElementById('videoFilter').value;
  const privacy = document.getElementById('videoPrivacy').value;

  if (!file) return;

  const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);

  await addDoc(collection(db, "posts"), {
    userId: currentUser.uid,
    username: authUsername.value || "umar_user",
    videoUrl: downloadUrl,
    description: desc,
    filter: filter,
    privacy: privacy,
    likes: 0,
    comments: 0,
    createdAt: serverTimestamp()
  });

  document.getElementById('uploadModal').classList.add('hidden');
});

// --- 4. NAVIGATION & MODALS CONTROLLER ---
document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.app-section').forEach(s => s.classList.add('hidden'));
    
    btn.classList.add('active');
    const target = btn.getAttribute('data-target');
    document.getElementById(target).classList.remove('hidden');
  });
});

// Generic Modal Opener / Closers
const setupModal = (btnId, modalId, closeId) => {
  document.getElementById(btnId)?.addEventListener('click', () => document.getElementById(modalId).classList.remove('hidden'));
  document.getElementById(closeId)?.addEventListener('click', () => document.getElementById(modalId).classList.add('hidden'));
};

setupModal('openCodeBtn', 'codeModal', 'closeCodeBtn');
setupModal('openWalletBtn', 'walletModal', 'closeWalletBtn');
setupModal('openUploadBtn', 'uploadModal', 'closeUploadBtn');
setupModal('globalSearchBtn', 'searchOverlay', 'closeSearchBtn');
setupModal('menuChannelGroupBtn', 'createChannelModal', 'closeChannelModalBtn');

// --- 5. REAL-TIME MARKET CHARTS ---
function initTradingChart() {
  const chartElement = document.getElementById('tradingChart');
  if (!chartElement || chartInstance) return;

  chartInstance = LightweightCharts.createChart(chartElement, {
    layout: { backgroundColor: '#151a23', textColor: '#ffffff' },
    grid: { vertLines: { color: '#2a3447' }, horzLines: { color: '#2a3447' } },
    width: chartElement.clientWidth,
    height: 350
  });

  const lineSeries = chartInstance.addLineSeries({ color: '#e91e63', lineWidth: 2 });
  lineSeries.setData([
    { time: '2026-07-15', value: 2030.5 },
    { time: '2026-07-16', value: 2035.2 },
    { time: '2026-07-17', value: 2028.9 },
    { time: '2026-07-18', value: 2042.1 },
    { time: '2026-07-19', value: 2050.0 },
    { time: '2026-07-20', value: 2048.3 },
    { time: '2026-07-21', value: 2055.6 },
  ]);
}

// --- 6. CODE COMPILER ---
document.getElementById('runCodeBtn').addEventListener('click', () => {
  const code = document.getElementById('codeEditor').value;
  const consoleBox = document.getElementById('codeConsole');
  consoleBox.innerText = "";

  const oldLog = console.log;
  console.log = function(...args) {
    consoleBox.innerText += args.join(' ') + '\n';
    oldLog.apply(console, args);
  };

  try {
    new Function(code)();
  } catch (err) {
    consoleBox.innerText = "Error: " + err.message;
  }
});

// --- 7. AI ASSISTANT ---
document.getElementById('sendAiBtn').addEventListener('click', () => {
  const input = document.getElementById('aiInput');
  const text = input.value.trim();
  if(!text) return;

  const chatBox = document.getElementById('aiChatBox');
  chatBox.innerHTML += `<div class="message user-msg"><p>${text}</p></div>`;
  input.value = "";

  setTimeout(() => {
    chatBox.innerHTML += `<div class="message ai-msg"><p>Processing your query: "${text}". Module operational.</p></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 600);
});
