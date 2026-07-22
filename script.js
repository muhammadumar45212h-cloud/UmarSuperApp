import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your explicit Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9ACAxelcW-esJWUDrD5lhL_7svxlyGxc",
  authDomain: "umarsuperapp.firebaseapp.com",
  projectId: "umarsuperapp",
  storageBucket: "umarsuperapp.firebasestorage.app",
  messagingSenderId: "812034119197",
  appId: "1:812034119197:web:60dc07304f30f29f6058f4",
  measurementId: "G-T8YZKR2SRR"
};

// Initialize Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserData = null;

// DOM Elements
const authOverlay = document.getElementById('authOverlay');
const appContainer = document.getElementById('appContainer');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authUsername = document.getElementById('authUsername');
const signUpBtn = document.getElementById('signUpBtn');
const loginBtn = document.getElementById('loginBtn');
const authError = document.getElementById('authError');

// Authentication Observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserData = user;
    authOverlay.classList.add('hidden');
    appContainer.classList.remove('hidden');
    initAppListeners();
  } else {
    authOverlay.classList.remove('hidden');
    appContainer.classList.add('hidden');
  }
});

// Auth Handlers
signUpBtn.addEventListener('click', async () => {
  const email = authEmail.value;
  const password = authPassword.value;
  const username = authUsername.value || 'user_' + Math.floor(Math.random()*1000);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save profile details to Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: email,
      username: username,
      avatar: "https://via.placeholder.com/100",
      createdAt: serverTimestamp()
    });
  } catch (err) {
    authError.textContent = err.message;
  }
});

loginBtn.addEventListener('click', async () => {
  try {
    await signInWithEmailAndPassword(auth, authEmail.value, authPassword.value);
  } catch (err) {
    authError.textContent = err.message;
  }
});

// App Initialization
function initAppListeners() {
  setupNavigation();
  setupVideoFeed();
  setupAIChat();
  setupCodeTerminal();
  setupUploadModal();
  setupWeatherModal();
}

// Navigation Handler
function setupNavigation() {
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
      const activeSection = document.getElementById(`view-${view}`);
      if(activeSection) activeSection.classList.remove('hidden');
    });
  });
}

// Real-Time Video Feed via Firestore
function setupVideoFeed() {
  const feedContainer = document.getElementById('videoFeed');
  const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(postsQuery, (snapshot) => {
    feedContainer.innerHTML = '';
    if (snapshot.empty) {
      feedContainer.innerHTML = `<div style="padding:40px; text-align:center;">No videos published yet! Tap '+' to post.</div>`;
      return;
    }

    snapshot.forEach(docSnap => {
      const post = docSnap.data();
      const card = document.createElement('div');
      card.className = 'video-card';
      
      card.innerHTML = `
        <video src="${post.videoUrl}" loop playsinline onclick="this.paused ? this.play() : this.pause()"></video>
        <div class="video-sidebar">
          <button class="action-btn"><i class="fa-solid fa-heart"></i><span>${post.likes || 0}</span></button>
          <button class="action-btn"><i class="fa-solid fa-comment"></i><span>${post.comments || 0}</span></button>
          <button class="action-btn"><i class="fa-solid fa-share"></i><span>Share</span></button>
        </div>
        <div class="video-overlay-info">
          <h4>@${post.username || 'anonymous'}</h4>
          <p>${post.description || ''}</p>
        </div>
      `;
      feedContainer.appendChild(card);
    });
  });
}

// AI Chat Integration
function setupAIChat() {
  const input = document.getElementById('aiInput');
  const sendBtn = document.getElementById('aiSendBtn');
  const chatBox = document.getElementById('aiChatBox');

  const handleSend = () => {
    const text = input.value.trim();
    if(!text) return;

    // User Message
    const uMsg = document.createElement('div');
    uMsg.className = 'msg user';
    uMsg.textContent = text;
    chatBox.appendChild(uMsg);

    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // Simulated Response
    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'msg bot';
      botMsg.textContent = `AI Replying to: "${text}". How can I help you build your app further?`;
      chatBox.appendChild(botMsg);
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
  };

  sendBtn.addEventListener('click', handleSend);
}

// Code Execution Engine
function setupCodeTerminal() {
  const runBtn = document.getElementById('runCodeBtn');
  const source = document.getElementById('codeSource');
  const consoleResult = document.getElementById('consoleResult');

  runBtn.addEventListener('click', () => {
    consoleResult.textContent = '$ Executing script...\n';
    try {
      const output = eval(source.value);
      consoleResult.textContent += output !== undefined ? String(output) : 'Success (No Output)';
    } catch (e) {
      consoleResult.textContent += `Error: ${e.message}`;
    }
  });
}

// Post Creation (+ Button)
function setupUploadModal() {
  const plusBtn = document.getElementById('plusActionBtn');
  const modal = document.getElementById('uploadModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const submitBtn = document.getElementById('submitPostBtn');
  const videoFile = document.getElementById('videoFile');
  const videoDesc = document.getElementById('videoDescription');

  plusBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  submitBtn.addEventListener('click', async () => {
    if (!videoFile.files[0]) {
      alert("Please select a video file first!");
      return;
    }

    // Convert local video object to Blob URL for instant streaming setup
    const blobUrl = URL.createObjectURL(videoFile.files[0]);

    try {
      await addDoc(collection(db, "posts"), {
        videoUrl: blobUrl,
        description: videoDesc.value,
        userId: currentUserData.uid,
        username: currentUserData.email.split('@')[0],
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp()
      });

      modal.classList.add('hidden');
      videoDesc.value = '';
      alert("Video Published Successfully!");
    } catch (e) {
      alert("Error saving video: " + e.message);
    }
  });
}

// Weather Selector Modal
function setupWeatherModal() {
  const badge = document.getElementById('weatherWidget');
  const modal = document.getElementById('weatherModal');
  const closeBtn = document.getElementById('closeWeatherModal');
  const checkBtn = document.getElementById('checkTempBtn');
  const input = document.getElementById('citySearchInput');
  const weatherText = document.getElementById('weatherText');

  badge.addEventListener('click', () => modal.classList.remove('hidden'));
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  checkBtn.addEventListener('click', () => {
    if (input.value.trim()) {
      weatherText.textContent = `30°C ${input.value.trim()}`;
      modal.classList.add('hidden');
    }
  });
}
