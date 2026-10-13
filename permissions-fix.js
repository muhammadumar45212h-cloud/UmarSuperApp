// ==========================================
// ⚡ SUPER APP - PERMISSIONS & ADS FIX
// File: permissions-fix.js
// ==========================================

(function() {
  'use strict';

  // ==========================================
  // 1. PERMISSIONS MANAGER
  // ==========================================

  window.AppPermissions = {
    // All required permissions
    required: [
      'camera',
      'microphone',
      'storage',
      'photos',
      'notifications'
    ],

    // Check all permissions
    checkAll: async function() {
      const results = {};
      for (const perm of this.required) {
        results[perm] = await this.check(perm);
      }
      return results;
    },

    // Check single permission
    check: async function(permission) {
      if (!window.Capacitor) {
        // Browser fallback
        return await this.checkBrowser(permission);
      }

      try {
        const { Camera } = window.Capacitor.Plugins;
        const { PushNotifications } = window.Capacitor.Plugins;

        if (permission === 'camera' && Camera) {
          const status = await Camera.checkPermissions();
          return status.camera === 'granted' || status.camera === 'prompt';
        }
        if (permission === 'photos' && Camera) {
          const status = await Camera.checkPermissions();
          return status.photos === 'granted' || status.photos === 'prompt';
        }
        if (permission === 'notifications' && PushNotifications) {
          const status = await PushNotifications.checkPermissions();
          return status.receive === 'granted' || status.receive === 'prompt';
        }
      } catch(e) {
        console.log('Permission check error:', e);
      }
      return false;
    },

    // Browser permission check
    checkBrowser: async function(permission) {
      if (!navigator.permissions) return true;
      try {
        if (permission === 'camera') {
          const result = await navigator.permissions.query({ name: 'camera' });
          return result.state !== 'denied';
        }
        if (permission === 'microphone') {
          const result = await navigator.permissions.query({ name: 'microphone' });
          return result.state !== 'denied';
        }
      } catch(e) {}
      return true;
    },

    // Request all permissions
    requestAll: async function() {
      showToast("🔓 Permissions maang raha hai...");
      
      const results = {};
      
      // Camera
      results.camera = await this.request('camera');
      
      // Microphone
      results.microphone = await this.request('microphone');
      
      // Storage
      results.storage = await this.request('storage');
      
      // Notifications
      results.notifications = await this.request('notifications');
      
      // Photos
      results.photos = await this.request('photos');

      const granted = Object.values(results).filter(r => r).length;
      const total = Object.keys(results).length;
      
      if (granted === total) {
        showToast(`✅ Saari permissions mil gayi (${granted}/${total})`);
      } else {
        showToast(`⚠️ ${granted}/${total} permissions mili. Baaki allow karein.`);
      }
      
      return results;
    },

    // Request single permission
    request: async function(permission) {
      // Browser mode
      if (!window.Capacitor) {
        return await this.requestBrowser(permission);
      }

      try {
        if (permission === 'camera') {
          const { Camera } = window.Capacitor.Plugins;
          if (Camera) {
            const result = await Camera.requestPermissions({ permissions: ['camera'] });
            return result.camera === 'granted';
          }
        }
        
        if (permission === 'photos') {
          const { Camera } = window.Capacitor.Plugins;
          if (Camera) {
            const result = await Camera.requestPermissions({ permissions: ['photos'] });
            return result.photos === 'granted';
          }
        }
        
        if (permission === 'microphone') {
          // Use getUserMedia to trigger mic permission
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
            return true;
          } catch(e) {
            return false;
          }
        }
        
        if (permission === 'notifications') {
          const { PushNotifications } = window.Capacitor.Plugins;
          if (PushNotifications) {
            const result = await PushNotifications.requestPermissions();
            return result.receive === 'granted';
          } else if ('Notification' in window) {
            const result = await Notification.requestPermission();
            return result === 'granted';
          }
        }
        
        if (permission === 'storage') {
          // Storage permissions usually granted by default in Capacitor
          return true;
        }
      } catch(e) {
        console.log('Permission request error:', e);
      }
      
      return false;
    },

    // Browser permission request
    requestBrowser: async function(permission) {
      try {
        if (permission === 'camera') {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(t => t.stop());
          return true;
        }
        if (permission === 'microphone') {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(t => t.stop());
          return true;
        }
        if (permission === 'notifications' && 'Notification' in window) {
          const result = await Notification.requestPermission();
          return result === 'granted';
        }
      } catch(e) {
        return false;
      }
      return true;
    }
  };

  // ==========================================
  // 2. FIX LIVE STREAM PERMISSIONS
  // ==========================================

  function fixLiveStreamPermissions() {
    // Override openLiveStreamRoom to request permissions first
    const originalOpenLive = window.openLiveStreamRoom;
    
    window.openLiveStreamRoom = async function(mode) {
      // First check and request permissions
      const hasCam = await AppPermissions.request('camera');
      const hasMic = await AppPermissions.request('microphone');
      
      if (!hasCam || !hasMic) {
        showToast("❌ Camera/Mic permission chahiye live ke liye");
        return;
      }
      
      // Now call original
      if (originalOpenLive) {
        return originalOpenLive.call(this, mode);
      }
    };
  }

  // ==========================================
  // 3. ADS SYSTEM (AdMob Real Fix)
  // ==========================================

  window.AppAds = {
    isReady: false,
    admobPlugin: null,

    // Initialize AdMob
    init: async function() {
      console.log("📢 Initializing Ads...");
      
      if (!window.Capacitor || !window.Capacitor.Plugins.AdMob) {
        console.log("⚠️ AdMob plugin not found (browser mode)");
        return false;
      }

      try {
        const { AdMob } = window.Capacitor.Plugins;
        this.admobPlugin = AdMob;

        await AdMob.initialize({
          // ⚠️ YE REAL ADMOB APP ID YAHAN DAALEIN
          // Abhi test ID hai (sirf testing ke liye)
          initializeForTesting: true // Real ID aane par false karein
        });

        this.isReady = true;
        console.log("✅ AdMob initialized");
        return true;
      } catch(e) {
        console.error("AdMob init error:", e);
        return false;
      }
    },

    // Show banner ad
    showBanner: async function() {
      if (!this.isReady || !this.admobPlugin) return;
      
      try {
        await this.admobPlugin.showBanner({
          adId: this.getBannerId(),
          position: 'BOTTOM_CENTER',
          margin: 0,
          adSize: 'BANNER'
        });
        console.log("📢 Banner ad shown");
      } catch(e) {
        console.error("Banner error:", e);
      }
    },

    // Hide banner ad
    hideBanner: async function() {
      if (!this.isReady || !this.admobPlugin) return;
      try {
        await this.admobPlugin.hideBanner();
      } catch(e) {}
    },

    // Show interstitial ad
    showInterstitial: async function() {
      if (!this.isReady || !this.admobPlugin) {
        // Browser fallback
        console.log("📢 Interstitial (browser mode - skipped)");
        return;
      }
      
      try {
        await this.admobPlugin.prepareInterstitial({
          adId: this.getInterstitialId()
        });
        await this.admobPlugin.showInterstitial();
        console.log("📢 Interstitial shown");
      } catch(e) {
        console.error("Interstitial error:", e);
      }
    },

    // Show rewarded ad
    showRewarded: async function() {
      if (!this.isReady || !this.admobPlugin) return false;
      
      try {
        await this.admobPlugin.prepareRewardVideoAd({
          adId: this.getRewardedId()
        });
        await this.admobPlugin.showRewardVideoAd();
        return true;
      } catch(e) {
        console.error("Rewarded error:", e);
        return false;
      }
    },

    // ==========================================
    // AD UNIT IDs - ⚠️ APNI REAL IDs YAHAN DAALEIN
    // ==========================================
    getBannerId: function() {
      return 'ca-app-pub-9780067506108310/XXXXXXXXXX'; // Apna banner ad unit ID
    },
    getInterstitialId: function() {
      return 'ca-app-pub-9780067506108310/YYYYYYYYYY'; // Apna interstitial ad unit ID
    },
    getRewardedId: function() {
      return 'ca-app-pub-9780067506108310/ZZZZZZZZZZ'; // Apna rewarded ad unit ID
    }
  };

  // ==========================================
  // 4. FIX WITHDRAWAL AD OVERLAY
  // ==========================================

  function fixWithdrawalAds() {
    // Override triggerPostWithdrawalAds to use real AdMob
    window.triggerPostWithdrawalAds = function(n) {
      if (n <= 0) return;
      
      // Show real interstitial if available
      if (AppAds.isReady) {
        AppAds.showInterstitial().then(() => {
          if (n - 1 > 0) {
            setTimeout(() => window.triggerPostWithdrawalAds(n - 1), 500);
          }
        });
      } else {
        // Fallback: Old overlay
        showAdOverlayFallback(n);
      }
    };
  }

  function showAdOverlayFallback(n) {
    const overlay = document.getElementById('adOverlayModal');
    if (!overlay) return;
    const timerText = document.getElementById('ad-timer-countdown');
    const skipBtn = document.getElementById('ad-skip-btn');
    overlay.classList.remove('hidden');
    skipBtn.disabled = true;
    skipBtn.className = "w-full py-2.5 bg-gray-800 text-gray-500 font-bold text-xs rounded-xl border border-gray-700";
    let count = 5;
    timerText.innerText = `Ad (${4 - n}/3) ends in ${count}s`;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        timerText.innerText = `Ad (${4 - n}/3) ends in ${count}s`;
      } else {
        clearInterval(interval);
        timerText.innerText = "Done!";
        skipBtn.disabled = false;
        skipBtn.className = "w-full py-2.5 btn-gradient text-white font-bold text-xs rounded-xl";
        skipBtn.innerText = n > 1 ? `Next Ad (${n - 1})` : "Continue";
        skipBtn.onclick = () => {
          overlay.classList.add('hidden');
          if (n - 1 > 0) setTimeout(() => window.triggerPostWithdrawalAds(n - 1), 300);
        };
      }
    }, 1000);
  }

  // ==========================================
  // 5. AUTO-REQUEST PERMISSIONS ON LOGIN
  // ==========================================

  function autoRequestPermissions() {
    // Check if permissions already asked this session
    if (sessionStorage.getItem('permissions_requested')) return;
    
    setTimeout(async () => {
      if (!currentUser) return;
      sessionStorage.setItem('permissions_requested', 'true');
      
      // Don't spam - ask only if needed
      const hasCam = await AppPermissions.check('camera');
      const hasMic = await AppPermissions.check('microphone');
      
      if (!hasCam || !hasMic) {
        // Silent request
        await AppPermissions.requestAll();
      }
    }, 5000);
  }

  // ==========================================
  // 6. PERMISSIONS BUTTON IN SETTINGS
  // ==========================================

  function addPermissionsButton() {
    setTimeout(() => {
      const settingsModal = document.getElementById('settingsModal');
      if (!settingsModal || document.getElementById('permissions-section')) return;

      const section = document.createElement('div');
      section.id = 'permissions-section';
      section.className = 'bg-gray-900 border border-cyan-500/30 rounded-xl p-4 space-y-3';
      section.innerHTML = `
        <h3 class="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
          <i class="fa-solid fa-shield-halved"></i> App Permissions
        </h3>
        <p class="text-[10px] text-gray-400">Live stream aur camera ke liye permissions zaroori hain</p>
        <button onclick="AppPermissions.requestAll()" class="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold rounded-lg">
          <i class="fa-solid fa-unlock"></i> Grant All Permissions
        </button>
        <div id="permissions-status" class="space-y-1 text-[10px]"></div>
      `;
      
      const walletSection = settingsModal.querySelector('.bg-gray-900');
      if (walletSection) {
        walletSection.parentNode.insertBefore(section, walletSection.nextSibling);
      }
    }, 3000);
  }

  // ==========================================
  // 7. INITIALIZE ALL
  // ==========================================

  function initPermissionsFix() {
    console.log("🔓 Initializing Permissions Fix...");
    
    fixLiveStreamPermissions();
    fixWithdrawalAds();
    addPermissionsButton();
    autoRequestPermissions();
    
    // Init Ads after 4 seconds
    setTimeout(() => {
      AppAds.init().then(ready => {
        if (ready) {
          // Show banner on videos tab
          AppAds.showBanner();
        }
      });
    }, 4000);
    
    console.log("✅ Permissions Fix Ready!");
  }

  // Wait for app
  window.addEventListener('load', function() {
    setTimeout(initPermissionsFix, 4000);
  });

})();
