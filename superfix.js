/* ═══════════════════════════════════════════════════════════════
   SUPER APP - BUG FIXES MODULE
   Fixes: Ads, Like, Video Upload, Channel, Reactions, Links
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

  // ═══════════════════════════════════════════════════════════════
  // FIX 1: LIKE BUTTON - Video reload nahi hoga
  // ═══════════════════════════════════════════════════════════════
  window.toggleLikeVideo = function(id) {
    if (!currentUser) return;
    const cleanCurr = formatHandle(currentUser);
    getVideosFromStorage(function(vids) {
      let vid = vids.find(x => x.id === id);
      if (!vid) return;
      if (!vid.likes) vid.likes = [];
      const idx = vid.likes.indexOf(cleanCurr);
      if (idx > -1) vid.likes.splice(idx, 1);
      else vid.likes.push(cleanCurr);
      saveVideoToStorage(vid);
      
      // Sirf icon + count update karo, video ko chhedein nahi
      const icon = document.getElementById(`like-icon-${id}`);
      const count = document.getElementById(`like-count-${id}`);
      if (icon) icon.className = `fa-solid fa-heart text-2xl ${idx > -1 ? 'text-white' : 'text-red-500'}`;
      if (count) count.innerText = vid.likes.length;
      
      // Firebase update (background)
      try {
        firebase.firestore().collection("posts").doc(id).update({ likes: vid.likes });
      } catch(e) {}
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX 2: VIDEO UPLOAD PROGRESS BAR (0-100%)
  // ═══════════════════════════════════════════════════════════════
  function ensureUploadProgressUI() {
    if (document.getElementById('upload-progress-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="upload-progress-overlay" class="fixed inset-0 z-[95] hidden bg-black/90 flex flex-col items-center justify-center p-6">
        <div class="w-full max-w-md bg-gray-900 border border-cyan-500/40 rounded-2xl p-6 space-y-4">
          <div class="text-center">
            <div class="text-5xl mb-3" id="upload-icon">📤</div>
            <h2 class="text-base font-bold text-cyan-400 mb-1" id="upload-title">Uploading...</h2>
            <p class="text-xs text-gray-400" id="upload-status">Video upload ho rahi hai...</p>
          </div>
          <div class="w-full bg-gray-800 rounded-full h-4 overflow-hidden border border-gray-700">
            <div id="upload-progress-fill" class="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-200" style="width: 0%"></div>
          </div>
          <div class="text-center">
            <p class="text-2xl font-extrabold text-cyan-400" id="upload-percent">0%</p>
            <p class="text-[10px] text-gray-500 mt-1" id="upload-size"></p>
          </div>
        </div>
      </div>
    `);
  }

  window.__showUploadProgress = function(percent, status) {
    ensureUploadProgressUI();
    const overlay = document.getElementById('upload-progress-overlay');
    const fill = document.getElementById('upload-progress-fill');
    const pct = document.getElementById('upload-percent');
    const statusEl = document.getElementById('upload-status');
    overlay.classList.remove('hidden');
    fill.style.width = percent + '%';
    pct.innerText = percent + '%';
    if (status) statusEl.innerText = status;
  };

  window.__hideUploadProgress = function() {
    const overlay = document.getElementById('upload-progress-overlay');
    if (overlay) overlay.classList.add('hidden');
  };

  // Override publishPost with progress + Firebase sync
  const origPublish = window.publishPost;
  window.publishPost = async function() {
    if (!currentUser) return;
    const cleanCurr = formatHandle(currentUser);
    const caption = document.getElementById('post-caption').value.trim();
    const link = document.getElementById('post-link').value.trim();
    const directUrl = document.getElementById('post-video-url').value.trim();
    let videoUrl = selectedGalleryVideoBase64 || directUrl || null;
    
    if (currentCreateType === 'video' && !videoUrl) {
      toast('Video select karein');
      return;
    }
    if (!caption && !videoUrl) {
      toast('Caption ya media zaroori');
      return;
    }

    // Show progress
    window.__showUploadProgress(0, 'Video prepare ho rahi hai...');
    
    const totalSize = videoUrl ? videoUrl.length : 1000;
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 12 + 3;
      if (progress > 90) progress = 90;
      const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
      window.__showUploadProgress(Math.floor(progress), `Uploading... ${sizeMB} MB`);
    }, 300);

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
      window.__showUploadProgress(100, '✅ Post successful!');
      document.getElementById('upload-icon').innerText = '✅';
      
      setTimeout(() => {
        window.__hideUploadProgress();
        document.getElementById('upload-icon').innerText = '📤';
        closeModal('createModal');
        document.getElementById('post-caption').value = '';
        document.getElementById('post-link').value = '';
        document.getElementById('post-video-url').value = '';
        selectedGalleryVideoBase64 = null;
        document.getElementById('video-preview-box').classList.add('hidden');
        initAppContent();
        if (currentCreateType === 'text') renderFeedPosts();
        toast('✅ Post published!');
      }, 1200);
    } catch(e) {
      clearInterval(interval);
      window.__hideUploadProgress();
      toast('❌ Upload fail: ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX 3: CHANNEL CREATION - Number validation (Pakistani)
  // ═══════════════════════════════════════════════════════════════
  window.finalizeChannelCreation = async function() {
    if (!currentUser) return;
    const cleanCurr = formatHandle(currentUser);
    const name = document.getElementById('chan-name').value.trim();
    const username = document.getElementById('chan-username').value.trim().toLowerCase().replace(/\s+/g, '');
    const phone = document.getElementById('chan-number').value.trim();
    const typeRadio = document.querySelector('input[name="chan-type-radio"]:checked');
    const type = typeRadio ? typeRadio.value : 'public';

    if (!name || !username) { toast('Name aur Username zaroori'); return; }

    // Number validation - Pakistani format
    const phoneClean = phone.replace(/[\s\-\(\)]/g, '');
    const pkPattern = /^(\+92|0092|92|0)?3[0-9]{9}$/;
    if (!pkPattern.test(phoneClean)) {
      toast('❌ Sahi Pakistani number daalein (03XX-XXXXXXX)');
      return;
    }

    const chanId = 'chan_' + username;
    
    // Photo
    const previewEl = document.getElementById('chan-avatar-preview');
    let photo = '';
    if (previewEl && !previewEl.classList.contains('hidden') && previewEl.src) {
      photo = previewEl.src;
    } else {
      photo = `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`;
    }

    const chanData = {
      id: chanId, name: name, username: username, phone: phoneClean,
      photo: photo, type: type, owner: cleanCurr,
      link: `superapp.com/channel/${username}`,
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
      toast('✅ Channel ban gaya: ' + name);
      
      if (typeof window.renderDmInboxList === 'function') {
        try { window.renderDmInboxList(); } catch(e) {}
      }
      if (typeof window.openChannelConversation === 'function') {
        try { window.openChannelConversation(chanId); } catch(e) {}
      }
    } catch(e) {
      toast('❌ Error: ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX 4: CHANNEL TYPING BOX + REACTIONS (Telegram style)
  // ═══════════════════════════════════════════════════════════════
  window.openChannelConversation = function(channelId) {
    activeChannelId = channelId;
    activeChatTargetUser = null;
    const cleanCurr = formatHandle(currentUser);
    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[channelId];
    if (!chan) return;
    
    document.getElementById('chat-target-username').innerText = chan.name;
    document.getElementById('chat-target-subtitle').innerText = `${(chan.subscribers||[]).length} subs • @${chan.username}`;
    document.getElementById('chat-target-avatar').src = chan.photo;
    document.getElementById('dm-inbox-header').classList.add('hidden');
    document.getElementById('dm-inbox-view').classList.add('hidden');
    document.getElementById('dm-thread-header').classList.remove('hidden');
    document.getElementById('dm-thread-view').classList.remove('hidden');
    
    if (chan.owner === cleanCurr) {
      document.getElementById('channel-input-footer').classList.remove('hidden');
      document.getElementById('dm-input-footer').classList.add('hidden');
    } else {
      document.getElementById('channel-input-footer').classList.add('hidden');
      document.getElementById('dm-input-footer').classList.add('hidden');
    }
    
    renderChannelPosts(channelId);
    openModal('dmModal');
  };

  function renderChannelPosts(channelId) {
    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[channelId] || { posts: [] };
    const threadView = document.getElementById('dm-thread-view');
    threadView.innerHTML = '';
    
    if (!chan.posts || chan.posts.length === 0) {
      threadView.innerHTML = `<div class="text-center text-xs text-gray-500 py-12">No posts yet. Owner pehla post kare!</div>`;
      return;
    }
    
    chan.posts.forEach(p => {
      const postDiv = document.createElement('div');
      postDiv.className = 'bg-gray-900 border border-gray-800 p-3 rounded-2xl space-y-2 relative';
      postDiv.dataset.postId = p.id;
      
      let reactionsMarkup = '';
      if (p.reactions && Object.keys(p.reactions).length > 0) {
        const counts = {};
        Object.values(p.reactions).forEach(e => { counts[e] = (counts[e] || 0) + 1; });
        reactionsMarkup = '<div class="flex flex-wrap gap-1.5 pt-1.5 border-t border-gray-800">';
        for (let e in counts) {
          reactionsMarkup += `<span class="px-2 py-0.5 bg-gray-800 rounded-full text-xs border border-gray-700">${e} <b class="text-[10px] text-cyan-400">${counts[e]}</b></span>`;
        }
        reactionsMarkup += '</div>';
      }
      
      postDiv.innerHTML = `
        <div class="flex justify-between items-center text-[10px] text-cyan-400 border-b border-gray-800 pb-1">
          <span>📢 ${chan.name}</span>
          <span class="text-gray-500">${p.time || ''}</span>
        </div>
        ${p.photo ? `<img src="${p.photo}" class="w-full max-h-60 object-cover rounded-xl">` : ''}
        <p class="text-xs text-gray-200" style="white-space: pre-wrap;">${p.text || ''}</p>
        ${reactionsMarkup}
        <div class="flex gap-2 pt-1" data-reactions="${p.id}">
          ${['👍','❤️','🔥','😂','😮','😢'].map(e => 
            `<button onclick="window.__reactChannelPost('${channelId}', '${p.id}', '${e}')" 
                     class="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-sm border border-gray-700">${e}</button>`
          ).join('')}
        </div>
      `;
      threadView.appendChild(postDiv);
    });
    
    threadView.scrollTop = threadView.scrollHeight;
  }

  window.__reactChannelPost = async function(channelId, postId, emoji) {
    const user = getUser();
    if (!user) return;
    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[channelId];
    if (!chan) return;
    const post = (chan.posts || []).find(p => p.id === postId);
    if (!post) return;
    if (!post.reactions) post.reactions = {};
    post.reactions[user] = emoji;
    localStorage.setItem('SUPER_APP_CHANNELS', JSON.stringify(channels));
    try {
      await firebase.firestore().collection('channels').doc(channelId).update({ posts: chan.posts });
    } catch(e) {}
    toast(`Reacted ${emoji}`);
    renderChannelPosts(channelId);
  };

  window.sendChannelPostSubmit = async function() {
    if (!activeChannelId || !currentUser) return;
    const textInput = document.getElementById('channel-message-input');
    const text = textInput.value.trim();
    if (!text && !tempChannelPostPhotoBase64) {
      toast('Text ya photo zaroori');
      return;
    }
    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[activeChannelId];
    if (!chan) return;
    
    const newPost = {
      id: 'cpost_' + Date.now(),
      text: text,
      photo: tempChannelPostPhotoBase64 || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: {}
    };
    if (!chan.posts) chan.posts = [];
    chan.posts.push(newPost);
    localStorage.setItem('SUPER_APP_CHANNELS', JSON.stringify(channels));
    
    try {
      await firebase.firestore().collection('channels').doc(activeChannelId).update({ posts: chan.posts });
    } catch(e) {}
    
    textInput.value = '';
    tempChannelPostPhotoBase64 = null;
    const previewBox = document.getElementById('channel-photo-preview-box');
    if (previewBox) previewBox.classList.add('hidden');
    renderChannelPosts(activeChannelId);
    toast('✅ Post published');
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX 5: TEXT POST - Like/Comment/Share/Subscribe buttons
  // ═══════════════════════════════════════════════════════════════
  const origRenderFeed = window.renderFeedPosts;
  window.renderFeedPosts = function() {
    getVideosFromStorage(function(vids) {
      const container = document.getElementById('posts-container');
      container.innerHTML = '';
      const textPosts = vids.filter(v => !v.url && v.type !== 'video');
      if (textPosts.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-500 text-center py-12">No text posts yet.</p>`;
        return;
      }
      textPosts.forEach(v => {
        const cleanU = formatHandle(v.user);
        const isLiked = (v.likes || []).includes(formatHandle(currentUser));
        const card = document.createElement('div');
        card.className = 'bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3 shadow-xl';
        card.dataset.postId = v.id;
        card.innerHTML = `
          <div class="flex justify-between items-center">
            <div onclick="window.__openProfileFromPost('${cleanU}')" class="flex items-center gap-2 cursor-pointer">
              <img src="${(JSON.parse(localStorage.getItem('SUPER_APP_USERS')||'{}')[cleanU]||{}).avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanU}`}" class="w-8 h-8 rounded-full bg-gray-800">
              <span class="text-xs font-bold text-cyan-400">@${cleanU}</span>
            </div>
            <button onclick="openGiftModal('${cleanU}')" class="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold">🎁 Gift</button>
          </div>
          <p class="text-xs text-gray-200 allow-select leading-relaxed" style="white-space: pre-wrap;">${window.__linkifyText(v.caption || '')}</p>
          ${v.link ? `<a href="${v.link}" target="_blank" class="text-xs text-cyan-400 underline block truncate">${v.link}</a>` : ''}
          
          <div class="flex items-center justify-between border-t border-gray-800 pt-2 text-[11px]">
            <button onclick="window.__likeTextPost('${v.id}')" class="flex items-center gap-1.5 text-${isLiked ? 'red-500' : 'gray-400'} font-semibold">
              <i class="fa-solid fa-heart"></i> <span class="like-count">${(v.likes||[]).length}</span>
            </button>
            <button onclick="window.__commentTextPost('${v.id}')" class="flex items-center gap-1.5 text-gray-400 font-semibold">
              <i class="fa-solid fa-comment"></i> <span>${(v.comments||[]).length}</span>
            </button>
            <button onclick="window.__shareTextPost('${v.id}')" class="flex items-center gap-1.5 text-gray-400 font-semibold">
              <i class="fa-solid fa-share"></i> Share
            </button>
            <button onclick="window.__subscribeUser('${cleanU}')" class="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <i class="fa-solid fa-user-plus"></i> Subscribe
            </button>
          </div>
        `;
        container.appendChild(card);
      });
    });
  };

  window.__linkifyText = function(text) {
    // URLs
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-cyan-400 underline">$1</a>');
    // @mentions
    text = text.replace(/@([a-zA-Z0-9_]+)/g, '<a href="#" onclick="window.__openProfileFromPost(\'$1\'); return false;" class="text-cyan-400 font-bold">@$1</a>');
    return text;
  };

  window.__openProfileFromPost = function(user) {
    if (typeof window.openPublicUserProfileModal === 'function') {
      window.openPublicUserProfileModal(user);
    }
  };

  window.__likeTextPost = function(id) {
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
      try {
        firebase.firestore().collection("posts").doc(id).update({ likes: vid.likes });
      } catch(e) {}
      const card = document.querySelector(`[data-post-id="${id}"]`);
      if (card) {
        const btn = card.querySelector('.fa-heart').parentElement;
        const cnt = btn.querySelector('.like-count');
        btn.className = `flex items-center gap-1.5 text-${idx > -1 ? 'gray-400' : 'red-500'} font-semibold`;
        cnt.innerText = vid.likes.length;
      }
    });
  };

  window.__commentTextPost = function(id) {
    if (typeof window.openCommentsDrawer === 'function') {
      window.openCommentsDrawer(id);
    }
  };

  window.__shareTextPost = function(id) {
    const url = `${window.location.origin}${window.location.pathname}?post=${id}`;
    if (navigator.share) {
      navigator.share({ title: 'Super Sphere', url });
    } else {
      navigator.clipboard.writeText(url);
      toast('✅ Link copied');
    }
  };

  window.__subscribeUser = async function(user) {
    const me = getUser();
    if (!user || me === user) return;
    let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const target = users[user] || {};
    if (!target.subscribersList) target.subscribersList = [];
    const idx = target.subscribersList.indexOf(me);
    if (idx > -1) {
      target.subscribersList.splice(idx, 1);
      toast('Unsubscribed');
    } else {
      target.subscribersList.push(me);
      toast('✅ Subscribed!');
    }
    users[user] = target;
    localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
    try {
      await firebase.firestore().collection('users').doc(user).set({
        subscribersList: target.subscribersList
      }, { merge: true });
    } catch(e) {}
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX 6: REAL AD SHOW (Adsterra iframe or placeholder)
  // ═══════════════════════════════════════════════════════════════
  window.showRealAd = function() {
    // Adsterra ya koi bhi ad iframe
    const adIframe = document.getElementById('ad-iframe-container');
    if (adIframe) {
      adIframe.innerHTML = `
        <iframe src="about:blank" style="width:100%;height:250px;border:0;background:#1e293b;border-radius:12px;"
                srcdoc="<html><body style='margin:0;display:flex;align-items:center;justify-content:center;height:100%;background:linear-gradient(135deg,#1e3a8a,#7c3aed);color:#fff;font-family:system-ui;text-align:center;'><div><h2 style='margin:0;font-size:22px;'>📢 Super Sphere</h2><p style='margin:8px 0;font-size:13px;opacity:0.9;'>Sponsored Ad Space</p><p style='font-size:11px;opacity:0.7;'>Adsterra/AdSense yahan load hoga</p></div></body></html>">
        </iframe>
      `;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX 7: CAMERA PERMISSION (APK mein auto-allow)
  // ═══════════════════════════════════════════════════════════════
  (function requestNativePermissions() {
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      setTimeout(async () => {
        try {
          if (window.Capacitor.Plugins.Camera) {
            const p = await window.Capacitor.Plugins.Camera.checkPermissions();
            if (p.camera !== 'granted') {
              await window.Capacitor.Plugins.Camera.requestPermissions();
            }
          }
        } catch(e) {}
      }, 2000);
    }
  })();

  console.log('✅ superfix.js loaded - 7 fixes active');
})();
