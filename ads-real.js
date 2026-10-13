// ==========================================
// ⚡ SUPER APP - REAL ADMOB INTEGRATION
// File: ads-real.js
// Non-intrusive ads + Rewarded earning
// ==========================================

(function() {
  'use strict';

  // ==========================================
  // ⚠️ ADMOB REAL IDs
  // ==========================================
  const AD_IDS = {
    APP_ID: 'ca-app-pub-9780067506108310~3493198071',
    
    // ✅ Aapka diya Banner ID
    BANNER: 'ca-app-pub-9780067506108310/8797038795',
    
    // ⏳ Baaki IDs AdMob Console se banayein (Banner jaise):
    // AdMob Console → Ad units → Create ad unit
    INTERSTITIAL: 'ca-app-pub-9780067506108310/8797038795', // Yahan Interstitial ID daalein
    REWARDED: 'ca-app-pub-9780067506108310/8797038795'      // Yahan Rewarded ID daalein
  };

  // ==========================================
  // ADS MANAGER
  // ==========================================
  window.RealAds = {
    ready: false,
    plugin: null,
    lastInterstitial: 0,
    interstitialCount: 0,
    bannerVisible: false,

    // ==========================================
    // INIT
    // ==========================================
    init: async function() {
      console.log("📢 RealAds: Initializing...");

      // Check Capacitor available
      if (!window.Capacitor || !window.Capacitor.Plugins.AdMob) {
        console.log("⚠️ AdMob plugin missing (browser mode)");
        this.ready = false;
        return false;
      }

      try {
        const { AdMob } = window.Capacitor.Plugins;
        this.plugin = AdMob;

        await AdMob.initialize({
          initializeForTesting: false // ⚠️ REAL ads - Production mode
        });

        this.ready = true;
        console.log("✅ RealAds: Ready!");

        // Start banner after 3 seconds (non-intrusive)
        setTimeout(() => this.showBanner(), 3000);

        // Listen to interstitial events
        AdMob.addListener('onInterstitialDismissed', () => {
          console.log("📢 Interstitial dismissed");
        });

        AdMob.addListener('onRewardedVideoAdReward', (reward) => {
          console.log("💰 Reward earned:", reward);
          this.onRewardEarned(reward);
        });

        return true;
      } catch(e) {
        console.error("❌ AdMob init error:", e);
        return false;
      }
    },

    // ==========================================
    // BANNER AD (Bottom - Non-intrusive)
    // ==========================================
    showBanner: async function() {
      if (!this.ready || !this.plugin) return;

      try {
        await this.plugin.showBanner({
          adId: AD_IDS.BANNER,
          position: 'BOTTOM_CENTER',
          margin: 0,
          adSize: 'BANNER',
          isTesting: false // ⚠️ REAL ads
        });
        this.bannerVisible = true;
        console.log("📢 Banner shown at bottom");
      } catch(e) {
        console.error("Banner error:", e);
      }
    },

    hideBanner: async function() {
      if (!this.ready || !this.plugin) return;
      try {
        await this.plugin.hideBanner();
        this.bannerVisible = false;
      } catch(e) {}
    },

    // ==========================================
    // INTERSTITIAL AD (Between actions)
    // Rule: Har 5 actions ke baad, 3 min gap
    // ==========================================
    maybeShowInterstitial: async function(reason = 'action') {
      if (!this.ready || !this.plugin) return false;

      // Time check: 3 minutes gap
      const now = Date.now();
      if (now - this.lastInterstitial < 3 * 60 * 1000) {
        console.log("⏸️ Interstitial skipped (time gap)");
        return false;
      }

      // Count check: Har 5 action ke baad
      this.interstitialCount++;
      if (this.interstitialCount < 5) {
        console.log(`⏸️ Interstitial skipped (${this.interstitialCount}/5)`);
        return false;
      }

      // Reset count
      this.interstitialCount = 0;
      this.lastInterstitial = now;

      try {
        await this.plugin.prepareInterstitial({
          adId: AD_IDS.INTERSTITIAL,
          isTesting: false
        });
        await this.plugin.showInterstitial();
        console.log(`📢 Interstitial shown (${reason})`);
        return true;
      } catch(e) {
        console.error("Interstitial error:", e);
        return false;
      }
    },

    // ==========================================
    // REWARDED AD (User ki marzi se - Earning)
    // ==========================================
    showRewarded: async function() {
      if (!this.ready || !this.plugin) {
        showToast("Ads abhi available nahi hain");
        return false;
      }

      try {
        showToast("🎬 Ad loading...");
        
        await this.plugin.prepareRewardVideoAd({
          adId: AD_IDS.REWARDED,
          isTesting: false
        });

        await this.plugin.showRewardVideoAd();
        return true;
      } catch(e) {
        console.error("Rewarded error:", e);
        showToast("❌ Ad load nahi hui");
        return false;
      }
    },

    // ==========================================
    // REWARD HANDLER
    // ==========================================
    onRewardEarned: async function(reward) {
      if (!currentUser) return;

      const cleanUser = formatHandle(currentUser);
      const rewardAmount = 5; // 5 diamonds per ad

      // Update local
      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (!users[cleanUser]) users[cleanUser] = {};
      users[cleanUser].diamonds = (users[cleanUser].diamonds || 0) + rewardAmount;
      users[cleanUser].adsWatched = (users[cleanUser].adsWatched || 0) + 1;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));

      // Update Firestore
      try {
        await db.collection("users").doc(cleanUser).set({
          diamonds: users[cleanUser].diamonds,
          adsWatched: users[cleanUser].adsWatched
        }, { merge: true });

        await db.collection("ad_rewards").add({
          user: cleanUser,
          amount: rewardAmount,
          type: 'rewarded',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch(e) { console.error("Reward save error:", e); }

      showToast(`💰 +${rewardAmount} Diamonds earned!`);
      updateWalletUI();
    }
  };

  // ==========================================
  // SMART AD INJECTION (Video Scroll)
  // ==========================================
  function setupVideoScrollAds() {
    let scrollCount = 0;
    const container = document.getElementById('video-feed-container');
    if (!container) return;

    container.addEventListener('scroll', () => {
      const scrollPos = Math.floor(container.scrollTop / container.clientHeight);
      if (scrollPos > scrollCount) {
        scrollCount = scrollPos;
        
        // Har 10 videos ke baad interstitial
        if (scrollCount > 0 && scrollCount % 10 === 0) {
          RealAds.maybeShowInterstitial('video_scroll');
        }
      }
    }, { passive: true });
  }

  // ==========================================
  // EARN DIAMONDS BUTTON IN WALLET
  // ==========================================
  function addEarnDiamondsUI() {
    setTimeout(() => {
      const walletTabs = document.querySelector('#wallet-tab-buy');
      if (!walletTabs || document.getElementById('earn-diamonds-section')) return;

      const earnBtn = document.createElement('div');
      earnBtn.id = 'earn-diamonds-section';
      earnBtn.className = 'mt-4 p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/40 rounded-2xl';
      earnBtn.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center">
            <i class="fa-solid fa-play text-white text-xl"></i>
          </div>
          <div class="flex-1">
            <p class="text-sm font-bold text-white">Watch Ad, Earn Diamonds</p>
            <p class="text-[10px] text-emerald-400">💰 +5 Diamonds per video</p>
          </div>
        </div>
        <button onclick="RealAds.showRewarded()" class="w-full mt-3 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold rounded-xl">
          <i class="fa-solid fa-play"></i> Watch & Earn
        </button>
      `;

      walletTabs.appendChild(earnBtn);
    }, 2500);
  }

  // ==========================================
  // HOOK INTO EXISTING ACTIONS
  // ==========================================
  function hookInterstitialTriggers() {
    // Hook into post publish
    const originalPublish = window.publishPost;
    window.publishPost = async function() {
      const result = originalPublish ? await originalPublish.apply(this, arguments) : null;
      setTimeout(() => RealAds.maybeShowInterstitial('post_publish'), 1500);
      return result;
    };

    // Hook into gift send
    const originalGift = window.sendGiftAction;
    window.sendGiftAction = async function() {
      const result = originalGift ? await originalGift.apply(this, arguments) : null;
      setTimeout(() => RealAds.maybeShowInterstitial('gift_send'), 1000);
      return result;
    };

    // Hook into withdrawal
    const originalWithdraw = window.processWithdrawalSubmit;
    window.processWithdrawalSubmit = async function() {
      const result = originalWithdraw ? await originalWithdraw.apply(this, arguments) : null;
      // Withdrawal ke baad 3 ads dikhao (earning ke liye)
      setTimeout(() => showWithdrawalAdSequence(3), 1500);
      return result;
    };
  }

  function showWithdrawalAdSequence(count) {
    if (count <= 0) return;
    RealAds.showRewarded().then(() => {
      if (count - 1 > 0) {
        setTimeout(() => showWithdrawalAdSequence(count - 1), 1500);
      }
    });
  }

  // ==========================================
  // INITIALIZE
  // ==========================================
  function initRealAds() {
    console.log("🎬 RealAds: Starting...");
    
    RealAds.init().then(ready => {
      if (ready) {
        setupVideoScrollAds();
        addEarnDiamondsUI();
        hookInterstitialTriggers();
        console.log("✅ RealAds: All systems ready!");
      }
    });
  }

  window.addEventListener('load', function() {
    setTimeout(initRealAds, 3500);
  });

})();
