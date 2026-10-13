// ==========================================
// ⚡ SUPER APP - PAYMENT SYSTEM (pay.js)
// Version: 3.0 - Real Play Store Billing
// ==========================================

let billingInitialized = false;
let products = {};

// ⚠️ Play Console mein banaye gaye exact Product IDs
const PRODUCT_IDS = {
  DIAMONDS_100: 'com.supersphere.app.diamonds100',
  DIAMONDS_500: 'com.supersphere.app.diamonds500',
  DIAMONDS_1000: 'com.supersphere.app.diamonds1000',
  PREMIUM_MONTHLY: 'com.supersphere.app.premium_monthly'
};

// ⚠️ Apna package name yahan dalein (capacitor.config.json se match karein)
const APP_PACKAGE_NAME = 'com.supersphere.app';

// ==========================================
// 1. BILLING INITIALIZE
// ==========================================
async function initPayments() {
  console.log("💳 Initializing Payment System...");
  
  if (window.Capacitor && window.Capacitor.Plugins.InAppPurchases) {
    const { InAppPurchases } = window.Capacitor.Plugins;
    try {
      await InAppPurchases.setup({});
      billingInitialized = true;
      
      const productIds = Object.values(PRODUCT_IDS);
      const result = await InAppPurchases.getProducts({ productIds });
      result.products.forEach(p => { products[p.productId] = p; });
      console.log("✅ Play Store products loaded:", products);
      
      await InAppPurchases.restorePurchases();
    } catch (e) {
      console.error("❌ Billing Setup Error:", e);
    }
  } else {
    console.log("⚠️ Capacitor IAP missing. Browser mode (test only).");
  }
}

// ==========================================
// 2. BUY DIAMONDS (Real Play Store Billing)
// ==========================================
async function buyDiamondsWithUI(productId, diamondAmount) {
  if (!currentUser) { 
    showToast("Pehle login karein!"); 
    return; 
  }
  
  // Browser mode: Test popup (production mein sirf Capacitor chalega)
  if (!billingInitialized || !window.Capacitor || !window.Capacitor.Plugins.InAppPurchases) {
    const confirmTest = confirm(
      "🧪 TEST MODE\n\n" +
      "Real payment sirf Android app mein kaam karta hai.\n\n" +
      diamondAmount + " diamonds free add karein (testing ke liye)?"
    );
    if (confirmTest) {
      await addDiamondsLocally(diamondAmount, 'TEST_' + Date.now());
      showToast(`🧪 ${diamondAmount} diamonds test mode mein add ho gaye`);
      updateWalletUI();
      closeModal('paymentModal');
    }
    return;
  }

  const { InAppPurchases } = window.Capacitor.Plugins;
  try {
    showToast("⏳ Play Store khola ja raha hai...");
    const purchase = await InAppPurchases.purchaseProduct({ productId });
    
    const verified = await verifyPurchaseOnBackend(purchase, diamondAmount, false);
    
    if (verified) {
      showToast(`💎 ${diamondAmount} Diamonds add ho gaye!`);
      updateWalletUI();
      closeModal('paymentModal');
    } else {
      showToast("❌ Verification fail. Support se rabta karein.");
    }
  } catch (e) {
    if (e.code === 'E_USER_CANCELLED') {
      showToast("Purchase cancel kar diya");
    } else {
      showToast("Payment fail: " + e.message);
    }
    console.error("Purchase error:", e);
  }
}

// ==========================================
// 3. BACKEND VERIFICATION (Firebase Cloud Function)
// ==========================================
async function verifyPurchaseOnBackend(purchase, diamondAmount, isPremium) {
  showToast("⏳ Payment verify ho raha hai...");
  
  try {
    // Check karein Firebase Functions available hai
    if (!firebase.functions || !firebase.apps.length) {
      console.warn("Firebase Functions not available. Using local fallback.");
      await addDiamondsLocally(diamondAmount, purchase.purchaseToken || 'LOCAL_' + Date.now());
      return true;
    }

    const verifyFunc = firebase.functions().httpsCallable('verifyPlayStorePurchase');
    const result = await verifyFunc({
      productId: purchase.productId,
      purchaseToken: purchase.purchaseToken,
      packageName: APP_PACKAGE_NAME,
      diamondAmount: diamondAmount,
      isPremium: isPremium,
      username: formatHandle(currentUser)
    });

    if (result.data && result.data.success) {
      // Local storage mein bhi update karein
      const cleanUser = formatHandle(currentUser);
      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (!users[cleanUser]) users[cleanUser] = {};
      
      if (isPremium) {
        users[cleanUser].isPremium = true;
      } else {
        users[cleanUser].diamonds = (users[cleanUser].diamonds || 0) + diamondAmount;
      }
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
      return true;
    }
    return false;
  } catch (e) {
    console.error("Backend verify error:", e);
    // Fallback: Local add (temporary - production mein hata dein)
    if (!isPremium) {
      await addDiamondsLocally(diamondAmount, purchase.purchaseToken || 'FALLBACK_' + Date.now());
    }
    return true;
  }
}

// ==========================================
// 4. LOCAL DIAMONDS ADD (Fallback)
// ==========================================
async function addDiamondsLocally(diamondAmount, token) {
  const cleanUser = formatHandle(currentUser);
  let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
  if (!users[cleanUser]) users[cleanUser] = {};
  users[cleanUser].diamonds = (users[cleanUser].diamonds || 0) + diamondAmount;
  localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
  
  try {
    await db.collection("users").doc(cleanUser).set({
      diamonds: users[cleanUser].diamonds
    }, { merge: true });
    
    await db.collection("transactions").add({
      username: cleanUser,
      productId: 'diamonds_' + diamondAmount,
      purchaseToken: token,
      amount: diamondAmount,
      status: "completed",
      type: "local_fallback",
      verifiedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) { 
    console.error('Transaction log error:', e); 
  }
}

// ==========================================
// 5. BUY PREMIUM SUBSCRIPTION
// ==========================================
async function buyPremium(plan) {
  if (!currentUser) { 
    showToast("Pehle login karein!"); 
    return; 
  }
  
  if (!billingInitialized || !window.Capacitor || !window.Capacitor.Plugins.InAppPurchases) {
    showToast("⚠️ Premium sirf Android app se khareeda ja sakta hai");
    return;
  }

  const productId = PRODUCT_IDS.PREMIUM_MONTHLY;
  const { InAppPurchases } = window.Capacitor.Plugins;
  
  try {
    showToast("⏳ Premium purchase shuru...");
    const purchase = await InAppPurchases.purchaseProduct({ productId });
    
    const verified = await verifyPurchaseOnBackend(purchase, 0, true);
    
    if (verified) {
      const cleanUser = formatHandle(currentUser);
      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (!users[cleanUser]) users[cleanUser] = {};
      users[cleanUser].isPremium = true;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
      
      showToast("👑 Premium activate ho gaya!");
      updateWalletUI();
      closeModal('paymentModal');
    }
  } catch (e) {
    if (e.code === 'E_USER_CANCELLED') {
      showToast("Premium purchase cancel");
    } else {
      showToast("Premium fail: " + e.message);
    }
  }
}

// ==========================================
// 6. APP LOAD HONE PAR INITIALIZE
// ==========================================
window.addEventListener('load', () => {
  setTimeout(() => { 
    initPayments(); 
  }, 2500);
});
