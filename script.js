// Application Central State Logic
const AppState = {
  currentUser: "@umar_developer",
  likesCount: 0,
  subscribersCount: 1200,
  postsCount: 1,
  reportsCountMap: {}, // ID-wise Report counter
  reels: [
    { id: 'reel-1', url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-leaves-26522-large.mp4', likes: 10, liked: false, user: '@ali' }
  ],
  textPosts: [
    { id: 'post-1', user: '@umar_developer', text: 'Super App Platform successfully hosted on Vercel! 🚀', likes: 5, liked: false }
  ],
  comments: {
    'reel-1': [
      { id: 'c1', user: '@umar', text: 'Zabardast editing!', likes: 2 },
      { id: 'c2', user: '@ali', text: 'Nice video bhai!', likes: 1 }
    ]
  },
  activeChatTarget: '@ali'
};

document.addEventListener('DOMContentLoaded', () => {
  initTabNavigation();
  initSettingsModal();
  renderReels();
  renderTextFeed();
  initIDECompiler();
  initTradingViewWidget('FX:XAUUSD');
  initUploadHandlers();
  initChatLogic();
  initContextMenu();
});

// 1. Tab Navigation Routing
function initTabNavigation() {
  const navBtns = document.querySelectorAll('.bottom-nav .nav-item');
  const views = document.querySelectorAll('.tab-view');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      navBtns.forEach(b => b.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// 2. Settings & Wallet Modal Handler
function initSettingsModal() {
  const openBtn = document.getElementById('openSettings');
  const closeBtn = document.getElementById('closeSettings');
  const modal = document.getElementById('settingsModal');
  const themePicker = document.getElementById('themeColorPicker');

  openBtn.addEventListener('click', () => modal.classList.add('active'));
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));

  themePicker.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--bg-dark', e.target.value);
  });
}

// 3. TikTok Reels Logic (Toggle Like Fix)
function renderReels() {
  const container = document.getElementById('reelsContainer');
  container.innerHTML = '';

  AppState.reels.forEach(reel => {
    const reelEl = document.createElement('div');
    reelEl.className = 'reel-card';
    reelEl.innerHTML = `
      <video src="${reel.url}" loop autoplay muted playsinline></video>
      <div class="reel-actions">
        <div class="action-item ${reel.liked ? 'liked' : ''}" onclick="toggleReelLike('${reel.id}')">
          <i class="fa-solid fa-heart"></i>
          <span>${reel.likes}</span>
        </div>
        <div class="action-item" onclick="openCommentsModal('${reel.id}')">
          <i class="fa-solid fa-comment"></i>
          <span>${AppState.comments[reel.id] ? AppState.comments[reel.id].length : 0}</span>
        </div>
        <div class="action-item" onclick="shareMedia('${reel.id}')">
          <i class="fa-solid fa-share"></i>
        </div>
      </div>
    `;
    container.appendChild(reelEl);
  });
}

window.toggleReelLike = function(reelId) {
  const reel = AppState.reels.find(r => r.id === reelId);
  if (reel) {
    if (reel.liked) {
      reel.likes -= 1;
      reel.liked = false;
      AppState.likesCount = Math.max(0, AppState.likesCount - 1);
    } else {
      reel.likes += 1;
      reel.liked = true;
      AppState.likesCount += 1;
    }
    updateProfileCounters();
    renderReels();
  }
};

// 4. Text Feed Handler
function renderTextFeed() {
  const container = document.getElementById('textFeedContainer');
  container.innerHTML = '';

  AppState.textPosts.forEach(post => {
    const postEl = document.createElement('div');
    postEl.className = 'post-item';
    postEl.setAttribute('data-id', post.id);
    postEl.innerHTML = `
      <div class="post-header">
        <img src="https://via.placeholder.com/35" class="avatar-sm">
        <strong>${post.user}</strong>
      </div>
      <p>${post.text}</p>
      <div class="post-actions-bar">
        <button class="icon-btn" onclick="togglePostLike('${post.id}')">
          <i class="${post.liked ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: ${post.liked ? '#ec4899' : '#fff'}"></i> ${post.likes}
        </button>
        <button class="icon-btn"><i class="fa-regular fa-comment"></i> Comment</button>
      </div>
    `;
    
    // Attach Context Menu Handler for Long-Press
    postEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, post.user);
    });

    container.appendChild(postEl);
  });
}

document.getElementById('submitTextPostBtn').addEventListener('click', () => {
  const textInput = document.getElementById('textPostInput');
  if (textInput.value.trim() !== '') {
    AppState.textPosts.unshift({
      id: 'post-' + Date.now(),
      user: AppState.currentUser,
      text: textInput.value,
      likes: 0,
      liked: false
    });
    AppState.postsCount += 1;
    textInput.value = '';
    updateProfileCounters();
    renderTextFeed();
  }
});

window.togglePostLike = function(postId) {
  const post = AppState.textPosts.find(p => p.id === postId);
  if (post) {
    if (post.liked) {
      post.likes -= 1;
      post.liked = false;
    } else {
      post.likes += 1;
      post.liked = true;
    }
    renderTextFeed();
  }
};

// 5. Dynamic Profile Counter Updates
function updateProfileCounters() {
  document.getElementById('statLikes').innerText = AppState.likesCount;
  document.getElementById('statSubscribers').innerText = AppState.subscribersCount;
  document.getElementById('statPosts').innerText = AppState.postsCount;
}

