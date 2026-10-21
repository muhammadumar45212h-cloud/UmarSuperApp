// ==========================================
// ⚡ SUPER APP - FIX EVERYTHING V8
// File: fix-everything-v8.js
// ==========================================

(function() {
  'use strict';

  // 1. HIDE ANNOYING BUTTONS (Keyboard, Voice, Triggers)
  function hideAnnoyingButtons() {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Zabardasti hide karo in sab ko */
      #voice-record-btn, 
      [onclick*="startVoice"], 
      [onclick*="toggleCustomKeyboard"], 
      #cc-trigger, 
      #ios-trigger-btn, 
      button:has(i.fa-keyboard),
      button:has(i.fa-microphone) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      
      /* DM Header 3 Dots Menu (Ensure it drops up and not cut off) */
      #dm-header-menu {
        top: 55px !important;
        right: 10px !important;
        z-index: 9999 !important;
      }
      
      /* Mini App button wapas lao */
      #header-mini-app-btn { display: flex !important; }
    `;
    document.head.appendChild(style);
  }

  // 2. PREMIUM HEADER & ACTION BUTTONS FIX
  function applyPremiumUI() {
    const style = document.createElement('style');
    style.innerHTML = `
      /* HEADER COLORS */
      header { background: #000 !important; border-bottom: 1px solid #1a1a1a !important; }
      header button { color: #00f2fe !important; border-color: #333 !important; background: #111 !important; }
      header button.text-red-400 { color: #ff0055 !important; border-color: #ff0055 !important; }
      
      /* ACTION BUTTONS (Like, Comment, Share, Gift) - CHOTE SIZE */
      .video-action-btn i { font-size: 20px !important; margin-bottom: 2px !important; }
      .video-action-btn span { font-size: 10px !important; font-weight: 700 !important; }
      .video-action-btn { gap: 2px !important; }

      /* BOTTOM NAVIGATION - DIFFERENT COLORS & GLASS */
      nav {
        background: rgba(15, 15, 15, 0.85) !important;
        backdrop-filter: blur(15px) !important;
        -webkit-backdrop-filter: blur(15px) !important;
        border: 1px solid rgba(255,255,255,0.05) !important;
        border-radius: 25px !important;
        bottom: 15px !important;
        left: 15px !important;
        right: 15px !important;
        padding: 8px 10px !important;
        margin-bottom: env(safe-area-inset-bottom, 0px);
      }
      
      /* Nav Buttons Colors */
      nav button { color: #666 !important; transition: 0.3s; }
      nav button[onclick*="videos"] i { color: #00f2fe !important; }
      nav button[onclick*="feed"] i { color: #a855f7 !important; }
      nav button[onclick*="trading"] i { color: #fbbf24 !important; }
      nav button[onclick*="profile"] i { color: #22c55e !important; }
      
      /* Center Plus Button */
      nav button[onclick*="createModal"] {
        background: linear-gradient(135deg, #ff0055, #ff8a00) !important;
        box-shadow: 0 0 20px rgba(255, 0, 85, 0.6) !important;
        width: 50px !important; height: 50px !important;
        margin-top: -20px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 3. LONG PRESS EMOJI SYSTEM (2 Second Tap)
  function enableLongPressEmoji() {
    function attachLongPress(element) {
      if (!element) return;
      let timer = null;
      
      const startPress = (e) => {
        timer = setTimeout(() => {
          // Trigger Emoji picker after 2 seconds
          if (window.openPremiumEmojiPicker) {
            window.openPremiumEmojiPicker(element.id);
          } else if (window.showEmojiPicker) {
            window.showEmojiPicker(element.id);
          } else {
            showToast("Emoji system loading...");
          }
        }, 2000); 
      };

      const cancelPress = () => {
        if (timer) clearTimeout(timer);
      };

      element.addEventListener('touchstart', startPress, {passive: true});
      element.addEventListener('touchend', cancelPress);
      element.addEventListener('touchmove', cancelPress, {passive: true});
      element.addEventListener('mousedown', startPress);
      element.addEventListener('mouseup', cancelPress);
      element.addEventListener('mouseleave', cancelPress);
    }

    // Attach to common inputs
    setTimeout(() => {
      attachLongPress(document.getElementById('dm-message-input'));
      attachLongPress(document.getElementById('new-comment-input'));
      attachLongPress(document.getElementById('channel-message-input'));
    }, 3000);
  }

  // 4. FIX CHANNEL CREATION (Telegram Style)
  window.finalizeChannelCreation = async function() {
    if (!currentUser) return;
    const cleanCurr = formatHandle(currentUser);
    const name = document.getElementById('chan-name').value.trim();
    const username = document.getElementById('chan-username').value.trim().toLowerCase().replace(/\s+/g, '');
    const phone = document.getElementById('chan-number').value.trim();
    const type = document.querySelector('input[name="chan-type-radio"]:checked').value;
    
    if (!name || !username) { showToast('Name & Username required'); return; }

    const chanId = 'chan_' + username;
    const chanData = {
      id: chanId, name, username, phone,
      photo: window.tempChannelPhotoBase64 || `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
      type, owner: cleanCurr, subscribers: [cleanCurr], posts: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      // 1. Save to Firestore
      await db.collection("channels").doc(chanId).set(chanData);
      
      // 2. Save to Local Storage (Inbox)
      let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
      channels[chanId] = chanData;
      localStorage.setItem('SUPER_APP_CHANNELS', JSON.stringify(channels));
      
      // 3. Save to Local Chats (Taaki DM list mein dikhe)
      let chats = JSON.parse(localStorage.getItem('SUPER_APP_CHATS') || '{}');
      const channelChatKey = cleanCurr + ':channel:' + chanId;
      chats[channelChatKey] = { messages: [], isChannel: true, channelId: chanId };
      localStorage.setItem('SUPER_APP_CHATS', JSON.stringify(chats));

      closeModal('createChannelStep2Modal');
      showToast(`✅ Channel "${name}" created!`);
      
      // Open the channel immediately
      renderDmInboxList();
      openChannelConversation(chanId);
      
    } catch(e) { 
      console.error(e);
      showToast("❌ Error creating channel"); 
    }
  };

  // 5. FIX HANGING & MEMORY LEAKS
  function fixHang() {
    setInterval(() => {
      const container = document.getElementById('video-feed-container');
      if (container) {
        const reels = container.querySelectorAll('.reel-item');
        if (reels.length > 10) {
          for (let i = 0; i < reels.length - 10; i++) reels[i].remove();
        }
      }
    }, 10000);
  }

  // 6. INJECT MINI APPS BUTTON
  function injectMiniAppsBtn() {
    setTimeout(() => {
      const header = document.querySelector('header .flex.gap-2');
      if (header && !document.getElementById('header-mini-app-btn')) {
        const btn = document.createElement('button');
        btn.id = 'header-mini-app-btn';
        btn.onclick = () => { if (window.openMiniAppsDashboard) window.openMiniAppsDashboard(); else showToast("Mini Apps Loading..."); };
        btn.className = 'px-2 py-1 bg-gray-900 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30';
        btn.innerHTML = '<i class="fa-solid fa-cubes"></i>';
        header.insertBefore(btn, header.firstChild);
      }
    }, 2000);
  }

  // INITIALIZE EVERYTHING
  window.addEventListener('load', () => {
    setTimeout(() => {
      hideAnnoyingButtons();
      applyPremiumUI();
      enableLongPressEmoji();
      fixHang();
      injectMiniAppsBtn();
      console.log("🔥 Fix Everything V8 Applied!");
    }, 500);
  });

})();
