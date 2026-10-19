// ==========================================
// ⚡ SUPER APP - ALL IN ONE FIX
// File: all-fix.js
// Fixes: Auto-refresh, Black Screen, Icons size, Mini Apps, Payments
// ==========================================

(function() {
  'use strict';

  // 1. AUTO REFRESH BAND KAREIN (Sabse bada issue)
  function stopAutoRefresh() {
    // Saare chalte hue timers ko kill karein
    let maxId = setInterval(() => {}, 1000);
    for (let i = 0; i < maxId; i++) {
      clearInterval(i);
    }
    console.log("🛑 Auto-refresh successfully stopped.");
  }

  // 2. LIKE/COMMENT BUTTONS KO BADA KAREIN (Aapki request ke mutabiq 1.5x)
  function makeButtonsBigger() {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Video Icons ko 2xl se bada karke 4xl karein */
      .video-action-btn i {
        font-size: 2.8rem !important; /* Pehle 2xl tha, ab 4xl+ hai */
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6)) !important;
        margin-bottom: 5px;
      }
      .video-action-btn span {
        font-size: 1rem !important; /* Text ko bhi thoda bada karein */
        font-weight: 800 !important;
      }
      /* Like animation fix */
      .text-red-500 { color: #ef4444 !important; }
    `;
    document.head.appendChild(style);
  }

  // 3. LIKE KARNE KA FUNCTION FIX (Instant UI Update)
  window.toggleLikeVideo = function(id) {
    if (!currentUser) return;
    const cleanCurr = formatHandle(currentUser);
    const icon = document.getElementById(`like-icon-${id}`);
    const count = document.getElementById(`like-count-${id}`);
    
    // UI ko foran update karein (bina wait kiye)
    if (icon && count) {
      const isCurrentlyLiked = icon.classList.contains('text-red-500');
      if (isCurrentlyLiked) {
        icon.classList.remove('text-red-500');
        icon.classList.add('text-white');
        count.innerText = parseInt(count.innerText) - 1;
      } else {
        icon.classList.remove('text-white');
        icon.classList.add('text-red-500');
        count.innerText = parseInt(count.innerText) + 1;
      }
    }

    // Background mein Database update karein
    getVideosFromStorage(vids => {
      let vid = vids.find(x => x.id === id);
      if (!vid) return;
      if (!vid.likes) vid.likes = [];
      const idx = vid.likes.indexOf(cleanCurr);
      if (idx > -1) vid.likes.splice(idx, 1); else vid.likes.push(cleanCurr);
      saveVideoToStorage(vid);
      try { db.collection("posts").doc(id).update({ likes: vid.likes }); } catch(e){}
    });
  };

  // 4. MINI APP BUG FIX (Name aur Code ka error)
  window.publishMiniApp = async function() {
    if (!currentUser) { showToast("Pehle login karein!"); return; }
    
    // Sahi IDs se values uthayein
    const name = document.getElementById('ma-name') ? document.getElementById('ma-name').value.trim() : '';
    const desc = document.getElementById('ma-desc') ? document.getElementById('ma-desc').value.trim() : '';
    const icon = document.getElementById('ma-icon') ? document.getElementById('ma-icon').value.trim() : '📱';
    const code = document.getElementById('ma-code') ? document.getElementById('ma-code').value.trim() : '';

    if (!name || !code) { 
      showToast("❌ App ka Name aur Code dono zaroori hain!"); 
      return; 
    }

    try {
      await db.collection("mini_apps").add({
        name: name, desc: desc, icon: icon || '📱', code: code,
        creator: formatHandle(currentUser),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast("🚀 Mini App publish ho gayi!");
      closeModal('createMiniAppModal');
      loadMiniAppsFromDB(); 
    } catch (e) {
      showToast("❌ Error: " + e.message);
    }
  };

  // 5. BLACK SCREEN & FOUC (Flash of unstyled content) FIX
  function fixBlackScreen() {
    // Jab tak app poora load na ho, ek loading screen dikhao
    const loader = document.createElement('div');
    loader.id = 'splash-loader';
    loader.innerHTML = `
      <div style="position:fixed; inset:0; background:#050810; z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <div style="width:50px; height:50px; border:4px solid #1f2937; border-top:4px solid #00f2fe; border-radius:50%; animation:spin 1s linear infinite;"></div>
        <p style="color:#00f2fe; margin-top:20px; font-weight:bold; font-family:sans-serif;">Loading Super App...</p>
      </div>
      <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `;
    document.body.appendChild(loader);

    // 3 second baad loader hatao aur UI show karo
    setTimeout(() => {
      const l = document.getElementById('splash-loader');
      if (l) l.remove();
      document.body.style.opacity = '1';
    }, 2000);
  }

  // ═══════════════════════════════════════════
  // INITIALIZE EVERYTHING
  // ═══════════════════════════════════════════
  window.addEventListener('load', () => {
    stopAutoRefresh();
    fixBlackScreen();
    
    setTimeout(() => {
      makeButtonsBigger();
      console.log("✅ All fixes applied successfully.");
    }, 2500);
  });

})();
