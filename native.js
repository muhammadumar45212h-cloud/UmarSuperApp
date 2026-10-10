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

  // ════════════════���══════════════════════════════════════════════
  // REQUEST ALL PERMISSIONS ON START
  // ═══════════════════════════════════════════════════════════════
  async function requestAllPermissions() {
    if (!isNative) {
      console.log('🌐 Web mode - permissions browser will handle');
      return true;
    }

    let allGranted = true;

    // Camera permission via Capacitor
    try {
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.Camera) {
        const cameraPerm = await window.Capacitor.Plugins.Camera.checkPermissions();
        console.log('Camera permission:', cameraPerm);
        
        if (cameraPerm && cameraPerm.camera !== 'granted') {
          const result = await window.Capacitor.Plugins.Camera.requestPermissions();
          console.log('Camera permission result:', result);
          if (result && result.camera !== 'granted') allGranted = false;
        }
      }
    } catch(e) {
      console.warn('Camera plugin permission error:', e.message);
    }

    // Microphone permission check
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const micPerm = await navigator.permissions.query({ name: 'microphone' });
        console.log('Mic permission:', micPerm.state);
        if (micPerm.state === 'denied') allGranted = false;
      }
    } catch(e) {}

    // Storage / Filesystem availability check
    try {
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
        console.log('Filesystem plugin available');
      }
    } catch(e) {}

    return allGranted;
  }

  // ═══════════════════════════════════════════════════════════════
  // SMART CAMERA OPENER (works both in APK and browser)
  // ═══════════════════════════════════════════════════════════════
  async function openCameraSmart() {
    // In APK - try native camera permission check first
    if (isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera) {
      try {
        const cameraPerm = await window.Capacitor.Plugins.Camera.checkPermissions();
        if (cameraPerm && cameraPerm.camera !== 'granted') {
          const granted = await window.Capacitor.Plugins.Camera.requestPermissions();
          if (!granted || granted.camera !== 'granted') {
            alert('❌ Camera permission chahiye. Settings → Permissions → Camera → Allow');
            return null;
          }
        }
      } catch(e) { console.warn('Capacitor Camera check error:', e); }
    }

    // Guard against unsupported mediaDevices (e.g. non-HTTPS)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('❌ Camera API is browser/device par supported nahi hai (HTTPS required).');
      return null;
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
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        if (isNative) {
          alert('📷 Camera allow karein:\n1. Phone Settings kholein\n2. Apps → Super Sphere\n3. Permissions → Camera & Mic → Allow\n4. Phir se try karein');
        } else {
          alert('📷 Browser mein camera allow karein:\nURL ke 🔒 icon → Camera → Allow → Reload');
        }
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        alert('❌ Koi camera device nahi mila');
      } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
        alert('❌ Camera busy hai. Baaki apps band karein.');
      } else {
        alert('❌ Camera start karne mein masla aya: ' + (e.message || e.name));
      }
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SAFE HOOK FOR openLiveStreamRoom
  // ═══════════════════════════════════════════════════════════════
  function setupLiveStreamHook() {
    if (window.__nativeHooked) return;
    if (typeof window.openLiveStreamRoom === 'function') {
      const originalOpenLive = window.openLiveStreamRoom;
      window.__nativeHooked = true;
      window.openLiveStreamRoom = async function(...args) {
        if (isNative) {
          await requestAllPermissions();
        }
        return originalOpenLive.apply(this, args);
      };
    }
  }

  // Attempt hook immediately and after scripts finish loading
  setupLiveStreamHook();
  document.addEventListener('DOMContentLoaded', setupLiveStreamHook);
  window.addEventListener('load', setupLiveStreamHook);

  // ═══════════════════════════════════════════════════════════════
  // CHECK CAMERA PERMISSION DENIED (browser/APK guidance)
  // ══════════════════════════════════════���════════════════════════
  async function checkCameraPermissionState() {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' });
        console.log('📷 Camera permission state:', result.state);
        
        if (result.state === 'denied') {
          setTimeout(() => {
            alert(
              '📷 Camera Permission Blocked Hai!\n\n' +
              'Isay allow karne ka tareeqa:\n' +
              '• Web Browser: URL ke sath 🔒 lock icon dabayein → Site settings / Permissions → Camera: Allow → Page reload karein.\n\n' +
              '• Android APK: Phone Settings → Apps → Super Sphere → Permissions → Camera & Microphone → Allow.'
            );
          }, 1500);
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
  // FILE PICKER LOGGING
  // ═══════════════════════════════════════════════════════════════
  if (isNative) {
    document.addEventListener('change', (e) => {
      if (e.target && e.target.type === 'file' && e.target.files) {
        console.log('📁 File selected:', e.target.files.length, 'files');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO-INIT
  // ═════════════════════════════════════════��═════════════════════
  window.addEventListener('load', async () => {
    await checkCameraPermissionState();
    
    if (isNative) {
      setTimeout(requestAllPermissions, 1500);
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