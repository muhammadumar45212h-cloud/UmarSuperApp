// ==========================================
// ⚡ SUPER APP - REAL PATCH (Connects Everything)
// File: patch-real.js
// ==========================================

(function() {
  'use strict';

  window.addEventListener('load', () => {
    setTimeout(() => {
      // 1. Override Live Stream Buttons
      window.openLiveStreamRoom = function(mode) {
        if (mode === 'solo') window.openRealSoloLive();
        else if (mode === 'pk') window.openRealPkMatch();
      };
      window.closeLiveStream = window.closeRealLiveStream;

      // 2. Replace with Real Ads
      window.AdMobManager = window.RealAds; // Fallback mapping
      
      // 3. Ensure Agora script is loaded
      if (!document.querySelector('script[src*="agora"]')) {
        const script = document.createElement('script');
        script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N.js';
        document.head.appendChild(script);
      }

      // 4. Ensure PeerJS script is loaded
      if (!document.querySelector('script[src*="peerjs"]')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
        document.head.appendChild(script);
      }

      console.log("🚀 Real Features Patched Successfully!");
    }, 2000);
  });
})();
