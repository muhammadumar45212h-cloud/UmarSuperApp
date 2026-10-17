// ==========================================
// ⚡ SUPER APP - STRICT PREMIUM SYSTEM
// File: premium-strict.js
// Features: Real Play Billing, Locks, Blue Tick
// ==========================================

(function() {
  'use strict';

  // ⚠️ Play Store IDs yahan lagayein
  const PRODUCTS = {
    monthly:   { id: 'com.supersphere.app.premium_monthly',    price: '$5',   days: 30,   tier: 'blue' },
    quarterly: { id: 'com.supersphere.app.premium_quarterly',  price: '$10',  days: 90,   tier: 'blue' },
    yearly:    { id: 'com.supersphere.app.premium_yearly',     price: '$100', days: 365,  tier: 'purple' },
    lifetime:  { id: 'com.supersphere.app.premium_lifetime',   price: '$500', days: 36500, tier: 'gold' }
  };

  // 1. Check if User is Premium
  window.checkPremiumStatus = function(username) {
    if (!username) return { active: false, tier: null };
    
    const cleanUser = formatHandle(username);
    const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const user = users[cleanUser] || {};

    if (!user.isPremium) return { active: false, tier: null };

    // Expiry check
    if (user.premiumExpiry && Date.now() > user.premiumExpiry) {
      // Expire ho gaya
      user.isPremium = false;
      user.premiumTier = null;
      users[cleanUser] = user;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
      return { active: false, tier: null };
    }

    return { active: true, tier: user.premiumTier || 'blue' };
  };

  // 2. Buy Premium (Strict Payment)
  window.buyPremiumStrict = async function(planType) {
    if (!currentUser) { showToast("Pehle login karein!"); return; }
    const product = PRODUCTS[planType];
    if (!product) return;

    // Check if Capacitor Billing available
    if (!window.Capacitor || !window.Capacitor.Plugins.InAppPurchases) {
      showToast("⚠️ Payment sirf Android App mein kaam karta hai.");
      alert("Payment system only works in the Android app. Please download from Play Store.");
      return;
    }

    const { InAppPurchases } = window.Capacitor.Plugins;

    try {
      showToast("⏳ Play Store khol raha hai...");
      const purchase = await InAppPurchases.purchaseProduct({ productId: product.id });

      showToast("⏳ Payment verify ho rahi hai...");

      // Backend Call (Cloud Function)
      const verifyFunc = firebase.functions().httpsCallable('verifyPlayStorePurchase');
      const result = await verifyFunc({
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken,
        packageName: 'com.umar.superapp', // ⚠️ Apna package name
        isPremium: true,
        premiumTier: product.tier,
        premiumType: planType,
        username: formatHandle(currentUser)
      });

      if (result.data && result.data.success) {
        // Update Local
        const cleanUser = formatHandle(currentUser);
        let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
        if (!users[cleanUser]) users[cleanUser] = {};
        
        users[cleanUser].isPremium = true;
        users[cleanUser].premiumTier = product.tier;
        users[cleanUser].premiumType = planType;
        users[cleanUser].premiumExpiry = Date.now() + (product.days * 24 * 60 * 60 * 1000);
        localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));

        showToast(`👑 Premium Activated!`);
        closeModal('premiumStoreModal');
        updateWalletUI();
        loadUserData();

      } else {
        showToast("❌ Payment verification failed.");
      }

    } catch (e) {
      if (e.code === 'E_USER_CANCELLED') {
        showToast("Purchase cancelled.");
      } else {
        showToast("Payment failed: " + e.message);
      }
    }
  };

  // 3. Premium Store UI (Replaces old one)
  window.openPremiumStore = function() {
    if (!currentUser) { showToast("Pehle login karein!"); return; }

    const existing = document.getElementById('premiumStoreModal');
    if (existing) existing.remove();

    const status = checkPremiumStatus(currentUser);
    const cleanUser = formatHandle(currentUser);

    let modalHTML = `
      <div id="premiumStoreModal" class="fullscreen-modal bg-gray-950 z-[85] overflow-y-auto no-scrollbar">
        <!-- Header -->
        <div class="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-md p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 class="text-sm font-bold text-amber-400 flex items-center gap-2">
            <i class="fa-solid fa-crown"></i> Premium Store
          </h2>
          <button onclick="document.getElementById('premiumStoreModal').remove()" class="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Current Status -->
        ${status.active ? `
          <div class="p-4">
            <div class="rounded-2xl p-4 border ${status.tier === 'gold' ? 'border-amber-500 bg-amber-500/10' : status.tier === 'purple' ? 'border-purple-500 bg-purple-500/10' : 'border-blue-500 bg-blue-500/10'}">
              <div class="flex items-center gap-3">
                <i class="fa-solid fa-check-circle text-2xl ${status.tier === 'gold' ? 'text-amber-500' : status.tier === 'purple' ? 'text-purple-500' : 'text-blue-500'}"></i>
                <div>
                  <p class="text-sm font-bold text-white">Premium Active</p>
                  <p class="text-[10px] text-gray-400">Aapka ${status.tier.toUpperCase()} plan chal raha hai.</p>
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Plans -->
        <div class="p-4 space-y-3 pb-24">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-4">Choose Your Plan</h3>

          <!-- Monthly -->
          <button onclick="buyPremiumStrict('monthly')" class="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl flex items-center justify-between active:scale-98 transition-all hover:border-blue-500">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500 text-xl"><i class="fa-solid fa-check-circle"></i></div>
              <div class="text-left">
                <p class="text-sm font-bold text-white">Monthly</p>
                <p class="text-[10px] text-blue-400">🔵 Blue Tick</p>
              </div>
            </div>
            <p class="text-lg font-extrabold text-white">$5</p>
          </button>

          <!-- Yearly -->
          <button onclick="buyPremiumStrict('yearly')" class="w-full p-4 bg-gradient-to-r from-purple-900/40 to-gray-900 border-2 border-purple-500 rounded-2xl flex items-center justify-between active:scale-98 relative overflow-hidden">
            <span class="absolute top-0 right-0 bg-purple-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg">POPULAR</span>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500 text-xl"><i class="fa-solid fa-check-circle"></i></div>
              <div class="text-left">
                <p class="text-sm font-bold text-white">1 Year</p>
                <p class="text-[10px] text-purple-400">🟣 Purple Tick</p>
              </div>
            </div>
            <p class="text-lg font-extrabold text-white">$100</p>
          </button>

          <!-- Lifetime -->
          <button onclick="buyPremiumStrict('lifetime')" class="w-full p-4 bg-gradient-to-r from-amber-900/40 to-gray-900 border-2 border-amber-500 rounded-2xl flex items-center justify-between active:scale-98 relative overflow-hidden">
            <span class="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg">LEGENDARY</span>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 text-xl"><i class="fa-solid fa-crown"></i></div>
              <div class="text-left">
                <p class="text-sm font-bold text-white">Lifetime</p>
                <p class="text-[10px] text-amber-400">🟡 Gold Tick</p>
              </div>
            </div>
            <p class="text-lg font-extrabold text-white">$500</p>
          </button>
          
          <p class="text-[9px] text-gray-500 text-center mt-4">Payments are processed securely via Google Play.</p>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  };

  // 4. Blue Tick HTML Generator
  window.getStrictBlueTick = function(username) {
    const status = checkPremiumStatus(username);
    if (!status.active) return '';

    const colors = { blue: '#3b82f6', purple: '#a855f7', gold: '#fbbf24' };
    const color = colors[status.tier] || colors.blue;
    
    return `<span class="inline-flex items-center justify-center w-4 h-4 ml-1" style="color: ${color}; filter: drop-shadow(0 0 2px ${color});">
      <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </span>`;
  };

  // Patch UI to add ticks
  window.addEventListener('load', () => {
    // Jab bhi koi post/video render ho, tick add karein
    const originalRenderReels = window.renderVideoReels;
    if (originalRenderReels) {
      window.renderVideoReels = function(vids) {
        originalRenderReels(vids);
        setTimeout(() => {
          document.querySelectorAll('.text-cyan-400').forEach(el => {
            const text = el.innerText;
            if (text.includes('@') && !el.querySelector('svg')) {
              const u = text.replace('@', '').trim();
              el.innerHTML = text + getStrictBlueTick(u);
            }
          });
        }, 300);
      };
    }
  });

})();
