// ==========================================
// ⚡ SUPER APP - PREMIUM UI MAKEOVER (V1)
// File: premium-ui.js
// Note: This file ONLY changes CSS. No functional logic is touched.
// ==========================================

(function() {
  'use strict';

  // Inject Premium CSS
  function injectPremiumCSS() {
    if (document.getElementById('premium-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'premium-ui-styles';
    style.innerHTML = `
      /* ═══════════ 1. GLOBAL PREMIUM STYLES ═══════════ */
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

      :root {
        --bg-dark: #050810;
        --card-bg: rgba(17, 24, 39, 0.7);
        --glass-border: rgba(255, 255, 255, 0.1);
        --accent-glow: rgba(0, 242, 254, 0.4);
      }

      body {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        background: radial-gradient(circle at top left, #111827 0%, #050810 100%) !important;
        color: #f3f4f6 !important;
        -webkit-font-smoothing: antialiased;
      }

      /* ═══════════ 2. FLOATING GLASS HEADER ═══════════ */
      header {
        position: fixed !important;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        background: rgba(5, 8, 16, 0.75) !important;
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        margin: 0 !important;
        padding: 12px 16px !important;
        border-radius: 0 0 20px 20px;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
      }

      /* Main viewport ko header ke neeche shift karein */
      #app-viewport {
        padding-top: 70px;
      }

      /* ═══════════ 3. FLOATING BOTTOM NAV (iOS Style) ═══════════ */
      nav {
        position: fixed !important;
        bottom: 16px !important;
        left: 16px !important;
        right: 16px !important;
        z-index: 100;
        background: rgba(17, 24, 39, 0.85) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 24px !important;
        padding: 10px 20px !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1);
        width: auto !important;
        border-top: 1px solid rgba(255, 255, 255, 0.1) !important; /* Override old tailwind */
      }

      nav button {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      nav button:active {
        transform: scale(0.85);
      }

      /* Center Plus Button Glow */
      nav button.btn-gradient {
        background: linear-gradient(135deg, #00f2fe, #4facfe) !important;
        box-shadow: 0 0 20px var(--accent-glow), 0 5px 15px rgba(0,0,0,0.4) !important;
        transform: translateY(-15px) !important;
        border: 2px solid rgba(255,255,255,0.2) !important;
      }

      /* ═══════════ 4. GLASSMORPHISM MODALS ═══════════ */
      .fullscreen-modal {
        background: rgba(5, 8, 16, 0.85) !important;
        backdrop-filter: blur(25px) !important;
        -webkit-backdrop-filter: blur(25px) !important;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1); }
      }

      /* Inner Cards in Modals */
      .bg-gray-900, .bg-gray-950 {
        background: rgba(17, 24, 39, 0.6) !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      }

      /* ═══════════ 5. VIDEO ACTION BUTTONS (GLOW) ═══════════ */
      .video-action-btn {
        transition: transform 0.2s ease, filter 0.2s ease;
      }
      
      .video-action-btn:active {
        transform: scale(0.8) !important;
      }

      .video-action-btn i {
        filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4)) !important;
      }

      .video-action-btn .text-red-500 {
        filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.8)) !important;
        animation: heartBeat 1s infinite alternate;
      }

      .video-action-btn .text-amber-400 {
        filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.8)) !important;
      }

      @keyframes heartBeat {
        0% { transform: scale(1); }
        100% { transform: scale(1.1); }
      }

      /* ═══════════ 6. PREMIUM BUTTONS & GRADIENTS ═══════════ */
      .btn-gradient {
        background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%) !important;
        box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3) !important;
        border: none !important;
        transition: all 0.3s ease !important;
      }

      .btn-gradient:active {
        transform: scale(0.95);
        box-shadow: 0 2px 10px rgba(0, 242, 254, 0.2) !important;
      }

      /* ═══════════ 7. SCROLLBAR HIDE (Clean look) ═══════════ */
      ::-webkit-scrollbar {
        display: none !important;
      }

      /* ═══════════ 8. INPUT FIELDS (Floating Style) ═══════════ */
      input, textarea, select {
        background: rgba(17, 24, 39, 0.8) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 12px !important;
        color: #fff !important;
        transition: all 0.3s ease;
      }

      input:focus, textarea:focus, select:focus {
        border-color: #00f2fe !important;
        box-shadow: 0 0 0 3px rgba(0, 242, 254, 0.2) !important;
        outline: none !important;
      }

      /* ═══════════ 9. STORIES BAR (Premium Look) ═══════════ */
      #stories-container {
        padding-top: 10px;
        padding-bottom: 10px;
        background: linear-gradient(to bottom, rgba(5,8,16,0.9) 0%, transparent 100%);
        backdrop-filter: blur(4px);
      }

      #stories-container .w-16 {
        box-shadow: 0 0 15px rgba(0, 242, 254, 0.3);
        transition: transform 0.2s;
      }
      
      #stories-container .w-16:active {
        transform: scale(0.9);
      }

      /* ═══════════ 10. TOAST NOTIFICATION ═══════════ */
      #toast-notification {
        background: rgba(17, 24, 39, 0.95) !important;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 242, 254, 0.5) !important;
        box-shadow: 0 10px 30px rgba(0, 242, 254, 0.2) !important;
        color: #fff !important;
      }
    `;
    document.head.appendChild(style);
  }

  // UI adjustments jo JS se karne padte hain
  function applyLayoutFixes() {
    // Header ke neeche content shift karein taaki hidden na ho
    const viewport = document.getElementById('app-viewport');
    if (viewport) {
      viewport.style.paddingBottom = '90px'; // For floating bottom nav
    }
  }

  // Wait for app to load
  window.addEventListener('load', function() {
    setTimeout(() => {
      console.log("✨ Injecting Premium UI...");
      injectPremiumCSS();
      applyLayoutFixes();
      console.log("✅ App looks Premium now!");
    }, 1500);
  });

})();
