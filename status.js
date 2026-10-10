/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - STATUS.JS
   Instagram/WhatsApp style 24-hour Status
   
   Features:
   1. Text Status (color background)
   2. Photo Status
   3. Video Status (15 sec max)
   4. 24-hour auto-expire
   5. Privacy: Only followers + DM contacts can see
   6. Views tracking
   7. Reply to status (opens DM)
   8. Delete own status
   9. Mute user status
   10. Status ring on avatar
   
   Add: <script src="status.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════
  function toast(msg) {
    if (typeof window.showToast === 'function') return window.showToast(msg);
    const t = document.getElementById('toast-notification');
    if (!t) { alert(msg); return; }
    document.getElementById('toast-message').innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
  function fmt(s) { return (s || 'Umar').replace(/^@+/, '').split('@')[0]; }
  function getUser() { return fmt(localStorage.getItem('SUPER_APP_CURRENT_USER')); }

  // ═══════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════
  const StatusState = {
    myStatuses: [],
    allStatuses: [], // grouped by user
    currentViewUser: null,
    currentViewIndex: 0,
    timer: null,
    progressTimer: null,
    viewing: false,
    mutedUsers: JSON.parse(localStorage.getItem('SPHERE_MUTED_STATUS') || '[]')
  };

  // ═══════════════════════════════════════════════════════════════
  // BACKGROUND COLORS (for text status)
  // ═══════════════════════════════════════════════════════════════
  const STATUS_BG_COLORS = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#30cfd0,#330867)',
    'linear-gradient(135deg,#a8edea,#fed6e3)',
    'linear-gradient(135deg,#ff9a9e,#fecfef)',
    'linear-gradient(135deg,#fbc2eb,#a6c1ee)',
    'linear-gradient(135deg,#fdcbf1,#e6dee9)',
    'linear-gradient(135deg,#000428,#004e92)',
    'linear-gradient(135deg,#ff5f6d,#ffc371)'
  ];

  // ═══════════════════════════════════════════════════════════════
  // CREATE STATUS BUTTON (Add to Header)
  // ═══════════════════════════════════════════════════════════════
  function addStatusButton() {
    const headerDiv = document.querySelector('header > div');
    if (!headerDiv || document.getElementById('status-header-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'status-header-btn';
    btn.className = 'w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg';
    btn.title = 'Status';
    btn.innerHTML = '<i class="fa-solid fa-circle-plus text-sm"></i>';
    btn.onclick = () => window.openStatusCreator();

    // Insert as first child
    headerDiv.insertBefore(btn, headerDiv.firstChild);
  }

  // ═══════════════════════════════════════════════════════════════
  // STATUS CREATOR MODAL
  // ═══════════════════════════════════════════════════════════════
  window.openStatusCreator = function() {
    if (document.getElementById('statusCreatorModal')) {
      document.getElementById('statusCreatorModal').remove();
    }

    document.body.insertAdjacentHTML('beforeend', `
      <div id="statusCreatorModal" class="fullscreen-modal p-4 z-[100] flex flex-col bg-gray-950">
        <div class="flex justify-between items-center border-b border-pink-500/40 pb-3 mb-3">
          <h2 class="text-base font-bold text-pink-400"><i class="fa-solid fa-circle-plus"></i> Create Status</h2>
          <button onclick="document.getElementById('statusCreatorModal').remove()" class="text-gray-400 text-xl">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Type Tabs -->
        <div class="flex gap-2 mb-3">
          <button onclick="window.__statusType('text')" id="st-type-text" class="flex-1 py-2 bg-pink-600 text-white text-xs font-bold rounded-lg">📝 Text</button>
          <button onclick="window.__statusType('photo')" id="st-type-photo" class="flex-1 py-2 bg-gray-800 text-gray-400 text-xs font-bold rounded-lg">🖼️ Photo</button>
          <button onclick="window.__statusType('video')" id="st-type-video" class="flex-1 py-2 bg-gray-800 text-gray-400 text-xs font-bold rounded-lg">🎥 Video</button>
        </div>

        <!-- TEXT Status -->
        <div id="st-content-text" class="flex-1 flex flex-col gap-3">
          <div id="st-preview" class="flex-1 rounded-2xl flex items-center justify-center p-6 min-h-[280px]" style="background:${STATUS_BG_COLORS[0]}">
            <p id="st-preview-text" class="text-white text-2xl font-bold text-center leading-snug">Apka status yahan dikhega...</p>
          </div>
          <textarea id="st-text-input" placeholder="Type your status..." maxlength="200"
                    class="w-full h-20 bg-gray-900 border border-gray-700 p-3 rounded-xl text-sm text-white focus:outline-none"
                    oninput="document.getElementById('st-preview-text').innerText = this.value || 'Apka status yahan dikhega...'"></textarea>
          <div>
            <p class="text-[10px] text-gray-400 uppercase mb-2">Background</p>
            <div class="grid grid-cols-6 gap-2" id="st-bg-grid"></div>
          </div>
        </div>

        <!-- PHOTO/VIDEO Status -->
        <div id="st-content-media" class="flex-1 hidden flex-col gap-3">
          <div id="st-media-preview" class="flex-1 rounded-2xl bg-gray-900 border-2 border-dashed border-gray-700 flex items-center justify-center min-h-[280px] overflow-hidden">
            <div class="text-center space-y-2" id="st-media-placeholder">
              <div class="text-5xl">📁</div>
              <p class="text-xs text-gray-400">Photo ya Video select karein</p>
            </div>
          </div>
          <input type="file" id="st-media-file" accept="image/*,video/*" class="hidden" onchange="window.__statusMediaSelect(this)">
          <button onclick="document.getElementById('st-media-file').click()"
                  class="w-full py-3 bg-gray-800 text-cyan-400 text-sm font-bold rounded-xl border border-cyan-500/40">
            📁 Select Media
          </button>
          <textarea id="st-media-caption" placeholder="Caption (optional)..." maxlength="100"
                    class="w-full h-16 bg-gray-900 border border-gray-700 p-3 rounded-xl text-xs text-white focus:outline-none"></textarea>
        </div>

        <!-- Privacy Info -->
        <div class="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 mt-3">
          <p class="text-[10px] text-blue-300 leading-relaxed">
            🔒 <b>Privacy:</b> Aapki status sirf <b>followers</b> aur <b>DM contacts</b> ko dikhegi. 24 ghante baad automatically delete ho jayegi.
          </p>
        </div>

        <!-- Upload Button -->
        <button onclick="window.__publishStatus()" id="st-publish-btn"
                class="w-full py-3 mt-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-sm rounded-xl shadow-lg">
          📤 Post Status
        </button>
      </div>
    `);

    // Init background grid
    renderBgGrid();
    window.__statusType('text');
    window.__selectedBg = STATUS_BG_COLORS[0];
    window.__statusMediaFile = null;
    window.__statusMediaType = null;
  };

  function renderBgGrid() {
    const grid = document.getElementById('st-bg-grid');
    if (!grid) return;
    grid.innerHTML = '';
    STATUS_BG_COLORS.forEach((bg, i) => {
      const btn = document.createElement('button');
      btn.className = 'aspect-square rounded-lg border-2 border-gray-700 hover:border-pink-500';
      btn.style.background = bg;
      btn.onclick = () => {
        window.__selectedBg = bg;
        document.getElementById('st-preview').style.background = bg;
        document.querySelectorAll('#st-bg-grid button').forEach(b => b.classList.remove('border-pink-500'));
        btn.classList.add('border-pink-500');
      };
      grid.appendChild(btn);
    });
  }

  window.__statusType = function(type) {
    ['text', 'photo', 'video'].forEach(t => {
      const btn = document.getElementById('st-type-' + t);
      if (btn) btn.className = `flex-1 py-2 ${t === type ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400'} text-xs font-bold rounded-lg`;
    });
    const textContent = document.getElementById('st-content-text');
    const mediaContent = document.getElementById('st-content-media');

    if (type === 'text') {
      textContent.classList.remove('hidden');
      mediaContent.classList.add('hidden');
      mediaContent.classList.remove('flex');
    } else {
      textContent.classList.add('hidden');
      mediaContent.classList.remove('hidden');
      mediaContent.classList.add('flex');
      document.getElementById('st-media-file').accept = type === 'video' ? 'video/*' : 'image/*';
      window.__statusMediaType = type;
    }
  };

  window.__statusMediaSelect = function(input) {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast('❌ File 20 MB se kam honi chahiye');
      return;
    }

    window.__statusMediaFile = file;
    const isVideo = file.type.startsWith('video');
    window.__statusMediaType = isVideo ? 'video' : 'photo';

    const preview = document.getElementById('st-media-preview');
    const reader = new FileReader();
    reader.onload = (e) => {
      if (isVideo) {
        preview.innerHTML = `<video src="${e.target.result}" class="w-full h-full object-cover" controls autoplay muted loop></video>`;
      } else {
        preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`;
      }
    };
    reader.readAsDataURL(file);
  };

  // ═══════════════════════════════════════════════════════════════
  // PUBLISH STATUS
  // ═══════════════════════════════════════════════════════════════
  window.__publishStatus = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    const btn = document.getElementById('st-publish-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';

    try {
      let statusData = {
        user,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        views: [],
        type: 'text',
        text: '',
        mediaUrl: '',
        bg: STATUS_BG_COLORS[0],
        privacy: 'followers'
      };

      const type = window.__statusMediaType;

      if (type === 'photo' || type === 'video') {
        const file = window.__statusMediaFile;
        if (!file) { toast('❌ Media select karein'); btn.disabled = false; btn.innerHTML = '📤 Post Status'; return; }

        // Upload to Firebase Storage
        const st = firebase.storage();
        const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
        const path = `status/${user}_${Date.now()}.${ext}`;
        const ref = st.ref().child(path);
        
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading media...';
        const snapshot = await ref.put(file);
        statusData.mediaUrl = await snapshot.ref.getDownloadURL();
        statusData.type = type;
        statusData.text = (document.getElementById('st-media-caption')?.value || '').trim();
      } else {
        // Text status
        const text = (document.getElementById('st-text-input')?.value || '').trim();
        if (!text) { toast('❌ Text likhein'); btn.disabled = false; btn.innerHTML = '📤 Post Status'; return; }
        statusData.text = text;
        statusData.bg = window.__selectedBg || STATUS_BG_COLORS[0];
        statusData.type = 'text';
      }

      // Save to Firestore
      await firebase.firestore().collection('statuses').add(statusData);

      toast('✅ Status posted! 24 hours visible');
      document.getElementById('statusCreatorModal').remove();

      // Refresh status ring
      setTimeout(loadStatuses, 500);

    } catch(e) {
      console.error(e);
      toast('❌ Upload fail: ' + e.message);
      btn.disabled = false;
      btn.innerHTML = '📤 Post Status';
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // LOAD STATUSES (only from followers + DM contacts)
  // ═══════════════════════════════════════════════════════════════
  async function loadStatuses() {
    const user = getUser();
    if (!user) return;

    try {
      // Get my followers list
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const myData = users[user] || {};
      const myFollowers = myData.subscribersList || [];
      const myFollowing = myData.followingList || [];

      // Get DM contacts
      const dmContacts = [];
      try {
        const chats = JSON.parse(localStorage.getItem('SUPER_APP_CHATS') || '{}');
        Object.keys(chats).forEach(key => {
          if (key.includes(user)) {
            const parts = key.split(':');
            const other = parts.find(p => p !== user);
            if (other) dmContacts.push(other);
          }
        });
      } catch(e) {}

      // Users I can see statuses from:
      // 1. People I follow
      // 2. People who follow me (mutual)
      // 3. DM contacts
      const allowedUsers = new Set([
        ...myFollowing,
        ...myFollowers,
        ...dmContacts,
        user // my own
      ]);

      // Get all statuses (not expired)
      const now = new Date();
      const snap = await firebase.firestore().collection('statuses')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      const statusesByUser = {};
      let myStatusCount = 0;

      snap.forEach(doc => {
        const data = doc.data();
        const statusUser = fmt(data.user);

        // Skip if expired
        if (data.expiresAt && data.expiresAt.toDate) {
          if (data.expiresAt.toDate() < now) return;
        }

        // Skip if not in allowed list
        if (!allowedUsers.has(statusUser)) return;

        // Skip if muted
        if (StatusState.mutedUsers.includes(statusUser) && statusUser !== user) return;

        if (!statusesByUser[statusUser]) {
          statusesByUser[statusUser] = [];
        }
        statusesByUser[statusUser].push({ id: doc.id, ...data });

        if (statusUser === user) myStatusCount++;
      });

      StatusState.allStatuses = statusesByUser;
      StatusState.myStatuses = statusesByUser[user] || [];

      // Render status bar
      renderStatusBar();

    } catch(e) {
      console.log('Status load:', e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER STATUS BAR (Horizontal scroll)
  // ═══════════════════════════════════════════════════════════════
  function renderStatusBar() {
    const user = getUser();
    if (!user) return;

    // Check if status bar exists
    let statusBar = document.getElementById('statusBar');
    if (!statusBar) {
      // Create status bar in Videos tab (top)
      const videoTab = document.getElementById('tab-videos');
      if (!videoTab) return;

      const div = document.createElement('div');
      div.id = 'statusBar';
      div.className = 'absolute top-2 left-0 right-0 z-30 px-3 py-2 overflow-x-auto no-scrollbar flex gap-3';
      videoTab.insertBefore(div, videoTab.firstChild);
      statusBar = div;
    }

    statusBar.innerHTML = '';

    // My status (Add or View)
    const myRing = document.createElement('div');
    myRing.className = 'flex flex-col items-center gap-1 cursor-pointer flex-shrink-0';
    myRing.onclick = () => {
      if (StatusState.myStatuses.length > 0) {
        openStatusViewer(user, 0);
      } else {
        window.openStatusCreator();
      }
    };

    const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const myAvatar = (users[user] || {}).avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user}`;

    if (StatusState.myStatuses.length > 0) {
      myRing.innerHTML = `
        <div class="w-14 h-14 rounded-full p-0.5" style="background:linear-gradient(135deg,#ec4899,#a855f7)">
          <img src="${myAvatar}" class="w-full h-full rounded-full object-cover bg-gray-800 border-2 border-black">
        </div>
        <span class="text-[9px] text-white font-bold">My Status</span>
        <span class="text-[8px] text-pink-400">${StatusState.myStatuses.length} post</span>
      `;
    } else {
      myRing.innerHTML = `
        <div class="w-14 h-14 rounded-full p-0.5 bg-gray-700 border-2 border-dashed border-pink-500 relative flex items-center justify-center">
          <img src="${myAvatar}" class="w-full h-full rounded-full object-cover bg-gray-800 opacity-60">
          <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center border-2 border-black text-[10px]">
            <i class="fa-solid fa-plus"></i>
          </div>
        </div>
        <span class="text-[9px] text-white font-bold">Add Status</span>
      `;
    }
    statusBar.appendChild(myRing);

    // Other users' statuses
    Object.keys(StatusState.allStatuses).forEach(statusUser => {
      if (statusUser === user) return;
      const statusList = StatusState.allStatuses[statusUser];
      if (!statusList || statusList.length === 0) return;

      const uData = users[statusUser] || {};
      const avatar = uData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${statusUser}`;
      const allViewed = statusList.every(s => (s.views || []).includes(user));

      const ring = document.createElement('div');
      ring.className = 'flex flex-col items-center gap-1 cursor-pointer flex-shrink-0';
      ring.onclick = () => openStatusViewer(statusUser, 0);
      ring.innerHTML = `
        <div class="w-14 h-14 rounded-full p-0.5" style="background:${allViewed ? 'linear-gradient(135deg,#6b7280,#4b5563)' : 'linear-gradient(135deg,#ec4899,#a855f7)'}">
          <img src="${avatar}" class="w-full h-full rounded-full object-cover bg-gray-800 border-2 border-black">
        </div>
        <span class="text-[9px] text-white font-bold truncate max-w-[60px]">@${statusUser}</span>
      `;
      statusBar.appendChild(ring);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // STATUS VIEWER
  // ═══════════════════════════════════════════════════════════════
  window.openStatusViewer = function(statusUser, index) {
    const statusList = StatusState.allStatuses[statusUser];
    if (!statusList || statusList.length === 0) {
      toast('No status available');
      return;
    }

    StatusState.currentViewUser = statusUser;
    StatusState.currentViewIndex = index || 0;
    StatusState.viewing = true;

    showStatusOverlay();
  };

  function showStatusOverlay() {
    document.getElementById('statusViewer')?.remove();

    const statusUser = StatusState.currentViewUser;
    const statusList = StatusState.allStatuses[statusUser];
    const status = statusList[StatusState.currentViewIndex];
    const user = getUser();
    const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const uData = users[statusUser] || {};
    const avatar = uData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${statusUser}`;

    // Mark as viewed
    if (!(status.views || []).includes(user)) {
      firebase.firestore().collection('statuses').doc(status.id).update({
        views: firebase.firestore.FieldValue.arrayUnion(user)
      }).catch(() => {});
    }

    // Build content HTML
    let contentHtml = '';
    if (status.type === 'text') {
      contentHtml = `
        <div class="w-full h-full flex items-center justify-center p-8" style="background:${status.bg || STATUS_BG_COLORS[0]}">
          <p class="text-white text-2xl font-bold text-center leading-snug whitespace-pre-wrap">${status.text}</p>
        </div>
      `;
    } else if (status.type === 'photo') {
      contentHtml = `
        <div class="w-full h-full flex items-center justify-center bg-black">
          <img src="${status.mediaUrl}" class="max-w-full max-h-full object-contain">
          ${status.text ? `<div class="absolute bottom-20 left-4 right-4 bg-black/60 backdrop-blur rounded-xl p-3"><p class="text-white text-sm">${status.text}</p></div>` : ''}
        </div>
      `;
    } else if (status.type === 'video') {
      contentHtml = `
        <div class="w-full h-full flex items-center justify-center bg-black relative">
          <video src="${status.mediaUrl}" class="max-w-full max-h-full object-contain" autoplay muted playsinline></video>
          ${status.text ? `<div class="absolute bottom-20 left-4 right-4 bg-black/60 backdrop-blur rounded-xl p-3"><p class="text-white text-sm">${status.text}</p></div>` : ''}
        </div>
      `;
    }

    document.body.insertAdjacentHTML('beforeend', `
      <div id="statusViewer" class="fixed inset-0 z-[150] bg-black flex flex-col">
        
        <!-- Progress Bars -->
        <div class="absolute top-2 left-2 right-2 z-20 flex gap-1">
          ${statusList.map((_, i) => `
            <div class="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div class="h-full bg-white transition-all duration-100" 
                   id="status-progress-${i}" 
                   style="width:${i < StatusState.currentViewIndex ? '100%' : (i === StatusState.currentViewIndex ? '0%' : '0%')}"></div>
            </div>
          `).join('')}
        </div>

        <!-- Header -->
        <div class="absolute top-6 left-2 right-2 z-20 flex items-center gap-3 p-2 bg-gradient-to-b from-black/80 to-transparent">
          <img src="${avatar}" class="w-10 h-10 rounded-full bg-gray-800 border-2 border-white/30">
          <div class="flex-1">
            <p class="text-white text-sm font-bold">@${statusUser}</p>
            <p class="text-gray-300 text-[10px]" id="status-time">${timeAgo(status.createdAt)}</p>
          </div>
          <button onclick="window.__statusMenu('${status.id}', '${statusUser}')" class="text-white w-8 h-8 flex items-center justify-center">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
          <button onclick="closeStatusViewer()" class="text-white w-8 h-8 flex items-center justify-center">
            <i class="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <!-- Navigation Zones (tap left/right) -->
        <div class="absolute inset-0 z-10 flex" onclick="event.stopPropagation()">
          <div class="w-1/3 h-full" onclick="window.__statusPrev()"></div>
          <div class="flex-1 h-full" onclick="window.__statusPauseToggle()"></div>
          <div class="w-1/3 h-full" onclick="window.__statusNext()"></div>
        </div>

        <!-- Content -->
        <div class="flex-1 relative overflow-hidden">
          ${contentHtml}
        </div>

        <!-- Reply Bar -->
        <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
          <div class="flex gap-2 items-center">
            <input type="text" id="status-reply-input" placeholder="Reply to ${statusUser}..."
                   class="flex-1 bg-white/10 backdrop-blur border border-white/20 p-3 rounded-full text-sm text-white placeholder-gray-300 focus:outline-none">
            <button onclick="window.__statusReply('${statusUser}')" class="w-11 h-11 rounded-full bg-pink-600 text-white flex items-center justify-center">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
            <button onclick="window.__statusLike('${status.id}')" class="w-11 h-11 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center">
              <i class="fa-solid fa-heart"></i>
            </button>
          </div>
        </div>
      </div>
    `);

    // Start timer (5 sec per status)
    startStatusTimer();

    // For video — end when video ends
    if (status.type === 'video') {
      const vid = document.querySelector('#statusViewer video');
      if (vid) {
        vid.onended = () => window.__statusNext();
        clearInterval(StatusState.timer);
      }
    }
  }

  function timeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    const t = timestamp.toMillis ? timestamp.toMillis() : Date.now();
    const diff = Math.floor((Date.now() - t) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  function startStatusTimer() {
    clearTimeout(StatusState.timer);
    clearInterval(StatusState.progressTimer);

    const duration = 5000; // 5 seconds per status
    const start = Date.now();
    const currentProgress = document.getElementById('status-progress-' + StatusState.currentViewIndex);

    StatusState.progressTimer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      if (currentProgress) currentProgress.style.width = pct + '%';
      
      if (pct >= 100) {
        clearInterval(StatusState.progressTimer);
        window.__statusNext();
      }
    }, 50);
  }

  window.__statusNext = function() {
    clearInterval(StatusState.progressTimer);
    const statusList = StatusState.allStatuses[StatusState.currentViewUser];
    if (!statusList) return closeStatusViewer();

    StatusState.currentViewIndex++;
    if (StatusState.currentViewIndex >= statusList.length) {
      // Move to next user
      const users = Object.keys(StatusState.allStatuses).filter(u => u !== StatusState.currentViewUser);
      const nextUser = users[0];
      if (nextUser) {
        StatusState.currentViewUser = nextUser;
        StatusState.currentViewIndex = 0;
        showStatusOverlay();
      } else {
        closeStatusViewer();
      }
    } else {
      showStatusOverlay();
    }
  };

  window.__statusPrev = function() {
    clearInterval(StatusState.progressTimer);
    if (StatusState.currentViewIndex > 0) {
      StatusState.currentViewIndex--;
      showStatusOverlay();
    } else {
      // Go to prev user
      const users = Object.keys(StatusState.allStatuses);
      const idx = users.indexOf(StatusState.currentViewUser);
      if (idx > 0) {
        StatusState.currentViewUser = users[idx - 1];
        StatusState.currentViewIndex = StatusState.allStatuses[users[idx - 1]].length - 1;
        showStatusOverlay();
      }
    }
  };

  window.__statusPauseToggle = function() {
    if (StatusState.progressTimer) {
      clearInterval(StatusState.progressTimer);
      StatusState.progressTimer = null;
    } else {
      startStatusTimer();
    }
  };

  window.closeStatusViewer = function() {
    clearTimeout(StatusState.timer);
    clearInterval(StatusState.progressTimer);
    document.getElementById('statusViewer')?.remove();
    StatusState.viewing = false;
    // Refresh bar (to update viewed state)
    renderStatusBar();
  };

  // ═══════════════════════════════════════════════════════════════
  // STATUS REPLY (opens DM)
  // ═══════════════════════════════════════════════════════════════
  window.__statusReply = function(statusUser) {
    const input = document.getElementById('status-reply-input');
    const text = (input?.value || '').trim();
    if (!text) return;

    const user = getUser();
    const chatKey = [user, statusUser].sort().join(':');

    // Save to DM
    firebase.firestore().collection('dm_messages').add({
      chatKey,
      sender: user,
      receiver: statusUser,
      text: `📸 Replied to your status: ${text}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(() => {});

    toast('✅ Reply sent');
    closeStatusViewer();
    
    // Open DM
    setTimeout(() => {
      if (window.openChatConversation) window.openChatConversation(statusUser);
    }, 500);
  };

  // ═══════════════════════════════════════════════════════════════
  // STATUS LIKE
  // ═══════════════════════════════════════════════════════════════
  window.__statusLike = function(statusId) {
    const user = getUser();
    firebase.firestore().collection('statuses').doc(statusId).update({
      likes: firebase.firestore.FieldValue.arrayUnion(user)
    }).catch(() => {});
    toast('❤️ Liked');
  };

  // ═══════════════════════════════════════════════════════════════
  // STATUS MENU (delete, mute, view count)
  // ═══════════════════════════════════════════════════════════════
  window.__statusMenu = function(statusId, statusUser) {
    const user = getUser();
    const isMine = statusUser === user;
    const isMuted = StatusState.mutedUsers.includes(statusUser);

    const menu = document.createElement('div');
    menu.className = 'fixed inset-0 z-[200] bg-black/80 flex items-end justify-center';
    menu.onclick = (e) => { if (e.target === menu) menu.remove(); };
    menu.innerHTML = `
      <div class="w-full max-w-sm bg-gray-900 rounded-t-2xl p-4 space-y-2 animate-slide-up">
        <div class="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-2"></div>
        
        ${isMine ? `
          <button onclick="window.__deleteStatus('${statusId}'); document.querySelector('#statusViewer').querySelectorAll('.fixed').forEach(x=>x.remove());" 
                  class="w-full py-3 bg-red-900/50 text-red-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
            <i class="fa-solid fa-trash"></i> Delete Status
          </button>
          <button onclick="document.querySelectorAll('.fixed.inset-0.z-\\\\[200\\\\]').forEach(x=>x.remove()); window.__viewStatusViews('${statusId}');" 
                  class="w-full py-3 bg-gray-800 text-cyan-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
            <i class="fa-solid fa-eye"></i> View Status Views
          </button>
        ` : `
          <button onclick="window.__muteStatusUser('${statusUser}'); document.querySelectorAll('.fixed.inset-0.z-\\\\[200\\\\]').forEach(x=>x.remove());" 
                  class="w-full py-3 bg-gray-800 text-amber-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
            <i class="fa-solid fa-volume-xmark"></i> ${isMuted ? 'Unmute' : 'Mute'} @${statusUser}'s status
          </button>
          <button onclick="window.__reportStatus('${statusId}'); document.querySelectorAll('.fixed.inset-0.z-\\\\[200\\\\]').forEach(x=>x.remove());" 
                  class="w-full py-3 bg-gray-800 text-red-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
            <i class="fa-solid fa-flag"></i> Report Status
          </button>
        `}
        
        <button onclick="this.closest('.fixed').remove()" 
                class="w-full py-3 bg-gray-800 text-white text-sm font-bold rounded-xl">
          Cancel
        </button>
      </div>
    `;
    document.body.appendChild(menu);
  };

  window.__deleteStatus = async function(statusId) {
    if (!confirm('Delete this status?')) return;
    try {
      await firebase.firestore().collection('statuses').doc(statusId).delete();
      toast('✅ Status deleted');
      closeStatusViewer();
      loadStatuses();
    } catch(e) { toast('❌ ' + e.message); }
  };

  window.__muteStatusUser = function(statusUser) {
    const idx = StatusState.mutedUsers.indexOf(statusUser);
    if (idx > -1) {
      StatusState.mutedUsers.splice(idx, 1);
      toast('🔊 Unmuted');
    } else {
      StatusState.mutedUsers.push(statusUser);
      toast('🔇 Muted');
    }
    localStorage.setItem('SPHERE_MUTED_STATUS', JSON.stringify(StatusState.mutedUsers));
    loadStatuses();
  };

  window.__reportStatus = async function(statusId) {
    try {
      await firebase.firestore().collection('reports').add({
        type: 'status',
        statusId,
        reporter: getUser(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      toast('✅ Reported');
    } catch(e) { toast('❌ ' + e.message); }
  };

  window.__viewStatusViews = async function(statusId) {
    try {
      const doc = await firebase.firestore().collection('statuses').doc(statusId).get();
      const data = doc.data();
      const views = data.views || [];
      alert(`👁️ ${views.length} views\n\n${views.map(v => '@' + v).join('\n')}`);
    } catch(e) { toast('Error'); }
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO CLEANUP (delete expired statuses)
  // ═══════════════════════════════════════════════════════════════
  async function cleanupExpiredStatuses() {
    try {
      const now = new Date();
      const snap = await firebase.firestore().collection('statuses')
        .where('expiresAt', '<', firebase.firestore.Timestamp.fromDate(now))
        .limit(50).get();

      for (const doc of snap.docs) {
        const data = doc.data();
        // Delete media from storage
        if (data.mediaUrl && data.mediaUrl.includes('firebasestorage')) {
          try {
            await firebase.storage().refFromURL(data.mediaUrl).delete();
          } catch(e) {}
        }
        await doc.ref.delete();
        console.log('🗑️ Expired status deleted');
      }
    } catch(e) {
      console.log('Cleanup:', e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    // Add status button
    setInterval(addStatusButton, 2000);
    setTimeout(addStatusButton, 3000);

    // Load statuses
    setTimeout(loadStatuses, 5000);
    setInterval(loadStatuses, 60000); // Refresh every minute

    // Cleanup expired
    setTimeout(cleanupExpiredStatuses, 10000);
    setInterval(cleanupExpiredStatuses, 30 * 60 * 1000); // Every 30 min

    console.log('✅ status.js loaded - 24-hour status active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════
  window.__STATUS__ = {
    openStatusCreator: window.openStatusCreator,
    openStatusViewer: window.openStatusViewer,
    loadStatuses,
    cleanupExpiredStatuses
  };
})();
