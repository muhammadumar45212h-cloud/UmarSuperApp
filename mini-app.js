// ==========================================
// ⚡ SUPER APP - MINI APPS PLATFORM (mini-app.js)
// ==========================================

// 1. UI Injection (Header aur DM List mein button add karna)
function injectMiniAppUI() {
  // Header mein button add karein
  const headerButtons = document.querySelector('header .flex.gap-2');
  if (headerButtons && !document.getElementById('header-mini-app-btn')) {
    const btn = document.createElement('button');
    btn.id = 'header-mini-app-btn';
    btn.onclick = openMiniAppsDashboard;
    btn.className = 'px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs rounded-full text-amber-400 flex items-center justify-center border border-amber-500/30 font-bold gap-1.5';
    btn.innerHTML = '<i class="fa-solid fa-cubes"></i> Mini Apps';
    headerButtons.appendChild(btn);
  }

  // DM List Header mein button add karein
  const dmHeader = document.getElementById('dm-inbox-header');
  if (dmHeader && !document.getElementById('dm-mini-app-btn')) {
    const dmBtn = document.createElement('button');
    dmBtn.id = 'dm-mini-app-btn';
    dmBtn.onclick = openMiniAppsDashboard;
    dmBtn.className = 'w-full mt-2 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2';
    dmBtn.innerHTML = '<i class="fa-solid fa-cubes"></i> Open Mini Apps Store';
    
    // DM Inbox view ke top par add karein
    const dmInboxView = document.getElementById('dm-inbox-view');
    if (dmInboxView) {
      dmInboxView.parentNode.insertBefore(dmBtn, dmInboxView);
    }
  }

  // Modals inject karein (agar pehle se nahi hain)
  if (!document.getElementById('miniAppsDashboardModal')) {
    const modalsHTML = `
      <!-- MINI APPS DASHBOARD MODAL -->
      <div id="miniAppsDashboardModal" class="fullscreen-modal hidden p-4 overflow-y-auto bg-gray-950 space-y-4">
        <div class="flex justify-between items-center border-b border-gray-800 pb-3">
          <h2 class="text-base font-bold text-amber-400 flex items-center gap-2"><i class="fa-solid fa-cubes"></i> Mini Apps Store</h2>
          <div class="flex gap-2">
            <button onclick="openCreateMiniAppModal()" class="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-xs font-bold"><i class="fa-solid fa-plus"></i> Create App</button>
            <button onclick="closeModal('miniAppsDashboardModal')" class="text-gray-400 text-xl px-2"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div id="mini-apps-grid" class="grid grid-cols-3 gap-3 pb-10">
          <p class="text-xs text-gray-500 text-center col-span-3 py-10">Loading mini apps...</p>
        </div>
      </div>

      <!-- CREATE MINI APP MODAL -->
      <div id="createMiniAppModal" class="fullscreen-modal hidden p-4 bg-gray-950 overflow-y-auto">
        <div class="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
          <h2 class="text-base font-bold text-cyan-400 flex items-center gap-2"><i class="fa-solid fa-code"></i> Create Mini App</h2>
          <button onclick="closeModal('createMiniAppModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="text-[10px] text-gray-400 uppercase block mb-1">App Name</label>
            <input type="text" id="mini-app-name" class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white" placeholder="e.g. My Calculator, To-Do List">
          </div>
          <div>
            <label class="text-[10px] text-gray-400 uppercase block mb-1">HTML / JS Code</label>
            <textarea id="mini-app-code" class="w-full h-64 bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs font-mono text-green-400 focus:outline-none allow-select resize-none" spellcheck="false" placeholder="<h1>Hello World</h1>\\n<button onclick='alert(1)'>Click Me</button>"></textarea>
          </div>
          <button onclick="publishMiniApp()" class="w-full py-3 btn-gradient rounded-xl text-xs font-bold text-white shadow-lg"><i class="fa-solid fa-cloud-arrow-up"></i> Publish App to Cloud</button>
        </div>
      </div>

      <!-- MINI APP PLAYER MODAL -->
      <div id="miniAppPlayerModal" class="fullscreen-modal hidden bg-black z-[70] flex flex-col">
        <div class="p-3 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
          <h3 class="text-xs font-bold text-amber-400 flex items-center gap-2"><i class="fa-solid fa-cube"></i> <span id="mini-app-title">Loading...</span></h3>
          <button onclick="closeMiniAppPlayer()" class="text-gray-400 text-xl bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="flex-1 w-full h-full bg-white relative">
          <iframe id="mini-app-iframe" sandbox="allow-scripts allow-forms allow-modals allow-popups" class="w-full h-full border-0 bg-white"></iframe>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalsHTML);
  }
}

// 2. Mini Apps Dashboard Kholna
async function openMiniAppsDashboard() {
  openModal('miniAppsDashboardModal');
  await loadMiniAppsStore();
}

// 3. Firebase se Mini Apps Load Karna
async function loadMiniAppsStore() {
  const container = document.getElementById('mini-apps-grid');
  if (!container) return;
  
  container.innerHTML = '<p class="text-xs text-gray-500 text-center col-span-3 py-10">Fetching apps from cloud...</p>';
  
  try {
    const snapshot = await db.collection("mini_apps").orderBy("createdAt", "desc").limit(50).get();
    container.innerHTML = '';
    
    if (snapshot.empty) {
      container.innerHTML = '<p class="text-xs text-gray-500 text-center col-span-3 py-10">Abhi koi mini app nahi bani. Pehli app aap banao!</p>';
      return;
    }

    snapshot.forEach(doc => {
      const app = doc.data();
      const card = document.createElement('div');
      card.className = 'bg-gray-800 border border-amber-500/30 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 transition-all text-center';
      card.onclick = () => openMiniAppRunner(doc.id, app);
      
      card.innerHTML = `
        <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white mb-2">
          <i class="fa-solid fa-cube text-xl"></i>
        </div>
        <p class="text-[11px] font-bold text-white truncate w-full">${app.app_name}</p>
        <p class="text-[9px] text-gray-400 mt-1">by @${app.creator}</p>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    console.error("Mini Apps Load Error:", e);
    container.innerHTML = '<p class="text-xs text-red-400 text-center col-span-3 py-10">Cloud se load nahi ho paya. Internet check karein.</p>';
  }
}

