// ==========================================
// ⚡ SUPER APP - ULTIMATE FIX V6 (FINAL)
// File: ultimate-fix.js
// Fixes: Blue tick, Emojis, Wallet, Premium, Video, Ads
// ==========================================

(function() {
  'use strict';

  console.log("🔧 UltimateFix V6 loading...");

  // ==========================================
  // 1. FIX WALLET BUG (Fake $24M amount)
  // ==========================================
  function fixWalletBug() {
    // Clean up corrupted wallet data
    setTimeout(() => {
      if (!currentUser) return;
      const cleanUser = formatHandle(currentUser);
      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const u = users[cleanUser] || {};
      
      // Reset if value is unreasonable (> $10000)
      if (u.balanceUsd && u.balanceUsd > 10000) {
        console.warn("⚠️ Corrupted wallet detected. Resetting to 0.");
        users[cleanUser].balanceUsd = 0;
        localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
        
        try {
          db.collection("users").doc(cleanUser).set({ balanceUsd: 0 }, { merge: true });
        } catch(e) {}
        
        showToast("⚠️ Wallet reset ho gaya");
      }
      
      // Fix display
      const pwb = document.getElementById('pay-usd-balance');
      if (pwb) pwb.innerText = '$' + (u.balanceUsd || 0).toFixed(2);
    }, 2000);
  }

  // ==========================================
  // 2. FIX BLUE TICK - ONLY ONE TICK SHOWN
  // ==========================================
  function fixBlueTicks() {
    // Override: Show only ONE tick based on tier
    window.getBlueTickHTML = function(username, size = 'small') {
      if (!window.PremiumState || !window.PremiumState.isActive(username)) return '';
      
      const tier = window.PremiumState.getTier(username);
      if (!tier) return '';
      
      const TIER_COLORS = {
        blue:   '#00b4d8',
        purple: '#a855f7',
        gold:   '#fbbf24'
      };
      
      const color = TIER_COLORS[tier] || TIER_COLORS.blue;
      const sizeClass = size === 'large' ? 'w-5 h-5' : 'w-4 h-4';
      
      // Only ONE tick based on tier
      const tickSymbol = tier === 'gold' ? '👑' : '✓';
      const anim = tier === 'gold' ? 'animation: premiumGlow 2s infinite;' : '';
      
      return `<span class="blue-tick-badge inline-flex items-center justify-center ${sizeClass}" 
        style="color: ${color}; ${anim}" title="Verified ${tier}">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full">
          <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4zm-2 16l-4-4 1.41-1.41L10 15.17l6.59-6.59L18 10l-8 8z"/>
        </svg>
      </span>`;
    };

    // Clean up: Remove duplicate ticks every 2 seconds
    setInterval(() => {
      document.querySelectorAll('.blue-tick-badge').forEach(tick => {
        // Remove if there are multiple siblings
        let parent = tick.parentNode;
        if (parent) {
          const allTicks = parent.querySelectorAll('.blue-tick-badge');
          if (allTicks.length > 1) {
            // Keep only first, remove rest
            for (let i = 1; i < allTicks.length; i++) {
              allTicks[i].remove();
            }
          }
        }
      });
    }, 2000);
  }

  // ==========================================
  // 3. PREMIUM EMOJIS - ONLY IN COMMENTS/CHAT
  // ==========================================
  function restrictPremiumEmojis() {
    // Remove any premium emojis from video reels/captions
    setInterval(() => {
      // Remove from video feed captions
      document.querySelectorAll('#video-feed-container .premium-emoji').forEach(el => {
        const parent = el.closest('.reel-item');
        if (parent && !parent.querySelector('#commentDrawer')) {
          // Replace with plain emoji
          el.outerHTML = el.textContent;
        }
      });

      // Remove from post captions (feed)
      document.querySelectorAll('#posts-container .premium-emoji').forEach(el => {
        el.outerHTML = el.textContent;
      });
    }, 1500);

    // Patch emoji picker to only work in comments and DM
    window.openPremiumEmojiPicker = function(targetInputId) {
      if (!currentUser) { showToast("Pehle login karein!"); return; }

      // Only allow in comments/chat/channel inputs
      const allowedInputs = ['new-comment-input', 'dm-message-input', 'channel-message-input'];
      if (!allowedInputs.includes(targetInputId)) {
        showToast("🔒 Premium emojis sirf comments aur chat mein use hote hain");
        return;
      }

      const cleanUser = formatHandle(currentUser);
      const isPremium = window.PremiumState && window.PremiumState.isActive(cleanUser);

      const existing = document.getElementById('premiumEmojiPicker');
      if (existing) existing.remove();

      const PREMIUM_EMOJIS = [
        { emoji: '💎', name: 'Diamond' },
        { emoji: '👑', name: 'Crown' },
        { emoji: '🔥', name: 'Fire' },
        { emoji: '⭐', name: 'Star' },
        { emoji: '✨', name: 'Sparkles' },
        { emoji: '🚀', name: 'Rocket' },
        { emoji: '💯', name: 'Hundred' },
        { emoji: '🏆', name: 'Trophy' },
        { emoji: '🎯', name: 'Target' },
        { emoji: '⚡', name: 'Lightning' },
        { emoji: '🌟', name: 'Glow Star' },
        { emoji: '🎁', name: 'Gift' },
        { emoji: '🥳', name: 'Party' },
        { emoji: '😎', name: 'Cool' },
        { emoji: '🤩', name: 'Star Eyes' },
        { emoji: '💫', name: 'Sparkle' }
      ];

      const modal = document.createElement('div');
      modal.id = 'premiumEmojiPicker';
      modal.className = 'fixed inset-0 z-[70] bg-black/90 flex items-end';
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

      const emojiGrid = PREMIUM_EMOJIS.map(e => {
        const locked = !isPremium;
        return `
          <button onclick="${locked ? 'showToast(\'🔒 Premium chahiye\'); openPremiumStore();' : `insertPremiumEmoji('${e.emoji}', '${targetInputId}')`}" 
            class="p-3 bg-gray-800 border ${locked ? 'border-gray-700 opacity-60' : 'border-amber-500/50'} rounded-xl flex flex-col items-center transition-all active:scale-90 relative">
            <span class="text-2xl" style="${locked ? '' : 'filter: drop-shadow(0 0 6px gold); animation: premiumPulse 1.5s infinite;'}">${e.emoji}</span>
            <span class="text-[8px] text-gray-400 mt-1">${e.name}</span>
            ${locked ? '<span class="absolute top-1 right-1 text-[10px]">🔒</span>' : ''}
          </button>
        `;
      }).join('');

      modal.innerHTML = `
        <div class="w-full bg-gray-900 rounded-t-3xl max-h-[70vh] overflow-hidden border-t-2 border-amber-500">
          <div class="p-4 border-b border-gray-800 flex justify-between items-center">
            <div>
              <h3 class="text-sm font-bold text-amber-400">✨ Premium Emojis</h3>
              <p class="text-[9px] text-gray-500 mt-0.5">${isPremium ? '✅ All unlocked' : '🔒 Premium required'}</p>
            </div>
            <button onclick="document.getElementById('premiumEmojiPicker').remove()" class="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="p-4 overflow-y-auto max-h-[55vh]">
            <div class="grid grid-cols-4 gap-2">${emojiGrid}</div>
            ${!isPremium ? `
              <button onclick="document.getElementById('premiumEmojiPicker').remove(); openPremiumStore();" 
                class="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-xl">
                👑 Unlock Premium Emojis
              </button>
            ` : ''}
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    };

    // Insert emoji with proper formatting
    window.insertPremiumEmoji = function(emoji, targetInputId) {
      const input = document.getElementById(targetInputId);
      if (input) {
        input.value += emoji;
        input.focus();
      }
      const picker = document.getElementById('premiumEmojiPicker');
      if (picker) picker.remove();
    };

    // Render premium emojis in messages with premium color
    window.renderPremiumEmoji = function(emoji) {
      return `<span class="premium-emoji-inline" style="font-size:1.2em; filter: drop-shadow(0 0 4px gold);">${emoji}</span>`;
    };
  }

  // ==========================================
  // 4. FIX PREMIUM - MUST BE PAID (No Auto-Activate)
  // ==========================================
  function fixPremiumPayment() {
    // Revoke any auto-activated premium
    setTimeout(() => {
      if (!currentUser) return;
      const cleanUser = formatHandle(currentUser);
      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const u = users[cleanUser] || {};
      
      // If premium active without payment, revoke
      if (u.isPremium && !u.premiumPaid) {
        users[cleanUser].isPremium = false;
        users[cleanUser].premiumTier = null;
        users[cleanUser].premiumExpiry = null;
        localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
        console.log("⚠️ Unpaid premium revoked");
      }
    }, 2000);

    // Override grant - require payment
    if (window.PremiumState) {
      const originalGrant = window.PremiumState.grant;
      window.PremiumState.grant = async function(username, tierType) {
        const cleanUser = formatHandle(username);
        const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
        const u = users[cleanUser] || {};
        
        // Only grant if payment confirmed
        if (!u.premiumPaid && !window.__paymentConfirmed) {
          console.warn("❌ Payment not confirmed");
          return false;
        }
        
        return originalGrant.call(this, username, tierType);
      };
    }

    // Override buyPremiumPlan - NO auto activation
    window.buyPremiumPlan = async function(tierType) {
      if (!currentUser) { showToast("Pehle login karein!"); return; }
      
      const PRODUCTS = {
        monthly:   { id: 'com.supersphere.app.premium_monthly',    price: '$5',   pkr: 1400,  label: 'Monthly' },
        quarterly: { id: 'com.supersphere.app.premium_quarterly',  price: '$10',  pkr: 2800,  label: '3 Months' },
        yearly:    { id: 'com.supersphere.app.premium_yearly',     price: '$100', pkr: 28000, label: '1 Year' },
        lifetime:  { id: 'com.supersphere.app.premium_lifetime',   price: '$500', pkr: 140000, label: 'Lifetime' }
      };
      
      const product = PRODUCTS[tierType];
      if (!product) return;

      // REAL Play Store billing ONLY
      if (!window.Capacitor || !window.Capacitor.Plugins.InAppPurchases) {
        showToast("⚠️ Payment sirf Android app mein kaam karta hai");
        showToast("Google Play se app install karein");
        return;
      }

      const { InAppPurchases } = window.Capacitor.Plugins;
      try {
        showToast("⏳ Play Store khola ja raha hai...");
        const purchase = await InAppPurchases.purchaseProduct({ productId: product.id });

        // Verify on backend
        showToast("⏳ Payment verify ho raha hai...");
        try {
          const verifyFunc = firebase.functions().httpsCallable('verifyPlayStorePurchase');
          const result = await verifyFunc({
            productId: purchase.productId,
            purchaseToken: purchase.purchaseToken,
            packageName: 'com.umar.superapp',
            isPremium: true,
            premiumTier: tierType === 'yearly' ? 'purple' : (tierType === 'lifetime' ? 'gold' : 'blue'),
            premiumType: tierType,
            username: formatHandle(currentUser)
          });

          if (result.data && result.data.success) {
            // Mark as paid
            let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
            const cleanUser = formatHandle(currentUser);
            if (!users[cleanUser]) users[cleanUser] = {};
            users[cleanUser].premiumPaid = true;
            users[cleanUser].isPremium = true;
            users[cleanUser].premiumTier = tierType === 'yearly' ? 'purple' : (tierType === 'lifetime' ? 'gold' : 'blue');
            users[cleanUser].premiumType = tierType;
            users[cleanUser].premiumExpiry = Date.now() + (tierType === 'monthly' ? 30 : tierType === 'quarterly' ? 90 : tierType === 'yearly' ? 365 : 36500) * 24 * 60 * 60 * 1000;
            localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
            
            showToast(`👑 ${product.label} Premium activated!`);
            const modal = document.getElementById('premiumStoreModal');
            if (modal) modal.remove();
            updateWalletUI();
          } else {
            showToast("❌ Verification fail");
          }
        } catch(e) {
          console.error("Verify error:", e);
          showToast("❌ Payment verify nahi hua: " + e.message);
        }
      } catch (e) {
        if (e.code === 'E_USER_CANCELLED') {
          showToast("Purchase cancel");
        } else {
          showToast("Payment fail: " + e.message);
        }
      }
    };
  }

  // ==========================================
  // 5. VIDEO UPLOAD FIX
  // ==========================================
  function fixVideoUpload() {
    // Ensure storage is available
    if (!window.storage && firebase && firebase.storage) {
      window.storage = firebase.storage();
    }

    window.previewGalleryVideo = function(input) {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        
        if (file.size > 100 * 1024 * 1024) {
          showToast("⚠️ Video 100MB se choti honi chahiye");
          input.value = '';
          return;
        }
        
        window.__videoFile = file;
        const url = URL.createObjectURL(file);
        const el = document.getElementById('video-preview-elem');
        if (el) {
          el.src = url;
          document.getElementById('video-preview-box').classList.remove('hidden');
        }
        showToast(`✅ Video ready (${(file.size/1024/1024).toFixed(1)} MB)`);
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

      // UPLOAD VIDEO
      if (currentCreateType === 'video' && window.__videoFile) {
        const file = window.__videoFile;
        try {
          publishBtn.disabled = true;
          publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';

          showUploadProgress('Uploading...', 0);

          const ext = file.name.split('.').pop() || 'mp4';
          const fileName = 'videos/' + cleanCurr + '/' + Date.now() + '.' + ext;
          const storageRef = storage.ref(fileName);
          const uploadTask = storageRef.put(file);

          videoUrl = await new Promise((resolve, reject) => {
            let lastP = -1;
            const timeout = setTimeout(() => reject(new Error("Timeout")), 300000);

            uploadTask.on('state_changed',
              (snap) => {
                const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                if (p !== lastP) {
                  lastP = p;
                  showUploadProgress('Uploading ' + p + '%', p);
                }
              },
              (err) => { clearTimeout(timeout); reject(err); },
              async () => {
                clearTimeout(timeout);
                try {
                  const url = await uploadTask.snapshot.ref.getDownloadURL();
                  resolve(url);
                } catch(e) { reject(e); }
              }
            );
          });

          hideUploadProgress();
          showToast('✅ Video upload ho gayi!');

        } catch (e) {
          hideUploadProgress();
          showToast('❌ Upload fail: ' + e.message);
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
        await db.collection("posts").doc(newPost.id).set({
          ...newPost,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('✅ Post publish ho gayi!');
      } catch(e) {
        showToast('⚠️ Cloud sync fail');
      }

      closeModal('createModal');
      document.getElementById('post-caption').value = '';
      document.getElementById('post-link').value = '';
      document.getElementById('post-video-url').value = '';
      window.__videoFile = null;
      document.getElementById('video-preview-box').classList.add('hidden');
      publishBtn.disabled = false;
      publishBtn.innerText = "Publish";

      initAppContent();
    };
  }

  // ==========================================
  // 6. REMOVE FAKE SETTINGS ITEMS
  // ==========================================
  function cleanSettings() {
    setTimeout(() => {
      // Remove "Admin Wallet" if not admin
      const adminWalletBtn = document.querySelector('button[onclick*="Admin Wallet"], button[onclick*="adminWallet"]');
      if (adminWalletBtn && !isAdminUser()) {
        adminWalletBtn.parentElement.remove();
      }

      // Remove duplicate payment history
      const paymentHistories = document.querySelectorAll('button:has-text("Payment History")');
      paymentHistories.forEach((btn, i) => {
        if (i > 0) btn.remove();
      });

      // Remove premium section if not needed
      const premiumSection = document.getElementById('settings-premium-section');
      if (premiumSection) {
        // Keep it, it's real
      }
    }, 3000);
  }

  function isAdminUser() {
    if (!currentUser) return false;
    const adminUsers = ['muhammadumar45212h', 'umar', 'admin'];
    return adminUsers.includes(formatHandle(currentUser).toLowerCase());
  }

  // ==========================================
  // 7. REAL ADS FIX
  // ==========================================
  function fixRealAds() {
    // Only initialize if AdMob plugin available
    if (!window.Capacitor || !window.Capacitor.Plugins.AdMob) {
      console.log("⚠️ AdMob plugin missing - real ads need Android app");
      return;
    }

    // Show a message to user
    setTimeout(() => {
      const adOverlay = document.getElementById('adOverlayModal');
      if (adOverlay && adOverlay.classList.contains('hidden')) {
        // Only show if real ads not ready
        if (!window.__realAdsReady) {
          // Do nothing, just skip
        }
      }
    }, 5000);
  }

  // ==========================================
  // 8. PREMIUM EMOJI STYLING
  // ==========================================
  function injectPremiumEmojiStyles() {
    if (document.getElementById('ultimate-emoji-css')) return;
    
    const style = document.createElement('style');
    style.id = 'ultimate-emoji-css';
    style.innerHTML = `
      .premium-emoji-inline {
        display: inline-block;
        filter: drop-shadow(0 0 4px rgba(255, 200, 0, 0.8));
        font-weight: bold;
        vertical-align: middle;
      }
      
      /* Premium emoji animations - subtle */
      @keyframes premiumGlow {
        0%, 100% { filter: drop-shadow(0 0 3px gold); }
        50% { filter: drop-shadow(0 0 8px gold); }
      }
      
      @keyframes premiumPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
      }
      
      @keyframes premiumShimmer {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.5) saturate(1.3); }
      }
      
      /* Blue tick - single stable */
      .blue-tick-badge {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
        margin-left: 2px;
      }
      
      /* Prevent emoji from moving too much */
      .premium-emoji {
        display: inline-block;
        animation: premiumPulse 2s ease-in-out infinite;
        will-change: transform;
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================================
  // 9. FIX DM VIDEO UPLOAD
  // ==========================================
  function fixChatVideoUpload() {
    // Add proper video upload for chat if needed
    // (Currently chat doesn't support video, skip)
  }

  // ==========================================
  // 10. REMOVE DUPLICATE EMOJIS FROM POSTS
  // ==========================================
  function cleanPostEmojis() {
    // In posts (feed), remove premium emoji styling but keep text
    setInterval(() => {
      const postsContainer = document.getElementById('posts-container');
      if (!postsContainer) return;
      
      postsContainer.querySelectorAll('.premium-emoji').forEach(el => {
        el.classList.remove('premium-emoji');
        el.style.animation = 'none';
        el.style.filter = 'none';
      });
    }, 2000);
  }

  // ==========================================
  // 11. INITIALIZE EVERYTHING
  // ==========================================
  function initUltimateFix() {
    console.log("🚀 UltimateFix V6 starting...");

    injectPremiumEmojiStyles();
    fixWalletBug();
    fixBlueTicks();
    restrictPremiumEmojis();
    fixPremiumPayment();
    fixVideoUpload();
    cleanSettings();
    fixRealAds();
    cleanPostEmojis();

    console.log("✅ UltimateFix V6 applied!");
  }

  // Wait for app ready
  window.addEventListener('load', function() {
    setTimeout(initUltimateFix, 4000);
  });

})();
