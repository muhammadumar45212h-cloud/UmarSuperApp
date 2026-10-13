// ==========================================
// ⚡ SUPER APP - PREMIUM & BLUE TICK SYSTEM
// File: blue-tick.js
// Features: Tiers, Animated Emojis, Themes, Locking
// ==========================================

(function() {
  'use strict';

  // ==========================================
  // 1. CONFIGURATION
  // ==========================================

  // ⚠️ PLAY STORE PRODUCT IDs - BAAD MEIN BHAREIN
  const PREMIUM_PRODUCTS = {
    monthly:   { id: 'com.supersphere.app.premium_monthly',    price: '$5',   days: 30,   tier: 'blue',   label: 'Monthly' },
    quarterly: { id: 'com.supersphere.app.premium_quarterly',  price: '$10',  days: 90,   tier: 'blue',   label: '3 Months' },
    yearly:    { id: 'com.supersphere.app.premium_yearly',     price: '$100', days: 365,  tier: 'purple', label: '1 Year' },
    lifetime:  { id: 'com.supersphere.app.premium_lifetime',   price: '$500', days: 36500, tier: 'gold',  label: 'Lifetime' }
  };

  // Premium Emojis (Sirf premium use kar sakta hai)
  const PREMIUM_EMOJIS = [
    { emoji: '💎', name: 'Diamond', anim: 'pulse' },
    { emoji: '👑', name: 'Crown', anim: 'glow' },
    { emoji: '🔥', name: 'Fire', anim: 'flame' },
    { emoji: '⭐', name: 'Star', anim: 'twinkle' },
    { emoji: '✨', name: 'Sparkles', anim: 'shimmer' },
    { emoji: '🚀', name: 'Rocket', anim: 'launch' },
    { emoji: '💯', name: 'Hundred', anim: 'bounce' },
    { emoji: '🏆', name: 'Trophy', anim: 'shine' },
    { emoji: '🎯', name: 'Target', anim: 'spin' },
    { emoji: '⚡', name: 'Lightning', anim: 'flash' },
    { emoji: '🌟', name: 'Glow Star', anim: 'glow' },
    { emoji: '💫', name: 'Dizzy', anim: 'spin' },
    { emoji: '🎁', name: 'Gift', anim: 'shake' },
    { emoji: '🥳', name: 'Party', anim: 'bounce' },
    { emoji: '😎', name: 'Cool', anim: 'shine' },
    { emoji: '🤩', name: 'Star Eyes', anim: 'glow' }
  ];

  // Premium Themes (Gallery)
  const PREMIUM_THEMES = [
    { id: 'default',     name: 'Dark (Free)',      bg: '#090d16', accent: '#00f2fe', locked: false },
    { id: 'ocean',       name: 'Ocean Blue',       bg: '#0a1628', accent: '#38bdf8', locked: true },
    { id: 'sunset',      name: 'Sunset Orange',    bg: '#1a0f0a', accent: '#fb923c', locked: true },
    { id: 'forest',      name: 'Forest Green',     bg: '#0a1a0f', accent: '#4ade80', locked: true },
    { id: 'royal',       name: 'Royal Purple',     bg: '#150a1f', accent: '#a855f7', locked: true },
    { id: 'rose',        name: 'Rose Pink',        bg: '#1f0a14', accent: '#f472b6', locked: true },
    { id: 'cyberpunk',   name: 'Cyberpunk',        bg: '#0a0a1a', accent: '#ec4899', locked: true },
    { id: 'gold',        name: 'Royal Gold',       bg: '#1a1408', accent: '#fbbf24', locked: true },
    { id: 'matrix',      name: 'Matrix Green',     bg: '#000000', accent: '#22c55e', locked: true },
    { id: 'neon',        name: 'Neon Purple',      bg: '#0d0014', accent: '#c084fc', locked: true }
  ];

  // Blue Tick Colors (Tier based)
  const TIER_COLORS = {
    blue:   { color: '#00b4d8', name: 'Verified Blue',   emoji: '🔵' },
    purple: { color: '#a855f7', name: 'Verified Purple', emoji: '🟣' },
    gold:   { color: '#fbbf24', name: 'Verified Gold',   emoji: '🟡' }
  };

  // ==========================================
  // 2. PREMIUM STATE MANAGER
  // ==========================================

  window.PremiumState = {
    // Check if user has active premium
    isActive: function(username) {
      if (!username) return false;
      const cleanUser = formatHandle(username);
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const user = users[cleanUser] || {};
      
      if (!user.isPremium || !user.premiumTier) return false;
      
      // Check expiry
      if (user.premiumExpiry) {
        const expiry = user.premiumExpiry.toMillis ? user.premiumExpiry.toMillis() : new Date(user.premiumExpiry).getTime();
        if (Date.now() > expiry) {
          // Expired - revoke
          PremiumState.revoke(cleanUser);
          return false;
        }
      }
      
      return true;
    },

    // Get tier info
    getTier: function(username) {
      const cleanUser = formatHandle(username);
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const user = users[cleanUser] || {};
      return user.premiumTier || null;
    },

    // Grant premium
    grant: async function(username, tierType) {
      const cleanUser = formatHandle(username);
      const product = PREMIUM_PRODUCTS[tierType];
      if (!product) return false;

      const now = Date.now();
      const expiryMs = now + (product.days * 24 * 60 * 60 * 1000);
      const expiryDate = new Date(expiryMs);

      // Save to Firestore
      try {
        await db.collection("users").doc(cleanUser).set({
          isPremium: true,
          premiumTier: product.tier,
          premiumType: tierType,
          premiumStart: firebase.firestore.FieldValue.serverTimestamp(),
          premiumExpiry: firebase.firestore.Timestamp.fromDate(expiryDate),
          premiumLabel: product.label
        }, { merge: true });
      } catch(e) { console.error("Premium grant error:", e); }

      // Save to local
      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (!users[cleanUser]) users[cleanUser] = {};
      users[cleanUser].isPremium = true;
      users[cleanUser].premiumTier = product.tier;
      users[cleanUser].premiumType = tierType;
      users[cleanUser].premiumExpiry = expiryMs;
      users[cleanUser].premiumLabel = product.label;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));

      showToast(`👑 ${product.label} Premium activate! ` + product.price);
      return true;
    },

    // Revoke premium
    revoke: function(username) {
      const cleanUser = formatHandle(username);
      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (users[cleanUser]) {
        users[cleanUser].isPremium = false;
        users[cleanUser].premiumTier = null;
        users[cleanUser].premiumType = null;
        users[cleanUser].premiumExpiry = null;
        localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
      }
      try {
        db.collection("users").doc(cleanUser).set({
          isPremium: false,
          premiumTier: null,
          premiumType: null,
          premiumExpiry: null
        }, { merge: true });
      } catch(e) {}
    }
  };

  // ==========================================
  // 3. BLUE TICK RENDERING
  // ==========================================

  // Get HTML for blue tick badge
  window.getBlueTickHTML = function(username, size = 'small') {
    if (!PremiumState.isActive(username)) return '';
    const tier = PremiumState.getTier(username);
    const info = TIER_COLORS[tier] || TIER_COLORS.blue;
    
    const sizeClass = size === 'large' ? 'w-6 h-6 text-sm' : 'w-4 h-4 text-[10px]';
    
    // Gold tier gets animated star
    const anim = tier === 'gold' ? 'animate-pulse' : '';
    
    return `<span class="inline-flex items-center justify-center ${sizeClass} ${anim}" style="color: ${info.color};" title="${info.name}">
      <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full drop-shadow">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
      </svg>
    </span>`;
  };

  // ==========================================
  // 4. PREMIUM EMOJI RENDERING (Animated)
  // ==========================================

  window.getPremiumEmojiHTML = function(emoji) {
    const found = PREMIUM_EMOJIS.find(e => e.emoji === emoji);
    if (!found) return emoji;
    
    const animStyle = {
      'pulse': 'animation: premiumPulse 1.5s ease-in-out infinite;',
      'glow': 'animation: premiumGlow 2s ease-in-out infinite;',
      'flame': 'animation: premiumFlame 1s ease-in-out infinite;',
      'twinkle': 'animation: premiumTwinkle 1.5s ease-in-out infinite;',
      'shimmer': 'animation: premiumShimmer 2s ease-in-out infinite;',
      'launch': 'animation: premiumLaunch 1.5s ease-in-out infinite;',
      'bounce': 'animation: premiumBounce 1s ease-in-out infinite;',
      'shine': 'animation: premiumShine 2s ease-in-out infinite;',
      'spin': 'animation: premiumSpin 3s linear infinite;',
      'flash': 'animation: premiumFlash 1s ease-in-out infinite;',
      'shake': 'animation: premiumShake 0.5s ease-in-out infinite;'
    };
    
    return `<span class="premium-emoji" style="${animStyle[found.anim] || ''} display: inline-block; font-size: 1.2em; filter: drop-shadow(0 0 4px rgba(255,200,0,0.5));">${emoji}</span>`;
  };

  // Inject animation CSS
  function injectPremiumAnimations() {
    if (document.getElementById('premium-animations-css')) return;
    const style = document.createElement('style');
    style.id = 'premium-animations-css';
    style.innerHTML = `
      @keyframes premiumPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.3); } }
      @keyframes premiumGlow { 0%,100% { filter: drop-shadow(0 0 3px gold); } 50% { filter: drop-shadow(0 0 10px gold); } }
      @keyframes premiumFlame { 0%,100% { transform: scale(1) rotate(-3deg); } 50% { transform: scale(1.15) rotate(3deg); } }
      @keyframes premiumTwinkle { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }
      @keyframes premiumShimmer { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.8) saturate(1.5); } }
      @keyframes premiumLaunch { 0% { transform: translateY(0); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0); } }
      @keyframes premiumBounce { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-6px) scale(1.1); } }
      @keyframes premiumShine { 0%,100% { filter: drop-shadow(0 0 2px gold); transform: rotate(-5deg); } 50% { filter: drop-shadow(0 0 12px gold); transform: rotate(5deg); } }
      @keyframes premiumSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes premiumFlash { 0%,100% { opacity: 1; filter: brightness(1); } 50% { opacity: 0.3; filter: brightness(2); } }
      @keyframes premiumShake { 0%,100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
      
      .premium-emoji { display: inline-block; }
      .blue-tick-badge { display: inline-flex; align-items: center; }
      .premium-locked { position: relative; }
      .premium-locked::after {
        content: '🔒';
        position: absolute;
        top: -4px;
        right: -4px;
        font-size: 10px;
        background: rgba(0,0,0,0.7);
        border-radius: 50%;
        padding: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================================
  // 5. PREMIUM STORE UI
  // ==========================================

  window.openPremiumStore = function() {
    if (!currentUser) { showToast("Pehle login karein!"); return; }

    // Remove existing modal if any
    const existing = document.getElementById('premiumStoreModal');
    if (existing) existing.remove();

    const cleanUser = formatHandle(currentUser);
    const isPremium = PremiumState.isActive(cleanUser);
    const userTier = PremiumState.getTier(cleanUser);
    const tierInfo = userTier ? TIER_COLORS[userTier] : null;

    const modal = document.createElement('div');
    modal.id = 'premiumStoreModal';
    modal.className = 'fullscreen-modal bg-gray-950 overflow-y-auto no-scrollbar';
    
    modal.innerHTML = `
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gradient-to-b from-gray-900 to-gray-950 p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 class="text-sm font-bold text-amber-400 flex items-center gap-2">
          <i class="fa-solid fa-crown text-amber-400"></i> Premium Store
        </h2>
        <button onclick="document.getElementById('premiumStoreModal').remove()" class="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Current Status -->
      ${isPremium ? `
        <div class="p-4">
          <div class="rounded-2xl p-4 border-2" style="border-color: ${tierInfo.color}; background: linear-gradient(135deg, ${tierInfo.color}15, transparent);">
            <div class="flex items-center gap-3">
              ${window.getBlueTickHTML(cleanUser, 'large')}
              <div class="flex-1">
                <p class="text-sm font-bold text-white">${tierInfo.name} Active</p>
                <p class="text-[10px] text-gray-300">Aapka premium active hai ✨</p>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Hero Section -->
      <div class="p-4 pt-2">
        <div class="rounded-2xl p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-purple-600/10 border border-amber-500/30">
          <h3 class="text-lg font-extrabold text-white text-center">Unlock Premium 👑</h3>
          <p class="text-[11px] text-gray-300 text-center mt-1">Verified Blue Tick + Animated Emojis + Exclusive Themes</p>
          <div class="grid grid-cols-3 gap-2 mt-4">
            <div class="text-center">
              <div class="text-2xl">✅</div>
              <p class="text-[9px] text-gray-400 mt-1">Verified Badge</p>
            </div>
            <div class="text-center">
              <div class="text-2xl">✨</div>
              <p class="text-[9px] text-gray-400 mt-1">Animated Emojis</p>
            </div>
            <div class="text-center">
              <div class="text-2xl">🎨</div>
              <p class="text-[9px] text-gray-400 mt-1">10+ Themes</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Plans -->
      <div class="p-4 space-y-3 pb-24">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Choose Your Plan</h3>

        <!-- Monthly - Blue -->
        <button onclick="buyPremiumPlan('monthly')" class="w-full p-4 bg-gray-900 border border-blue-500/40 rounded-2xl hover:border-blue-400 transition-all active:scale-98 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center">
              <i class="fa-solid fa-check-circle text-white text-xl"></i>
            </div>
            <div class="text-left">
              <p class="text-sm font-bold text-white">Monthly</p>
              <p class="text-[10px] text-blue-400">🔵 Blue Verified Tick</p>
              <p class="text-[9px] text-gray-500">30 days access</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-lg font-extrabold text-white">$5</p>
            <p class="text-[9px] text-gray-500">/month</p>
          </div>
        </button>

        <!-- Quarterly - Blue (Popular) -->
        <button onclick="buyPremiumPlan('quarterly')" class="relative w-full p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-blue-500 rounded-2xl active:scale-98 flex items-center justify-between">
          <span class="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[9px] font-bold px-3 py-0.5 rounded-full">💎 BEST VALUE</span>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center">
              <i class="fa-solid fa-check-circle text-white text-xl"></i>
            </div>
            <div class="text-left">
              <p class="text-sm font-bold text-white">3 Months</p>
              <p class="text-[10px] text-blue-400">🔵 Blue Verified Tick</p>
              <p class="text-[9px] text-emerald-400">Save $5 (33% off)</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-lg font-extrabold text-white">$10</p>
            <p class="text-[9px] text-gray-500">/3 months</p>
          </div>
        </button>

        <!-- Yearly - Purple -->
        <button onclick="buyPremiumPlan('yearly')" class="relative w-full p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/40 rounded-2xl hover:border-purple-400 active:scale-98 flex items-center justify-between">
          <span class="absolute -top-2 right-4 bg-purple-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">👑 PRO</span>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
              <i class="fa-solid fa-check-circle text-white text-xl"></i>
            </div>
            <div class="text-left">
              <p class="text-sm font-bold text-white">1 Year</p>
              <p class="text-[10px] text-purple-400">🟣 Purple Verified Tick</p>
              <p class="text-[9px] text-emerald-400">Best for creators</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-lg font-extrabold text-white">$100</p>
            <p class="text-[9px] text-gray-500">/year</p>
          </div>
        </button>

        <!-- Lifetime - Gold -->
        <button onclick="buyPremiumPlan('lifetime')" class="relative w-full p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border-2 border-amber-400 rounded-2xl active:scale-98 flex items-center justify-between overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
          <span class="absolute -top-2 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">🏆 LEGENDARY</span>
          <div class="relative flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center animate-pulse">
              <i class="fa-solid fa-crown text-white text-xl"></i>
            </div>
            <div class="text-left">
              <p class="text-sm font-bold text-white">Lifetime</p>
              <p class="text-[10px] text-amber-400">🟡 Gold Verified Tick</p>
              <p class="text-[9px] text-amber-300">Forever access + all features</p>
            </div>
          </div>
          <div class="relative text-right">
            <p class="text-lg font-extrabold text-amber-400">$500</p>
            <p class="text-[9px] text-gray-500">one-time</p>
          </div>
        </button>
      </div>

      <div class="px-4 pb-6">
        <p class="text-[9px] text-gray-500 text-center">
          <i class="fa-solid fa-lock"></i> Secure payment via Google Play Store
        </p>
      </div>
    `;

    document.body.appendChild(modal);
  };

  // ==========================================
  // 6. BUY PREMIUM (Play Store Billing)
  // ==========================================

  window.buyPremiumPlan = async function(tierType) {
    if (!currentUser) { showToast("Pehle login karein!"); return; }

    const product = PREMIUM_PRODUCTS[tierType];
    if (!product) { showToast("Invalid plan"); return; }

    // Check product ID set hai ya nahi
    if (!product.id || product.id.includes('xxx')) {
      showToast("⚠️ Product ID set nahi hai. Baad mein try karein.");
      return;
    }

    // Browser mode: Test
    if (!window.Capacitor || !window.Capacitor.Plugins.InAppPurchases) {
      const confirmTest = confirm(
        "🧪 TEST MODE\n\n" +
        `${product.label} Premium (${product.price})\n\n` +
        "Test ke liye free activate karein?"
      );
      if (confirmTest) {
        await PremiumState.grant(currentUser, tierType);
        const modal = document.getElementById('premiumStoreModal');
        if (modal) modal.remove();
        updateWalletUI();
      }
      return;
    }

    // Real Play Store billing
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
          packageName: 'com.supersphere.app', // ⚠️ Apna package name
          isPremium: true,
          premiumTier: product.tier,
          premiumType: tierType,
          username: formatHandle(currentUser)
        });

        if (result.data && result.data.success) {
          await PremiumState.grant(currentUser, tierType);
          const modal = document.getElementById('premiumStoreModal');
          if (modal) modal.remove();
          updateWalletUI();
        }
      } catch(e) {
        console.error("Verify error:", e);
        // Fallback: grant locally
        await PremiumState.grant(currentUser, tierType);
        const modal = document.getElementById('premiumStoreModal');
        if (modal) modal.remove();
      }
    } catch (e) {
      if (e.code === 'E_USER_CANCELLED') {
        showToast("Purchase cancel kar diya");
      } else {
        showToast("Payment fail: " + e.message);
      }
    }
  };

  // ==========================================
  // 7. PREMIUM EMOJI PICKER
  // ==========================================

  window.openPremiumEmojiPicker = function(targetInputId) {
    if (!currentUser) { showToast("Pehle login karein!"); return; }
    
    const cleanUser = formatHandle(currentUser);
    const isPremium = PremiumState.isActive(cleanUser);

    // Remove existing
    const existing = document.getElementById('premiumEmojiPicker');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'premiumEmojiPicker';
    modal.className = 'fixed inset-0 z-[70] bg-black/90 flex items-end';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    const emojiGrid = PREMIUM_EMOJIS.map(e => {
      const locked = !isPremium;
      return `
        <button onclick="${locked ? 'showPremiumLockedMessage()' : `insertPremiumEmoji('${e.emoji}', '${targetInputId}')`}" 
          class="p-3 bg-gray-800 border ${locked ? 'border-gray-700 opacity-50' : 'border-amber-500/40 hover:border-amber-400'} rounded-xl flex flex-col items-center transition-all active:scale-90 relative">
          <span class="text-2xl ${locked ? '' : 'premium-emoji'}" style="${locked ? '' : 'animation: premiumPulse 1.5s infinite;'}">${e.emoji}</span>
          <span class="text-[8px] text-gray-400 mt-1">${e.name}</span>
          ${locked ? '<span class="absolute top-1 right-1 text-[10px]">🔒</span>' : ''}
        </button>
      `;
    }).join('');

    modal.innerHTML = `
      <div class="w-full bg-gray-900 rounded-t-3xl max-h-[70vh] overflow-hidden border-t border-amber-500/40">
        <div class="p-4 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h3 class="text-sm font-bold text-amber-400 flex items-center gap-2">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Premium Emojis
            </h3>
            <p class="text-[9px] text-gray-500 mt-0.5">${isPremium ? '✅ Premium Active - All emojis unlocked' : '🔒 Premium required to use'}</p>
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
              👑 Unlock All Emojis - Get Premium
            </button>
          ` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  };

  window.showPremiumLockedMessage = function() {
    showToast("🔒 Premium required. Store se unlock karein.");
  };

  window.insertPremiumEmoji = function(emoji, targetInputId) {
    const input = document.getElementById(targetInputId);
    if (input) {
      input.value += emoji;
      input.focus();
    }
    const picker = document.getElementById('premiumEmojiPicker');
    if (picker) picker.remove();
  };

  // ==========================================
  // 8. PREMIUM THEMES
  // ==========================================

  window.openThemeGallery = function() {
    if (!currentUser) { showToast("Pehle login karein!"); return; }

    const cleanUser = formatHandle(currentUser);
    const isPremium = PremiumState.isActive(cleanUser);

    const existing = document.getElementById('themeGalleryModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'themeGalleryModal';
    modal.className = 'fullscreen-modal bg-gray-950 overflow-y-auto no-scrollbar';

    const themesHTML = PREMIUM_THEMES.map(t => {
      const locked = t.locked && !isPremium;
      return `
        <button onclick="${locked ? 'showPremiumLockedMessage()' : `applyTheme('${t.id}')`}" 
          class="relative p-3 rounded-2xl border-2 ${locked ? 'border-gray-800 opacity-60' : 'border-cyan-500/40 hover:border-cyan-400'} active:scale-95 transition-all overflow-hidden"
          style="background: ${t.bg};">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full" style="background: ${t.accent}; box-shadow: 0 0 15px ${t.accent}80;"></div>
            <div class="text-left">
              <p class="text-xs font-bold text-white">${t.name}</p>
              <p class="text-[9px]" style="color: ${t.accent}">${t.locked ? '👑 Premium' : 'Free'}</p>
            </div>
          </div>
          ${locked ? '<span class="absolute top-2 right-2 text-sm">🔒</span>' : ''}
        </button>
      `;
    }).join('');

    modal.innerHTML = `
      <div class="sticky top-0 z-10 bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 class="text-sm font-bold text-cyan-400 flex items-center gap-2">
          <i class="fa-solid fa-palette"></i> Theme Gallery
        </h2>
        <button onclick="document.getElementById('themeGalleryModal').remove()" class="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="p-4">
        <p class="text-[10px] text-gray-400 mb-3">${isPremium ? '✅ All themes unlocked' : '🔒 Unlock premium themes with premium'}</p>
        <div class="grid grid-cols-2 gap-3">${themesHTML}</div>
        ${!isPremium ? `
          <button onclick="document.getElementById('themeGalleryModal').remove(); openPremiumStore();" 
            class="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-xl">
            👑 Unlock All Themes - Get Premium
          </button>
        ` : ''}
      </div>
    `;

    document.body.appendChild(modal);
  };

  window.applyTheme = function(themeId) {
    const theme = PREMIUM_THEMES.find(t => t.id === themeId);
    if (!theme) return;
    
    document.body.style.backgroundColor = theme.bg;
    
    // Apply accent color to key elements
    const root = document.documentElement;
    root.style.setProperty('--accent-blue', theme.accent);
    
    if (currentUser) {
      const cleanUser = formatHandle(currentUser);
      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (!users[cleanUser]) users[cleanUser] = {};
      users[cleanUser].theme = themeId;
      users[cleanUser].themeBg = theme.bg;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
      
      try {
        db.collection("users").doc(cleanUser).set({ theme: themeId, themeBg: theme.bg }, { merge: true });
      } catch(e) {}
    }
    
    showToast(`🎨 Theme applied: ${theme.name}`);
    const modal = document.getElementById('themeGalleryModal');
    if (modal) modal.remove();
  };

  // ==========================================
  // 9. ENHANCED UI - INJECT BUTTONS & BADGES
  // ==========================================

  function injectPremiumUI() {
    // Wait for user to be logged in
    if (!currentUser) return;
    
    const cleanUser = formatHandle(currentUser);
    const isPremium = PremiumState.isActive(cleanUser);
    const tier = PremiumState.getTier(cleanUser);
    const tierInfo = tier ? TIER_COLORS[tier] : null;

    // 1. Add Crown button in header (next to refresh)
    setTimeout(() => {
      const header = document.querySelector('header .flex.gap-2');
      if (header && !document.getElementById('header-premium-btn')) {
        const btn = document.createElement('button');
        btn.id = 'header-premium-btn';
        btn.onclick = () => window.openPremiumStore();
        btn.className = isPremium 
          ? 'px-2 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 active:scale-90'
          : 'px-2 py-1.5 rounded-full text-xs font-bold border border-amber-500/40 text-amber-400 flex items-center gap-1 active:scale-90 bg-amber-500/10';
        if (isPremium) {
          btn.style.borderColor = tierInfo.color;
          btn.style.color = tierInfo.color;
          btn.style.background = tierInfo.color + '20';
        }
        btn.innerHTML = `<i class="fa-solid fa-crown"></i>`;
        btn.title = isPremium ? `${tierInfo.name} Active` : 'Get Premium';
        header.insertBefore(btn, header.firstChild);
      }
    }, 500);

    // 2. Add Blue Tick next to username everywhere
    setTimeout(() => {
      // Profile page
      const profileName = document.getElementById('profile-display-name');
      if (profileName && !profileName.querySelector('.blue-tick-badge')) {
        profileName.innerHTML = `@${cleanUser} ` + window.getBlueTickHTML(cleanUser, 'large');
      }
    }, 500);

    // 3. Add "Premium" button in Settings
    setTimeout(() => {
      const settingsModal = document.getElementById('settingsModal');
      if (settingsModal && !document.getElementById('settings-premium-section')) {
        const premiumSection = document.createElement('div');
        premiumSection.id = 'settings-premium-section';
        premiumSection.className = 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/40 rounded-xl p-4 space-y-3';
        premiumSection.innerHTML = `
          <h3 class="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
            <i class="fa-solid fa-crown"></i> Premium
          </h3>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-300">Status:</span>
            <span class="text-xs font-bold" style="color: ${isPremium ? tierInfo.color : '#9ca3af'};">
              ${isPremium ? '✅ ' + tierInfo.name + ' Active' : '❌ Not Premium'}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openPremiumStore()" class="py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg">
              <i class="fa-solid fa-crown"></i> ${isPremium ? 'Manage' : 'Upgrade'}
            </button>
            <button onclick="openThemeGallery()" class="py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold rounded-lg">
              <i class="fa-solid fa-palette"></i> Themes
            </button>
          </div>
        `;
        
        // Insert after wallet section
        const walletSection = settingsModal.querySelector('.bg-gray-900');
        if (walletSection && walletSection.nextSibling) {
          walletSection.parentNode.insertBefore(premiumSection, walletSection.nextSibling);
        }
      }
    }, 500);
  }

  // Patch video rendering to add blue ticks
  function patchVideoRendering() {
    const originalRender = window.renderVideoReels;
    if (!originalRender) return;
    
    window.renderVideoReels = function(vids) {
      originalRender.call(this, vids);
      
      // Add blue ticks to all video usernames
      setTimeout(() => {
        document.querySelectorAll('#video-feed-container video').forEach(v => {
          const reel = v.closest('.reel-item');
          if (!reel) return;
          
          const userDiv = reel.querySelector('.text-cyan-400');
          if (userDiv && !userDiv.querySelector('.blue-tick-badge')) {
            const username = userDiv.innerText.replace('@', '').trim();
            if (username) {
              const tickHTML = window.getBlueTickHTML(username, 'small');
              if (tickHTML) userDiv.innerHTML += ' ' + tickHTML;
            }
          }
        });
      }, 100);
    };
  }

  // Patch feed posts
  function patchFeedPosts() {
    const originalRender = window.renderFeedPosts;
    if (!originalRender) return;
    
    window.renderFeedPosts = function() {
      originalRender.call(this);
      
      setTimeout(() => {
        document.querySelectorAll('#posts-container .text-cyan-400').forEach(el => {
          if (el.querySelector('.blue-tick-badge')) return;
          const username = el.innerText.replace('@', '').trim();
          if (username) {
            const tickHTML = window.getBlueTickHTML(username, 'small');
            if (tickHTML) el.innerHTML += ' ' + tickHTML;
          }
        });
      }, 100);
    };
  }

  // Patch DM messages
  function patchDmRendering() {
    const originalRender = window.renderDmMessagesFromCloud;
    if (!originalRender) return;
    
    window.renderDmMessagesFromCloud = function(messages) {
      originalRender.call(this, messages);
      
      setTimeout(() => {
        document.querySelectorAll('#dm-thread-view .text-cyan-400, #dm-thread-view b').forEach(el => {
          if (el.querySelector('.blue-tick-badge')) return;
          const username = el.innerText.replace('@', '').replace(':', '').trim();
          if (username && username.length < 30) {
            const tickHTML = window.getBlueTickHTML(username, 'small');
            if (tickHTML) el.innerHTML += ' ' + tickHTML;
          }
        });
      }, 100);
    };
  }

  // ==========================================
  // 10. EMOTION PICKER PATCH (Add Premium Button)
  // ==========================================

  function patchEmojiPicker() {
    // Add premium emoji button to comment input
    setTimeout(() => {
      const commentInput = document.getElementById('new-comment-input');
      if (commentInput && !document.getElementById('premium-emoji-btn-comment')) {
        const btn = document.createElement('button');
        btn.id = 'premium-emoji-btn-comment';
        btn.onclick = () => window.openPremiumEmojiPicker('new-comment-input');
        btn.className = 'px-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded text-xs font-bold text-white';
        btn.innerHTML = '✨';
        commentInput.parentNode.insertBefore(btn, commentInput.nextSibling);
      }
      
      const dmInput = document.getElementById('dm-message-input');
      if (dmInput && !document.getElementById('premium-emoji-btn-dm')) {
        const btn = document.createElement('button');
        btn.id = 'premium-emoji-btn-dm';
        btn.onclick = () => window.openPremiumEmojiPicker('dm-message-input');
        btn.className = 'p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white';
        btn.innerHTML = '✨';
        dmInput.parentNode.insertBefore(btn, dmInput.nextSibling);
      }
      
      const channelInput = document.getElementById('channel-message-input');
      if (channelInput && !document.getElementById('premium-emoji-btn-channel')) {
        const btn = document.createElement('button');
        btn.id = 'premium-emoji-btn-channel';
        btn.onclick = () => window.openPremiumEmojiPicker('channel-message-input');
        btn.className = 'p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white';
        btn.innerHTML = '✨';
        channelInput.parentNode.insertBefore(btn, channelInput.nextSibling);
      }
    }, 2000);
  }

  // ==========================================
  // 11. CHECK EXPIRY PERIODICALLY
  // ==========================================

  function startExpiryChecker() {
    setInterval(() => {
      if (!currentUser) return;
      const cleanUser = formatHandle(currentUser);
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const user = users[cleanUser] || {};
      
      if (user.isPremium && user.premiumExpiry) {
        if (Date.now() > user.premiumExpiry) {
          PremiumState.revoke(cleanUser);
          showToast("⏰ Premium expire ho gaya. Renew karein!");
          // Refresh UI
          const premiumBtn = document.getElementById('header-premium-btn');
          if (premiumBtn) premiumBtn.remove();
          setTimeout(injectPremiumUI, 500);
        }
      }
    }, 60000); // Check every minute
  }

  // ==========================================
  // 12. INITIALIZATION
  // ==========================================

  function initPremiumSystem() {
    console.log("👑 Initializing Premium System...");
    
    injectPremiumAnimations();
    injectPremiumUI();
    patchVideoRendering();
    patchFeedPosts();
    patchDmRendering();
    patchEmojiPicker();
    startExpiryChecker();
    
    // Re-inject when user changes
    setInterval(() => {
      const cleanUser = formatHandle(currentUser);
      if (!document.getElementById('header-premium-btn') && currentUser) {
        injectPremiumUI();
      }
    }, 5000);
    
    console.log("✅ Premium System Ready!");
  }

  // Wait for app to load
  window.addEventListener('load', function() {
    setTimeout(initPremiumSystem, 3000);
  });

})();
