
/* ==========================================
   SUPER APP — REAL ADMOB ADS
   File: real-ads.js
   Capacitor AdMob legacy API
   ========================================== */

(function () {
  'use strict';

  const APP_ID =
    'ca-app-pub-9780067506108310~3493198071';

  const AD_IDS = {
    BANNER:
      'ca-app-pub-9780067506108310/3123156585',

    INTERSTITIAL:
      'ca-app-pub-9780067506108310/2931584892',

    REWARDED:
      'ca-app-pub-9780067506108310/5812899101',

    REWARDED_INTERSTITIAL:
      'ca-app-pub-9780067506108310/7992339880'
  };

  const REWARD_DIAMONDS = 5;
  const INTERSTITIAL_ACTION_LIMIT = 5;
  const INTERSTITIAL_COOLDOWN = 180000;

  const RealAds = {
    ready: false,
    plugin: null,
    lastInterstitial: 0,
    actionCount: 0,
    rewardListenerAdded: false,

    async init() {
      if (this.ready) return true;

      const AdMob = window.Capacitor?.Plugins?.AdMob;

      if (!AdMob) {
        console.warn(
          'AdMob plugin missing. Run inside the configured Android app.'
        );
        return false;
      }

      this.plugin = AdMob;

      try {
        await AdMob.initialize({
          initializeForTesting: false
        });

        this.ready = true;

        console.log('AdMob initialized for production.');
        console.log('Configured App ID:', APP_ID);

        this.registerRewardListener();

        setTimeout(() => {
          this.showBanner();
        }, 2000);

        return true;
      } catch (error) {
        this.ready = false;
        console.error('AdMob initialization failed:', error);
        return false;
      }
    },

    registerRewardListener() {
      if (!this.plugin || this.rewardListenerAdded) return;

      if (typeof this.plugin.addListener !== 'function') {
        console.warn(
          'This AdMob plugin version does not expose addListener.'
        );
        return;
      }

      try {
        this.plugin.addListener(
          'onRewardedVideoAdReward',
          async (reward) => {
            console.log('Reward callback received:', reward);
            await this.giveRewardToUser();
          }
        );

        this.rewardListenerAdded = true;
      } catch (error) {
        console.error('Reward listener setup failed:', error);
      }
    },

    async showBanner() {
      if (!this.ready || !this.plugin) return false;

      try {
        await this.plugin.showBanner({
          adId: AD_IDS.BANNER,
          position: 'BOTTOM_CENTER',
          margin: 0,
          isTesting: false
        });

        return true;
      } catch (error) {
        console.error('Banner failed:', error);
        return false;
      }
    },

    async hideBanner() {
      if (!this.ready || !this.plugin) return;

      try {
        await this.plugin.hideBanner();
      } catch (error) {
        console.error('Hide banner failed:', error);
      }
    },

    async showInterstitial() {
      if (!this.ready || !this.plugin) return false;

      this.actionCount++;

      if (this.actionCount < INTERSTITIAL_ACTION_LIMIT) {
        return false;
      }

      if (
        Date.now() - this.lastInterstitial <
        INTERSTITIAL_COOLDOWN
      ) {
        return false;
      }

      try {
        await this.plugin.prepareInterstitial({
          adId: AD_IDS.INTERSTITIAL,
          isTesting: false
        });

        await this.plugin.showInterstitial();

        this.actionCount = 0;
        this.lastInterstitial = Date.now();

        return true;
      } catch (error) {
        console.error('Interstitial failed:', error);
        return false;
      }
    },

    async showRewarded() {
      if (!this.ready || !this.plugin) {
        this.toast('Ads Android app mein hi chal sakte hain.');
        return false;
      }

      if (
        typeof this.plugin.prepareRewardVideoAd !== 'function' ||
        typeof this.plugin.showRewardVideoAd !== 'function'
      ) {
        console.error(
          'Installed AdMob plugin does not support this Rewarded API.'
        );
        this.toast('AdMob plugin version check karna zaroori hai.');
        return false;
      }

      try {
        this.toast('Rewarded ad load ho raha hai...');

        await this.plugin.prepareRewardVideoAd({
          adId: AD_IDS.REWARDED,
          isTesting: false
        });

        await this.plugin.showRewardVideoAd();

        return true;
      } catch (error) {
        console.error('Rewarded ad failed:', error);
        this.toast('Ad load nahi hua. Baad mein dobara koshish karein.');
        return false;
      }
    },

    async showRewardedInterstitial() {
      if (!this.ready || !this.plugin) return false;

      /*
       * Sirf un plugin versions ke liye jo explicitly
       * rewarded-interstitial methods provide karte hain.
       * Traditional Rewarded methods ko is format ke liye
       * substitute nahi karna.
       */
      if (
        typeof this.plugin.prepareRewardedInterstitial !== 'function' ||
        typeof this.plugin.showRewardedInterstitial !== 'function'
      ) {
        console.warn(
          'Rewarded Interstitial is not supported by the installed plugin API.',
          AD_IDS.REWARDED_INTERSTITIAL
        );

        this.toast(
          'Rewarded Interstitial ke liye plugin support update karna hoga.'
        );

        return false;
      }

      try {
        await this.plugin.prepareRewardedInterstitial({
          adId: AD_IDS.REWARDED_INTERSTITIAL,
          isTesting: false
        });

        await this.plugin.showRewardedInterstitial();

        return true;
      } catch (error) {
        console.error('Rewarded Interstitial failed:', error);
        return false;
      }
    },

    toast(message) {
      if (typeof window.showToast === 'function') {
        window.showToast(message);
      } else {
        console.log(message);
      }
    },

    async giveRewardToUser() {
      /*
       * IMPORTANT:
       * Client-side diamonds are not secure against tampering.
       * Production rewards should be verified and credited by
       * a trusted backend using the provider's supported
       * verification mechanism.
       */
      try {
        if (
          typeof currentUser === 'undefined' ||
          !currentUser
        ) {
          this.toast('Reward ke liye login karein.');
          return;
        }

        if (
          typeof formatHandle !== 'function' ||
          typeof updateWalletUI !== 'function'
        ) {
          console.error('Wallet functions are unavailable.');
          return;
        }

        const cleanUser = formatHandle(currentUser);

        if (!cleanUser) return;

        let users = {};

        try {
          users = JSON.parse(
            localStorage.getItem('SUPER_APP_USERS') || '{}'
          );
        } catch (_) {
          users = {};
        }

        if (!users[cleanUser]) users[cleanUser] = {};

        users[cleanUser].diamonds =
          Number(users[cleanUser].diamonds || 0) +
          REWARD_DIAMONDS;

        localStorage.setItem(
          'SUPER_APP_USERS',
          JSON.stringify(users)
        );

        /*
         * This is a client-side wallet update, not secure
         * server-side reward verification.
         * Do not use it for cash withdrawals or purchased value.
         */
        updateWalletUI();

        this.toast(
          '+' + REWARD_DIAMONDS + ' Diamonds'
        );
      } catch (error) {
        console.error('Reward handling failed:', error);
      }
    }
  };

  window.RealAds = RealAds;

  window.addEventListener('load', () => {
    setTimeout(() => {
      RealAds.init();
    }, 1000);
  });

  window.triggerPostWithdrawalAds = function (count) {
    if (Number(count) > 0) {
      return RealAds.showRewarded();
    }
  };

})();
