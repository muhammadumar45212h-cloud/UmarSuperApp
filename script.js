// App Dynamic State Management
let currentUser = {
  name: "Umar Developer",
  handle: "@umar_tech",
  bio: "Super App Founder & Trader",
  avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Umar",
  followers: 1250,
  following: 180,
  likes: 4300,
  balance: 25400.00
};

let posts = [
  {
    id: 1,
    type: "text",
    author: "Umar Developer",
    handle: "@umar_tech",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Umar",
    content: "Umar Super App full layout updated with customized dark pink theme!",
    likes: 42
  }
];

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
  renderProfile();
  renderFeed('all');
  initDropdowns();
  fetchTemperature();
});

// Tab Navigation Engine
function switchTab(tabName) {
  document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

  const targetView = document.getElementById(`view-${tabName}`);
  const targetNav = document.getElementById(`nav-${tabName}`);

  if (targetView) targetView.classList.add('active');
  if (targetNav) targetNav.classList.add('active');
}

// Modal Controls
function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}
function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

// Dropdown Handling
function initDropdowns() {
  document.getElementById('btn-notif').onclick = () => {
    document.getElementById('notif-dropdown').classList.toggle('hidden');
    document.getElementById('menu-dropdown').classList.add('hidden');
  };
  document.getElementById('btn-menu').onclick = () => {
    document.getElementById('menu-dropdown').classList.toggle('hidden');
    document.getElementById('notif-dropdown').classList.add('hidden');
  };
  document.getElementById('btn-code').onclick = () => openModal('modal-code');
  document.getElementById('btn-wallet').onclick = () => openModal('modal-wallet');
}

// Live Temperature Fetching
function fetchTemperature() {
  document.getElementById('temp-val').innerText = "32°C"; // Default cached temp
}

// Code Execution Engine (No Document Redirect)
function runCode() {
  const code = document.getElementById('code-input').value;
  const outputScreen = document.getElementById('code-output');
  outputScreen.innerText = "";

  let originalLog = console.log;
  console.log = function(...args) {
    outputScreen.innerText += args.join(' ') + '\n';
    originalLog.apply(console, args);
  };

  try {
    let result = eval(code);
    if (result !== undefined) {
      outputScreen.innerText += "==> " + result;
    }
  } catch (err) {
    outputScreen.innerText += "Error: " + err.message;
  }
}

// Post Creation Engine (Video & Text)
function togglePostInput() {
  const type = document.getElementById('post-type').value;
  const videoWrapper = document.getElementById('video-input-wrapper');
  if (type === 'video') {
    videoWrapper.classList.remove('hidden');
  } else {
    videoWrapper.classList.add('hidden');
  }
}

function submitPost() {
  const type = document.getElementById('post-type').value;
  const content = document.getElementById('post-content').value;
  const videoFile = document.getElementById('post-video-file').files[0];

  let videoUrl = null;
  if (type === 'video' && videoFile) {
    videoUrl = URL.createObjectURL(videoFile); // Instant local rendering
  }

  const newPost = {
    id: Date.now(),
    type: type,
    author: currentUser.name,
    handle: currentUser.handle,
    avatar: currentUser.avatar,
    content: content,
    videoUrl: videoUrl,
    likes: 0
  };

  posts.unshift(newPost);
  renderFeed('all');
  closeModal('modal-post');
  document.getElementById('post-content').value = "";
}

function renderFeed(filter) {
  const container = document.getElementById('feed-container');
  container.innerHTML = "";

  const filteredPosts = posts.filter(p => filter === 'all' || p.type === filter);

  filteredPosts.forEach(post => {
    const postEl = document.createElement('div');
    postEl.className = "post-card";
    postEl.innerHTML = `
      <div class="post-header">
        <img src="${post.avatar}" class="post-avatar" />
        <div>
          <h4>${post.author}</h4>
          <span style="color: var(--text-sub); font-size: 0.8rem;">${post.handle}</span>
        </div>
      </div>
      <p>${post.content}</p>
      ${post.videoUrl ? `<video src="${post.videoUrl}" controls class="post-video"></video>` : ''}
      <div style="margin-top: 10px; display: flex; gap: 15px; color: var(--text-sub);">
        <button onclick="likePost(${post.id})" style="background:transparent; color: var(--primary-pink);">
          <i class="fa-solid fa-heart"></i> ${post.likes}
        </button>
      </div>
    `;
    container.appendChild(postEl);
  });
}

