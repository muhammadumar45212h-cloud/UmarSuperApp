// State Management
let reelsData = [
  {
    id: 1,
    url: "https://assets.mixkit.co/videos/preview/mixkit-vertical-animation-of-a-futuristic-city-43187-large.mp4",
    author: "@umar_developer",
    desc: "Super App platform update coming live! 🚀",
    likes: 1200,
    liked: false,
    comments: [
      { text: "Awesome update bhai!", likes: 5 }
    ]
  }
];

let activeReelIndex = 0;
let isRecording = false;

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initDropdown();
  renderReels();
  initTradingViewWidget('FX:XAUUSD');
});

// Tab Switcher
function initTabs() {
  const navBtns = document.querySelectorAll('.bottom-nav .nav-btn');
  const pages = document.querySelectorAll('.tab-page');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      navBtns.forEach(b => b.classList.remove('active'));
      pages.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
}

// 3-Dot Dropdown Menu
function initDropdown() {
  const btn = document.getElementById('threeDotMenuBtn');
  const menu = document.getElementById('threeDotMenu');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('active');
  });

  document.addEventListener('click', () => menu.classList.remove('active'));
}

// Render Reels
function renderReels() {
  const container = document.getElementById('reelsContainer');
  container.innerHTML = '';

  reelsData.forEach((reel, index) => {
    const reelEl = document.createElement('div');
    reelEl.className = 'reel-item';
    reelEl.innerHTML = `
      <video src="${reel.url}" loop autoplay muted playsinline></video>
      <div class="reel-overlay-right">
        <button class="reel-action-btn ${reel.liked ? 'liked' : ''}" onclick="toggleLike(${index})">
          <i class="fa-solid fa-heart"></i>
          <span>${reel.likes}</span>
        </button>
        <button class="reel-action-btn" onclick="openCommentsDrawer(${index})">
          <i class="fa-solid fa-comment"></i>
          <span>${reel.comments.length}</span>
        </button>
        <button class="reel-action-btn" onclick="alert('Link copied to clipboard!')">
          <i class="fa-solid fa-share-nodes"></i>
          <span>Share</span>
        </button>
      </div>
      <div class="reel-overlay-bottom">
        <h4>${reel.author}</h4>
        <p>${reel.desc}</p>
      </div>
    `;
    container.appendChild(reelEl);
  });
}

// Like Toggle
function toggleLike(index) {
  if (reelsData[index].liked) {
    reelsData[index].likes--;
    reelsData[index].liked = false;
  } else {
    reelsData[index].likes++;
    reelsData[index].liked = true;
  }
  renderReels();
}

// Video Post Functionality
function handleVideoPost() {
  const fileInput = document.getElementById('reelFileInput');
  const descInput = document.getElementById('reelDescInput');

  if (fileInput.files.length === 0) {
    alert("Please select a video file!");
    return;
  }

  const file = fileInput.files[0];
  const videoUrl = URL.createObjectURL(file);

  const newReel = {
    id: Date.now(),
    url: videoUrl,
    author: document.getElementById('displayUsername').innerText,
    desc: descInput.value || "New video post",
    likes: 0,
    liked: false,
    comments: []
  };

  reelsData.unshift(newReel);
  renderReels();
  updateProfileVideos(videoUrl);

  closeModal('uploadModal');
  fileInput.value = '';
  descInput.value = '';
  alert("Video posted successfully!");
}

// Profile Video Grid Update
function updateProfileVideos(url) {
  const grid = document.getElementById('userVideoGrid');
  const emptyMsg = document.getElementById('emptyVideoMsg');
  if (emptyMsg) emptyMsg.style.display = 'none';

  const videoNode = document.createElement('video');
  videoNode.src = url;
  videoNode.controls = true;
  grid.appendChild(videoNode);

  // Update total videos count
  const countEl = document.getElementById('statVideos');
  countEl.innerText = parseInt(countEl.innerText) + 1;
}

// Comments Functionality
function openCommentsDrawer(index) {
  activeReelIndex = index;
  renderComments();
  openModal('commentModal');
}

function renderComments() {
  const list = document.getElementById('commentsList');
  list.innerHTML = '';
  const reel = reelsData[activeReelIndex];

  reel.comments.forEach((c, idx) => {
    const item = document.createElement('div');
    item.className = 'comment-item';
    item.innerHTML = `
      <div><strong>User:</strong> ${c.text}</div>
      <div class="comment-actions">
        <span onclick="likeComment(${idx})" style="cursor:pointer;"><i class="fa-solid fa-heart"></i> ${c.likes || 0}</span>
        <span onclick="replyComment(${idx})" style="cursor:pointer;"><i class="fa-solid fa-reply"></i> Reply</span>
      </div>
    `;
    list.appendChild(item);
  });
}

function addComment() {
  const input = document.getElementById('commentTextInput');
  if (input.value.trim()) {
    reelsData[activeReelIndex].comments.push({ text: input.value, likes: 0 });
    input.value = '';
    renderComments();
    renderReels();
  }
}

function likeComment(cIdx) {
  reelsData[activeReelIndex].comments[cIdx].likes = (reelsData[activeReelIndex].comments[cIdx].likes || 0) + 1;
  renderComments();
}

function replyComment(cIdx) {
  const replyText = prompt("Write your reply:");
  if (replyText) {
    reelsData[activeReelIndex].comments.push({ text: `Reply: ${replyText}`, likes: 0 });
    renderComments();
  }
}

// Profile Edits
function saveProfileChanges() {
  const name = document.getElementById('newUsernameInput').value;
  const bio = document.getElementById('newBioInput').value;
  const avatarFile = document.getElementById('newAvatarInput').files[0];

  if (name) document.getElementById('displayUsername').innerText = name;
  if (bio) document.getElementById('displayBio').innerText = bio;
  if (avatarFile) {
    document.getElementById('profileAvatarImg').src = URL.createObjectURL(avatarFile);
  }

  closeModal('editProfileModal');
  alert("Profile updated successfully!");
}

// Chat Send & Mic Simulation
function sendChatMessage() {
  const input = document.getElementById('chatMessageInput');
  const chatBody = document.getElementById('chatBoxBody');
  if (input.value.trim()) {
    const msg = document.createElement('div');
    msg.className = 'msg-bubble sent';
    msg.innerText = input.value;
    chatBody.appendChild(msg);
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;
  }
}

function toggleVoiceRecording() {
  const mic = document.getElementById('micIcon');
  if (!isRecording) {
    isRecording = true;
    mic.style.color = '#ef4444';
  } else {
    isRecording = false;
    mic.style.color = '';
    const chatBody = document.getElementById('chatBoxBody');
    const msg = document.createElement('div');
    msg.className = 'msg-bubble sent';
    msg.innerHTML = '<i class="fa-solid fa-play"></i> 🎵 Voice Note (0:04)';
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
}

// TradingView Fullscreen Widget
function initTradingViewWidget(symbol) {
  document.getElementById('tradingViewWidget').innerHTML = '';
  new TradingView.widget({
    "autosize": true,
    "symbol": symbol,
    "interval": "D",
    "theme": "dark",
    "style": "1",
    "container_id": "tradingViewWidget"
  });
}

function switchMarketSymbol(symbol, btn) {
  document.querySelectorAll('.market-pair-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  initTradingViewWidget(symbol);
}

// Modal Helpers
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
