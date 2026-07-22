// ====================================================
// UMAR SUPER APP - CLEAN & UPGRADED SCRIPT (NO SECRETS)
// ====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc,
  updateDoc,
  increment,
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Firebase Configuration (Clean Public Config)
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

// Global State
let currentUser = null;
let aiQueryCount = 0;

window.addEventListener('DOMContentLoaded', () => {
  initAuthListener();
  listenRealtimeMessages();
  listenRealtimePosts();
  listenChannels();
  listenGroups();
});

// 2. Authentication & Distinct Profiles
function initAuthListener() {
  onAuthStateChanged(auth, (user) => {
    const authScreen = document.getElementById('authScreen');
    if (user) {
      currentUser = user;
      if (authScreen) authScreen.classList.add('hidden');
      const username = user.email ? user.email.split('@')[0] : 'UmarUser';
      
      const profileNameElem = document.getElementById('profileName');
      const profileEmailElem = document.getElementById('profileEmail');
      if (profileNameElem) profileNameElem.innerText = username;
      if (profileEmailElem) profileEmailElem.innerText = user.email;
    } else {
      currentUser = null;
      if (authScreen) authScreen.classList.remove('hidden');
    }
  });
}

// 3. Channel Management (Owner-Only Access, Subscribers & Share Link)
window.createNewChannel = async function() {
  if (!currentUser) return alert("Pehle login karein!");
  const channelName = prompt("Naye Channel ka name enter karein:");
  if (!channelName || !channelName.trim()) return;

  try {
    await addDoc(collection(db, "channels"), {
      name: channelName.trim(),
      ownerEmail: currentUser.email,
      ownerName: currentUser.email.split('@')[0],
      subscribers: 1,
      createdAt: serverTimestamp()
    });
    alert(`Channel "${channelName}" ban gaya! Aap iske Owner hain.`);
  } catch (e) {
    alert("Error: " + e.message);
  }
};

function listenChannels() {
  const q = query(collection(db, "channels"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const container = document.getElementById('channelListContainer');
    if (!container) return;
    container.innerHTML = '';

    snapshot.forEach(docSnap => {
      const ch = docSnap.data();
      const chId = docSnap.id;
      const isOwner = currentUser && currentUser.email === ch.ownerEmail;
      
      container.innerHTML += `
        <div style="background:#1e293b; padding:12px; border-radius:10px; margin-bottom:10px; border-left:4px solid #e91e63;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0; color:#fff;">📺 ${ch.name}</h4>
            <span style="background:#0f172a; color:#f43f5e; padding:2px 8px; border-radius:12px; font-size:11px;">
              👥 ${ch.subscribers || 0} Subs
            </span>
          </div>
          <p style="margin:4px 0; color:#94a3b8; font-size:12px;">Owner: @${ch.ownerName} ${isOwner ? '👑 (You)' : ''}</p>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button onclick="shareChannelLink('${chId}', '${ch.name}')" style="background:#3b82f6; color:#fff; border:none; padding:4px 8px; border-radius:6px; font-size:12px; cursor:pointer;">🔗 Share Link</button>
            ${isOwner ? `<button onclick="ownerPostAction('${chId}')" style="background:#22c55e; color:#fff; border:none; padding:4px 8px; border-radius:6px; font-size:12px; cursor:pointer;">⚙️ Manage Channel</button>` : `<button onclick="subscribeChannel('${chId}')" style="background:#e91e63; color:#fff; border:none; padding:4px 8px; border-radius:6px; font-size:12px; cursor:pointer;">+ Subscribe</button>`}
          </div>
        </div>`;
    });
  });
}

window.shareChannelLink = function(id, name) {
  const link = `${window.location.origin}?channel=${id}`;
  navigator.clipboard.writeText(link);
  alert(`Channel "${name}" ka link copy ho gaya hai! Doston ko bhejein:\n${link}`);
};

window.subscribeChannel = async function(id) {
  try {
    const ref = doc(db, "channels", id);
    await updateDoc(ref, { subscribers: increment(1) });
    alert("Subscribed successfully!");
  } catch(e) {
    console.error(e);
  }
};

window.ownerPostAction = function(id) {
  alert("Owner Panel: Aap is channel ke malik hain! Post aur settings active hain.");
};

// 4. Group List System
window.createNewGroup = async function() {
  const groupName = prompt("Group ka naam rakhein:");
  if (!groupName) return;
  try {
    await addDoc(collection(db, "groups"), {
      name: groupName,
      createdName: currentUser ? currentUser.email.split('@')[0] : 'User',
      createdAt: serverTimestamp()
    });
    alert("Group Create Ho Gaya!");
  } catch(e) { console.error(e); }
};

function listenGroups() {
  const q = query(collection(db, "groups"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const container = document.getElementById('groupListContainer');
    if (!container) return;
    container.innerHTML = '';
    snapshot.forEach(docSnap => {
      const g = docSnap.data();
      container.innerHTML += `
        <div style="background:#0f172a; padding:10px; border-radius:8px; margin-bottom:6px; border:1px solid #334155; color:#fff;">
          💬 <strong>${g.name}</strong> <span style="font-size:10px; color:#64748b;">by @${g.createdName}</span>
        </div>`;
    });
  });
}

