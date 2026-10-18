// ==========================================
// ⚡ SUPER APP - ULTIMATE CLEAN LOOK (Makeover)
// File: clean-look.js
// ==========================================

(function() {
  'use strict';

  function forceCleanDesign() {
    const style = document.createElement('style');
    style.id = 'force-clean-design';
    
    // Ye CSS purane saare gande colors, shadows aur button designs ko hata degi
    style.innerHTML = `
      /* 1. CLEAN BACKGROUND & FONTS */
      :root {
        --bg-clean: #000000;
        --card-clean: #121212;
        --border-clean: #262626;
        --text-clean: #f5f5f5;
        --accent-clean: #0095f6; /* Instagram Blue */
      }
      
      body, #app-viewport {
        background-color: var(--bg-clean) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        color: var(--text-clean) !important;
      }

      /* 2. HIDE UGLY GRADIENTS & GLOWS */
      .btn-gradient {
        background: var(--accent-clean) !important;
        box-shadow: none !important;
        border-radius: 8px !important;
        border: none !important;
        font-weight: 600 !important;
        color: white !important;
      }

      /* 3. CLEAN HEADER */
      header {
        background: var(--bg-clean) !important;
        border-bottom: 1px solid var(--border-clean) !important;
        box-shadow: none !important;
        padding: 10px 15px !important;
        position: sticky !important;
        top: 0;
        z-index: 100;
      }
      header h1 {
        background: none !important;
        -webkit-text-fill-color: white !important;
        color: white !important;
        font-weight: 800 !important;
        letter-spacing: -0.5px;
      }

      /* 4. CLEAN BOTTOM NAVIGATION */
      nav {
        background: var(--bg-clean) !important;
        border-top: 1px solid var(--border-clean) !important;
        border-radius: 0 !important;
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        padding: 10px 0 !important;
        box-shadow: none !important;
      }
      
      nav button {
        color: #8e8e8e !important;
      }
      nav button.text-cyan-400, nav button.active {
        color: white !important;
      }
      nav button i {
        font-size: 22px !important;
      }
      
      /* Center Plus Button */
      nav button.btn-gradient {
        background: transparent !important;
        border: 2px solid white !important;
        color: white !important;
        transform: none !important;
        box-shadow: none !important;
      }

      /* 5. CLEAN CARDS & MODALS */
      .bg-gray-900, .bg-gray-800, .bg-gray-950 {
        background-color: var(--bg-clean) !important;
        border-color: var(--border-clean) !important;
      }
      
      .fullscreen-modal {
        background-color: var(--bg-clean) !important;
      }

      /* 6. HIDE CLUTTER (Faltu cheezein chupao) */
      #header-premium-btn, #btn-open-mini-apps {
        display: none !important; /* Top header se faltu buttons hatao */
      }

      /* 7. INPUT FIELDS (Chat/Post) */
      input, textarea {
        background-color: var(--card-clean) !important;
        border: 1px solid var(--border-clean) !important;
        border-radius: 20px !important;
        color: white !important;
        padding: 12px 16px !important;
        box-shadow: none !important;
      }
      input:focus, textarea:focus {
        border-color: #555 !important;
        outline: none !important;
      }

      /* 8. STORIES BAR CLEAN */
      #stories-container {
        background: var(--bg-clean) !important;
        border-bottom: 1px solid var(--border-clean) !important;
        padding: 10px !important;
        border-radius: 0 !important;
      }
      
      /* 9. VIDEO PLAYER OVERLAYS */
      .video-action-btn i {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)) !important;
        color: white !important;
      }
      .video-action-btn .text-red-500 {
        color: #ff3040 !important; /* Clean Red */
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // App load hote hi design force karein
  window.addEventListener('load', () => {
    forceCleanDesign();
    console.log("✨ Clean Modern UI Applied! App should look like Instagram/Threads now.");
  });
  
  // Agar user tab change kare toh bhi design barkarar rahe
  setInterval(() => {
    if (!document.getElementById('force-clean-design')) {
      forceCleanDesign();
    }
  }, 3000);

})();
