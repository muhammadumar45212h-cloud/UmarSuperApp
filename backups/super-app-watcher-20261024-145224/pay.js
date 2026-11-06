// ==========================================
// ⚡ SUPER APP - REAL PLAY STORE BILLING
// File: pay.js
// ==========================================

let billingInitialized = false;

// ⚠️ Yahan apni Play Console wali IDs daalna jab account ban jaye
const PRODUCT_IDS = {
  DIAMONDS_100: 'com.supersphere.app.diamonds100',
  DIAMONDS_500: 'com.supersphere.app.diamonds500',
  DIAMONDS_1000: 'com.supersphere.app.diamonds1000',
  PREMIUM_MONTHLY: 'com.supersphere.app.premium_monthly'
};

const APP_PACKAGE_NAME = 'com.supersphere.app'; // Aapka package name

async function initPayments() {
  if (window.Capacitor && window.Capacitor.Plugins.InAppPurchases) {
    const { InAppPurchases } = window.Capacitor.Plugins;
    try {
      await InAppPurchases.setup({});
      billingInitialized = true;
      await InAppPurchases.getProducts({ productIds: Object.values(PRODUCT_IDS) });
      await InAppPurchases.restorePurchases();
    } catch (e) { console.error("Billing Setup Error:", e); }
  }
}

async function buyDiamondsWithUI(productId, diamondAmount) {
  if (!currentUser) { showToast("Please login first!"); return; }
  
  if (!billingInitialized) {
    // Browser mein test mode
    if (confirm(`TEST MODE: Add ${diamondAmount} diamonds for free?`)) {
      await addDiamondsLocally(diamondAmount);
    }
    return;
  }

  const { InAppPurchases } = window.Capacitor.Plugins;
  try {
    showToast("⏳ Opening Play Store...");
    const purchase = await InAppPurchases.purchaseProduct({ productId });
    
    // Backend verification
    const verifyFunc = firebase.functions().httpsCallable('verifyPlayStorePurchase');
    const result = await verifyFunc({
      productId: purchase.productId,
      purchaseToken: purchase.purchaseToken,
      packageName: APP_PACKAGE_NAME,
      diamondAmount: diamondAmount,
      isPremium: false,
      username: formatHandle(currentUser)
    });

    if (result.data.success) {
      showToast(`💎 ${diamondAmount} Diamonds added!`);
      updateWalletUI();
      closeModal('paymentModal');
    } else { showToast("❌ Verification failed."); }
  } catch (e) {
    if (e.code === 'E_USER_CANCELLED') showToast("Purchase cancelled.");
    else showToast("Payment failed: " + e.message);
  }
}

async function addDiamondsLocally(amount) {
  const cleanUser = formatHandle(currentUser);
  let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
  if (!users[cleanUser]) users[cleanUser] = {};
  users[cleanUser].diamonds = (users[cleanUser].diamonds || 0) + amount;
  localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
  try { await db.collection("users").doc(cleanUser).set({ diamonds: users[cleanUser].diamonds }, { merge: true }); } catch(e){}
  updateWalletUI();
}

window.addEventListener('load', () => { setTimeout(initPayments, 2500); });