function likePost(id) {
  const post = posts.find(p => p.id === id);
  if (post) {
    post.likes++;
    renderFeed('all');
  }
}

// User Profile Editing Logic
function renderProfile() {
  document.getElementById('user-name-display').innerText = currentUser.name;
  document.getElementById('user-handle-display').innerText = currentUser.handle;
  document.getElementById('user-bio-display').innerText = currentUser.bio;
  document.getElementById('user-avatar').src = currentUser.avatar;
  document.getElementById('stat-followers').innerText = currentUser.followers;
  document.getElementById('stat-following').innerText = currentUser.following;
  document.getElementById('stat-likes').innerText = currentUser.likes;
  document.getElementById('wallet-amt').innerText = `PKR ${currentUser.balance.toLocaleString('en-PK', {minimumFractionDigits: 2})}`;
}

function openEditProfile() {
  document.getElementById('edit-name').value = currentUser.name;
  document.getElementById('edit-handle').value = currentUser.handle;
  document.getElementById('edit-bio').value = currentUser.bio;
  document.getElementById('edit-avatar').value = currentUser.avatar;
  openModal('modal-edit-profile');
}

function saveProfile() {
  currentUser.name = document.getElementById('edit-name').value;
  currentUser.handle = document.getElementById('edit-handle').value;
  currentUser.bio = document.getElementById('edit-bio').value;
  currentUser.avatar = document.getElementById('edit-avatar').value;
  renderProfile();
  closeModal('modal-edit-profile');
}

// Wallet & Real-time Withdrawal Processing
function showWithdraw() {
  document.getElementById('withdraw-section').classList.remove('hidden');
}

function processWithdrawal() {
  const method = document.getElementById('wd-method').value;
  const account = document.getElementById('wd-account').value;
  const amount = parseFloat(document.getElementById('wd-amount').value);

  if (!account || isNaN(amount) || amount <= 0) {
    alert("Please enter a valid account number and amount!");
    return;
  }

  if (amount > currentUser.balance) {
    alert("Insufficient wallet balance!");
    return;
  }

  currentUser.balance -= amount;
  renderProfile();

  alert(`Withdrawal Request Submitted!\nMethod: ${method}\nAccount: ${account}\nAmount: PKR ${amount}\nStatus: Processing in Real-Time.`);
  
  document.getElementById('wd-account').value = "";
  document.getElementById('wd-amount').value = "";
  document.getElementById('withdraw-section').classList.add('hidden');
}

// AI Chat Integration
function sendAIMessage() {
  const input = document.getElementById('ai-input');
  const msgText = input.value.trim();
  if (!msgText) return;

  const chatBox = document.getElementById('chat-messages');

  // Add User Msg
  const userDiv = document.createElement('div');
  userDiv.className = "msg user-msg";
  userDiv.innerText = msgText;
  chatBox.appendChild(userDiv);

  input.value = "";

  // AI Response Simulation
  setTimeout(() => {
    const aiDiv = document.createElement('div');
    aiDiv.className = "msg ai-msg";
    aiDiv.innerText = "Processing request for Umar Super App: " + msgText;
    chatBox.appendChild(aiDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 600);
}

// Market Trading Chart Loader
function loadChart(symbol) {
  document.querySelectorAll('.m-btn').forEach(btn => btn.classList.remove('active'));
  const container = document.getElementById('chart-container');
  container.innerHTML = `<iframe src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=${symbol}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC" style="width: 100%; height: 350px; border: none; border-radius: 8px;"></iframe>`;
}