// 4. Create Mini App Modal Kholna
function openCreateMiniAppModal() {
  document.getElementById('mini-app-name').value = '';
  document.getElementById('mini-app-code').value = `<!-- Aap yahan HTML, CSS, ya JS likh sakte hain -->\n<h1 style="color: #00f2fe; text-align: center;">Hello Super App!</h1>\n<button onclick="alert('Mera pehla mini app!')" style="display:block; margin: 20px auto; padding: 10px 20px; background: #ff0055; color: white; border: none; border-radius: 10px;">Click Me</button>`;
  openModal('createMiniAppModal');
}

// 5. Firestore mein App Save Karna (Publish)
async function publishMiniApp() {
  if (!currentUser) { showToast("Pehle login karein!"); return; }
  
  const appName = document.getElementById('mini-app-name').value.trim();
  const appCode = document.getElementById('mini-app-code').value.trim();
  
  if (!appName || !appCode) { showToast("App ka naam aur code dono likhein!"); return; }

  try {
    // Firebase Firestore mein save karein
    await db.collection("mini_apps").add({
      app_name: appName,
      creator: formatHandle(currentUser),
      html_code: appCode,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showToast(`✅ "${appName}" cloud par publish ho gayi!`);
    closeModal('createMiniAppModal');
    loadMiniAppsStore(); 
    
  } catch (e) {
    console.error(e);
    showToast("Publish Error: " + e.message);
  }
}

// 6. Mini App Ko Run Karna (Sandboxed Iframe)
function openMiniAppRunner(appId, appData) {
  const modal = document.getElementById('miniAppPlayerModal');
  const iframe = document.getElementById('mini-app-iframe');
  
  if (!modal || !iframe) return;
  
  // User ke code ko ek complete HTML page mein wrap karein (Tailwind aur FontAwesome ke sath)
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://cdn.tailwindcss.com"><\/script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 15px; background-color: #f8fafc; color: #1e293b; }
      </style>
    </head>
    <body>
      ${appData.html_code}
    </body>
    </html>
  `;
  
  // Blob URL banayein (Security ke liye sabse best tarika)
  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  iframe.src = url;
  document.getElementById('mini-app-title').innerText = appData.app_name + " (by @" + appData.creator + ")";
  
  openModal('miniAppPlayerModal');
  
  // Memory leak se bachne ke liye URL ko save karein
  modal.dataset.blobUrl = url; 
}

// 7. Player Close Karna aur Memory Clean Karna
function closeMiniAppPlayer() {
  const modal = document.getElementById('miniAppPlayerModal');
  const iframe = document.getElementById('mini-app-iframe');
  
  if (modal && modal.dataset.blobUrl) {
    URL.revokeObjectURL(modal.dataset.blobUrl); // Blob delete karein
    modal.dataset.blobUrl = '';
  }
  if (iframe) iframe.src = 'about:blank'; // Iframe clear karein
  
  closeModal('miniAppPlayerModal');
}

// 8. App Load hone par UI Inject karein
window.addEventListener('load', () => {
  setTimeout(() => {
    injectMiniAppUI();
  }, 1500); // 1.5s baad taaki main app ka UI load ho jaye
});
