// ==========================================
// ⚡ SUPER APP - V4 COMPLETE FIX
// File: superfix-v4.js
// Fixes: Video upload, DM send, Channel list, Performance, Refresh
// ==========================================

(function() {
  'use strict';

  // Wait for all other scripts to load
  window.addEventListener('load', function() {
    setTimeout(applyAllFixes, 2000);
  });

  function applyAllFixes() {
    console.log("🔧 Applying SuperFix V4...");
    fixVideoUpload();
    fixDmSend();
    fixChannelList();
    fixPerformance();
    fixRefreshSystem();
    console.log("✅ SuperFix V4 Applied!");
  }

  // ==========================================
  // FIX 1: VIDEO UPLOAD (Real progress + error handling)
  // ==========================================
  function fixVideoUpload() {

    // Hold file object, not base64
    window.previewGalleryVideo = function(input) {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Check file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
          showToast("⚠️ Video 100MB se choti honi chahiye");
          input.value = '';
          return;
        }
        
        window.__selectedVideoFile = file;
        const url = URL.createObjectURL(file);
        const el = document.getElementById('video-preview-elem');
        if (el) {
          el.src = url;
          document.getElementById('video-preview-box').classList.remove('hidden');
        }
        showToast("✅ Video selected: " + (file.size / 1024 / 1024).toFixed(1) + " MB");
      }
    };

    window.previewUrlVideo = function(url) {
      window.__selectedVideoFile = null;
      if (url.trim()) {
        const el = document.getElementById('video-preview-elem');
        if (el) {
          el.src = url.trim();
          document.getElementById('video-preview-box').classList.remove('hidden');
        }
      }
    };

    window.publishPost = async function() {
      if (!currentUser) { showToast("Pehle login karein!"); return; }
      
      const cleanCurr = formatHandle(currentUser);
      const caption = document.getElementById('post-caption').value.trim();
      const link = document.getElementById('post-link').value.trim();
      const directUrl = document.getElementById('post-video-url').value.trim();
      const publishBtn = document.getElementById('publish-btn');
      
      let videoUrl = directUrl || null;
      
      // Handle video file upload
      if (currentCreateType === 'video' && window.__selectedVideoFile) {
        const file = window.__selectedVideoFile;
        
        // Validate file
        if (!file.type.startsWith('video/')) {
          showToast("❌ Sirf video file upload karein");
          return;
        }
        
        try {
          // Disable button during upload
          publishBtn.disabled = true;
          publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
          
          showUploadProgress('Video cloud par upload ho rahi hai...', 0);
          
          const ext = file.name.split('.').pop() || 'mp4';
          const fileName = 'videos/' + cleanCurr + '/' + Date.now() + '.' + ext;
          const storageRef = storage.ref(fileName);
          
          const uploadTask = storageRef.put(file);
          
          videoUrl = await new Promise((resolve, reject) => {
            let lastProgress = -1;
            
            uploadTask.on('state_changed', 
              (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                if (progress !== lastProgress) {
                  lastProgress = progress;
                  showUploadProgress('Uploading video... ' + progress + '%', progress);
                }
              },
              (error) => {
                console.error("Upload error:", error);
                reject(error);
              },
              async () => {
                try {
                  const url = await uploadTask.snapshot.ref.getDownloadURL();
                  resolve(url);
                } catch(e) {
                  reject(e);
                }
              }
            );
            
            // Timeout after 5 minutes
            setTimeout(() => {
              reject(new Error("Upload timeout (5 min). Internet check karein."));
            }, 300000);
          });
          
          hideUploadProgress();
          showToast('✅ Video upload complete!');
          
        } catch (e) {
          hideUploadProgress();
          console.error("Video upload failed:", e);
          showToast('❌ Upload fail: ' + (e.message || 'Unknown error'));
          publishBtn.disabled = false;
          publishBtn.innerText = "Publish";
          return;
        }
      }
      
      if (currentCreateType === 'video' && !videoUrl) { 
        showToast('Video select karein'); 
        publishBtn.disabled = false;
        publishBtn.innerText = "Publish";
        return; 
      }
      
      if (!caption && !videoUrl) { 
        showToast('Caption ya media zaroori'); 
        publishBtn.disabled = false;
        publishBtn.innerText = "Publish";
        return; 
      }
      
      // Create post
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
      
      // Save locally first
      saveVideoToStorage(newPost);
      
      // Save to Firestore
      try {
        await db.collection("posts").doc(newPost.id).set({
          ...newPost,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('✅ Post duniya bhar mein publish ho gayi!');
      } catch(e) {
        console.error("Firestore save error:", e);
        showToast('⚠️ Local save hua, cloud sync fail: ' + e.message);
      }
      
      // Reset form
      closeModal('createModal');
      document.getElementById('post-caption').value = '';
      document.getElementById('post-link').value = '';
      document.getElementById('post-video-url').value = '';
      window.__selectedVideoFile = null;
      document.getElementById('video-preview-box').classList.add('hidden');
      publishBtn.disabled = false;
      publishBtn.innerText = "Publish";
      
      initAppContent();
      if (currentCreateType === 'text') renderFeedPosts();
    };
  }

  // ==========================================
  // FIX 2: DM SEND BUTTON
  // ==========================================
  function fixDmSend() {
    window.sendDmMessageSubmit = async function() {
      if (!currentUser || !activeChatTargetUser) {
        showToast("Chat open karein pehle");
        return;
      }
      
      const cleanCurr = formatHandle(currentUser);
      const input = document.getElementById('dm-message-input');
      const text = input.value.trim();
      if (!text) return;
      
      const chatKey = [cleanCurr, activeChatTargetUser].sort().join(':');
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Clear input immediately (optimistic)
      input.value = '';
      
      // Show message locally first
      const threadView = document.getElementById('dm-thread-view');
      if (threadView) {
        const bubble = document.createElement('div');
        bubble.className = 'max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ml-auto btn-gradient text-white rounded-br-none';
        bubble.innerHTML = `<p class="allow-select">${text}</p><span class="text-[9px] opacity-70 block text-right mt-1">${time} ⏳</span>`;
        threadView.appendChild(bubble);
        threadView.scrollTop = threadView.scrollHeight;
      }
      
      try {
        await db.collection("dm_messages").add({
          chatKey,
          sender: cleanCurr,
          receiver: activeChatTargetUser,
          text,
          time,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Also save to local chats
        let chats = JSON.parse(localStorage.getItem('SUPER_APP_CHATS') || '{}');
        if (!chats[chatKey]) chats[chatKey] = { messages: [] };
        chats[chatKey].messages.push({ sender: cleanCurr, text, time });
        localStorage.setItem('SUPER_APP_CHATS', JSON.stringify(chats));
        
      } catch(e) {
        console.error('DM send error:', e);
        showToast("❌ Message bheja nahi gaya. Dobara try karein.");
        
        // Fallback local
        let chats = JSON.parse(localStorage.getItem('SUPER_APP_CHATS') || '{}');
        if (!chats[chatKey]) chats[chatKey] = { messages: [] };
        chats[chatKey].messages.push({ sender: cleanCurr, text, time });
        localStorage.setItem('SUPER_APP_CHATS', JSON.stringify(chats));
      }
    };

    // Fix input enter key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && e.target.id === 'dm-message-input') {
        e.preventDefault();
        window.sendDmMessageSubmit();
      }
    });
  }

  // ==========================================
  // FIX 3: CHANNEL LIST SHOW
  // ==========================================
  function fixChannelList() {
    window.finalizeChannelCreation = async function() {
      if (!currentUser) return;
      const cleanCurr = formatHandle(currentUser);
      const name = document.getElementById('chan-name').value.trim();
      const username = document.getElementById('chan-username').value.trim().toLowerCase().replace(/\s+/g, '');
      const phone = document.getElementById('chan-number').value.trim();
      const type = document.querySelector('input[name="chan-type-radio"]:checked').value;
      
      if (!name || !username) { showToast('Name & Username zaroori'); return; }
      
      const chanId = 'chan_' + username;
      const chanData = {
        id: chanId,
        name: name,
        username: username,
        phone: phone,
        photo: window.tempChannelPhotoBase64 || `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
        type: type,
        owner: cleanCurr,
        link: `superapp.com/channel/${username}`,
        subscribers: [cleanCurr],
        pendingRequests: [],
        posts: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      try {
        await db.collection("channels").doc(chanId).set(chanData);
        
        // Save to local storage
        let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
        channels[chanId] = chanData;
        localStorage.setItem('SUPER_APP_CHANNELS', JSON.stringify(channels));
        
        // ⚡ IMPORTANT: Add to local chats so it shows in DM inbox
        let chats = JSON.parse(localStorage.getItem('SUPER_APP_CHATS') || '{}');
        const channelChatKey = cleanCurr + ':channel:' + chanId;
        if (!chats[channelChatKey]) {
          chats[channelChatKey] = { 
            messages: [],
            isChannel: true,
            channelId: chanId,
            channelName: name
          };
          localStorage.setItem('SUPER_APP_CHATS', JSON.stringify(chats));
        }
        
        showToast(`✅ Channel "${name}" ban gaya!`);
        
        closeModal('createChannelStep2Modal');
        
        // Refresh and open channel
        setTimeout(() => {
          renderDmInboxList();
          openChannelConversation(chanId);
        }, 500);
        
      } catch(e) {
        console.error("Channel create error:", e);
        showToast("❌ Channel banane mein error: " + e.message);
      }
    };

    // Enhanced DM inbox rendering
    window.renderDmInboxList = function() {
      if (!currentUser) return;
      const cleanCurr = formatHandle(currentUser);
      let chats = JSON.parse(localStorage.getItem('SUPER_APP_CHATS') || '{}');
      let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const inbox = document.getElementById('dm-inbox-view');
      if (!inbox) return;
      
      inbox.innerHTML = '';
      
      let channelKeys = Object.keys(channels);
      let chatKeys = Object.keys(chats).filter(k => k.includes(cleanCurr) && !k.includes(':channel:'));
      
      if (channelKeys.length === 0 && chatKeys.length === 0) {
        inbox.innerHTML = `<p class="text-xs text-gray-500 text-center py-10">No messages yet. Tap ⋮ → New Contact or Create Channel</p>`;
        return;
      }
      
      // Show channels
      channelKeys.forEach(cKey => {
        const c = channels[cKey];
        if (!c) return;
        const div = document.createElement('div');
        div.className = 'p-3 bg-gray-900 border border-cyan-500/30 rounded-xl flex items-center gap-3 cursor-pointer active:scale-98';
        div.onclick = () => window.openChannelConversation(c.id);
        const lastPost = c.posts && c.posts.length > 0 ? c.posts[c.posts.length - 1] : null;
        div.innerHTML = `
          <img src="${c.photo}" class="w-10 h-10 rounded-full bg-gray-800" onerror="this.src='https://api.dicebear.com/7.x/identicon/svg?seed=${c.id}'">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-cyan-300 truncate">
              <i class="fa-solid fa-bullhorn text-[10px]"></i> ${c.name}
              ${c.owner === cleanCurr ? '<span class="text-[9px] text-amber-400 ml-1">(Owner)</span>' : ''}
            </p>
            <p class="text-[11px] text-gray-400 truncate">${lastPost ? (lastPost.text || '📷 Photo') : 'No posts yet'}</p>
          </div>
          <i class="fa-solid fa-chevron-right text-gray-600 text-xs"></i>
        `;
        inbox.appendChild(div);
      });
      
      // Show direct chats
      chatKeys.forEach(key => {
        const parts = key.split(':');
        const otherUser = parts.find(p => p !== cleanCurr);
        if (!otherUser) return;
        
        const lastMsg = chats[key].messages && chats[key].messages.length > 0 
          ? chats[key].messages[chats[key].messages.length - 1] 
          : null;
        const uAvatar = (users[otherUser] || {}).avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUser}`;
        
        const div = document.createElement('div');
        div.className = 'p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-center gap-3 cursor-pointer active:scale-98';
        div.onclick = () => window.openChatConversation(otherUser);
        div.innerHTML = `
          <img src="${uAvatar}" class="w-10 h-10 rounded-full bg-gray-800">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-white truncate">@${otherUser}</p>
            <p class="text-[11px] text-gray-400 truncate">${lastMsg ? lastMsg.text : 'Tap to chat'}</p>
          </div>
          <i class="fa-solid fa-chevron-right text-gray-600 text-xs"></i>
        `;
        inbox.appendChild(div);
      });
    };

    // Enhanced channel conversation
    window.openChannelConversation = function(channelId) {
      window.activeChannelId = channelId;
      window.activeChatTargetUser = null;
      const cleanCurr = formatHandle(currentUser);
      let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
      const chan = channels[channelId];
      if (!chan) {
        showToast("Channel load nahi hua");
        return;
      }
      
      document.getElementById('chat-target-username').innerText = chan.name;
      document.getElementById('chat-target-subtitle').innerText = `${(chan.subscribers || []).length} subs • @${chan.username}`;
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
  }

  // ==========================================
  // FIX 4: PERFORMANCE (Kill duplicate listeners)
  // ==========================================
  function fixPerformance() {
    // Debounce video rendering
    let renderTimeout = null;
    const originalRender = window.renderVideoReels;
    
    window.renderVideoReels = function(vids) {
      if (renderTimeout) clearTimeout(renderTimeout);
      renderTimeout = setTimeout(() => {
        if (originalRender) originalRender(vids);
      }, 100);
    };
    
    // Auto cleanup listeners on visibility change
    let lastHidden = Date.now();
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        lastHidden = Date.now();
        // Pause all videos
        document.querySelectorAll('#video-feed-container video').forEach(v => {
          try { v.pause(); } catch(e){}
        });
      } else {
        // If hidden for more than 5 min, reload
        if (Date.now() - lastHidden > 5 * 60 * 1000) {
          showToast("🔄 Refresh ho raha hai...");
          setTimeout(() => {
            if (typeof initAppContent === 'function') initAppContent();
          }, 300);
        }
      }
    });
    
    // Reduce Firestore listener load
    window.__originalListeners = window.startAllRealtimeListeners;
    window.startAllRealtimeListeners = function() {
      // Only start once
      if (window.__listenersStarted) return;
      window.__listenersStarted = true;
      if (window.__originalListeners) window.__originalListeners();
    };
  }

  // ==========================================
  // FIX 5: REFRESH SYSTEM (Pull to refresh)
  // ==========================================
  function fixRefreshSystem() {
    // Add pull-to-refresh on main viewport
    const viewport = document.getElementById('app-viewport');
    if (!viewport) return;
    
    let startY = 0;
    let pulling = false;
    
    viewport.addEventListener('touchstart', function(e) {
      if (viewport.scrollTop === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    }, { passive: true });
    
    viewport.addEventListener('touchmove', function(e) {
      if (!pulling) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      if (diff > 100) {
        // Show refresh indicator
        if (!document.getElementById('pull-refresh-indicator')) {
          const indicator = document.createElement('div');
          indicator.id = 'pull-refresh-indicator';
          indicator.className = 'fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-cyan-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg';
          indicator.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Refreshing...';
          document.body.appendChild(indicator);
        }
        pulling = false;
        
        // Refresh
        setTimeout(() => {
          if (typeof initAppContent === 'function') initAppContent();
          if (typeof loadUserData === 'function') loadUserData();
          if (typeof updateWalletUI === 'function') updateWalletUI();
          
          setTimeout(() => {
            const ind = document.getElementById('pull-refresh-indicator');
            if (ind) ind.remove();
            showToast("✅ Refreshed!");
          }, 800);
        }, 300);
      }
    }, { passive: true });
    
    viewport.addEventListener('touchend', function() {
      pulling = false;
    }, { passive: true });
    
    // Also add refresh button in header
    setTimeout(() => {
      const header = document.querySelector('header .flex.gap-2');
      if (header && !document.getElementById('header-refresh-btn')) {
        const btn = document.createElement('button');
        btn.id = 'header-refresh-btn';
        btn.onclick = function() {
          showToast("🔄 Refreshing...");
          if (typeof initAppContent === 'function') initAppContent();
          if (typeof loadUserData === 'function') loadUserData();
          if (typeof updateWalletUI === 'function') updateWalletUI();
          if (typeof renderDmInboxList === 'function') renderDmInboxList();
          setTimeout(() => showToast("✅ Refreshed!"), 800);
        };
        btn.className = 'w-8 h-8 rounded-full bg-gray-800 text-cyan-400 flex items-center justify-center border border-cyan-500/30 active:scale-90';
        btn.innerHTML = '<i class="fa-solid fa-rotate text-xs"></i>';
        header.insertBefore(btn, header.firstChild);
      }
    }, 1500);
  }

  // ==========================================
  // HELPERS (Re-add in case they're missing)
  // ==========================================
  if (typeof window.showUploadProgress !== 'function') {
    window.showUploadProgress = function(text, percent) {
      let overlay = document.getElementById('uploadProgressOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'uploadProgressOverlay';
        overlay.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-80 bg-gray-900 border border-cyan-500 rounded-xl p-3 shadow-2xl';
        overlay.innerHTML = `
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-bold text-cyan-400" id="uploadStatusText">Uploading...</span>
            <span class="text-xs font-bold text-white" id="uploadPercentText">0%</span>
          </div>
          <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-cyan-400 to-pink-500 transition-all" id="uploadProgressFill" style="width:0%"></div>
          </div>
        `;
        document.body.appendChild(overlay);
      }
      overlay.style.display = 'block';
      document.getElementById('uploadStatusText').innerText = text;
      document.getElementById('uploadPercentText').innerText = Math.round(percent) + '%';
      document.getElementById('uploadProgressFill').style.width = percent + '%';
    };
  }

  if (typeof window.hideUploadProgress !== 'function') {
    window.hideUploadProgress = function() {
      const overlay = document.getElementById('uploadProgressOverlay');
      if (overlay) setTimeout(() => { overlay.style.display = 'none'; }, 500);
    };
  }

})();