// 6. Global File Upload (+ Button & Profile Avatar)
function initUploadHandlers() {
  const plusBtn = document.getElementById('plusMediaUploadBtn');
  const videoInput = document.getElementById('globalVideoInput');

  plusBtn.addEventListener('click', () => videoInput.click());

  videoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const videoURL = URL.createObjectURL(file);
      AppState.reels.unshift({
        id: 'reel-' + Date.now(),
        url: videoURL,
        likes: 0,
        liked: false,
        user: AppState.currentUser
      });
      AppState.postsCount += 1;
      updateProfileCounters();
      renderReels();
      alert('New video reel posted successfully!');
    }
  });

  // Avatar Upload Handler
  document.getElementById('avatarUploadInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const imgURL = URL.createObjectURL(file);
      document.getElementById('profileAvatarImg').src = imgURL;
    }
  });
}

// 7. TradingView Widget Integration
function initTradingViewWidget(symbol) {
  const container = document.getElementById('tradingViewChart');
  container.innerHTML = ''; 

  new TradingView.widget({
    "autosize": true,
    "symbol": symbol,
    "interval": "D",
    "timezone": "Etc/UTC",
    "theme": "dark",
    "style": "1",
    "locale": "en",
    "toolbar_bg": "#f1f3f6",
    "enable_publishing": false,
    "hide_top_toolbar": false,
    "container_id": "tradingViewChart"
  });

  // Switch Trading Pairs
  document.querySelectorAll('.pair-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.pair-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const newPair = e.target.getAttribute('data-pair');
      initTradingViewWidget(newPair);
    });
  });
}

// 8. IDE Code Validation & Dynamic Syntax Compiler
function initIDECompiler() {
  const runBtn = document.getElementById('runCodeBtn');
  const codeInput = document.getElementById('ideCodeInput');
  const outputBox = document.getElementById('ideOutput');

  runBtn.addEventListener('click', () => {
    const code = codeInput.value;
    outputBox.className = 'ide-output-box';
    outputBox.innerHTML = '';

    try {
      // Validate Code & Output Capture
      let logBuffer = [];
      const customConsole = {
        log: (...args) => logBuffer.push(args.join(' ')),
        error: (...args) => logBuffer.push('ERROR: ' + args.join(' '))
      };

      const runFunction = new Function('console', 'document', code);
      runFunction(customConsole, {
        write: (str) => { logBuffer.push(str); }
      });

      if (logBuffer.length === 0) {
        outputBox.innerHTML = '<span style="color: gray;">Code executed successfully with no output.</span>';
      } else {
        outputBox.innerHTML = logBuffer.join('<br>');
      }
    } catch (err) {
      outputBox.className = 'ide-output-box error';
      outputBox.innerHTML = `<strong>Syntax/Runtime Error:</strong><br>${err.message}`;
    }
  });
}

// 9. Comments Modal Drawer & Reply System
window.openCommentsModal = function(reelId) {
  const modal = document.getElementById('commentsModal');
  const list = document.getElementById('commentsContainer');
  modal.classList.add('active');

  const comments = AppState.comments[reelId] || [];
  list.innerHTML = '';

  comments.forEach(c => {
    const item = document.createElement('div');
    item.style.marginBottom = '10px';
    item.innerHTML = `<strong>${c.user}:</strong> ${c.text} <span style="font-size: 0.8rem; color: #ec4899; margin-left:10px; cursor:pointer;" onclick="likeComment('${reelId}', '${c.id}')"><i class="fa-solid fa-heart"></i> ${c.likes}</span>`;
    list.appendChild(item);
  });

  document.getElementById('closeComments').onclick = () => modal.classList.remove('active');
};

// 10. Chat Logic, Voice Notes & Calling Overlay
function initChatLogic() {
  const sendBtn = document.getElementById('sendMsgBtn');
  const msgInput = document.getElementById('chatMessageInput');
  const chatBody = document.getElementById('chatMessages');

  sendBtn.addEventListener('click', () => {
    if (msgInput.value.trim() !== '') {
      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble msg-sent';
      bubble.innerText = msgInput.value;
      chatBody.appendChild(bubble);
      msgInput.value = '';
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  });

  // Voice Note Recording Simulator
  const voiceBtn = document.getElementById('voiceRecordBtn');
  let isRecording = false;

  voiceBtn.addEventListener('click', () => {
    if (!isRecording) {
      isRecording = true;
      voiceBtn.style.color = '#ef4444';
      alert('Voice recording started...');
    } else {
      isRecording = false;
      voiceBtn.style.color = '#fff';
      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble msg-sent';
      bubble.innerHTML = '<i class="fa-solid fa-play"></i> Voice Note (0:05)';
      chatBody.appendChild(bubble);
    }
  });

  // Calling Modal Trigger
  const callModal = document.getElementById('callModal');
  document.getElementById('startAudioCallBtn').addEventListener('click', () => {
    document.getElementById('callUserName').innerText = AppState.activeChatTarget;
    callModal.classList.add('active');
  });

  document.getElementById('endCallBtn').addEventListener('click', () => {
    callModal.classList.remove('active');
  });
}

// 11. Context Menu & Automated 10-Report System
function initContextMenu() {
  const menu = document.getElementById('contextMenu');
  let targetUser = null;

  window.showContextMenu = function(x, y, username) {
    targetUser = username;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.display = 'flex';
  };

  document.addEventListener('click', () => menu.style.display = 'none');

  document.getElementById('ctxReport').addEventListener('click', () => {
    if (targetUser) {
      AppState.reportsCountMap[targetUser] = (AppState.reportsCountMap[targetUser] || 0) + 1;
      alert(`Report submitted for ${targetUser}. Total reports: ${AppState.reportsCountMap[targetUser]}`);

      // Auto-warning Trigger if reports exceed 10
      if (AppState.reportsCountMap[targetUser] >= 10) {
        alert(`⚠️ WARNING NOTICE: Account ${targetUser} has received over 10 community reports and is flagged!`);
      }
    }
  });
}
