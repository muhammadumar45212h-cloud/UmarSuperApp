import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, onSnapshot, updateDoc, increment 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration
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
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let isSignUpMode = false;

// DOM Elements
const authScreen = document.getElementById('authScreen');
const authForm = document.getElementById('authForm');
const toggleAuthBtn = document.getElementById('toggleAuthBtn');
const additionalFields = document.getElementById('additionalFields');
const authErrorMsg = document.getElementById('authErrorMsg');

// Navigation View Handlers
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const target = item.getAttribute('data-target');
    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    viewSections.forEach(section => {
      section.classList.remove('active-view');
      if(section.id === target) section.classList.add('active-view');
    });
  });
});

// Auth Handlers
toggleAuthBtn.addEventListener('click', (e) => {
  e.preventDefault();
  isSignUpMode = !isSignUpMode;
  if(isSignUpMode) {
    document.getElementById('authTitle').innerText = "Create Your Account";
    document.getElementById('authSubmitBtn').innerText = "Sign Up";
    additionalFields.classList.remove('hidden');
    document.getElementById('toggleAuthText').innerText = "Already have an account?";
    toggleAuthBtn.innerText = "Sign In";
  } else {
    document.getElementById('authTitle').innerText = "Welcome to Umar Super App";
    document.getElementById('authSubmitBtn').innerText = "Sign In";
    additionalFields.classList.add('hidden');
    document.getElementById('toggleAuthText').innerText = "Don't have an account?";
    toggleAuthBtn.innerText = "Sign Up";
  }
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authErrorMsg.innerText = "";
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;

  try {
    if (isSignUpMode) {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const name = document.getElementById('authFullName').value || "New User";
      const username = document.getElementById('authUsername').value || "@user";
      
      // Save user profile to Firestore
      await setDoc(doc(db, "users", userCred.user.uid), {
        fullName: name,
        username: username,
        email: email,
        bio: "Welcome to my super app profile!",
        photoURL: "https://via.placeholder.com/100",
        likes: 0,
        subscribers: 0,
        postsCount: 0
      });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (err) {
    if(err.code === 'auth/email-already-in-use') {
      authErrorMsg.innerText = "Already used this email, please login.";
    } else {
      authErrorMsg.innerText = err.message;
    }
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    authScreen.classList.add('hidden');
    loadUserProfile();
    listenToFeed();
    initTradingViewChart();
  } else {
    authScreen.classList.remove('hidden');
  }
});

// Profile Management
async function loadUserProfile() {
  if(!currentUser) return;
  const docRef = doc(db, "users", currentUser.uid);
  const docSnap = await getDoc(docRef);
  if(docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById('profileDisplayName').innerText = data.fullName;
    document.getElementById('profileHandle').innerText = data.username;
    document.getElementById('profileBioText').innerText = data.bio;
    document.getElementById('profileAvatar').src = data.photoURL;
    document.getElementById('statLikes').innerText = data.likes || 0;
    document.getElementById('statSubscribers').innerText = data.subscribers || 0;
    document.getElementById('statPosts').innerText = data.postsCount || 0;
  }
}

document.getElementById('updateProfileBtn').addEventListener('click', async () => {
  const newName = document.getElementById('editNameInput').value;
  const newBio = document.getElementById('editBioInput').value;
  
  if(!currentUser) return;
  const updates = {};
  if(newName) updates.fullName = newName;
  if(newBio) updates.bio = newBio;

  await updateDoc(doc(db, "users", currentUser.uid), updates);
  loadUserProfile();
  alert("Profile updated successfully!");
});

// Video Feed Functions
function listenToFeed() {
  const feedContainer = document.getElementById('videoFeed');
  const q = query(collection(db, "videos"), orderBy("timestamp", "desc"));
  
  onSnapshot(q, (snapshot) => {
    feedContainer.innerHTML = "";
    if(snapshot.empty) {
      feedContainer.innerHTML = `<div style="padding:40px; text-align:center;">No videos posted yet. Tap + to publish one!</div>`;
      return;
    }

    snapshot.forEach(docSnap => {
      const v = docSnap.data();
      const videoId = docSnap.id;
      const card = document.createElement('div');
      card.className = "video-card";
      
      card.innerHTML = `
        <video src="${v.videoUrl}" loop playsinline onclick="this.paused?this.play():this.pause()"></video>
        <div class="video-actions">
          <img src="${v.creatorPhoto || 'https://via.placeholder.com/100'}" class="creator-avatar">
          <div class="action-icon" onclick="likeVideo('${videoId}')">
            <i class="fa-solid fa-heart"></i>
            <span>${v.likes || 0}</span>
          </div>
          <div class="action-icon">
            <i class="fa-solid fa-comment"></i>
            <span>${v.comments || 0}</span>
          </div>
          <div class="action-icon" onclick="shareVideo('${videoId}')">
            <i class="fa-solid fa-share"></i>
            <span>Share</span>
          </div>
        </div>
        <div class="video-info">
          <h4>${v.creatorName}</h4>
          <p>${v.description}</p>
        </div>
        <div class="end-video-banner hidden">
          <h2>SUPER APP</h2>
        </div>
      `;

      const videoElement = card.querySelector('video');
      const banner = card.querySelector('.end-video-banner');

      videoElement.addEventListener('ended', () => {
        banner.classList.remove('hidden');
        setTimeout(() => banner.classList.add('hidden'), 2000);
      });

      feedContainer.appendChild(card);
    });
  });
}

window.likeVideo = async (id) => {
  await updateDoc(doc(db, "videos", id), { likes: increment(1) });
};

window.shareVideo = (id) => {
  const shareUrl = `${window.location.origin}?video=${id}`;
  navigator.clipboard.writeText(shareUrl);
  alert("Link copied! Open link to view this video in Super App: " + shareUrl);
};

// Code Compiler Engine
document.getElementById('openCodeBtn').addEventListener('click', () => {
  document.getElementById('codeModal').classList.remove('hidden');
});
document.getElementById('closeCodeBtn').addEventListener('click', () => {
  document.getElementById('codeModal').classList.add('hidden');
});

document.getElementById('runCodeBtn').addEventListener('click', () => {
  const code = document.getElementById('codeCompilerEditor').value;
  const outputBox = document.getElementById('terminalOutput');
  outputBox.innerText = "> Executing code...\n";
  
  try {
    let logs = [];
    const customConsole = { log: (...args) => logs.push(args.join(' ')) };
    const run = new Function('console', code);
    run(customConsole);
    outputBox.innerText = logs.length ? logs.join('\n') : "> Program executed successfully with no output.";
  } catch (err) {
    outputBox.innerText = "> Error: " + err.message;
  }
});

// Wallet Operations
document.getElementById('openWalletBtn').addEventListener('click', () => {
  document.getElementById('walletModal').classList.remove('hidden');
});
document.getElementById('closeWalletBtn').addEventListener('click', () => {
  document.getElementById('walletModal').classList.add('hidden');
});

document.getElementById('withdrawBtn').addEventListener('click', () => {
  document.getElementById('withdrawForm').classList.toggle('hidden');
});

document.getElementById('confirmWithdrawBtn').addEventListener('click', () => {
  const phone = document.getElementById('withdrawPhone').value;
  const amount = document.getElementById('withdrawAmount').value;

  if(!phone || !amount) {
    alert("Please enter both phone/account number and amount.");
    return;
  }

  alert(`Withdrawal request of PKR ${amount} submitted for ${phone}. Funds will transfer after verification.`);
  document.getElementById('withdrawForm').classList.add('hidden');
});

// AI Chat Integration
document.getElementById('sendChatBtn').addEventListener('click', () => {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if(!text) return;

  const box = document.getElementById('chatMessagesBox');
  box.innerHTML += `<div class="message user-message">${text}</div>`;
  input.value = "";

  setTimeout(() => {
    box.innerHTML += `<div class="message ai-message">Main aapki query ("${text}") par kaam kar raha hoon. Umar Super App AI completely active hai!</div>`;
    box.scrollTop = box.scrollHeight;
  }, 1000);
});

// Weather API Tool
document.getElementById('searchWeatherBtn').addEventListener('click', async () => {
  const city = document.getElementById('weatherCityInput').value;
  const resContainer = document.getElementById('weatherResult');
  if(!city) return;

  resContainer.innerHTML = "Fetching live weather updates...";
  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    const data = await res.json();
    const current = data.current_condition[0];
    resContainer.innerHTML = `
      <h4>${city.toUpperCase()}</h4>
      <p>Temperature: <strong>${current.temp_C}°C</strong></p>
      <p>Weather: ${current.weatherDesc[0].value}</p>
      <p>Humidity: ${current.humidity}%</p>
    `;
  } catch(e) {
    resContainer.innerHTML = "Failed to load weather data. Please check city name.";
  }
});

// TradingView Widget Loader
function initTradingViewChart() {
  if (document.getElementById('tradingview_widget')) {
    new TradingView.widget({
      "width": "100%",
      "height": 400,
      "symbol": "FX:EURUSD",
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#f1f3f6",
      "enable_publishing": false,
      "container_id": "tradingview_widget"
    });
  }
}

// Upload Video Modal Handler
document.getElementById('openUploadBtn').addEventListener('click', () => {
  document.getElementById('uploadModal').classList.remove('hidden');
});
document.getElementById('closeUploadBtn').addEventListener('click', () => {
  document.getElementById('uploadModal').classList.hidden = true;
  document.getElementById('uploadModal').classList.add('hidden');
});

document.getElementById('publishVideoBtn').addEventListener('click', async () => {
  const desc = document.getElementById('videoDescription').value;
  if(!currentUser) return;

  // Mock upload logic saving object metadata to Firestore
  await addDoc(collection(db, "videos"), {
    creatorId: currentUser.uid,
    creatorName: currentUser.email.split('@')[0],
    creatorPhoto: "https://via.placeholder.com/100",
    description: desc,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    likes: 0,
    comments: 0,
    timestamp: new Date()
  });

  await updateDoc(doc(db, "users", currentUser.uid), {
    postsCount: increment(1)
  });

  document.getElementById('uploadModal').classList.add('hidden');
  alert("Video posted successfully!");
});
