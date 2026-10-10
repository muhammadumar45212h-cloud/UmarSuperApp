/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - ADMOB.JS
   Real Google AdMob ads for APK (Capacitor)
   Add: <script src="admob.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  function toast(msg) {
    if (typeof window.showToast === 'function') return window.showToast(msg);
    const t = document.getElementById('toast-notification');
    if (!t) { console.log(msg); return; }
    document.getElementById('toast-message').innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // ═══════════════════════════════════════════════════════════════
  // ⚙️ ADMOB CONFIG — AAPKI REAL IDs
  // ═══════════════════════════════════════════════════════════════
  const ADMOB_CONFIG = {
    // Aapki App ID
    appId: 'ca-app-pub-9780067506108310~3493198071',

    testMode: false, // Real ads

    // ═══ TEST IDs (agar zaroorat pade) ═══
    testBannerId: 'ca-app-pub-3940256099942544/6300978111',
    testInterstitialId: 'ca-app-pub-3940256099942544/1033173712',
    testRewardedId: 'ca-app-pub-3940256099942544/5224354917',

    // ═══ REAL Ad Unit IDs ═══
    // Format: ca-app-pub-9780067506108310/XXXXXXXXXXXXXXXX
    realBannerId: 'ca-app-pub-9780067506108310/8797038795', // ✅ Aapki Banner ID
    realInterstitialId: '', // ⚠️ AdMob mein Interstitial banayein aur yahan daalein
    realRewardedId: '',     // ⚠️ AdMob mein Rewarded banayein aur yahan daalein

    // Settings
    showBannerOnVideos: true,               // Videos tab mein banner
    showInterstitialAfterWithdrawal: true,  // Withdrawal ke baad
    showInterstitialAfterDeposit: true,     // Deposit ke baad
    adsCountAfterWithdrawal: 3,             // Kitne ads dikhane hain
    adsCountAfterDeposit: 3
  };

  window.__ADMOB_CONFIG = ADMOB_CONFIG;

  // Active IDs (test ya real)
  const BANNER_ID = ADMOB_CONFIG.testMode ? ADMOB_CONFIG.testBannerId : ADMOB_CONFIG.realBannerId;
  const INTERSTITIAL_ID = ADMOB_CONFIG.testMode ? ADMOB_CONFIG.testInterstitialId : ADMOB_CONFIG.realInterstitialId;
  const REWARDED_ID = ADMOB_CONFIG.testMode ? ADMOB_CONFIG.testRewardedId : ADMOB_CONFIG.realRewardedId;

  // ═══════════════════════════════════════════════════════════════
  // CHECK CAPACITOR ADMOB AVAILABLE
  // ═══════════════════════════════════════════════════════════════
  const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  const AdMob = isNative && window.Capacitor.Plugins ? window.Capacitor.Plugins.AdMob : null;

  if (!isNative) {
    console.log('🌐 Browser mode - AdMob disabled (only works in APK)');
  } else if (!AdMob) {
    console.warn('⚠️ AdMob plugin not installed. Run: npm install @capacitor-community/admob');
  } else {
    console.log('✅ AdMob plugin detected');
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZE ADMOB
  // ═══════════════════════════════════════════════════════════════
  async function initAdMob() {
    if (!AdMob) return;
    try {
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        testingDevices: [],
        initializeForTesting: ADMOB_CONFIG.testMode
      });
      console.log('✅ AdMob initialized');
    } catch(e) {
      console.error('AdMob init error:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BANNER AD (Video scroll ke saath)
  // ═══════════════════════════════════════════════════════════════
  async function showBannerAd() {
    if (!AdMob) return;
    if (!BANNER_ID) {
      console.log('Banner ID missing');
      return;
    }
    try {
      await AdMob.showBanner({
        adId: BANNER_ID,
        adSize: 'BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: ADMOB_CONFIG.testMode
      });
      console.log('✅ Banner ad shown');
    } catch(e) {
      console.error('Banner error:', e);
    }
  }

  async function hideBannerAd() {
    if (!AdMob) return;
    try { await AdMob.hideBanner(); } catch(e) {}
  }

  async function removeBannerAd() {
    if (!AdMob) return;
    try { await AdMob.removeBanner(); } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════════
  // INTERSTITIAL AD (Full screen — withdrawal/deposit ke baad)
  // ═══════════════════════════════════════════════════════════════
  async function prepareInterstitial() {
    if (!AdMob) return false;
    if (!INTERSTITIAL_ID) {
      console.log('Interstitial ID missing');
      return false;
    }
    try {
      await AdMob.prepareInterstitial({
        adId: INTERSTITIAL_ID,
        isTesting: ADMOB_CONFIG.testMode
      });
      return true;
    } catch(e) {
      console.error('Prepare interstitial error:', e);
      return false;
    }
  }

  async function showInterstitial() {
    if (!AdMob) return false;
    try {
      await AdMob.showInterstitial();
      return true;
    } catch(e) {
      console.error('Show interstitial error:', e);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // REWARDED AD (Optional — user ko diamonds mile)
  // ═══════════════════════════════════════════════════════════════
  async function showRewardedAd() {
    if (!AdMob) return null;
    if (!REWARDED_ID) {
      console.log('Rewarded ID missing');
      return null;
    }
    try {
      await AdMob.prepareRewardVideoAd({
        adId: REWARDED_ID,
        isTesting: ADMOB_CONFIG.testMode
      });
      const result = await AdMob.showRewardVideoAd();
      return result;
    } catch(e) {
      console.error('Rewarded ad error:', e);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SEQUENTIAL ADS (3 ads after withdrawal/deposit)
  // ═══════════════════════════════════════════════════════════════
  async function showSequentialAds(count) {
    if (!AdMob) {
      // Fallback: HTML overlay ads (browser ke liye)
      showFallbackAdOverlay(count);
      return;
    }

    if (!INTERSTITIAL_ID) {
      // Interstitial ID nahi hai, toh fallback use karo
      showFallbackAdOverlay(count);
      return;
    }

    for (let i = 0; i < count; i++) {
      toast(`📢 Ad ${i + 1} of ${count}`);

      const prepared = await prepareInterstitial();
      if (!prepared) {
        // Try fallback
        showFallbackAdOverlay(1);
        await sleep(3000);
        continue;
      }

      const shown = await showInterstitial();
      if (!shown) {
        console.log('Ad ' + (i + 1) + ' could not show');
      }

      // Ad ke beech mein 1 sec pause
      await sleep(1000);
    }

    toast('✅ Ads complete');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ═══════════════════════════════════════════════════════════════
  // FALLBACK AD OVERLAY (agar AdMob plugin na ho)
  // ═══════════════════════════════════════════════════════════════
  function showFallbackAdOverlay(count) {
    let current = 0;

    function showNext() {
      if (current >= count) {
        document.getElementById('fallbackAdModal')?.remove();
        return;
      }
      current++;

      document.getElementById('fallbackAdModal')?.remove();
      document.body.insertAdjacentHTML('beforeend', `
        <div id="fallbackAdModal" class="fullscreen-modal p-4 justify-center items-center bg-black/95 z-[95] flex">
          <div class="w-full max-w-sm bg-gray-900 border-2 border-cyan-500/40 rounded-2xl p-6 text-center space-y-4">
            <div class="flex justify-between items-center border-b border-gray-800 pb-2">
              <span class="text-xs text-cyan-400 font-bold">📢 Sponsored</span>
              <span class="text-xs text-amber-400 font-bold">Ad ${current}/${count}</span>
            </div>
            <div class="py-8 space-y-3">
              <div class="text-6xl">📢</div>
              <h3 class="text-base font-bold text-white">Super Sphere</h3>
              <p class="text-xs text-gray-400">Sponsored content</p>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div id="fallbackAdProgress" class="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-1000" style="width:0%"></div>
            </div>
            <button onclick="window.__skipFallbackAd(${count}, ${current})" class="w-full py-2.5 bg-gray-800 text-gray-400 rounded-lg text-xs font-bold">
              Wait 5s...
            </button>
          </div>
        </div>
      `);

      let pct = 0;
      const interval = setInterval(() => {
        pct += 20;
        const el = document.getElementById('fallbackAdProgress');
        if (el) el.style.width = pct + '%';
        if (pct >= 100) {
          clearInterval(interval);
          const btn = document.querySelector('#fallbackAdModal button');
          if (btn) {
            btn.className = 'w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-xs font-bold';
            btn.innerText = current < count ? 'Next Ad →' : '✅ Continue';
            btn.onclick = () => {
              document.getElementById('fallbackAdModal')?.remove();
              if (current < count) showNext();
            };
          }
        }
      }, 1000);
    }

    showNext();
  }

  window.__skipFallbackAd = function(total, current) {
    // Force skip
    document.getElementById('fallbackAdModal')?.remove();
    if (current < total) showFallbackAdOverlay(total - current);
  };

  // ═══════════════════════════════════════════════════════════════
  // INTEGRATE: Withdrawal ke baad 3 ads
  // ═══════════════════════════════════════════════════════════════
  const origWithdrawal = window.processWithdrawalSubmit;
  if (typeof origWithdrawal === 'function' && !origWithdrawal.__admobWrapped) {
    window.processWithdrawalSubmit = async function() {
      const result = await origWithdrawal.apply(this, arguments);

      // 3 ads after withdrawal
      if (ADMOB_CONFIG.showInterstitialAfterWithdrawal) {
        setTimeout(() => {
          showSequentialAds(ADMOB_CONFIG.adsCountAfterWithdrawal);
        }, 2000);
      }
      return result;
    };
    window.processWithdrawalSubmit.__admobWrapped = true;
  }

  // ═══════════════════════════════════════════════════════════════
  // INTEGRATE: Deposit ke baad 3 ads
  // ═══════════════════════════════════════════════════════════════
  const origDeposit = window.__finalSubmit;
  if (typeof origDeposit === 'function' && !origDeposit.__admobWrapped) {
    window.__finalSubmit = async function() {
      const result = await origDeposit.apply(this, arguments);

      if (ADMOB_CONFIG.showInterstitialAfterDeposit) {
        setTimeout(() => {
          showSequentialAds(ADMOB_CONFIG.adsCountAfterDeposit);
        }, 2000);
      }
      return result;
    };
    window.__finalSubmit.__admobWrapped = true;
  }

  // ═══════════════════════════════════════════════════════════════
  // INTEGRATE: Video scroll pe banner
  // ═══════════════════════════════════════════════════════════════
  function setupVideoBannerAds() {
    if (!ADMOB_CONFIG.showBannerOnVideos) return;

    // Check when user goes to Videos tab
    const observer = new MutationObserver(() => {
      const videosTab = document.getElementById('tab-videos');
      if (videosTab && !videosTab.classList.contains('hidden')) {
        if (!window.__bannerShown) {
          window.__bannerShown = true;
          showBannerAd();
        }
      } else {
        if (window.__bannerShown) {
          window.__bannerShown = false;
          hideBannerAd();
        }
      }
    });

    const appViewport = document.getElementById('app-viewport');
    if (appViewport) {
      observer.observe(appViewport, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    if (isNative) {
      initAdMob();
      setupVideoBannerAds();
      console.log('✅ admob.js loaded - Native mode');
    } else {
      console.log('ℹ️ admob.js loaded - Web mode (fallback ads use honge)');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // ═══════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════
  window.__ADMOB__ = {
    config: ADMOB_CONFIG,
    showBannerAd,
    hideBannerAd,
    showInterstitial,
    showRewardedAd,
    showSequentialAds,
    isNative,
    isPluginAvailable: !!AdMob
  };
})();
