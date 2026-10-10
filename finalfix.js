/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - FINAL FIXES (Bugs)
   Add: <script src="finalfix.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

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

  // ═══════ FIX #1: LIKE BUTTON (video reload nahi hoga) ═══════
  window.toggleLikeVideo = function(id) {
    if (!currentUser) return;
    const cleanCurr = formatHandle(currentUser);
    getVideosFromStorage(function(vids) {
      const vid = vids.find(x => x.id === id);
      if (!vid) return;
      if (!vid.likes) vid.likes = [];
      const idx = vid.likes.indexOf(cleanCurr);
      if (idx > -1) vid.likes.splice(idx, 1);
      else vid.likes.push(cleanCurr);
      saveVideoToStorage(vid);

      // Sirf UI update — koi reload nahi
      const icon = document.getElementById(`like-icon-${id}`);
      const count = document.getElementById(`like-count-${id}`);
      if (icon) icon.className = `fa-solid fa-heart text-2xl ${idx > -1 ? 'text-white' : 'text-red-500'}`;
      if (count) count.innerText = vid.likes.length;

      try { firebase.firestore().collection("posts").doc(id).update({ likes: vid.likes }); } catch(e) {}
    });
  };

  // ═══════ FIX #2: VIDEO POST → Firebase + Progress Bar ═══════
  function injectProgressBar() {
    if (document.getElementById('up-prog-modal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="up-prog-modal" class="fixed inset-0 z-[95] hidden bg-black/95 flex items-center justify-center p-6">
        <div class="w-full max-w-md bg-gray-900 border-2 border-cyan-500/40 rounded-2xl p-6 space-y-4">
          <div class="text-center">
            <div class="text-6xl mb-3" id="up-icon">📤</div>
            <h2 class="text-base font-bold text-cyan-400">Posting...</h2>
            <p class="text-xs text-gray-400 mt-1" id="up-status">Please wait...</p>
          </div>
          <div class="w-full bg-gray-800 rounded-full h-5 overflow-hidden border border-gray-700">
            <div id="up-fill" class="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-300 flex items-center justify-end pr-2 text-[10px] font-bold text-white" style="width:0%"></div>
          </div>
          <p class="text-3xl font-extrabold text-cyan-400 text-center" id="up-pct">0%</p>
        </div>
      </div>
    `);
  }

  window.__showProgress = function(pct, status) {
    injectProgressBar();
    document.getElementById('up-prog-modal').classList.remove('hidden');
    document.getElementById('up-fill').style.width = pct + '%';
    document.getElementById('up-pct').innerText = pct + '%';
    if (status) document.getElementById('up-status').innerText = status;
  };
  window.__hideProgress = function() {
    document.getElementById('up-prog-modal')?.classList.add('hidden');
  };

  // Override publishPost with progress
  window.publishPost = async function() {
    if (!currentUser) { toast('Login zaroori'); return; }
    const cleanCurr = formatHandle(currentUser);
    const caption = document.getElementById('post-caption').value.trim();
    const link = document.getElementById('post-link').value.trim();
    const directUrl = document.getElementById('post-video-url').value.trim();
    const videoUrl = selectedGalleryVideoBase64 || directUrl || null;

    if (currentCreateType === 'video' && !videoUrl) { toast('Video select karein'); return; }
    if (!caption && !videoUrl) { toast('Caption ya media zaroori'); return; }

    window.__showProgress(0, 'Preparing...');
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress > 90) progress = 90;
      window.__showProgress(Math.floor(progress), `Uploading... ${Math.floor(progress)}%`);
    }, 200);

    const newPost = {
      id: 'post_' + Date.now(),
      type: currentCreateType,
      url: videoUrl,
      user: cleanCurr,
      caption: caption,
      link: link || null,
      likes: [],
      comments: [],
      views: 0
    };
    saveVideoToStorage(newPost);

    try {
      await firebase.firestore().collection("posts").doc(newPost.id).set({
        ...newPost,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      clearInterval(interval);
      window.__showProgress(100, '✅ Post successful!');
      document.getElementById('up-icon').innerText = '✅';

      setTimeout(() => {
        window.__hideProgress();
        document.getElementById('up-icon').innerText = '📤';
        closeModal('createModal');
        document.getElementById('post-caption').value = '';
        document.getElementById('post-link').value = '';
        document.getElementById('post-video-url').value = '';
        selectedGalleryVideoBase64 = null;
        document.getElementById('video-preview-box')?.classList.add('hidden');
        if (typeof window.initAppContent === 'function') window.initAppContent();
        if (currentCreateType === 'text' && typeof window.renderFeedPosts === 'function') window.renderFeedPosts();
        toast('✅ Post sabko dikhega!');
      }, 1200);
    } catch(e) {
      clearInterval(interval);
      window.__hideProgress();
      toast('❌ Upload fail: ' + e.message);
    }
  };

  // ═══════ FIX #3: CHANNEL POSTING (typing area + emojis) ═══════
  function ensureChannelInputArea() {
    const footer = document.getElementById('channel-input-footer');
    if (!footer) return;
    if (document.getElementById('channel-message-input')) return;

    footer.innerHTML = `
      <div id="channel-photo-preview-box" class="hidden relative w-16 h-16 rounded-lg overflow-hidden border border-cyan-500 mb-2">
        <img id="channel-photo-preview-img" class="w-full h-full object-cover">
        <button onclick="window.__clearChPhoto()" class="absolute top-0 right-0 bg-black/70 text-white text-[10px] px-1"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="flex gap-2 items-center">
        <input type="file" id="channel-post-file" accept="image/*" class="hidden" onchange="window.__previewChPhoto(this)">
        <button onclick="document.getElementById('channel-post-file').click()" class="p-2.5 bg-gray-800 text-cyan-400 rounded-xl border border-gray-700">
          <i class="fa-solid fa-image"></i>
        </button>
        <input type="text" id="channel-message-input" 
               class="flex-1 bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white focus:outline-none" 
               placeholder="Broadcast likhein...">
        <button onclick="window.sendChannelPostSubmit()" 
                class="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-xs font-bold text-white">
          Send
        </button>
      </div>
    `;
  }

  window.__previewChPhoto = function(input) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        window.__tempChPhoto = e.target.result;
        document.getElementById('channel-photo-preview-img').src = e.target.result;
        document.getElementById('channel-photo-preview-box').classList.remove('hidden');
      };
      reader.readAsDataURL(input.files[0]);
    }
  };
  window.__clearChPhoto = function() {
    window.__tempChPhoto = null;
    document.getElementById('channel-photo-preview-box')?.classList.add('hidden');
  };

  window.sendChannelPostSubmit = async function() {
    if (!activeChannelId || !currentUser) { toast('Channel ya user missing'); return; }
    const input = document.getElementById('channel-message-input');
    const text = (input?.value || '').trim();
    if (!text && !window.__tempChPhoto) { toast('Text ya photo zaroori'); return; }

    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[activeChannelId];
    if (!chan) return;

    const newPost = {
      id: 'cpost_' + Date.now(),
      text: text,
      photo: window.__tempChPhoto || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: {}
    };
    if (!chan.posts) chan.posts = [];
    chan.posts.push(newPost);
    localStorage.setItem('SUPER_APP_CHANNELS', JSON.stringify(channels));

    try {
      await firebase.firestore().collection('channels').doc(activeChannelId).update({ posts: chan.posts });
    } catch(e) {}

    if (input) input.value = '';
    window.__clearChPhoto();
    if (typeof window.renderChannelPosts === 'function') window.renderChannelPosts(activeChannelId);
    toast('✅ Post published!');
  };

  // Reactions override with 6 emojis
  window.renderChannelPosts = function(channelId) {
    const channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[channelId] || { posts: [] };
    const thread = document.getElementById('dm-thread-view');
    if (!thread) return;
    thread.innerHTML = '';
    if (!chan.posts || chan.posts.length === 0) {
      thread.innerHTML = '<div class="text-center text-xs text-gray-500 py-12">No posts yet. Pehla post karein!</div>';
      return;
    }
    chan.posts.forEach(p => {
      const div = document.createElement('div');
      div.className = 'bg-gray-900 border border-gray-800 p-3 rounded-2xl space-y-2';
      let reactions = '';
      if (p.reactions && Object.keys(p.reactions).length > 0) {
        const counts = {};
        Object.values(p.reactions).forEach(e => counts[e] = (counts[e] || 0) + 1);
        reactions = '<div class="flex flex-wrap gap-1.5 pt-1.5 border-t border-gray-800">';
        for (let e in counts) reactions += `<span class="px-2 py-0.5 bg-gray-800 rounded-full text-xs border border-gray-700">${e} <b class="text-[10px] text-cyan-400">${counts[e]}</b></span>`;
        reactions += '</div>';
      }
      div.innerHTML = `
        <div class="flex justify-between items-center text-[10px] text-cyan-400 border-b border-gray-800 pb-1">
          <span>📢 ${chan.name}</span>
          <span class="text-gray-500">${p.time || ''}</span>
        </div>
        ${p.photo ? `<img src="${p.photo}" class="w-full max-h-60 object-cover rounded-xl">` : ''}
        <p class="text-xs text-gray-200" style="white-space:pre-wrap;">${p.text || ''}</p>
        ${reactions}
        <div class="flex gap-1.5 pt-1 flex-wrap">
          ${['👍','❤️','🔥','😂','😮','😢'].map(e => 
            `<button onclick="window.__reactCh('${channelId}','${p.id}','${e}')" 
                     class="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-sm border border-gray-700">${e}</button>`
          ).join('')}
        </div>
      `;
      thread.appendChild(div);
    });
    thread.scrollTop = thread.scrollHeight;
  };

  window.__reactCh = async function(chId, postId, emoji) {
    const user = getUser();
    if (!user) return;
    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[chId];
    if (!chan) return;
    const post = (chan.posts || []).find(p => p.id === postId);
    if (!post) return;
    if (!post.reactions) post.reactions = {};
    post.reactions[user] = emoji;
    localStorage.setItem('SUPER_APP_CHANNELS', JSON.stringify(channels));
    try { await firebase.firestore().collection('channels').doc(chId).update({ posts: chan.posts }); } catch(e) {}
    toast(`Reacted ${emoji}`);
    window.renderChannelPosts(chId);
  };

  // ═══════ FIX #4: CHANNEL NUMBER VALIDATION ═══════
  window.finalizeChannelCreation = async function() {
    if (!currentUser) { toast('Login zaroori'); return; }
    const cleanCurr = formatHandle(currentUser);
    const name = document.getElementById('chan-name').value.trim();
    const username = document.getElementById('chan-username').value.trim().toLowerCase().replace(/\s+/g, '');
    const phone = document.getElementById('chan-number').value.trim();
    const typeEl = document.querySelector('input[name="chan-type-radio"]:checked');
    const type = typeEl ? typeEl.value : 'public';

    if (!name || !username) { toast('Name aur Username zaroori'); return; }

    // Pakistani number strict validation
    const phoneClean = phone.replace(/[\s\-\(\)]/g, '');
    const pkPattern = /^(\+92|0092|92|0)?3[0-9]{9}$/;
    if (!pkPattern.test(phoneClean)) {
      toast('❌ Sahi Pakistani number (03XX-XXXXXXX) daalein');
      return;
    }

    const chanId = 'chan_' + username;
    const previewEl = document.getElementById('chan-avatar-preview');
    const photo = (previewEl && !previewEl.classList.contains('hidden') && previewEl.src)
      ? previewEl.src
      : `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`;

    const chanData = {
      id: chanId, name, username, phone: phoneClean, photo, type,
      owner: cleanCurr, link: `superapp.com/channel/${username}`,
      subscribers: [cleanCurr], pendingRequests: [], posts: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await firebase.firestore().collection('channels').doc(chanId).set(chanData);
      let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
      channels[chanId] = chanData;
      localStorage.setItem('SUPER_APP_CHANNELS', JSON.stringify(channels));
      closeModal('createChannelStep2Modal');
      closeModal('createChannelStep1Modal');
      toast('✅ Channel created: ' + name);
      if (typeof window.renderDmInboxList === 'function') window.renderDmInboxList();
      if (typeof window.openChannelConversation === 'function') window.openChannelConversation(chanId);
    } catch(e) { toast('❌ ' + e.message); }
  };

  // ═══════ FIX #5: TEXT POST — Like/Comment/Share/Subscribe ═══════
  window.renderFeedPosts = function() {
    getVideosFromStorage(function(vids) {
      const container = document.getElementById('posts-container');
      if (!container) return;
      container.innerHTML = '';
      const textPosts = vids.filter(v => !v.url && v.type !== 'video');
      if (textPosts.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-500 text-center py-12">No text posts yet.</p>';
        return;
      }
      textPosts.forEach(v => {
        const cleanU = formatHandle(v.user);
        const isLiked = (v.likes || []).includes(getUser());
        const card = document.createElement('div');
        card.className = 'bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3';
        card.dataset.postId = v.id;
        card.innerHTML = `
          <div class="flex justify-between items-center">
            <div onclick="window.__openProfile('${cleanU}')" class="flex items-center gap-2 cursor-pointer">
              <img src="${(JSON.parse(localStorage.getItem('SUPER_APP_USERS')||'{}')[cleanU]||{}).avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanU}`}" class="w-8 h-8 rounded-full bg-gray-800">
              <span class="text-xs font-bold text-cyan-400">@${cleanU}</span>
            </div>
            <button onclick="openGiftModal('${cleanU}')" class="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold">🎁 Gift</button>
          </div>
          <p class="text-xs text-gray-200 leading-relaxed" style="white-space:pre-wrap;">${window.__linkifyText(v.caption || '')}</p>
          ${v.link ? `<a href="${v.link}" target="_blank" class="text-xs text-cyan-400 underline block truncate">${v.link}</a>` : ''}
          <div class="flex items-center justify-between border-t border-gray-800 pt-2 text-[11px]">
            <button onclick="window.__likeTxt('${v.id}')" class="flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-gray-400'}">
              <i class="fa-solid fa-heart"></i> <span class="lc">${(v.likes||[]).length}</span>
            </button>
            <button onclick="window.__commentTxt('${v.id}')" class="flex items-center gap-1.5 text-gray-400">
              <i class="fa-solid fa-comment"></i> <span>${(v.comments||[]).length}</span>
            </button>
            <button onclick="window.__shareTxt('${v.id}')" class="flex items-center gap-1.5 text-gray-400">
              <i class="fa-solid fa-share"></i> Share
            </button>
            <button onclick="window.__subUser('${cleanU}')" class="flex items-center gap-1.5 text-cyan-400">
              <i class="fa-solid fa-user-plus"></i> Subscribe
            </button>
          </div>
        `;
        container.appendChild(card);
      });
    });
  };

  window.__linkifyText = function(text) {
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-cyan-400 underline">$1</a>');
    text = text.replace(/@([a-zA-Z0-9_]+)/g, '<a href="#" onclick="window.__openProfile(\'$1\'); return false;" class="text-cyan-400 font-bold">@$1</a>');
    return text;
  };

  window.__openProfile = function(user) {
    if (typeof window.openPublicUserProfileModal === 'function') window.openPublicUserProfileModal(user);
  };

  window.__likeTxt = function(id) {
    if (!currentUser) return;
    const me = getUser();
    getVideosFromStorage(vids => {
      const v = vids.find(x => x.id === id);
      if (!v) return;
      if (!v.likes) v.likes = [];
      const i = v.likes.indexOf(me);
      if (i > -1) v.likes.splice(i, 1); else v.likes.push(me);
      saveVideoToStorage(v);
      try { firebase.firestore().collection("posts").doc(id).update({ likes: v.likes }); } catch(e) {}
      const card = document.querySelector(`[data-post-id="${id}"]`);
      if (card) {
        const btn = card.querySelector('.fa-heart').parentElement;
        btn.className = `flex items-center gap-1.5 ${i > -1 ? 'text-gray-400' : 'text-red-500'}`;
        btn.querySelector('.lc').innerText = v.likes.length;
      }
    });
  };

  window.__commentTxt = function(id) {
    if (typeof window.openCommentsDrawer === 'function') window.openCommentsDrawer(id);
  };

  window.__shareTxt = function(id) {
    const url = `${window.location.origin}${window.location.pathname}?post=${id}`;
    if (navigator.share) navigator.share({ title: 'Super Sphere', url });
    else { navigator.clipboard.writeText(url); toast('✅ Link copied'); }
  };

  window.__subUser = async function(user) {
    const me = getUser();
    if (!user || me === user) return;
    let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const t = users[user] || {};
    if (!t.subscribersList) t.subscribersList = [];
    const i = t.subscribersList.indexOf(me);
    if (i > -1) { t.subscribersList.splice(i, 1); toast('Unsubscribed'); }
    else { t.subscribersList.push(me); toast('✅ Subscribed!'); }
    users[user] = t;
    localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
    try { await firebase.firestore().collection('users').doc(user).set({ subscribersList: t.subscribersList }, { merge: true }); } catch(e) {}
  };

  // ═══════ FIX #6: REAL ADS (blank screen fix) ═══════
  window.showRealAd = function() {
    const adIframe = document.getElementById('ad-iframe-container');
    if (adIframe) {
      adIframe.innerHTML = `
        <div style="width:100%;min-height:200px;background:linear-gradient(135deg,#1e3a8a,#7c3aed);border-radius:12px;padding:20px;text-align:center;color:#fff;">
          <div style="font-size:56px;">📢</div>
          <h3 style="font-size:18px;margin:10px 0 6px;">Sponsored</h3>
          <p style="font-size:12px;opacity:0.9;">Aapka ad yahan dikhega</p>
          <p style="font-size:10px;opacity:0.6;margin-top:8px;">Adsterra/AdSense approval ke baad</p>
        </div>
      `;
    }
  };

  // ═══════ AUTO INIT ═══════
  function init() {
    setInterval(() => {
      ensureChannelInputArea();
    }, 1500);
    setTimeout(ensureChannelInputArea, 2000);
    console.log('✅ finalfix.js loaded');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
