// ==========================================
// ⚡ SUPER APP - PROFESSIONAL MINI APP STORE
// File: mini-apps-store.js
// Features: Search, Create, List, Execute (Sandbox)
// ==========================================

(function() {
  'use strict';

  // UI Inject karein jab app load ho
  function injectMiniAppUI() {
    if (document.getElementById('miniAppStoreModal')) return;

    const modalsHTML = `
      <!-- MINI APP STORE MODAL -->
      <div id="miniAppStoreModal" class="fullscreen-modal hidden bg-gray-950 z-[80] flex flex-col">
        <!-- Header -->
        <div class="p-3 bg-gray-900 border-b border-gray-800 flex justify-between items-center shadow-lg">
          <h2 class="text-sm font-bold text-amber-400 flex items-center gap-2">
            <i class="fa-solid fa-cubes"></i> Mini App Store
          </h2>
          <div class="flex items-center gap-2">
            <button onclick="openCreateMiniAppModal()" class="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-xs font-bold shadow-md active:scale-95">
              <i class="fa-solid fa-plus"></i> Create
            </button>
            <button onclick="closeModal('miniAppStoreModal')" class="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="p-3 bg-gray-900 border-b border-gray-800">
          <div class="relative">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
            <input type="text" id="miniAppSearchInput" oninput="filterMiniApps(this.value)" 
              class="w-full bg-gray-800 border border-gray-700 pl-9 pr-3 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-all" 
              placeholder="Search mini apps...">
          </div>
        </div>

        <!-- Apps Grid -->
        <div class="flex-1 overflow-y-auto p-4 no-scrollbar">
          <div id="miniAppsGrid" class="grid grid-cols-3 gap-3 pb-20">
            <p class="text-xs text-gray-500 text-center col-span-3 py-10">Loading apps...</p>
          </div>
        </div>
      </div>

      <!-- CREATE MINI APP MODAL -->
      <div id="createMiniAppModal" class="fullscreen-modal hidden bg-gray-950 z-[85] overflow-y-auto">
        <div class="p-4 space-y-4">
          <div class="flex justify-between items-center border-b border-gray-800 pb-3">
            <h2 class="text-sm font-bold text-cyan-400 flex items-center gap-2"><i class="fa-solid fa-code"></i> Create Mini App</h2>
            <button onclick="closeModal('createMiniAppModal')" class="text-gray-400"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="text-[10px] text-gray-400 uppercase font-bold">App Name</label>
              <input type="text" id="ma-name" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-xs text-white mt-1" placeholder="e.g. My Calculator">
            </div>
            <div>
              <label class="text-[10px] text-gray-400 uppercase font-bold">Description</label>
              <input type="text" id="ma-desc" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-xs text-white mt-1" placeholder="What does this app do?">
            </div>
            <div>
              <label class="text-[10px] text-gray-400 uppercase font-bold">Icon (Emoji)</label>
              <input type="text" id="ma-icon" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-xs text-white mt-1" placeholder="e.g. 🧮, 🎮, 📝" maxlength="2">
            </div>
            <div>
              <label class="text-[10px] text-gray-400 uppercase font-bold">HTML / JS Code</label>
              <textarea id="ma-code" class="w-full h-64 bg-gray-900 border border-gray-700 p-3 rounded-xl text-xs font-mono text-green-400 mt-1" 
                placeholder="<h1>Hello World</h1>"></textarea>
            </div>
          </div>

          <button onclick="publishMiniApp()" class="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold rounded-xl shadow-lg active:scale-95 mt-4">
            <i class="fa-solid fa-cloud-arrow-up"></i> Publish to Store
          </button>
        </div>
      </div>

      <!-- MINI APP PLAYER MODAL -->
      <div id="miniAppPlayerModal" class="fullscreen-modal hidden bg-black z-[90] flex flex-col">
        <div class="p-3 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span id="ma-player-icon" class="text-xl">📱</span>
            <div>
              <h3 class="text-xs font-bold text-white" id="ma-player-title">App Name</h3>
              <p class="text-[9px] text-gray-500" id="ma-player-author">by @user</p>
            </div>
          </div>
          <button onclick="closeMiniAppPlayer()" class="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="flex-1 w-full h-full bg-white relative">
          <!-- Sandbox important hai security ke liye -->
          <iframe id="ma-iframe" sandbox="allow-scripts allow-forms allow-modals" class="w-full h-full border-0 bg-white"></iframe>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalsHTML);
  }

  // ==========================================
  // OPEN STORE & LOAD APPS
  // ==========================================
  window.openMiniAppsStore = async function() {
    openModal('miniAppStoreModal');
    await loadMiniAppsFromDB();
  };

  window.loadMiniAppsFromDB = async function() {
    const grid = document.getElementById('miniAppsGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="col-span-3 text-center py-10"><i class="fa-solid fa-spinner fa-spin text-cyan-400 text-2xl"></i></div>';

    try {
      // Firestore se saare mini apps load karein
      const snapshot = await db.collection("mini_apps").orderBy("createdAt", "desc").limit(100).get();
      
      window.__miniAppsCache = []; // Search ke liye cache

      if (snapshot.empty) {
        grid.innerHTML = '<p class="text-xs text-gray-500 text-center col-span-3 py-10">No mini apps found. Create the first one!</p>';
        return;
      }

      grid.innerHTML = '';
      snapshot.forEach(doc => {
        const app = { id: doc.id, ...doc.data() };
        window.__miniAppsCache.push(app);
        renderMiniAppCard(app, grid);
      });

    } catch (e) {
      console.error("Mini App Load Error:", e);
      grid.innerHTML = '<p class="text-xs text-red-400 text-center col-span-3">Failed to load apps. Check internet.</p>';
    }
  };

  function renderMiniAppCard(app, container) {
    const card = document.createElement('div');
    card.className = 'bg-gray-900 border border-gray-700 rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all hover:border-amber-500/50';
    card.onclick = () => runMiniApp(app);
    
    card.innerHTML = `
      <div class="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-2xl mb-2 shadow-inner">
        ${app.icon || '📱'}
      </div>
      <p class="text-[11px] font-bold text-white text-center w-full truncate">${app.name}</p>
      <p class="text-[9px] text-gray-500 text-center w-full truncate">@${app.creator}</p>
    `;
    container.appendChild(card);
  }

  // ==========================================
  // SEARCH FUNCTIONALITY
  // ==========================================
  window.filterMiniApps = function(query) {
    const grid = document.getElementById('miniAppsGrid');
    if (!grid || !window.__miniAppsCache) return;

    const q = query.toLowerCase().trim();
    grid.innerHTML = '';

    if (!q) {
      window.__miniAppsCache.forEach(app => renderMiniAppCard(app, grid));
      return;
    }

    const filtered = window.__miniAppsCache.filter(app => 
      app.name.toLowerCase().includes(q) || 
      app.desc.toLowerCase().includes(q) ||
      app.creator.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      grid.innerHTML = '<p class="text-xs text-gray-500 text-center col-span-3 py-10">No apps found for this search.</p>';
      return;
    }

    filtered.forEach(app => renderMiniAppCard(app, grid));
  };

  // ==========================================
  // CREATE & PUBLISH APP
  // ==========================================
  window.openCreateMiniAppModal = function() {
    document.getElementById('ma-name').value = '';
    document.getElementById('ma-desc').value = '';
    document.getElementById('ma-icon').value = '📱';
    document.getElementById('ma-code').value = `<style>\n  body { font-family: sans-serif; text-align: center; padding: 20px; }\n  button { padding: 10px 20px; background: #0ea5e9; color: white; border: none; border-radius: 8px; }\n</style>\n\n<h1>Hello Super App!</h1>\n<p>This is my first mini app.</p>\n<button onclick="alert('Working!')">Click Me</button>`;
    openModal('createMiniAppModal');
  };

  window.publishMiniApp = async function() {
    if (!currentUser) { showToast("Pehle login karein!"); return; }

    const name = document.getElementById('ma-name').value.trim();
    const desc = document.getElementById('ma-desc').value.trim();
    const icon = document.getElementById('ma-icon').value.trim() || '📱';
    const code = document.getElementById('ma-code').value.trim();

    if (!name || !code) { showToast("Name aur Code zaroori hai!"); return; }

    try {
      await db.collection("mini_apps").add({
        name: name,
        desc: desc,
        icon: icon,
        code: code,
        creator: formatHandle(currentUser),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showToast("🚀 Mini App published successfully!");
      closeModal('createMiniAppModal');
      loadMiniAppsFromDB(); // Refresh list

    } catch (e) {
      console.error(e);
      showToast("❌ Failed to publish: " + e.message);
    }
  };

  // ==========================================
  // RUN APP (SANDBOXED IFRAME)
  // ==========================================
  window.runMiniApp = function(app) {
    const iframe = document.getElementById('ma-iframe');
    document.getElementById('ma-player-title').innerText = app.name;
    document.getElementById('ma-player-author').innerText = `by @${app.creator}`;
    document.getElementById('ma-player-icon').innerText = app.icon || '📱';

    // HTML ko wrap karein aur execute karein
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://cdn.tailwindcss.com"><\/script>
        <style>body { margin: 0; padding: 15px; background: #fff; color: #000; }</style>
      </head>
      <body>
        ${app.code}
      </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Store URL to revoke later (memory leak prevent)
    document.getElementById('miniAppPlayerModal').dataset.blobUrl = url;
    
    iframe.src = url;
    openModal('miniAppPlayerModal');
  };

  window.closeMiniAppPlayer = function() {
    const modal = document.getElementById('miniAppPlayerModal');
    const iframe = document.getElementById('ma-iframe');
    
    if (modal.dataset.blobUrl) {
      URL.revokeObjectURL(modal.dataset.blobUrl);
      modal.dataset.blobUrl = '';
    }
    iframe.src = 'about:blank';
    closeModal('miniAppPlayerModal');
  };

  // ==========================================
  // INJECT HEADER BUTTON
  // ==========================================
  function addHeaderButton() {
    const header = document.querySelector('header .flex.gap-2');
    if (header && !document.getElementById('btn-open-mini-apps')) {
      const btn = document.createElement('button');
      btn.id = 'btn-open-mini-apps';
      btn.onclick = window.openMiniAppsStore;
      btn.className = 'px-3 py-1.5 bg-gray-800 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30 flex items-center gap-1.5 active:scale-95';
      btn.innerHTML = '<i class="fa-solid fa-cubes"></i> Apps';
      header.insertBefore(btn, header.firstChild);
    }
  }

  // Init
  window.addEventListener('load', () => {
    setTimeout(() => {
      injectMiniAppUI();
      addHeaderButton();
    }, 2000);
  });

})();
