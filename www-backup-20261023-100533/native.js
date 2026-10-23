/* ═══════════════════════════════════════════════════════════════
   SUPER APP - NATIVE PERMISSIONS MODULE
   APK ke liye automatic permissions - browser prompt nahi
   
   Add to index.html: <script src="native.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // Detect if running in Capacitor APK
  const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const isAndroid = isNative && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'android';
  const isIOS = isNative && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'ios';

  console.log('📱 Platform:', isNative ? (isAndroid ? 'Android APK' : 'iOS APK') : 'Web Browser');

  // ═══════════════════════════════════════════════════════════════
  // REQUEST ALL PERMISSIONS ON START
  // ═══════════════════════════════════════════════════════════════
  async function requestAllPermissions() {
    if (!isNative) {
      console.log('🌐 Web mode - permissions browser will handle');
      return;
    }

    try {
      // Use Capacitor Camera plugin if available
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.Camera) {
        const cameraPerm = await window.Capacitor.Plugins.Camera.checkPermissions();
        console.log('Camera permission:', cameraPerm);
        
        if (cameraPerm.camera !== 'granted') {
          const result = await window.Capacitor.Plugins.Camera.requestPermissions();
          console.log('Camera permission result:', result);
        }
      }
    } catch(e) { console.log('Camera plugin:', e.message); }

    // Microphone permission
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const micPerm = await navigator.permissions.query({ name: 'microphone' });
        console.log('Mic permission:', micPerm.state);
      }
    } catch(e) {}

    // Storage (for file uploads)
    try {
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
        console.log('Filesystem plugin available');
      }
    } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════════
  // SMART CAMERA OPENER (works both in APK and browser)
  // ═══════════════════════════════════════════════════════════════
  async function openCameraSmart() {
    // In APK - try native camera first
    if (isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera) {
      try {
        const cameraPerm = await window.Capacitor.Plugins.Camera.checkPermissions();
        if (cameraPerm.camera !== 'granted') {
          const granted = await window.Capacitor.Plugins.Camera.requestPermissions();
          if (granted.camera !== 'granted') {
            alert('❌ Camera permission chahiye. Settings → Permissions → Camera → Allow');
            return null;
          }
        }
      } catch(e) { console.log(e); }
    }

    // Use getUserMedia (works in both APK WebView and browser)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true
      });
      return stream;
    } catch(e) {
      console.error('Camera error:', e);
      if (e.name === 'NotAllowedError') {
        if (isNative) {
          alert('📷 Camera allow karein:\n1. Phone Settings kholein\n2. Apps → Super App\n3. Permissions → Camera → Allow\n4. Phir se try karein');
        } else {
          alert('📷 Browser mein camera allow karein:\nURL ke 🔒 icon → Camera → Allow → Reload');
        }
      } else if (e.name === 'NotFoundError') {
        alert('❌ Koi camera device nahi mila');
      } else if (e.name === 'NotReadableError') {
        alert('❌ Camera busy hai. Baaki apps band karein.');
      }
      return null;
    }
  }

  // Override openLiveStreamRoom for native
  const originalOpenLive = window.openLiveStreamRoom;
  if (typeof originalOpenLive === 'function' && !window.__nativeHooked) {
    window.__nativeHooked = true;
    window.openLiveStreamRoom = async function(mode) {
      // Native permission check first
      if (isNative) {
        const granted = await requestAllPermissions();
      }
      // Call original
      return originalOpenLive.apply(this, arguments);
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX CAMERA PERMISSION DENIED (browser permanent block)
  // ═══════════════════════════════════════════════════════════════
  async function checkCameraPermissionState() {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' });
        console.log('📷 Camera permission state:', result.state);
        
        if (result.state === 'denied') {
          // Show clear instructions
          setTimeout(() => {
            const help = confirm(
              '📷 Camera Permission BLOCK hai!\n\n' +
              'Solution:\n' +
              '1. Browser mein URL ke bagal 🔒 icon dabayein\n' +
              '2. "Site settings" ya "Permissions" kholein\n' +
              '3. Camera → Allow\n' +
              '4. Page refresh karein\n\n' +
              'Ya APK mein: Phone Settings → Apps → Super App → Permissions → Camera → Allow\n\n' +
              'Reset karein?'
            );
            if (help) {
              // Try to reset (works in some browsers)
              try {
                if (window.chrome && window.chrome.runtime) {
                  console.log('Manual reset needed');
                }
              } catch(e) {}
            }
          }, 2000);
        }
        return result.state;
      }
    } catch(e) {}
    return 'unknown';
  }

  // ═══════════════════════════════════════════════════════════════
  // BACK BUTTON HANDLER (Android APK)
  // ═══════════════════════════════════════════════════════════════
  if (isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
      // Check if any modal is open
      const openModals = document.querySelectorAll('.fullscreen-modal:not(.hidden)');
      if (openModals.length > 0) {
        // Close the top modal
        const topModal = openModals[openModals.length - 1];
        topModal.classList.add('hidden');
        return;
      }
      
      // Check if any drawer is open
      const drawers = document.querySelectorAll('.drawer-bottom.open');
      if (drawers.length > 0) {
        drawers.forEach(d => d.classList.remove('open'));
        return;
      }
      
      // Otherwise exit app or go back
      if (!canGoBack) {
        if (confirm('App band karein?')) {
          window.Capacitor.Plugins.App.exitApp();
        }
      } else {
        window.history.back();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // STATUS BAR COLOR (Android APK - dark theme)
  // ═══════════════════════════════════════════════════════════════
  if (isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
    try {
      window.Capacitor.Plugins.StatusBar.setStyle({ style: 'DARK' });
      window.Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#090d16' });
    } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════════
  // SPLASH SCREEN HIDE
  // ═══════════════════════════════════════════════════════════════
  if (isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen) {
    setTimeout(() => {
      try {
        window.Capacitor.Plugins.SplashScreen.hide();
      } catch(e) {}
    }, 1500);
  }

  // ═══════════════════════════════════════════════════════════════
  // FILE PICKER FIX (APK needs special handling for file input)
  // ═══════════════════════════════════════════════════════════════
  if (isNative) {
    document.addEventListener('change', (e) => {
      if (e.target && e.target.type === 'file') {
        console.log('📁 File selected:', e.target.files.length, 'files');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO-INIT
  // ═══════════════════════════════════════════════════════════════
  window.addEventListener('load', async () => {
    // Check camera state
    await checkCameraPermissionState();
    
    // Request permissions on start (native only)
    if (isNative) {
      setTimeout(requestAllPermissions, 2000);
    }
  });

  // Export
  window.__NATIVE__ = {
    isNative,
    isAndroid,
    isIOS,
    openCameraSmart,
    requestAllPermissions,
    checkCameraPermissionState
  };

  console.log('✅ native.js loaded - Platform:', isNative ? (isAndroid ? 'Android' : 'iOS') : 'Web');

})();
