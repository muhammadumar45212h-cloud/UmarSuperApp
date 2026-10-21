// ==========================================
// ⚡ SUPER APP - ULTIMATE PREMIUM FIX V7
// File: ultimate-fix-v7.js
// Fixes: Design, Upload, DM, Channels, Size, Language, Hang
// ==========================================

(function() {
  'use strict';

  // 1. PREMIUM DESIGN & ICON SIZE FIX
  function applyPremiumDesign() {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Font Change for Premium Look */
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      body { font-family: 'Inter', sans-serif !important; }
      
      /* Action Buttons Size Fix (Chote aur barabar) */
      .video-action-btn i { font-size: 1.4rem !important; margin-bottom: 2px !important; }
      .video-action-btn span { font-size: 0.7rem !important; font-weight: 600 !important; }
      .video-action-btn { gap: 2px !important; }
      
      /* Premium Glass Cards for DM & Lists */
      .bg-gray-900 { 
        background: rgba(17, 24, 39, 0.7) !important; 
        backdrop-filter: blur(12px) !important; 
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 16px !important;
      }
      
      /* Translate Common Urdu Text to English via CSS (Fallback) */
      /* We will use JS to replace text directly */
      
      /* Hide Unwanted Features */
      #header-mini-app-btn, #voice-record-btn, #cc-trigger { display: none !important; }
      
      /* Make Share Drawer Premium */
      #shareDrawer { background: rgba(17, 24, 39, 0.95) !important; backdrop-filter: blur(20px); border-radius: 24px 24px 0 0 !important; }
    `;
    document.head.appendChild(style);
  }

  // 2. RESET FAKE BALANCE ($5625.68)
  function resetFakeBalance() {
    if (!currentUser) return;
    const cleanUser = formatHandle(currentUser);
    let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const u = users[cleanUser] || {};
    
    // Agar balance 5000 se zyada hai, toh reset karo
    if (u.balanceUsd > 5000) {
      users[cleanUser].balanceUsd = 0;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
      try { db.collection("users").doc(cleanUser).set({ balanceUsd: 0 }, { merge: true }); } catch(e){}
      showToast("⚠️ Fake test balance reset to $0.00");
      setTimeout(() => window.location.reload(), 2000);
    }
  }

  // 3. TRANSLATE UI TO ENGLISH
  function translateToEnglish() {
    const translations = {
      'Sun ke sunao': 'Listen to audio',
      'Kya': 'What',
      'Write something...': 'Write a caption...',
      'Send': 'Send',
      'Post': 'Post',
      'Share & Options': 'Share & Options',
      'Copy Post Link': 'Copy Link',
      'Save Media': 'Save Video',
      'Repost': 'Repost',
      'Report': 'Report',
      'Performance Analytics': 'Analytics',
      'Views': 'Views',
      'Likes': 'Likes',
      'Comments': 'Comments',
      'Abe sale': 'Hey!',
      'Kaise ho': 'How are you?',
      'Choro': 'Leave it',
      'Bhejo': 'Send',
      'Open Wallet & Payments': 'Open Wallet',
      'Themes': 'Themes',
      'Payment History': 'History',
      'Get Premium': 'Get Premium',
      'Admin Wallet': 'Admin Wallet',
      'My Gifts': 'My Gifts'
    };

    setInterval(() => {
      document.querySelectorAll('button, span, p, h3, h2').forEach(el => {
        if (el.children.length > 0) return; // Skip containers
        const text = el.innerText.trim();
        if (translations[text]) {
          el.innerText = translations[text];
        }
      });
    }, 2000);
  }

  // 4. FIX VIDEO UPLOAD (Catbox Upload with real Progress)
  window.publishPost = async function() {
    if (!currentUser) { showToast("Please login first!"); return; }

    const cleanCurr = formatHandle(currentUser);
    const caption = document.getElementById('post-caption').value.trim();
    const link = document.getElementById('post-link').value.trim();
    const directUrl = document.getElementById('post-video-url').value.trim();
    const publishBtn = document.getElementById('publish-btn');

    let videoUrl = directUrl || null;

    // Upload Video to Catbox
    if (currentCreateType === 'video' && window.__videoFile) {
      const file = window.__videoFile;
      try {
        publishBtn.disabled = true;
        publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
        
        // Show Progress Bar
        showUploadProgress('Uploading to Cloud...', 0);

        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', file);

        // Use XHR for Progress
        videoUrl = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', 'https://catbox.moe/user/api.php');
          
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              showUploadProgress('Uploading... ' + percent + '%', percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) resolve(xhr.responseText.trim());
            else reject(new Error("Upload failed"));
          };
          xhr.onerror = () => reject(new Error("Network Error"));
          xhr.send(formData);
        });

        hideUploadProgress();
        showToast('✅ Video Uploaded Successfully!');

      } catch (e) {
        hideUploadProgress();
        showToast('❌ Upload Fail: ' + e.message);
        publishBtn.disabled = false;
        publishBtn.innerText = "Publish";
        return;
      }
    }

    if (currentCreateType === 'video' && !videoUrl) { showToast('Please select a video'); return; }
    if (!caption && !videoUrl) { showToast('Caption or media required'); return; }

    const newPost = { 
      id: 'post_' + Date.now(), type: currentCreateType, url: videoUrl, 
      user: cleanCurr, caption, link: link || null, likes: [], comments: [], views: 0 
    };
    
    saveVideoToStorage(newPost);

    try {
      await db.collection("posts").doc(newPost.id).set({ 
        ...newPost, createdAt: firebase.firestore.FieldValue.serverTimestamp() 
      });
      showToast('✅ Post Published!');
    } catch(e) { console.error(e); }

    closeModal('createModal');
    document.getElementById('post-caption').value = '';
    document.getElementById('post-video-url').value = '';
    window.__videoFile = null;
    document.getElementById('video-preview-box').classList.add('hidden');
    publishBtn.disabled = false;
    publishBtn.innerText = "Publish";
    initAppContent();
  };

  // 5. FIX DM & CHANNELS (Inbox sync)
  window.sendDmMessageSubmit = async function() {
    if (!currentUser || !activeChatTargetUser) { showToast("Open a chat first"); return; }
    
    const cleanCurr = formatHandle(currentUser);
    const input = document.getElementById('dm-message-input');
    const text = input.value.trim();
    if (!text) return;

    const chatKey = [cleanCurr, activeChatTargetUser].sort().join(':');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    input.value = '';

    // 1. Update Local Storage First (Taaki inbox mein turant dikhe)
    let chats = JSON.parse(localStorage.getItem('SUPER_APP_CHATS') || '{}');
    if (!chats[chatKey]) chats[chatKey] = { messages: [] };
    chats[chatKey].messages.push({ sender: cleanCurr, text, time });
    localStorage.setItem('SUPER_APP_CHATS', JSON.stringify(chats));

    // 2. UI Update
    const threadView = document.getElementById('dm-thread-view');
    if (threadView) {
      const bubble = document.createElement('div');
      bubble.className = 'max-w-[75%] p-3 rounded-2xl text-xs ml-auto bg-cyan-600 text-white rounded-br-none mb-2';
      bubble.innerHTML = `<p>${text}</p><span class="text-[9px] opacity-70 block text-right mt-1">${time} ⏳</span>`;
      threadView.appendChild(bubble);
      threadView.scrollTop = threadView.scrollHeight;
    }

    // 3. Send to Firestore
    try {
      await db.collection("dm_messages").add({
        chatKey, sender: cleanCurr, receiver: activeChatTargetUser,
        text, time, timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) { console.error("DB Error: ", e); }
  };

  // Fix Channel Creation (Show in Inbox)
  window.finalizeChannelCreation = async function() {
    if (!currentUser) return;
    const cleanCurr = formatHandle(currentUser);
    const name = document.getElementById('chan-name').value.trim();
    const username = document.getElementById('chan-username').value.trim().toLowerCase().replace(/\s+/g, '');
    const type = document.querySelector('input[name="chan-type-radio"]:checked').value;
    
    if (!name || !username) { showToast('Name & Username required'); return; }
    const chanId = 'chan_' + username;

    const chanData = {
      id: chanId, name, username,
      photo: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
      type, owner: cleanCurr, subscribers: [cleanCurr], posts: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await db.collection("channels").doc(chanId).set(chanData);
      
      let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
      channels[chanId] = chanData;
      localStorage.setItem('SUPER_APP_CHANNELS', JSON.stringify(channels));
      
      // Add to chat list for inbox
      let chats = JSON.parse(localStorage.getItem('SUPER_APP_CHATS') || '{}');
      const channelChatKey = cleanCurr + ':channel:' + chanId;
      chats[channelChatKey] = { messages: [], isChannel: true, channelId: chanId };
      localStorage.setItem('SUPER_APP_CHATS', JSON.stringify(chats));

      closeModal('createChannelStep2Modal');
      showToast(`Channel "${name}" created!`);
      renderDmInboxList();
      openChannelConversation(chanId);
    } catch(e) { console.error(e); }
  };

  // 6. HANG FIX (DOM Cleanup)
  function fixHang() {
    setInterval(() => {
      const container = document.getElementById('video-feed-container');
      if (container) {
        const reels = container.querySelectorAll('.reel-item');
        if (reels.length > 15) {
          for (let i = 0; i < reels.length - 15; i++) reels[i].remove();
        }
      }
    }, 10000); // Every 10 seconds
  }

  // 7. DISABLE BROKEN EDITING
  function disableEditing() {
    window.openVideoEditor = function() {
      showToast("🎬 Video Editor is under maintenance. Coming soon!");
    };
    window.mp4Export = function() { return false; };
  }

  // 8. REPLACE TEXT EMOJIS WITH ICONS
  function replaceEmojisWithIcons() {
    setInterval(() => {
      document.querySelectorAll('button').forEach(btn => {
        if (btn.innerHTML.includes('🎁 Gift')) btn.innerHTML = btn.innerHTML.replace('🎁 Gift', '<i class="fa-solid fa-gift"></i> Gift');
        if (btn.innerHTML.includes('💬')) btn.innerHTML = btn.innerHTML.replace('💬', '<i class="fa-solid fa-comment"></i>');
        if (btn.innerHTML.includes('🔴 Live')) btn.innerHTML = btn.innerHTML.replace('🔴 Live', '<i class="fa-solid fa-tower-broadcast text-red-500"></i> Live');
      });
    }, 3000);
  }

  // INIT ALL
  window.addEventListener('load', () => {
    setTimeout(() => {
      applyPremiumDesign();
      resetFakeBalance();
      translateToEnglish();
      fixHang();
      disableEditing();
      replaceEmojisWithIcons();
      
      // Hide Custom Keyboard UI
      window.toggleCustomKeyboard = () => { showToast("Keyboard feature disabled in premium mode."); };
      window.startVoice = () => { showToast("Voice typing is coming soon!"); };

      console.log("🔥 Ultimate Fix V7 Applied!");
    }, 2000);
  });

})();
