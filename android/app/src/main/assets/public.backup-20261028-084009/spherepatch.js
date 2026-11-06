/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - ALL FIXES IN ONE FILE
   Add: <script src="spherepatch.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══ HELPERS ═══
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
  function isAdmin() { return ['muhammadumar45212h', 'Umar', 'admin'].includes(getUser()); }

  const CONFIG = {
    easypaisa: { number: '+92 305 2163026', name: 'Muhammad Umar' },
    jazzcash:  { number: '+92 305 2163026', name: 'Muhammad Umar' },
    sadapay:   { number: '5590490292264221', iban: 'PK94SADA0000003013816558', name: 'Muhammad Umar' },
    whatsappAdmin1: '923089775764',
    whatsappAdmin2: '923423373749',
    referrerCommission: 0.40
  };
  window.__SUPER_CONFIG = CONFIG;

  // ═══════════════════════════════════════════════════════════════
  // BUG #1: LIKE BUTTON — video reload nahi hoga
  // ═══════════════════════════════════════════════════════════════
  window.toggleLikeVideo = function(id) {
    if (!currentUser) return;
    const cleanCurr = formatHandle(currentUser);
    getVideosFromStorage(function(vids) {
      const vid = vids.find(x => x.id === id);
      if (!vid) return;
      if (!vid.likes) vid.likes = [];
      const idx = vid.likes.indexOf(cleanCurr);
      if (idx > -1) vid.likes.splice(idx, 1); else vid.likes.push(cleanCurr);
      saveVideoToStorage(vid);
      const icon = document.getElementById(`like-icon-${id}`);
      const count = document.getElementById(`like-count-${id}`);
      if (icon) icon.className = `fa-solid fa-heart text-2xl ${idx > -1 ? 'text-white' : 'text-red-500'}`;
      if (count) count.innerText = vid.likes.length;
      try { firebase.firestore().collection("posts").doc(id).update({ likes: vid.likes }); } catch(e) {}
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // BUG #2: VIDEO POST — progress bar + Firebase
  // ═══════════════════════════════════════════════════════════════
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
            <div id="up-fill" class="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-300" style="width:0%"></div>
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
      id: 'post_' + Date.now(), type: currentCreateType, url: videoUrl,
      user: cleanCurr, caption, link: link || null, likes: [], comments: [], views: 0
    };
    saveVideoToStorage(newPost);
    try {
      await firebase.firestore().collection("posts").doc(newPost.id).set({
        ...newPost, createdAt: firebase.firestore.FieldValue.serverTimestamp()
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

  // ═══════════════════════════════════════════════════════════════
  // BUG #3: CHANNEL POSTING + 6 emoji reactions
  // ═══════════════════════════════════════════════════════════════
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
        <button onclick="document.getElementById('channel-post-file').click()" class="p-2.5 bg-gray-800 text-cyan-400 rounded-xl border border-gray-700"><i class="fa-solid fa-image"></i></button>
        <input type="text" id="channel-message-input" class="flex-1 bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white focus:outline-none" placeholder="Broadcast likhein...">
        <button onclick="window.sendChannelPostSubmit()" class="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-xs font-bold text-white">Send</button>
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
    if (!activeChannelId || !currentUser) { toast('Channel missing'); return; }
    const input = document.getElementById('channel-message-input');
    const text = (input?.value || '').trim();
    if (!text && !window.__tempChPhoto) { toast('Text ya photo zaroori'); return; }
    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[activeChannelId];
    if (!chan) return;
    const newPost = {
      id: 'cpost_' + Date.now(), text, photo: window.__tempChPhoto || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: {}
    };
    if (!chan.posts) chan.posts = [];
    chan.posts.push(newPost);
    localStorage.setItem('SUPER_APP_CHANNELS', JSON.stringify(channels));
    try { await firebase.firestore().collection('channels').doc(activeChannelId).update({ posts: chan.posts }); } catch(e) {}
    if (input) input.value = '';
    window.__clearChPhoto();
    if (typeof window.renderChannelPosts === 'function') window.renderChannelPosts(activeChannelId);
    toast('✅ Post published!');
  };

  window.renderChannelPosts = function(channelId) {
    const channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[channelId] || { posts: [] };
    const thread = document.getElementById('dm-thread-view');
    if (!thread) return;
    thread.innerHTML = '';
    if (!chan.posts || chan.posts.length === 0) {
      thread.innerHTML = '<div class="text-center text-xs text-gray-500 py-12">No posts yet.</div>';
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
          <span>📢 ${chan.name}</span><span class="text-gray-500">${p.time || ''}</span>
        </div>
        ${p.photo ? `<img src="${p.photo}" class="w-full max-h-60 object-cover rounded-xl">` : ''}
        <p class="text-xs text-gray-200" style="white-space:pre-wrap;">${p.text || ''}</p>
        ${reactions}
        <div class="flex gap-1.5 pt-1 flex-wrap">
          ${['👍','❤️','🔥','😂','😮','😢'].map(e => 
            `<button onclick="window.__reactCh('${channelId}','${p.id}','${e}')" class="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-sm border border-gray-700">${e}</button>`
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

  // ═══════════════════════════════════════════════════════════════
  // BUG #4: Channel number validation (Pakistani)
  // ═══════════════════════════════════════════════════════════════
  window.finalizeChannelCreation = async function() {
    if (!currentUser) { toast('Login zaroori'); return; }
    const cleanCurr = formatHandle(currentUser);
    const name = document.getElementById('chan-name').value.trim();
    const username = document.getElementById('chan-username').value.trim().toLowerCase().replace(/\s+/g, '');
    const phone = document.getElementById('chan-number').value.trim();
    const typeEl = document.querySelector('input[name="chan-type-radio"]:checked');
    const type = typeEl ? typeEl.value : 'public';
    if (!name || !username) { toast('Name aur Username zaroori'); return; }
    const phoneClean = phone.replace(/[\s\-\(\)]/g, '');
    const pkPattern = /^(\+92|0092|92|0)?3[0-9]{9}$/;
    if (!pkPattern.test(phoneClean)) { toast('❌ Sahi Pakistani number (03XX-XXXXXXX) daalein'); return; }
    const chanId = 'chan_' + username;
    const previewEl = document.getElementById('chan-avatar-preview');
    const photo = (previewEl && !previewEl.classList.contains('hidden') && previewEl.src) ? previewEl.src : `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`;
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

  // ═══════════════════════════════════════════════════════════════
  // BUG #5: TEXT POST buttons + linkify
  // ═══════════════════════════════════════════════════════════════
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
            <button onclick="window.__likeTxt('${v.id}')" class="flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-gray-400'}"><i class="fa-solid fa-heart"></i> <span class="lc">${(v.likes||[]).length}</span></button>
            <button onclick="window.__commentTxt('${v.id}')" class="flex items-center gap-1.5 text-gray-400"><i class="fa-solid fa-comment"></i> <span>${(v.comments||[]).length}</span></button>
            <button onclick="window.__shareTxt('${v.id}')" class="flex items-center gap-1.5 text-gray-400"><i class="fa-solid fa-share"></i> Share</button>
            <button onclick="window.__subUser('${cleanU}')" class="flex items-center gap-1.5 text-cyan-400"><i class="fa-solid fa-user-plus"></i> Sub</button>
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
  window.__commentTxt = function(id) { if (typeof window.openCommentsDrawer === 'function') window.openCommentsDrawer(id); };
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

  // ═══════════════════════════════════════════════════════════════
  // BUG #6: Real ads placeholder
  // ═══════════════════════════════════════════════════════════════
  window.showRealAd = function() {
    const adIframe = document.getElementById('ad-iframe-container');
    if (adIframe) {
      adIframe.innerHTML = `<div style="width:100%;min-height:200px;background:linear-gradient(135deg,#1e3a8a,#7c3aed);border-radius:12px;padding:20px;text-align:center;color:#fff;"><div style="font-size:56px;">📢</div><h3 style="font-size:18px;margin:10px 0 6px;">Sponsored</h3><p style="font-size:12px;opacity:0.9;">Aapka ad yahan dikhega</p></div>`;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // PAYMENT: Buy Diamonds
  // ═══════════════════════════════════════════════════════════════
  const PKGS = [
    { id: 'p1', diamonds: 1,   pkr: 1400 },
    { id: 'p2', diamonds: 5,   pkr: 7000,   bonus: 1 },
    { id: 'p3', diamonds: 10,  pkr: 14000,  bonus: 3 },
    { id: 'p4', diamonds: 25,  pkr: 35000,  bonus: 10 },
    { id: 'p5', diamonds: 50,  pkr: 70000,  bonus: 25 },
    { id: 'p6', diamonds: 100, pkr: 140000, bonus: 60 }
  ];
  let selectedPkg = null;

  window.openBuyDiamondsModal = function() {
    if (!document.getElementById('buyDiamondsModal')) {
      document.body.insertAdjacentHTML('beforeend', `<div id="buyDiamondsModal" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[85] space-y-4"></div>`);
    }
    const modal = document.getElementById('buyDiamondsModal');
    modal.innerHTML = `
      <div class="flex justify-between items-center border-b border-amber-500/40 pb-3">
        <h2 class="text-base font-bold text-amber-400"><i class="fa-solid fa-gem"></i> Buy Diamonds</h2>
        <button onclick="closeModal('buyDiamondsModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="bg-amber-900/20 border border-amber-500/40 rounded-xl p-3 space-y-1">
        <p class="text-[11px] text-amber-300 font-bold">💎 1 Diamond = $5 (≈ Rs 1400)</p>
        <p class="text-[10px] text-gray-300">Step 1: Package select karein</p>
        <p class="text-[10px] text-gray-300">Step 2: Paisa bhejein</p>
        <p class="text-[10px] text-gray-300">Step 3: Screenshot + Txn ID upload</p>
        <p class="text-[10px] text-gray-300">Step 4: Admin 5-10 min mein approve karega</p>
      </div>
      <div id="pkgs-grid" class="grid grid-cols-2 gap-3"></div>
      <div id="pay-details" class="hidden bg-cyan-900/20 border border-cyan-500/40 rounded-xl p-4 space-y-3">
        <h3 class="text-xs font-bold text-cyan-400">💳 Payment Accounts</h3>
        <div class="bg-gray-900 rounded-lg p-3 space-y-1">
          <p class="text-[10px] text-gray-400">Easypaisa / JazzCash</p>
          <p class="text-sm font-bold text-white">+92 305 2163026</p>
          <p class="text-[10px] text-gray-500">Muhammad Umar</p>
        </div>
        <div class="bg-gray-900 rounded-lg p-3 space-y-1">
          <p class="text-[10px] text-gray-400">SadaPay (Preferred)</p>
          <p class="text-sm font-bold text-white">5590490292264221</p>
          <p class="text-[9px] text-gray-500">IBAN: PK94SADA0000003013816558</p>
        </div>
        <input type="file" id="pay-ss" accept="image/*" class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white">
        <input type="text" id="pay-txn" class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white" placeholder="Transaction ID">
        <button onclick="window.__submitOrder()" class="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xs rounded-xl">✅ Submit</button>
      </div>
    `;
    if (typeof openModal === 'function') openModal('buyDiamondsModal');
    renderPkgs();
  };

  function renderPkgs() {
    const grid = document.getElementById('pkgs-grid');
    if (!grid) return;
    grid.innerHTML = '';
    PKGS.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'p-3 bg-gray-800 border-2 border-amber-500/40 rounded-xl flex flex-col items-center';
      btn.onclick = () => {
        selectedPkg = p;
        document.querySelectorAll('#pkgs-grid > button').forEach(b => b.classList.remove('border-amber-400', 'bg-amber-900/20'));
        btn.classList.add('border-amber-400', 'bg-amber-900/20');
        document.getElementById('pay-details').classList.remove('hidden');
      };
      btn.innerHTML = `<span class="text-2xl">💎</span><span class="text-sm font-bold text-amber-400">${p.diamonds}</span>${p.bonus ? `<span class="text-[9px] text-green-400">+${p.bonus}</span>` : ''}<span class="text-[11px] font-bold text-white">Rs ${p.pkr.toLocaleString()}</span>`;
      grid.appendChild(btn);
    });
  }

  window.__submitOrder = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    if (!selectedPkg) { toast('Package select karein'); return; }
    const scr = document.getElementById('pay-ss');
    const txn = document.getElementById('pay-txn').value.trim();
    if (!scr.files || !scr.files[0]) { toast('Screenshot upload karein'); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const totalDiamonds = selectedPkg.diamonds + (selectedPkg.bonus || 0);
      try {
        await firebase.firestore().collection('payments').add({
          user, amountPkr: selectedPkg.pkr, diamonds: totalDiamonds,
          screenshot: e.target.result, txn, status: 'pending',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        const waText = encodeURIComponent(`🔔 Order\nUser: @${user}\nRs ${selectedPkg.pkr}\n${totalDiamonds} 💎\nTxn: ${txn}`);
        window.open(`https://wa.me/${CONFIG.whatsappAdmin1}?text=${waText}`, '_blank');
        toast('✅ Order submitted!');
        if (typeof closeModal === 'function') closeModal('buyDiamondsModal');
      } catch(err) { toast('❌ ' + err.message); }
    };
    reader.readAsDataURL(scr.files[0]);
  };

  // ═══════════════════════════════════════════════════════════════
  // WITHDRAWAL 10-min cancel
  // ═══════════════════════════════════════════════════════════════
  window.processWithdrawalSubmit = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    const method = document.getElementById('withdraw-method').value;
    const currency = document.getElementById('withdraw-currency').value;
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const account = document.getElementById('withdraw-account').value.trim();
    const password = document.getElementById('withdraw-password').value.trim();
    if (!amount || !account || !password) { toast('Sab fields bharein'); return; }
    let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const u = users[user] || {};
    if (u.password !== password) { toast('Galat password'); return; }
    const currentUsd = u.balanceUsd || 0;
    const reqUsd = currency === 'PKR' ? (amount / 278) : amount;
    if (reqUsd > currentUsd) { toast('Balance kam hai'); return; }
    users[user].balanceUsd = currentUsd - reqUsd;
    localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
    const wdId = 'wd_' + Date.now();
    const cancelUntil = new Date(Date.now() + 10 * 60 * 1000);
    try {
      await firebase.firestore().collection('withdrawals').doc(wdId).set({
        id: wdId, user, method, currency, amount, account, status: 'Pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        cancelUntil: firebase.firestore.Timestamp.fromDate(cancelUntil)
      });
      await firebase.firestore().collection('users').doc(user).set({ balanceUsd: users[user].balanceUsd }, { merge: true });
      try { if (typeof grecaptcha !== 'undefined') grecaptcha.reset(); } catch(e) {}
      if (typeof window.updateWalletUI === 'function') window.updateWalletUI();
      showCancelWindow(wdId, amount, currency, account, method);
    } catch(e) {
      users[user].balanceUsd = currentUsd;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
      toast('❌ ' + e.message);
    }
  };

  function showCancelWindow(id, amount, currency, account, method) {
    document.getElementById('cancelWdModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', `
      <div id="cancelWdModal" class="fullscreen-modal p-4 justify-center items-center bg-black/90 z-[95] flex">
        <div class="w-full max-w-sm bg-gray-900 border-2 border-amber-500/50 rounded-2xl p-6 text-center space-y-4">
          <div class="text-5xl">⏳</div>
          <h2 class="text-base font-bold text-amber-400">Withdrawal Submitted!</h2>
          <p class="text-xs text-gray-300">${currency} ${amount} to <b>${account}</b></p>
          <div class="bg-amber-900/20 border border-amber-500/40 rounded-xl p-3">
            <p class="text-[10px] text-amber-300">Auto-process:</p>
            <p class="text-3xl font-extrabold text-amber-400" id="wd-timer">10:00</p>
          </div>
          <div class="flex gap-2">
            <button onclick="window.__cancelWd('${id}')" class="flex-1 py-3 bg-red-600 text-white font-bold text-xs rounded-xl">Cancel</button>
            <button onclick="document.getElementById('cancelWdModal').remove(); clearInterval(window.__wdTimer);" class="flex-1 py-3 bg-gray-800 text-gray-300 font-bold text-xs rounded-xl">OK</button>
          </div>
        </div>
      </div>
    `);
    let sec = 600;
    window.__wdTimer = setInterval(() => {
      sec--;
      const m = Math.floor(sec / 60), s = sec % 60;
      const el = document.getElementById('wd-timer');
      if (el) el.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
      if (sec <= 0) {
        clearInterval(window.__wdTimer);
        document.getElementById('cancelWdModal')?.remove();
        const admin = Math.random() < 0.5 ? CONFIG.whatsappAdmin1 : CONFIG.whatsappAdmin2;
        const waText = encodeURIComponent(`💸 WITHDRAWAL\nUser: @${getUser()}\n${method}\n${currency} ${amount}\nAccount: ${account}`);
        window.open(`https://wa.me/${admin}?text=${waText}`, '_blank');
        toast('✅ Withdrawal processing!');
      }
    }, 1000);
  }

  window.__cancelWd = async function(id) {
    try {
      const doc = await firebase.firestore().collection('withdrawals').doc(id).get();
      if (!doc.exists) return;
      const data = doc.data();
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const refundUsd = data.currency === 'PKR' ? (data.amount / 278) : data.amount;
      if (users[data.user]) {
        users[data.user].balanceUsd = (users[data.user].balanceUsd || 0) + refundUsd;
        localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
        await firebase.firestore().collection('users').doc(data.user).set({ balanceUsd: users[data.user].balanceUsd }, { merge: true });
      }
      await firebase.firestore().collection('withdrawals').doc(id).update({ status: 'Cancelled', cancelledAt: firebase.firestore.FieldValue.serverTimestamp() });
      clearInterval(window.__wdTimer);
      document.getElementById('cancelWdModal')?.remove();
      if (typeof window.updateWalletUI === 'function') window.updateWalletUI();
      toast('✅ Cancelled + refunded');
    } catch(e) { toast('Error: ' + e.message); }
  };

  // ═══════════════════════════════════════════════════════════════
  // KYC — CNIC + WhatsApp verification links
  // ═══════════════════════════════════════════════════════════════
  let kycImgs = { front: null, back: null, selfie: null };
  window.kycPreview = function(type, input) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
      kycImgs[type] = e.target.result;
      const pv = document.getElementById('kyc-' + type + '-preview');
      if (pv) { pv.src = e.target.result; pv.classList.remove('hidden'); }
      const ic = document.getElementById('kyc-' + type + '-icon');
      if (ic) ic.classList.add('hidden');
    };
    reader.readAsDataURL(input.files[0]);
  };

  window.submitKyc = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    const fullName = (document.getElementById('kyc-fullname') || {}).value || '';
    const cnic = (document.getElementById('kyc-cnic') || {}).value || '';
    const dob = (document.getElementById('kyc-dob') || {}).value || '';
    const cnicClean = cnic.replace(/[^0-9]/g, '');
    if (cnicClean.length !== 13) { toast('❌ CNIC 13 digits'); return; }
    if (!fullName || !kycImgs.front || !kycImgs.back || !kycImgs.selfie) { toast('Sab fields + 3 photos zaroori'); return; }
    try {
      await firebase.firestore().collection('kyc').doc(user).set({
        user, fullName, cnic: cnicClean, dob,
        front: kycImgs.front, back: kycImgs.back, selfie: kycImgs.selfie,
        status: 'Pending', submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      const base = `${window.location.origin}${window.location.pathname}`;
      const verifyLink = `${base}?verify=${user}&code=${Math.random().toString(36).substr(2, 8)}`;
      const rejectLink = `${base}?reject=${user}&code=${Math.random().toString(36).substr(2, 8)}`;
      const waText = encodeURIComponent(`🔔 KYC\nUser: @${user}\nName: ${fullName}\nCNIC: ${cnicClean}\nDOB: ${dob}\n\n✅ APPROVE: ${verifyLink}\n\n❌ REJECT: ${rejectLink}`);
      toast('✅ KYC submitted!');
      setTimeout(() => {
        if (confirm('WhatsApp pe admin ko bhejein?')) {
          const admin = Math.random() < 0.5 ? CONFIG.whatsappAdmin1 : CONFIG.whatsappAdmin2;
          window.open(`https://wa.me/${admin}?text=${waText}`, '_blank');
        }
      }, 800);
      if (typeof closeModal === 'function') closeModal('kycModal');
    } catch(e) { toast('❌ ' + e.message); }
  };

  // KYC verify/reject via URL
  async function handleKycVerify() {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('verify');
    const r = params.get('reject');
    if (v) {
      if (confirm(`Approve KYC for @${v}?`)) {
        try {
          await firebase.firestore().collection('kyc').doc(v).update({ status: 'Approved', approvedAt: firebase.firestore.FieldValue.serverTimestamp() });
          await firebase.firestore().collection('notifications').add({ userId: v, title: '✅ KYC Verified!', body: 'Your KYC has been verified.', type: 'general', read: false, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
          alert('✅ Approved for @' + v);
        } catch(e) { alert('Error: ' + e.message); }
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (r) {
      if (confirm(`Reject KYC for @${r}?`)) {
        try {
          await firebase.firestore().collection('kyc').doc(r).update({ status: 'Rejected', rejectedAt: firebase.firestore.FieldValue.serverTimestamp() });
          await firebase.firestore().collection('notifications').add({ userId: r, title: '❌ KYC Rejected', body: 'Please resubmit.', type: 'general', read: false, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
          alert('❌ Rejected for @' + r);
        } catch(e) { alert('Error: ' + e.message); }
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }
  handleKycVerify();

  // ═══════════════════════════════════════════════════════════════
  // REFERRAL 40% commission
  // ═══════════════════════════════════════════════════════════════
  window.initReferralSystem = function() {
    const user = getUser();
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const refBy = params.get('ref');
    if (refBy && refBy !== user) {
      const key = 'ref_joined_' + user;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, refBy);
        localStorage.setItem('ref_' + user, refBy);
        try { firebase.firestore().collection('users').doc(user).set({ referredBy: refBy }, { merge: true }); } catch(e) {}
        toast('🎉 Joined via @' + refBy);
      }
    }
    const refLink = `${window.location.origin}${window.location.pathname}?ref=${user}`;
    const el = document.getElementById('referral-link');
    if (el) el.innerText = refLink;
  };

  window.__applyReferralCommission = async function(buyer, diamondsBought) {
    const referrer = localStorage.getItem('ref_' + buyer);
    if (!referrer) return;
    const commission = Math.floor(diamondsBought * CONFIG.referrerCommission);
    if (commission <= 0) return;
    try {
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (users[referrer]) {
        users[referrer].diamonds = (users[referrer].diamonds || 0) + commission;
        localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
        await firebase.firestore().collection('users').doc(referrer).set({ diamonds: users[referrer].diamonds }, { merge: true });
        await firebase.firestore().collection('notifications').add({ userId: referrer, title: '💰 Referral Commission', body: `@${buyer} bought ${diamondsBought}💎. You got ${commission}💎 (40%)!`, type: 'reward', read: false, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
      }
    } catch(e) {}
  };

  // ═══════════════════════════════════════════════════════════════
  // RECEIVED GIFTS (70%)
  // ═══════════════════════════════════════════════════════════════
  window.showReceivedGifts = async function() {
    const user = getUser();
    if (!user) return;
    if (!document.getElementById('giftsViewModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="giftsViewModal" class="fullscreen-modal hidden p-4 z-[85] overflow-y-auto no-scrollbar">
          <div class="flex justify-between items-center border-b border-amber-500/40 pb-3 mb-3">
            <h2 class="text-base font-bold text-amber-400"><i class="fa-solid fa-gift"></i> Received Gifts</h2>
            <button onclick="closeModal('giftsViewModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="gifts-list" class="space-y-2"></div>
        </div>
      `);
    }
    if (typeof openModal === 'function') openModal('giftsViewModal');
    try {
      const snap = await firebase.firestore().collection('gifts').where('receiver', '==', user).limit(50).get();
      const list = document.getElementById('gifts-list');
      list.innerHTML = '';
      if (snap.empty) { list.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">No gifts yet</p>'; return; }
      const gifts = [];
      snap.forEach(d => gifts.push(d.data()));
      gifts.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
      let total = 0;
      gifts.forEach(g => {
        const earn = Math.floor((g.pkrValue || 0) * 0.7);
        total += earn;
        const div = document.createElement('div');
        div.className = 'bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3';
        div.innerHTML = `<div class="text-3xl">${g.emoji || '🎁'}</div><div class="flex-1"><p class="text-xs font-bold text-white">${g.gift || 'Gift'}</p><p class="text-[10px] text-gray-400">From: @${g.sender}</p><p class="text-[10px] text-green-400 font-bold">+Rs ${earn} (70%)</p></div>`;
        list.appendChild(div);
      });
      list.insertAdjacentHTML('afterbegin', `<div class="bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border border-amber-500/40 rounded-xl p-3 mb-3"><p class="text-[10px] text-amber-300 uppercase font-bold">Total Earned (70%)</p><p class="text-2xl font-extrabold text-amber-400">Rs ${total.toLocaleString()}</p></div>`);
    } catch(e) { toast('Error: ' + e.message); }
  };

  function addGiftsBtn() {
    const profile = document.getElementById('tab-profile');
    if (!profile || document.getElementById('my-gifts-btn')) return;
    const row = profile.querySelector('.flex.items-center.gap-2');
    if (!row) return;
    const btn = document.createElement('button');
    btn.id = 'my-gifts-btn';
    btn.onclick = window.showReceivedGifts;
    btn.className = 'px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-xs font-bold flex items-center gap-1';
    btn.innerHTML = '<i class="fa-solid fa-gift"></i> My Gifts';
    row.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // HIDDEN ADMIN WALLET
  // ═══════════════════════════════════════════════════════════════
  window.openAdminWallet = async function() {
    if (!isAdmin()) { toast('Access denied'); return; }
    if (!document.getElementById('adminWalletModal')) {
      document.body.insertAdjacentHTML('beforeend', `<div id="adminWalletModal" class="fullscreen-modal hidden p-4 z-[90] overflow-y-auto no-scrollbar"><div class="flex justify-between items-center border-b border-red-500/40 pb-3 mb-4"><h2 class="text-base font-bold text-red-400"><i class="fa-solid fa-vault"></i> Admin Wallet</h2><button onclick="closeModal('adminWalletModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button></div><div id="admin-wallet-content" class="space-y-4"></div></div>`);
    }
    if (typeof openModal === 'function') openModal('adminWalletModal');
    const c = document.getElementById('admin-wallet-content');
    c.innerHTML = 'Loading...';
    try {
      const paySnap = await firebase.firestore().collection('payments').where('status', '==', 'approved').limit(500).get();
      let totalPkr = 0, totalDiamonds = 0;
      paySnap.forEach(d => { const x = d.data(); totalPkr += parseFloat(x.amountPkr || 0); totalDiamonds += parseInt(x.diamonds || 0); });
      const wdSnap = await firebase.firestore().collection('withdrawals').where('status', '==', 'Approved').limit(500).get();
      let withdrawn = 0;
      wdSnap.forEach(d => withdrawn += parseFloat(d.data().amount || 0));
      c.innerHTML = `<div class="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-2 border-green-500/50 rounded-2xl p-4 space-y-3"><p class="text-[10px] text-green-300 uppercase font-bold">Total Received</p><p class="text-3xl font-extrabold text-green-400">Rs ${totalPkr.toLocaleString()}</p><div class="grid grid-cols-2 gap-2 mt-2"><div class="bg-gray-900/60 rounded-lg p-2"><p class="text-[9px] text-gray-400">Diamonds</p><p class="text-sm font-bold text-amber-400">💎 ${totalDiamonds}</p></div><div class="bg-gray-900/60 rounded-lg p-2"><p class="text-[9px] text-gray-400">Paid Out</p><p class="text-sm font-bold text-red-400">Rs ${withdrawn.toLocaleString()}</p></div></div><div class="bg-gradient-to-r from-cyan-900/60 to-blue-900/60 rounded-lg p-3 mt-2"><p class="text-[10px] text-cyan-300 uppercase font-bold">Net Balance</p><p class="text-2xl font-extrabold text-cyan-400">Rs ${(totalPkr - withdrawn).toLocaleString()}</p></div></div>`;
    } catch(e) { c.innerHTML = '<p class="text-xs text-red-400">Error: ' + e.message + '</p>'; }
  };

  function addAdminBtn() {
    if (!isAdmin()) return;
    if (document.getElementById('admin-wallet-btn')) return;
    const header = document.querySelector('header');
    if (!header) return;
    const btn = document.createElement('button');
    btn.id = 'admin-wallet-btn';
    btn.onclick = window.openAdminWallet;
    btn.className = 'px-2 py-1 bg-red-600 text-white rounded-full text-[10px] font-bold';
    btn.innerHTML = '<i class="fa-solid fa-vault"></i>';
    header.querySelector('div').appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // CAMERA PERMISSIONS (APK)
  // ═══════════════════════════════════════════════════════════════
  async function requestNativePerms() {
    if (!window.Capacitor?.isNativePlatform?.()) return;
    try {
      if (window.Capacitor.Plugins.Camera) {
        const p = await window.Capacitor.Plugins.Camera.checkPermissions();
        if (p.camera !== 'granted') await window.Capacitor.Plugins.Camera.requestPermissions();
      }
    } catch(e) {}
  }
  requestNativePerms();
  setInterval(requestNativePerms, 60000);

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    setInterval(() => {
      ensureChannelInputArea();
      addGiftsBtn();
      addAdminBtn();
    }, 2000);
    setTimeout(() => {
      ensureChannelInputArea();
      addGiftsBtn();
      addAdminBtn();
      window.initReferralSystem();
    }, 2500);
    console.log('✅ spherepatch.js loaded');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
