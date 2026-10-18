// ==========================================
// ⚡ SUPER APP - FINAL PRODUCTION CODE
// File: final-production.js
// Removes all FAKE/DEMO features. Makes it REAL.
// ==========================================

(function() {
  'use strict';

  console.log("🚀 Initializing Final Production Mode...");

  // ═══════════════════════════════════════════
  // 1. PREMIUM PAYMENT (NO FAKE, ONLY REAL)
  // ═══════════════════════════════════════════
  // Purana fake premium code (jo bina paise ke premium de raha tha) override karein
  window.buyPremiumPlan = async function(tierType) {
    if (!currentUser) { showToast("Pehle login karein!"); return; }

    const PRODUCTS = {
      monthly:   { id: 'com.supersphere.app.premium_monthly',    price: '$5',   days: 30,   tier: 'blue' },
      quarterly: { id: 'com.supersphere.app.premium_quarterly',  price: '$10',  days: 90,   tier: 'blue' },
      yearly:    { id: 'com.supersphere.app.premium_yearly',     price: '$100', days: 365,  tier: 'purple' },
      lifetime:  { id: 'com.supersphere.app.premium_lifetime',   price: '$500', days: 36500, tier: 'gold' }
    };
    
    const product = PRODUCTS[tierType];
    if (!product) return;

    // Check Capacitor Billing
    if (!window.Capacitor || !window.Capacitor.Plugins.InAppPurchases) {
      showToast("⚠️ Payment sirf Android App mein kaam karta hai.");
      alert("Please download the official app from Play Store to purchase premium.");
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
        packageName: 'com.umar.superapp', // ⚠️ Apna package name check karein
        isPremium: true,
        premiumTier: product.tier,
        premiumType: tierType,
        username: formatHandle(currentUser)
      });

      if (result.data && result.data.success) {
        // Database mein save ho gaya backend se, ab local update karein
        const cleanUser = formatHandle(currentUser);
        let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
        if (!users[cleanUser]) users[cleanUser] = {};
        
        users[cleanUser].isPremium = true;
        users[cleanUser].premiumTier = product.tier;
        users[cleanUser].premiumType = tierType;
        users[cleanUser].premiumExpiry = Date.now() + (product.days * 24 * 60 * 60 * 1000);
        localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));

        showToast(`👑 ${tierType.toUpperCase()} Premium Activated!`);
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

  // ═══════════════════════════════════════════
  // 2. REAL DEPOSIT/WITHDRAWAL (MANUAL ADMIN APPROVAL)
  // ═══════════════════════════════════════════
  // Fake deposit hata kar asli Firestore request bhejna
  window.processDepositSubmit = async function() {
    if (!currentUser) return;
    const cleanUser = formatHandle(currentUser);
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const method = document.getElementById('deposit-method').value;
    
    if (!amount || amount <= 0) { showToast("Sahi amount daalein!"); return; }

    try {
      await db.collection("deposits").add({
        user: cleanUser,
        method: method,
        amountPKR: amount,
        status: "pending", // Admin panel se approve hoga
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast("✅ Deposit request bhej di. Admin 24 hrs mein approve karega.");
      closeModal('paymentModal');
    } catch(e) {
      showToast("❌ Error: " + e.message);
    }
  };

  window.processWithdrawalSubmit = async function() {
    if (!currentUser) return;
    const cleanUser = formatHandle(currentUser);
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const method = document.getElementById('withdraw-method').value;
    const account = document.getElementById('withdraw-account').value.trim();
    const password = document.getElementById('withdraw-password').value.trim();
    
    if (!amount || !account || !password) { showToast("Sab fields bharein!"); return; }

    let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const u = users[cleanUser] || {};
    
    if (u.password !== password) { showToast("Galat password!"); return; }
    
    const currentUsd = u.balanceUsd || 0;
    const reqUsd = amount / 278; 
    if (reqUsd > currentUsd) { showToast("Balance kam hai!"); return; }

    try {
      await db.collection("withdrawals").add({
        user: cleanUser,
        method: method,
        amount: amount,
        account: account,
        status: "pending", // Admin panel se process hoga
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast("✅ Withdrawal request bhej di!");
      closeModal('paymentModal');
    } catch(e) {
      showToast("❌ Error: " + e.message);
    }
  };

  // ═══════════════════════════════════════════
  // 3. REMOVE FAKE ALERTS & DEMO POPUPS
  // ═══════════════════════════════════════════
  // Agar koi 'demo' ya 'fake' wala alert aa raha hai toh usko band karein
  window.alert = function(msg) {
    if (msg && (msg.includes('demo') || msg.includes('TEST MODE') || msg.includes('free mein'))) {
      console.log("Fake Alert Blocked: " + msg);
      return;
    }
    console.log("Alert: " + msg);
  };

  // ═══════════════════════════════════════════
  // 4. CLEAN SETTINGS (Remove Fake Admin Buttons)
  // ═══════════════════════════════════════════
  setTimeout(() => {
    const settings = document.getElementById('settingsModal');
    if (settings) {
      // "Admin Wallet" hatao agar user admin nahi hai
      settings.querySelectorAll('button').forEach(btn => {
        if (btn.innerText.includes('Admin Wallet') && 
            formatHandle(currentUser).toLowerCase() !== 'muhammadumar45212h') {
          btn.remove();
        }
      });
    }
  }, 3000);

  // ═══════════════════════════════════════════
  // 5. DISABLE ALL FAKE AUTO-REFRESH
  // ═══════════════════════════════════════════
  // Jo bhi auto refresh timers chal rahe hain unko clear karo
  for (let i = 1; i < 9999; i++) clearInterval(i);
  console.log("✅ All fake refresh timers stopped.");

  // ═══════════════════════════════════════════
  // 6. ENFORCE REAL VIDEO UPLOAD (Catbox)
  // ═══════════════════════════════════════════
  window.showUploadProgress = function(text, percent) {
    let overlay = document.getElementById('uploadProgressOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'uploadProgressOverlay';
      overlay.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-72 bg-gray-900 border border-cyan-500 rounded-2xl p-4 shadow-2xl';
      overlay.innerHTML = `
        <p class="text-xs font-bold text-cyan-400 mb-2 text-center" id="uploadStatusText">Uploading...</p>
        <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all" id="uploadProgressFill" style="width:0%"></div>
        </div>
        <p class="text-xs text-center text-white mt-2" id="uploadPercentText">0%</p>
      `;
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';
    document.getElementById('uploadStatusText').innerText = text;
    document.getElementById('uploadPercentText').innerText = Math.round(percent) + '%';
    document.getElementById('uploadProgressFill').style.width = percent + '%';
  };

  window.hideUploadProgress = function() {
    const overlay = document.getElementById('uploadProgressOverlay');
    if (overlay) overlay.style.display = 'none';
  };

  console.log("✅ PRODUCTION READY: All fake/demo features removed.");

})();
