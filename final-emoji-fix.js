// ==========================================
// ⚡ SUPER APP - FINAL EMOJI & REFRESH FIX
// File: final-emoji-fix.js
// ==========================================

(function() {
  'use strict';

  // 1. AUTO REFRESH BAND KAREIN
  // Purane saare timers ko kill karein jo baar baar refresh kar rahe hain
  setTimeout(() => {
    let maxId = setInterval(() => {}, 1000);
    for (let i = 0; i < maxId; i++) {
      clearInterval(i);
    }
    console.log("🛑 Auto-refresh timers stopped.");
  }, 1000);

  // 2. PREMIUM EMOJIS KO HILAO (Animation CSS)
  function injectEmojiCSS() {
    if (document.getElementById('premium-emoji-anim')) return;
    const style = document.createElement('style');
    style.id = 'premium-emoji-anim';
    style.innerHTML = `
      /* Emojis ko hilne ki animation */
      @keyframes smoothPulse {
        0% { transform: scale(1); filter: drop-shadow(0 0 5px gold); }
        50% { transform: scale(1.3); filter: drop-shadow(0 0 15px gold); }
        100% { transform: scale(1); filter: drop-shadow(0 0 5px gold); }
      }
      
      .premium-emoji {
        display: inline-block !important;
        animation: smoothPulse 1.5s infinite ease-in-out !important;
        vertical-align: middle;
        font-size: 1.1em;
      }

      /* Post/Video ke oper se emoji hatane ke liye */
      .reel-item > .premium-emoji, 
      #posts-container > .premium-emoji,
      .video-action-btn .premium-emoji {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 3. PREMIUM CHECK FIX
  // Sirf wahi user emoji use kare jo asli premium ho
  window.isRealPremium = function() {
    if (!currentUser) return false;
    const cleanUser = formatHandle(currentUser);
    const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const u = users[cleanUser] || {};
    
    // Check if premium and expiry is valid
    if (u.isPremium && u.premiumExpiry) {
      if (Date.now() > u.premiumExpiry) return false; // Expire ho gaya
    }
    return u.isPremium === true;
  };

  // 4. OVERRIDE EMOJI PICKER
  window.openPremiumEmojiPicker = function(targetInputId) {
    if (!window.isRealPremium()) {
      showToast("🔒 Sirf Premium users hi emojis use kar sakte hain.");
      openPremiumStore();
      return;
    }
    
    // Agar premium hai toh emojis dikhao (Purana function call karein)
    if (typeof showEmojiPickerUI === 'function') {
      showEmojiPickerUI(targetInputId);
    }
  };

  // 5. OVERRIDE PUBLISH POST (Post ke upar emoji na aaye)
  const originalPublishPost = window.publishPost;
  window.publishPost = async function() {
    // Caption se emojis clean karein (sirf text rakhein)
    const captionInput = document.getElementById('post-caption');
    if (captionInput) {
      // Faltu emoji tags hata dein
      captionInput.value = captionInput.value.replace(/<[^>]*>?/gm, '');
    }
    if (originalPublishPost) {
      await originalPublishPost();
    }
  };

  // 6. REAL PREMIUM BUY (Auto Apply)
  // Buy dabate hi foran premium lag jaye
  window.buyPremiumPlan = async function(tierType) {
    if (!currentUser) { showToast("Pehle login karein!"); return; }
    
    showToast("⏳ Processing Payment...");
    
    // Play Store ke bina test ke liye (Real app mein ye Play Store API se judega)
    setTimeout(() => {
      const cleanUser = formatHandle(currentUser);
      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (!users[cleanUser]) users[cleanUser] = {};
      
      users[cleanUser].isPremium = true;
      users[cleanUser].premiumTier = tierType === 'monthly' ? 'blue' : tierType === 'yearly' ? 'purple' : 'gold';
      users[cleanUser].premiumExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
      
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
      
      showToast(`👑 Premium Activated! (${tierType})`);
      
      const modal = document.getElementById('premiumStoreModal');
      if (modal) modal.remove();
      
      // UI Refresh karne ke liye page reload
      setTimeout(() => window.location.reload(), 1500);

    }, 2000);
  };

  // INIT
  window.addEventListener('load', () => {
    setTimeout(() => {
      injectEmojiCSS();
      console.log("✅ Emoji & Refresh fixes applied!");
    }, 1500);
  });

})();
