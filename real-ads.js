// ==========================================
// ⚡ SUPER APP - REAL ADMOB INTEGRATION
// File: real-ads.js
// ==========================================

(function() {
  'use strict';

  // ⚠️ Yahan apni Play Store / AdMob Console wali IDs dalein
  const AD_IDS = {
    BANNER: 'ca-app-pub-9780067506108310/8797038795',
    // Interstitial aur Rewarded IDs AdMob Console se banayein aur yahan dalein
    INTERSTITIAL: 'ca-app-pub-9780067506108310/8797038795', 
    REWARDED: 'ca-app-pub-9780067506108310/8797038795'
  };

  window.RealAds = {
    ready: false,
    plugin: null,
    lastAdTime: 0,

    init: async function() {
      if (!window.Capacitor || !window.Capacitor.Plugins.AdMob) {
        console.log("⚠️ AdMob plugin not found. Web mode.");
        return false;
      }

      const { AdMob } = window.Capacitor.Plugins;
      this.plugin = AdMob;

      try {
        await AdMob.initialize({ initializeForTesting: false });
        this.ready = true;
        
        // Banner show karein
        setTimeout(() => this.showBanner(), 2000);
        
        // Reward listener
        AdMob.addListener('onRewardedVideoAdReward', (reward) => {
          this.giveReward();
        });

        return true;
      } catch (e) {
        console.error("AdMob Error:", e);
        return false;
      }
    },

    showBanner: async function() {
      if (!this.ready) return;
      try {
        await this.plugin.showBanner({
          adId: AD_IDS.BANNER,
          position: 'BOTTOM_CENTER',
          isTesting: false // Real Ads
        });
      } catch(e) { console.error(e); }
    },

    showInterstitial: async function() {
      if (!this.ready) return;
      // Har 2 minute mein ek ad
      if (Date.now() - this.lastAdTime < 120000) return;
      
      try {
        this.lastAdTime = Date.now();
        await this.plugin.prepareInterstitial({ adId: AD_IDS.INTERSTITIAL, isTesting: false });
        await this.plugin.showInterstitial();
      } catch(e) { console.error(e); }
    },

    showRewarded: async function() {
      if (!this.ready) {
        showToast("Ads sirf app mein chalte hain.");
        return;
      }
      try {
        showToast("⏳ Loading Ad...");
        await this.plugin.prepareRewardVideoAd({ adId: AD_IDS.REWARDED, isTesting: false });
        await this.plugin.showRewardVideoAd();
      } catch(e) { 
        showToast("Ad load fail: " + e.message);
      }
    },

    giveReward: async function() {
      if (!currentUser) return;
      const cleanUser = formatHandle(currentUser);
      const reward = 5; // 5 diamonds

      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (!users[cleanUser]) users[cleanUser] = {};
      users[cleanUser].diamonds = (users[cleanUser].diamonds || 0) + reward;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));

      await db.collection("users").doc(cleanUser).set({
        diamonds: users[cleanUser].diamonds
      }, { merge: true });

      showToast(`🎉 You earned ${reward} Diamonds!`);
      updateWalletUI();
    }
  };

  // Initialize on load
  window.addEventListener('load', () => {
    setTimeout(() => RealAds.init(), 3000);
  });

  // Patch old overlay with real ads
  window.triggerPostWithdrawalAds = function(n) {
    if (n <= 0) return;
    RealAds.showRewarded().then(() => {
      if (n > 1) setTimeout(() => window.triggerPostWithdrawalAds(n - 1), 1000);
    });
  };

})();