// 5. Video Post System & Dynamic Algorithm (Likes = Higher Views)
window.addNewVideoPost = async function() {
  if (!currentUser) return alert("Login karein video post karne ke liye!");
  const videoUrl = prompt("Video URL / Link enter karein:");
  if (!videoUrl) return;
  const caption = prompt("Video Caption enter karein:") || "";

  try {
    await addDoc(collection(db, "posts"), {
      videoUrl: videoUrl,
      caption: caption,
      username: currentUser.email.split('@')[0],
      likes: 0,
      views: 1,
      timestamp: serverTimestamp()
    });
    alert("Video successfully post ho gayi hai! Sabhi users ko feed me dikhegi.");
  } catch (e) {
    alert("Post error: " + e.message);
  }
};

function listenRealtimePosts() {
  // Sort posts dynamically so higher likes appear on top
  const q = query(collection(db, "posts"), orderBy("likes", "desc"));
  onSnapshot(q, (snapshot) => {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer) return;
    feedContainer.innerHTML = '';

    if (snapshot.empty) {
      feedContainer.innerHTML = '<div style="color:#aaa; text-align:center; padding:20px;">Koi video nahi hai. Niche Post Video button dabayein!</div>';
      return;
    }

    snapshot.forEach(docSnap => {
      const post = docSnap.data();
      const postId = docSnap.id;
      
      feedContainer.innerHTML += `
        <div style="background:#0f172a; margin-bottom:15px; border-radius:12px; overflow:hidden; border:1px solid #1e293b;">
          <video src="${post.videoUrl}" controls style="width:100%; max-height:380px; background:#000;"></video>
          <div style="padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="color:#f43f5e;">@${post.username || 'User'}</strong>
              <span style="color:#64748b; font-size:12px;">👁️ ${post.views || 1} Views</span>
            </div>
            <p style="color:#cbd5e1; margin:6px 0;">${post.caption || ''}</p>
            <button onclick="likePost('${postId}')" style="background:#e91e63; color:#fff; border:none; padding:6px 12px; border-radius:20px; font-weight:bold; cursor:pointer;">
              ❤️ Like (${post.likes || 0})
            </button>
          </div>
        </div>`;
    });
  });
}

window.likePost = async function(postId) {
  try {
    const postRef = doc(db, "posts", postId);
    // Algorithm: More Likes = Boosts Views Automatically
    await updateDoc(postRef, {
      likes: increment(1),
      views: increment(5)
    });
  } catch(e) {
    console.error("Like Error: ", e);
  }
};

// 6. Realtime Global Chat
function listenRealtimeMessages() {
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
  onSnapshot(q, (snapshot) => {
    const chatBox = document.getElementById('userChatBox');
    if (!chatBox) return;
    chatBox.innerHTML = '';
    snapshot.forEach(docSnap => {
      const msg = docSnap.data();
      const isMe = currentUser && msg.sender === currentUser.email;
      chatBox.innerHTML += `
        <div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; background: ${isMe ? '#0284c7' : '#334155'}; color: white; padding: 8px 12px; border-radius: 10px; margin: 4px 0; max-width: 80%;">
          <strong style="font-size:11px; display:block; opacity:0.8;">@${msg.sender ? msg.sender.split('@')[0] : 'User'}</strong>
          ${msg.text}
        </div>`;
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

window.sendUserMessage = async function() {
  const input = document.getElementById('userMessageInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, "messages"), {
      text: text,
      sender: currentUser ? currentUser.email : "Guest_User",
      timestamp: serverTimestamp()
    });
    input.value = '';
  } catch(e) {
    console.error(e);
  }
};

// AI Limits Helper
window.sendAiMessage = function() {
  const input = document.getElementById('aiInput');
  if (!input || !input.value.trim()) return;
  const chatBox = document.getElementById('aiChatBox');
  const text = input.value.trim();
  chatBox.innerHTML += `<div style="background:#e91e63; color:#fff; padding:8px; border-radius:8px; margin:4px 0; text-align:right;">${text}</div>`;
  input.value = '';

  if (aiQueryCount >= 3) {
    chatBox.innerHTML += `<div style="background:#1e293b; color:#fff; padding:10px; border-radius:8px; margin:4px 0; border:1px solid #e91e63;">⚠️ Limit Reached! Upgrade account for full AI access.</div>`;
    return;
  }
  aiQueryCount++;
  setTimeout(() => {
    chatBox.innerHTML += `<div style="background:#334155; color:#fff; padding:8px; border-radius:8px; margin:4px 0;"><strong>AI:</strong> Request received (${aiQueryCount}/3).</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 300);
};

// Global Tab Navigation
window.switchMainTab = function(tabId, element) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add('active');
  if (element) element.classList.add('active');
};
