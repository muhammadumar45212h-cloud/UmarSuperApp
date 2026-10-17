// ==========================================
// ⚡ SUPER APP - NEW FEATURES (Stories, Voice, Bookmarks)
// File: new-features.js
// ==========================================

(function() {
  'use strict';

  // ==========================================
  // 1. STORIES / STATUS (24 Hours)
  // ==========================================
  
  window.openAddStatusModal = function() {
    if (!currentUser) { showToast("Pehle login karein!"); return; }
    const existing = document.getElementById('addStatusModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'addStatusModal';
    modal.className = 'fullscreen-modal bg-black z-[90] flex flex-col justify-center items-center';
    modal.innerHTML = `
      <div class="w-full max-w-sm bg-gray-900 border border-cyan-500/40 rounded-2xl p-4 space-y-4">
        <div class="flex justify-between items-center border-b border-gray-800 pb-2">
          <h3 class="text-sm font-bold text-cyan-400"><i class="fa-solid fa-circle-plus"></i> Add Status</h3>
          <button onclick="document.getElementById('addStatusModal').remove()" class="text-gray-400"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="flex flex-col items-center">
          <input type="file" id="status-file-input" accept="image/*,video/*" class="hidden" onchange="previewStatusFile(this)">
          <div onclick="document.getElementById('status-file-input').click()" class="w-full h-48 bg-gray-800 border-2 border-dashed border-cyan-500/50 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
            <img id="status-preview-img" class="w-full h-full object-cover hidden">
            <video id="status-preview-vid" class="w-full h-full object-cover hidden" controls></video>
            <div id="status-upload-icon" class="flex flex-col items-center">
              <i class="fa-solid fa-camera text-3xl text-cyan-400"></i>
              <span class="text-xs text-gray-400 mt-2">Select Photo or Video</span>
            </div>
          </div>
        </div>
        <div>
          <label class="text-[10px] text-gray-400 uppercase block mb-1">Caption (Optional)</label>
          <input type="text" id="status-caption" class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white" placeholder="Write something...">
        </div>
        <button onclick="uploadStatus()" class="w-full py-3 btn-gradient rounded-xl text-xs font-bold text-white shadow-lg">
          <i class="fa-solid fa-paper-plane"></i> Post Status
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  };

  window.previewStatusFile = function(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      window.__statusFile = file;
      const img = document.getElementById('status-preview-img');
      const vid = document.getElementById('status-preview-vid');
      const icon = document.getElementById('status-upload-icon');
      const url = URL.createObjectURL(file);
      
      if (file.type.startsWith('image/')) {
        img.src = url; img.classList.remove('hidden');
        vid.classList.add('hidden'); icon.classList.add('hidden');
      } else if (file.type.startsWith('video/')) {
        vid.src = url; vid.classList.remove('hidden');
        img.classList.add('hidden'); icon.classList.add('hidden');
      }
    }
  };

  window.uploadStatus = async function() {
    if (!window.__statusFile || !currentUser) { showToast("File select karein"); return; }
    const file = window.__statusFile;
    const caption = document.getElementById('status-caption').value.trim();
    const cleanUser = formatHandle(currentUser);
    
    try {
      showToast("⏳ Uploading status...");
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('userhash', '');
      formData.append('fileToUpload', file);

      const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: formData });
      const url = await res.text();
      if (!url.startsWith('https://')) throw new Error("Upload failed");

      const expiry = Date.now() + (24 * 60 * 60 * 1000);
      
      await db.collection("stories").add({
        user: cleanUser, url: url,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        caption: caption, expiry: expiry,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showToast("✅ Status posted!");
      document.getElementById('addStatusModal').remove();
      window.__statusFile = null;
      loadStories();
    } catch(e) {
      showToast("❌ Upload failed: " + e.message);
    }
  };

  window.loadStories = async function() {
    const container = document.getElementById('stories-container');
    if (!container) return;
    try {
      const now = Date.now();
      const snapshot = await db.collection("stories").where("expiry", ">", now).orderBy("expiry", "desc").limit(30).get();
      container.innerHTML = '';
      
      const addBtn = document.createElement('div');
      addBtn.className = 'flex flex-col items-center cursor-pointer';
      addBtn.onclick = window.openAddStatusModal;
      addBtn.innerHTML = `<div class="w-16 h-16 rounded-full bg-gray-800 border-2 border-dashed border-cyan-500 flex items-center justify-center mb-1"><i class="fa-solid fa-plus text-cyan-400 text-xl"></i></div><span class="text-[9px] text-gray-300">Add Status</span>`;
      container.appendChild(addBtn);

      const storiesByUser = {};
      snapshot.forEach(doc => {
        const story = { id: doc.id, ...doc.data() };
        if (!storiesByUser[story.user]) storiesByUser[story.user] = [];
        storiesByUser[story.user].push(story);
      });

      Object.keys(storiesByUser).forEach(user => {
        const userStories = storiesByUser[user];
        const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
        const avatar = (users[user] || {}).avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user}`;

        const storyDiv = document.createElement('div');
        storyDiv.className = 'flex flex-col items-center cursor-pointer';
        storyDiv.onclick = () => window.viewStory(userStories);
        storyDiv.innerHTML = `<div class="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-red-500 p-0.5 mb-1"><img src="${avatar}" class="w-full h-full rounded-full object-cover bg-gray-900"></div><span class="text-[9px] text-gray-300 truncate w-16 text-center">@${user}</span>`;
        container.appendChild(storyDiv);
      });
    } catch (e) { console.error(e); }
  };

  window.viewStory = function(stories) {
    if (!stories || stories.length === 0) return;
    let currentIdx = 0;
    const existing = document.getElementById('storyViewerModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'storyViewerModal';
    modal.className = 'fullscreen-modal bg-black z-[100] flex flex-col justify-center relative';
    document.body.appendChild(modal);

    function renderStory() {
      const story = stories[currentIdx];
      const user = story.user;
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const avatar = (users[user] || {}).avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user}`;

      modal.innerHTML = `
        <div class="absolute top-4 left-4 right-4 flex gap-1 z-20">
          ${stories.map((_, i) => `<div class="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"><div class="h-full bg-white ${i <= currentIdx ? 'w-full' : 'w-0'}"></div></div>`).join('')}
        </div>
        <div class="absolute top-8 left-4 right-4 flex justify-between items-center z-20">
          <div class="flex items-center gap-2"><img src="${avatar}" class="w-8 h-8 rounded-full border border-white/50"><span class="text-xs font-bold text-white">@${user}</span></div>
          <button onclick="document.getElementById('storyViewerModal').remove()" class="text-white text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="flex-1 flex items-center justify-center relative">
          ${story.type === 'video' ? `<video src="${story.url}" class="w-full max-h-full object-contain" autoplay playsinline onended="nextStory()"></video>` : `<img src="${story.url}" class="w-full max-h-full object-contain">`}
        </div>
        ${story.caption ? `<div class="absolute bottom-8 left-4 right-4 bg-black/60 p-3 rounded-xl z-20"><p class="text-white text-sm">${story.caption}</p></div>` : ''}
        <div class="absolute inset-0 flex z-10"><div class="w-1/2 h-full" onclick="prevStory()"></div><div class="w-1/2 h-full" onclick="nextStory()"></div></div>
      `;

      if (story.type === 'image') setTimeout(() => { if (document.getElementById('storyViewerModal')) window.nextStory(); }, 5000);
      
      window.nextStory = () => { currentIdx++; if (currentIdx >= stories.length) document.getElementById('storyViewerModal').remove(); else renderStory(); };
      window.prevStory = () => { if (currentIdx > 0) { currentIdx--; renderStory(); } };
    }
    renderStory();
  };

  // ==========================================
  // 2. VOICE NOTES (DM)
  // ==========================================
  let mediaRecorder = null;
  let audioChunks = [];

  window.toggleVoiceRecording = async function() {
    const btn = document.getElementById('voice-record-btn');
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop(); if (btn) btn.innerHTML = '<i class="fa-solid fa-microphone"></i>'; return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        if (audioBlob.size > 1000) await sendVoiceNote(audioBlob);
      };
      mediaRecorder.start();
      if (btn) btn.innerHTML = '<i class="fa-solid fa-stop text-red-500 animate-pulse"></i>';
      showToast("🎤 Recording...");
    } catch(e) { showToast("❌ Mic permission needed"); }
  };

  window.sendVoiceNote = async function(audioBlob) {
    if (!currentUser || !activeChatTargetUser) return;
    try {
      showToast("⏳ Sending...");
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('userhash', '');
      formData.append('fileToUpload', new File([audioBlob], 'voice.webm', { type: 'audio/webm' }));

      const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: formData });
      const url = await res.text();
      
      const cleanCurr = formatHandle(currentUser);
      const chatKey = [cleanCurr, activeChatTargetUser].sort().join(':');
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      await db.collection("dm_messages").add({ chatKey, sender: cleanCurr, receiver: activeChatTargetUser, text: "🎤 Voice Note", voiceUrl: url, time, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
      showToast("✅ Sent");
    } catch(e) { showToast("❌ Failed"); }
  };

  function injectVoiceButton() {
    const dmFooter = document.getElementById('dm-input-footer');
    if (dmFooter && !document.getElementById('voice-record-btn')) {
      const input = dmFooter.querySelector('input');
      if (input) {
        const btn = document.createElement('button');
        btn.id = 'voice-record-btn'; btn.onclick = window.toggleVoiceRecording;
        btn.className = 'w-10 h-10 bg-gray-800 text-cyan-400 rounded-xl flex items-center justify-center border border-gray-700';
        btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        input.parentNode.insertBefore(btn, input);
      }
    }
  }

  // ==========================================
  // 3. BOOKMARKS / SAVE
  // ==========================================
  window.toggleBookmark = async function(postId) {
    if (!currentUser) return;
    const cleanUser = formatHandle(currentUser);
    let saved = JSON.parse(localStorage.getItem(`BOOKMARKS_${cleanUser}`) || '[]');
    const idx = saved.indexOf(postId);
    if (idx > -1) { saved.splice(idx, 1); showToast("🔖 Removed"); } 
    else { saved.push(postId); showToast("🔖 Saved"); }
    localStorage.setItem(`BOOKMARKS_${cleanUser}`, JSON.stringify(saved));
    try { await db.collection("users").doc(cleanUser).set({ bookmarks: saved }, { merge: true }); } catch(e) {}
  };

  window.openBookmarksModal = async function() {
    if (!currentUser) return;
    const cleanUser = formatHandle(currentUser);
    const saved = JSON.parse(localStorage.getItem(`BOOKMARKS_${cleanUser}`) || '[]');
    const existing = document.getElementById('bookmarksModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'bookmarksModal';
    modal.className = 'fullscreen-modal bg-gray-950 z-[80] flex flex-col';
    modal.innerHTML = `
      <div class="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
        <h2 class="text-sm font-bold text-amber-400"><i class="fa-solid fa-bookmark"></i> Saved Posts</h2>
        <button onclick="document.getElementById('bookmarksModal').remove()" class="text-gray-400"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>
      <div class="flex-1 p-3 overflow-y-auto no-scrollbar grid grid-cols-3 gap-2" id="bookmarks-grid">
        <p class="text-xs text-gray-500 text-center col-span-3 py-10">Loading...</p>
      </div>
    `;
    document.body.appendChild(modal);
    const grid = document.getElementById('bookmarks-grid');
    
    if (saved.length === 0) { grid.innerHTML = '<p class="text-xs text-gray-500 col-span-3 py-10">No saved posts</p>'; return; }
    try {
      const posts = await Promise.all(saved.map(id => db.collection("posts").doc(id).get()));
      grid.innerHTML = '';
      posts.forEach(doc => {
        if (!doc.exists) return;
        const v = doc.data();
        const thumb = document.createElement('div');
        thumb.className = 'aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-700 cursor-pointer';
        thumb.onclick = () => window.openSingleVideoPlayer(doc.id);
        thumb.innerHTML = `<video src="${v.url}#t=0.1" preload="metadata" class="w-full h-full object-cover" muted></video>`;
        grid.appendChild(thumb);
      });
    } catch(e) { grid.innerHTML = 'Error'; }
  };

  // ==========================================
  // INIT
  // ==========================================
  function initNewFeatures() {
    const videoTab = document.getElementById('tab-videos');
    if (videoTab && !document.getElementById('stories-container')) {
      const storiesBar = document.createElement('div');
      storiesBar.id = 'stories-container';
      storiesBar.className = 'absolute top-2 left-0 right-0 px-3 flex gap-3 overflow-x-auto no-scrollbar z-30';
      videoTab.appendChild(storiesBar);
      loadStories();
    }
    setTimeout(() => { injectVoiceButton(); setInterval(injectVoiceButton, 3000); }, 2000);
    
    setTimeout(() => {
      const settingsModal = document.getElementById('settingsModal');
      if (settingsModal && !document.getElementById('btn-bookmarks')) {
        const btn = document.createElement('button');
        btn.id = 'btn-bookmarks'; btn.onclick = window.openBookmarksModal;
        btn.className = 'w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg text-xs font-bold mt-2';
        btn.innerHTML = '<i class="fa-solid fa-bookmark"></i> My Saved Posts';
        const firstCard = settingsModal.querySelector('.bg-gray-900');
        if (firstCard) firstCard.after(btn);
      }
    }, 3000);
  }

  window.addEventListener('load', () => setTimeout(initNewFeatures, 2500));
})();
