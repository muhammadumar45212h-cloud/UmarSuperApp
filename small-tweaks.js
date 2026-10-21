// ==========================================
// ⚡ SUPER APP - PREMIUM TOUCHES & UI FIXES
// File: small-tweaks.js
// ==========================================

(function() {
  'use strict';

  // 1. Fix Notch / Safe Area (Status bar / Bottom bar)
  function fixSafeAreas() {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Top header ko notch se bachayein */
      header {
        padding-top: env(safe-area-inset-top, 10px) !important;
      }
      /* Bottom nav ko gesture bar se bachayein */
      nav {
        padding-bottom: env(safe-area-inset-bottom, 10px) !important;
      }
      /* Modals ke andar ka content niche na kate */
      .fullscreen-modal {
        padding-bottom: env(safe-area-inset-bottom, 20px) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 2. Haptic Feedback (Vibration on Tap)
  function addHapticFeedback() {
    // Jab bhi user kisi button ya link par tap kare
    document.addEventListener('click', function(e) {
      const target = e.target.closest('button, a, .video-action-btn, .nav-btn');
      if (target) {
        // Agar phone vibrate support karta hai (Android Chrome/WebView)
        if (navigator.vibrate) {
          navigator.vibrate(15); // 15 milliseconds ka halka sa vibration
        }
      }
    });
  }

  // 3. "Coming Soon" UI for unlinked features
  function handleEmptyStates() {
    // Agar koi aisa button dabaye jo abhi ready nahi hai
    // toh app crash/hang hone ki jagah ek acha message aaye.
    
    // Example: Agar future mein koi "Video Call" ya "AI" ka button aaye
    window.showComingSoon = function(featureName) {
      // Ek premium toast notification banayein
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-5 py-3 rounded-2xl shadow-2xl z-[99999] flex items-center gap-3 animate-bounce';
      toast.innerHTML = `
        <i class="fa-solid fa-wand-magic-sparkles text-lg"></i>
        <div>
          <p class="text-xs font-bold">${featureName}</p>
          <p class="text-[9px] opacity-90">Jald aa raha hai! Next Update mein.</p>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    };
  }

  // 4. Prevent Double-Tap Zoom (Makes app feel like Native App)
  function disableDoubleTapZoom() {
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  // INIT
  window.addEventListener('load', () => {
    setTimeout(() => {
      fixSafeAreas();
      addHapticFeedback();
      handleEmptyStates();
      disableDoubleTapZoom();
      console.log("✨ Premium UI Touches Applied!");
    }, 1000);
  });

})();
