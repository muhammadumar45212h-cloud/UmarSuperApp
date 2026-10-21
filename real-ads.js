// ==========================================
// ⚡ SUPER APP - REAL ADMOB ADS
// File: real-ads.js
// ==========================================

(function() {
  'use strict';

  // ⚠️ AAPKI REAL ADMOB IDs
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

    init: async function() {
      if (!window.Capacitor || !window.Capacitor.Plugins.AdMob) {
        console.log("⚠️ AdMob plugin missing (Browser mode).");
        return false;
      }

      const { AdMob } = window.Capacitor.Plugins;
      this.plugin = AdMob;

      try {
        await AdMob.initialize({ initializeForTesting: false });
        this.ready = true;
        console.log("✅ Real AdMob Initialized");

        setTimeout(() => this.showBanner(), 2000);

        AdMob.addListener('onRewardedVideoAdReward', (reward) => {
          this.giveRewardToUser();
        });

        return true;
      } catch (e) {
        console.error("❌ AdMob Init Error:", e);
        return false;
      }
    },

    showBanner: async function() {
      if (!this.ready) return;
      try {
        await this.plugin.showBanner({
          adId: AD_IDS.BANNER,
          position: 'BOTTOM_CENTER',
          margin: 0,
          isTesting: false // REAL ADS
        });
      } catch(e) { console.error("Banner Error:", e); }
    },

    showInterstitial: async function() {
      if (!this.ready) return;
      this.actionCount++;
      if (this.actionCount < 5) return; 
      if (Date.now() - this.lastInterstitial < 180000) return; 

      try {
        this.actionCount = 0;
        this.lastInterstitial = Date.now();
        await this.plugin.prepareInterstitial({ adId: AD_IDS.INTERSTITIAL, isTesting: false });
        await this.plugin.showInterstitial();
      } catch(e) { console.error("Interstitial Error:", e); }
    },

    showRewarded: async function() {
      if (!this.ready) { showToast("Ads only work in Android App"); return; }
      try {
        showToast("🎬 Loading Ad...");
        await this.plugin.prepareRewardVideoAd({ adId: AD_IDS.REWARDED, isTesting: false });
        await this.plugin.showRewardVideoAd();
      } catch(e) { showToast("❌ Ad failed to load."); }
    },

    giveRewardToUser: async function() {
      if (!currentUser) return;
      const cleanUser = formatHandle(currentUser);
      const rewardAmount = 5; // 5 diamonds

      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (!users[cleanUser]) users[cleanUser] = {};
      users[cleanUser].diamonds = (users[cleanUser].diamonds || 0) + rewardAmount;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));

      try {
        await db.collection("users").doc(cleanUser).set({
          diamonds: users[cleanUser].diamonds
        }, { merge: true });
        await db.collection("ad_rewards").add({
          user: cleanUser, amount: rewardAmount, type: 'rewarded_ad',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch(e) {}

      showToast(`💰 +${rewardAmount} Diamonds earned!`);
      updateWalletUI();
    }
  };

  window.addEventListener('load', () => { setTimeout(() => RealAds.init(), 3000); });
  window.triggerPostWithdrawalAds = function(n) { if (n > 0) RealAds.showRewarded(); };

})();
