// ==========================================
// ⚡ SUPER APP - REAL SEARCH & REFRESH
// File: real-features.js
// ==========================================

(function() {
  'use strict';

  // ==========================================
  // 1. REAL SEARCH (Firestore / Cloud Se)
  // ==========================================
  window.performSearch = async function() {
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    const results = document.getElementById('searchResults');
    
    if (!q) { 
      results.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">Type to search...</p>'; 
      return; 
    }

    results.innerHTML = '<div class="text-center py-8"><i class="fa-solid fa-spinner fa-spin text-cyan-400 text-xl"></i><p class="text-xs text-gray-400 mt-2">Searching cloud...</p></div>';
    
    let found = false;
    let htmlContent = '';

    try {
      // A. Users ko search karein
      if (currentSearchFilter === 'all' || currentSearchFilter === 'users') {
        const usersSnap = await db.collection("users").limit(100).get();
        usersSnap.forEach(doc => {
          const u = doc.id;
          const d = doc.data();
          if (u.toLowerCase().includes(q) || (d.name && d.name.toLowerCase().includes(q))) {
            found = true;
            htmlContent += `
              <div onclick="closeSearchOverlay(); openPublicUserProfileModal('${u}')" class="p-3 bg-gray-900 border border-cyan-500/30 rounded-xl flex items-center gap-3 cursor-pointer">
                <img src="${d.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u}`}" class="w-10 h-10 rounded-full bg-gray-800">
                <div class="flex-1">
                  <p class="text-xs font-bold text-cyan-400">@${u}</p>
                  <p class="text-[10px] text-gray-500">${d.name || 'User'}</p>
                </div>
              </div>
            `;
          }
        });
      }

      // B. Posts/Videos ko search karein
      if (currentSearchFilter === 'all' || currentSearchFilter === 'videos') {
        const postsSnap = await db.collection("posts").limit(100).get();
        postsSnap.forEach(doc => {
          const v = doc.data();
          if ((v.caption && v.caption.toLowerCase().includes(q)) || (v.user && v.user.toLowerCase().includes(q))) {
            found = true;
            htmlContent += `
              <div onclick="closeSearchOverlay(); switchTab('${v.url ? 'videos' : 'feed'}')" class="p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-center gap-3 cursor-pointer">
                <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                  <i class="fa-solid ${v.url ? 'fa-play' : 'fa-pen'} text-cyan-400"></i>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-bold text-white">@${v.user}</p>
                  <p class="text-[10px] text-gray-400 line-clamp-1">${v.caption || 'Video/Post'}</p>
                </div>
              </div>
            `;
          }
        });
      }

      // C. Channels ko search karein
      if (currentSearchFilter === 'all' || currentSearchFilter === 'channels') {
        const channelsSnap = await db.collection("channels").limit(50).get();
        channelsSnap.forEach(doc => {
          const c = doc.data();
          if (c.name && c.name.toLowerCase().includes(q)) {
            found = true;
            htmlContent += `
              <div onclick="closeSearchOverlay(); openChannelConversation('${doc.id}')" class="p-3 bg-gray-900 border border-amber-500/30 rounded-xl flex items-center gap-3 cursor-pointer">
                <img src="${c.photo}" class="w-10 h-10 rounded-full bg-gray-800">
                <div class="flex-1">
                  <p class="text-xs font-bold text-amber-400">${c.name}</p>
                  <p class="text-[10px] text-gray-500">Channel</p>
                </div>
              </div>
            `;
          }
        });
      }

      if (found) {
        results.innerHTML = htmlContent;
      } else {
        results.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">Kuch nahi mila (Cloud par).</p>';
      }

    } catch (e) {
      console.error("Search error:", e);
      results.innerHTML = '<p class="text-xs text-red-500 text-center py-8">Search fail ho gayi. Internet check karein.</p>';
    }
  };

  // ==========================================
  // 2. REAL REFRESH (Cloud Se Naya Data)
  // ==========================================
  window.realRefreshApp = async function() {
    // UI mein spinner dikhayein
    const refreshBtn = document.getElementById('header-refresh-btn');
    if (refreshBtn) {
      refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i>';
      refreshBtn.disabled = true;
    }

    showToast("🔄 Cloud se naya data aa raha hai...");

    try {
      // 1. Purana local data clear karein (Optional, taaki naya load ho)
      // const tx = dbInstance.transaction("videos", "readwrite");
      // tx.objectStore("videos").clear();

      // 2. Firestore se naya data pull karein (Posts)
      const snapshot = await db.collection("posts").orderBy("createdAt", "desc").limit(100).get();
      
      // 3. Local IndexedDB ko update karein
      snapshot.forEach(doc => {
        const d = doc.data();
        const post = {
          id: doc.id, type: d.type, url: d.url || null, user: d.user,
          caption: d.caption || '', link: d.link || null,
          likes: d.likes || [], comments: d.comments || [], views: d.views || 0
        };
        saveVideoToStorage(post);
      });

      // 4. UI ko refresh karein
      if (typeof initAppContent === 'function') initAppContent();
      if (typeof loadUserData === 'function') loadUserData();
      if (typeof updateWalletUI === 'function') updateWalletUI();
      if (typeof renderDmInboxList === 'function') renderDmInboxList();

      showToast("✅ Data Refresh Ho Gaya!");

    } catch (e) {
      console.error("Refresh Error:", e);
      showToast("❌ Refresh fail: " + e.message);
    } finally {
      // Spinner wapas icon mein badal dein
      if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fa-solid fa-rotate text-xs"></i>';
        refreshBtn.disabled = false;
      }
    }
  };

  // ==========================================
  // 3. HEADER REFRESH BUTTON UPDATE
  // ==========================================
  setTimeout(() => {
    const header = document.querySelector('header .flex.gap-2');
    if (header && !document.getElementById('header-refresh-btn')) {
      const btn = document.createElement('button');
      btn.id = 'header-refresh-btn';
      btn.onclick = window.realRefreshApp; // Naya real function
      btn.className = 'w-8 h-8 rounded-full bg-gray-800 text-cyan-400 flex items-center justify-center border border-cyan-500/30 active:scale-90';
      btn.innerHTML = '<i class="fa-solid fa-rotate text-xs"></i>';
      header.insertBefore(btn, header.firstChild);
    } else if (document.getElementById('header-refresh-btn')) {
      // Agar pehle se hai, toh uska onclick change kar dein
      document.getElementById('header-refresh-btn').onclick = window.realRefreshApp;
    }
  }, 2000);

})();
