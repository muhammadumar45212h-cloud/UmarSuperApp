// ==========================================
// ⚡ SUPER APP - REAL ADMOB (FINAL)
// File: real-ads.js
// IDs: Banner, Interstitial, Rewarded
// ==========================================

(function() {
  'use strict';

  // ⚠️ AAPKI ASLI IDs
  const AD_IDS = {
    BANNER: 'ca-app-pub-9780067506108310/8797038795',
    INTERSTITIAL: 'ca-app-pub-9780067506108310/8812211938',
    REWARDED: 'ca-app-pub-9780067506108310/6133332849'
  };

  window.RealAds = {
    ready: false,
    plugin: null,
    lastInterstitial: 0,
    actionCount: 0,

    // 1. Initialize AdMob
    init: async function() {
      if (!window.Capacitor || !window.Capacitor.Plugins.AdMob) {
        console.log("⚠️ AdMob plugin missing (Web/Browser mode).");
        return false;
      }

      const { AdMob } = window.Capacitor.Plugins;
      this.plugin = AdMob;

      try {
        await AdMob.initialize({ initializeForTesting: false });
        this.ready = true;
        console.log("✅ Real AdMob Initialized");

        // Banner show karein app khulte hi
        setTimeout(() => this.showBanner(), 2000);

        // Reward listener set karein
        AdMob.addListener('onRewardedVideoAdReward', (reward) => {
          this.giveRewardToUser();
        });

        return true;
      } catch (e) {
        console.error("❌ AdMob Init Error:", e);
        return false;
      }
    },

    // 2. Banner Ad
    showBanner: async function() {
      if (!this.ready) return;
      try {
        await this.plugin.showBanner({
          adId: AD_IDS.BANNER,
          position: 'BOTTOM_CENTER',
          margin: 0,
          isTesting: false
        });
      } catch(e) { console.error("Banner Error:", e); }
    },

    // 3. Interstitial Ad (Har 5 action ke baad, gap 3 min)
    showInterstitial: async function() {
      if (!this.ready) return;
      
      this.actionCount++;
      if (this.actionCount < 5) return; // Har 5 baar mein ek dafa
      
      if (Date.now() - this.lastInterstitial < 180000) return; // 3 min gap

      try {
        this.actionCount = 0;
        this.lastInterstitial = Date.now();
        
        await this.plugin.prepareInterstitial({ adId: AD_IDS.INTERSTITIAL, isTesting: false });
        await this.plugin.showInterstitial();
      } catch(e) { console.error("Interstitial Error:", e); }
    },

    // 4. Rewarded Ad (User ki marzi se - Earning)
    showRewarded: async function() {
      if (!this.ready) {
        showToast("Ads sirf Android App mein chalte hain. (Play Store se download karein)");
        return;
      }
      try {
        showToast("🎬 Ad load ho rahi hai...");
        await this.plugin.prepareRewardVideoAd({ adId: AD_IDS.REWARDED, isTesting: false });
        await this.plugin.showRewardVideoAd();
      } catch(e) { 
        showToast("❌ Ad load nahi hui. Internet check karein.");
        console.error("Rewarded Error:", e);
      }
    },

    // 5. Reward Dena (Jab user ad pura dekh le)
    giveRewardToUser: async function() {
      if (!currentUser) return;
      
      const cleanUser = formatHandle(currentUser);
      const rewardAmount = 5; // Har ad dekhne par 5 diamonds

      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (!users[cleanUser]) users[cleanUser] = {};
      
      users[cleanUser].diamonds = (users[cleanUser].diamonds || 0) + rewardAmount;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));

      try {
        await db.collection("users").doc(cleanUser).set({
          diamonds: users[cleanUser].diamonds
        }, { merge: true });

        await db.collection("ad_rewards").add({
          user: cleanUser,
          amount: rewardAmount,
          type: 'rewarded_ad',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch(e) {}

      showToast(`💰 +${rewardAmount} Diamonds add ho gaye!`);
      updateWalletUI();
    }
  };

  // App Load hone par init karein
  window.addEventListener('load', () => {
    setTimeout(() => RealAds.init(), 3000);
  });

  // Purane system ko override karein
  window.triggerPostWithdrawalAds = function(n) {
    if (n <= 0) return;
    RealAds.showRewarded();
  };

})();
