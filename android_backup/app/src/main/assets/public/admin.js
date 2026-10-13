// ═══════════════ ADMIN PANEL MODULE ═══════════════
// Ye file index.html mein load karne ke liye script tag add karein:
// <script src="admin.js" defer></script>

const ADMIN_USERNAMES = ['muhammadumar45212h', 'Umar', 'admin']; // Yahan admin usernames daalein

function isAdmin(user) {
  if (!user) return false;
  const clean = (user || '').replace(/^@+/, '').split('@')[0];
  return ADMIN_USERNAMES.includes(clean);
}

// ═══════════════ ADMIN PANEL OPEN ═══════════════
function openAdminPanel() {
  if (!isAdmin(currentUser)) {
    showToast('❌ Aap admin nahi hain!');
    return;
  }
  
  // Panel HTML inject karo (agar nahi hai)
  if (!document.getElementById('adminPanelModal')) {
    const panelHTML = `
      <div id="adminPanelModal" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar space-y-4 bg-gray-950 z-[100]">
        <div class="flex justify-between items-center border-b border-red-500/40 pb-3">
          <h2 class="text-base font-bold text-red-400 flex items-center gap-2">
            <i class="fa-solid fa-shield-halved"></i> Admin Control Panel
          </h2>
          <button onclick="closeModal('adminPanelModal')" class="text-gray-400 hover:text-white text-xl">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- STATS -->
        <div class="grid grid-cols-3 gap-2">
          <div class="bg-gray-900 border border-cyan-500/30 rounded-xl p-3 text-center">
            <p class="text-[10px] text-gray-400 uppercase">Users</p>
            <p class="text-lg font-bold text-cyan-400" id="admin-total-users">0</p>
          </div>
          <div class="bg-gray-900 border border-red-500/30 rounded-xl p-3 text-center">
            <p class="text-[10px] text-gray-400 uppercase">Reports</p>
            <p class="text-lg font-bold text-red-400" id="admin-total-reports">0</p>
          </div>
          <div class="bg-gray-900 border border-amber-500/30 rounded-xl p-3 text-center">
            <p class="text-[10px] text-gray-400 uppercase">Withdrawals</p>
            <p class="text-lg font-bold text-amber-400" id="admin-total-withdrawals">0</p>
          </div>
        </div>

        <!-- TABS -->
        <div class="flex bg-gray-800 p-1 rounded-xl text-[10px] font-semibold gap-1">
          <button onclick="adminSwitchTab('users')" id="admin-tab-users" class="admin-tab-btn flex-1 py-2 rounded-lg bg-red-600 text-white">👥 Users</button>
          <button onclick="adminSwitchTab('reports')" id="admin-tab-reports" class="admin-tab-btn flex-1 py-2 rounded-lg text-gray-400">🚨 Reports</button>
          <button onclick="adminSwitchTab('withdrawals')" id="admin-tab-withdrawals" class="admin-tab-btn flex-1 py-2 rounded-lg text-gray-400">💰 Withdrawals</button>
          <button onclick="adminSwitchTab('ads')" id="admin-tab-ads" class="admin-tab-btn flex-1 py-2 rounded-lg text-gray-400">📢 Ads</button>
        </div>

        <!-- USERS TAB -->
        <div id="admin-content-users" class="admin-content space-y-2"></div>

        <!-- REPORTS TAB -->
        <div id="admin-content-reports" class="admin-content space-y-2 hidden"></div>

        <!-- WITHDRAWALS TAB -->
        <div id="admin-content-withdrawals" class="admin-content space-y-2 hidden"></div>

        <!-- ADS TAB -->
        <div id="admin-content-ads" class="admin-content hidden space-y-3">
          <div class="bg-gray-900 border border-cyan-500/30 rounded-xl p-4 space-y-3">
            <h3 class="text-xs font-bold text-cyan-400 uppercase">📢 Post New Ad</h3>
            <input type="text" id="admin-ad-title" class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white" placeholder="Ad title (e.g. Free Diamonds!)">
            <textarea id="admin-ad-text" class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white" rows="3" placeholder="Ad description..."></textarea>
            <input type="text" id="admin-ad-link" class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-cyan-400" placeholder="Link (optional)">
            <input type="text" id="admin-ad-image" class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-cyan-400" placeholder="Image URL (optional)">
            <select id="admin-ad-target" class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white">
              <option value="all">All Users</option>
              <option value="active">Active Users Only</option>
              <option value="new">New Users Only</option>
            </select>
            <button onclick="adminPostAd()" class="w-full py-2.5 btn-gradient text-white font-bold text-xs rounded-xl">
              📢 Broadcast Ad to All Users
            </button>
          </div>
          <div id="admin-ads-list" class="space-y-2"></div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', panelHTML);
  }
  
  openModal('adminPanelModal');
  adminLoadStats();
  adminSwitchTab('users');
}

// ═══════════════ TABS ═══════════════
function adminSwitchTab(tab) {
  ['users', 'reports', 'withdrawals', 'ads'].forEach(t => {
    const content = document.getElementById('admin-content-' + t);
    const btn = document.getElementById('admin-tab-' + t);
    if (t === tab) {
      content.classList.remove('hidden');
      btn.className = 'admin-tab-btn flex-1 py-2 rounded-lg bg-red-600 text-white';
    } else {
      content.classList.add('hidden');
      btn.className = 'admin-tab-btn flex-1 py-2 rounded-lg text-gray-400';
    }
  });
  if (tab === 'users') adminLoadUsers();
  if (tab === 'reports') adminLoadReports();
  if (tab === 'withdrawals') adminLoadWithdrawals();
  if (tab === 'ads') adminLoadAds();
}

// ═══════════════ STATS ═══════════════
async function adminLoadStats() {
  try {
    const usersSnap = await db.collection("users").limit(1000).get();
    document.getElementById('admin-total-users').innerText = usersSnap.size;
    
    const reportsSnap = await db.collection("reports").limit(1000).get();
    document.getElementById('admin-total-reports').innerText = reportsSnap.size;
    
    const wdSnap = await db.collection("withdrawals").where("status", "==", "Pending").limit(1000).get();
    document.getElementById('admin-total-withdrawals').innerText = wdSnap.size;
  } catch(e) { console.log(e); }
}

// ═══════════════ USERS ═══════════════
async function adminLoadUsers() {
  const container = document.getElementById('admin-content-users');
  container.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Loading users...</p>';
  try {
    const snap = await db.collection("users").limit(200).get();
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">No users found</p>';
      return;
    }
    snap.forEach(doc => {
      const d = doc.data();
      const isBanned = d.banned === true;
      const div = document.createElement('div');
      div.className = `bg-gray-900 border ${isBanned ? 'border-red-500/50' : 'border-gray-800'} rounded-xl p-3 flex items-center gap-3`;
      div.innerHTML = `
        <img src="${d.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${doc.id}`}" class="w-10 h-10 rounded-full bg-gray-800">
        <div class="flex-1">
          <p class="text-xs font-bold text-white">@${doc.id} ${isBanned ? '<span class="text-red-400 text-[9px]">[BANNED]</span>' : ''}</p>
          <p class="text-[10px] text-gray-400">${d.name || ''} • 💎 ${d.diamonds || 0} • $${(d.balanceUsd || 0).toFixed(2)}</p>
          <p class="text-[9px] text-gray-500">Reports: ${d.reportCount || 0}</p>
        </div>
        <button onclick="adminToggleBan('${doc.id}', ${isBanned})" class="px-3 py-1.5 ${isBanned ? 'bg-green-600' : 'bg-red-600'} text-white text-[10px] font-bold rounded-lg">
          ${isBanned ? 'Unban' : 'Ban'}
        </button>
      `;
      container.appendChild(div);
    });
  } catch(e) { 
    container.innerHTML = '<p class="text-xs text-red-400 text-center py-4">Error: ' + e.message + '</p>';
  }
}

async function adminToggleBan(username, currentlyBanned) {
  try {
    await db.collection("users").doc(username).set({
      banned: !currentlyBanned,
      reportCount: currentlyBanned ? 0 : undefined
    }, { merge: true });
    showToast(currentlyBanned ? `✅ @${username} unbanned` : `🚫 @${username} banned`);
    adminLoadUsers();
    adminLoadStats();
  } catch(e) { showToast('Error: ' + e.message); }
}

// ═══════════════ REPORTS ═══════════════
async function adminLoadReports() {
  const container = document.getElementById('admin-content-reports');
  container.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Loading reports...</p>';
  try {
    const snap = await db.collection("reports").orderBy("timestamp", "desc").limit(100).get();
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">No reports</p>';
      return;
    }
    snap.forEach(doc => {
      const d = doc.data();
      const div = document.createElement('div');
      div.className = 'bg-gray-900 border border-red-500/30 rounded-xl p-3 space-y-1';
      div.innerHTML = `
        <div class="flex justify-between items-center">
          <p class="text-xs font-bold text-red-400">🚨 Report</p>
          <p class="text-[9px] text-gray-500">${d.timestamp ? new Date(d.timestamp.toMillis()).toLocaleString() : ''}</p>
        </div>
        <p class="text-[10px] text-gray-300"><b>Reporter:</b> @${d.reporter}</p>
        <p class="text-[10px] text-gray-300"><b>Offender:</b> @${d.offender}</p>
        <p class="text-[10px] text-gray-300"><b>Reason:</b> ${d.reason || 'N/A'}</p>
        <p class="text-[9px] text-gray-500">Post ID: ${d.postId || 'N/A'}</p>
      `;
      container.appendChild(div);
    });
  } catch(e) {
    container.innerHTML = '<p class="text-xs text-red-400 text-center py-4">Error: ' + e.message + '</p>';
  }
}

// ═══════════════ WITHDRAWALS ═══════════════
async function adminLoadWithdrawals() {
  const container = document.getElementById('admin-content-withdrawals');
  container.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Loading withdrawals...</p>';
  try {
    const snap = await db.collection("withdrawals").orderBy("timestamp", "desc").limit(100).get();
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">No withdrawals</p>';
      return;
    }
    snap.forEach(doc => {
      const d = doc.data();
      const statusColor = d.status === 'Approved' ? 'green' : (d.status === 'Rejected' ? 'red' : 'amber');
      const div = document.createElement('div');
      div.className = `bg-gray-900 border border-${statusColor}-500/30 rounded-xl p-3 space-y-2`;
      div.innerHTML = `
        <div class="flex justify-between items-center">
          <p class="text-xs font-bold text-${statusColor}-400">${d.status || 'Pending'}</p>
          <p class="text-[9px] text-gray-500">${d.timestamp ? new Date(d.timestamp.toMillis()).toLocaleString() : ''}</p>
        </div>
        <p class="text-[10px] text-gray-300"><b>User:</b> @${d.user}</p>
        <p class="text-[10px] text-gray-300"><b>Method:</b> ${d.method}</p>
        <p class="text-[10px] text-gray-300"><b>Amount:</b> ${d.currency} ${d.amount}</p>
        <p class="text-[10px] text-gray-300"><b>Account:</b> ${d.account}</p>
        ${d.status === 'Pending' ? `
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button onclick="adminApproveWithdrawal('${doc.id}')" class="py-2 bg-green-600 text-white text-[10px] font-bold rounded-lg">✅ Approve</button>
            <button onclick="adminRejectWithdrawal('${doc.id}')" class="py-2 bg-red-600 text-white text-[10px] font-bold rounded-lg">❌ Reject</button>
          </div>
        ` : ''}
      `;
      container.appendChild(div);
    });
  } catch(e) {
    container.innerHTML = '<p class="text-xs text-red-400 text-center py-4">Error: ' + e.message + '</p>';
  }
}

async function adminApproveWithdrawal(id) {
  try {
    await db.collection("withdrawals").doc(id).update({ status: 'Approved', approvedAt: firebase.firestore.FieldValue.serverTimestamp() });
    showToast('✅ Withdrawal approved');
    adminLoadWithdrawals();
    adminLoadStats();
  } catch(e) { showToast('Error: ' + e.message); }
}

async function adminRejectWithdrawal(id) {
  try {
    const doc = await db.collection("withdrawals").doc(id).get();
    const d = doc.data();
    // Refund balance
    const usersSnap = await db.collection("users").doc(d.user).get();
    if (usersSnap.exists) {
      const u = usersSnap.data();
      const refundUsd = d.currency === 'PKR' ? (d.amount / 278) : d.amount;
      await db.collection("users").doc(d.user).set({
        balanceUsd: (u.balanceUsd || 0) + refundUsd
      }, { merge: true });
    }
    await db.collection("withdrawals").doc(id).update({ status: 'Rejected', rejectedAt: firebase.firestore.FieldValue.serverTimestamp() });
    showToast('❌ Withdrawal rejected + refund');
    adminLoadWithdrawals();
    adminLoadStats();
  } catch(e) { showToast('Error: ' + e.message); }
}

// ═══════════════ ADS BROADCAST ═══════════════
async function adminPostAd() {
  const title = document.getElementById('admin-ad-title').value.trim();
  const text = document.getElementById('admin-ad-text').value.trim();
  const link = document.getElementById('admin-ad-link').value.trim();
  const image = document.getElementById('admin-ad-image').value.trim();
  const target = document.getElementById('admin-ad-target').value;
  
  if (!title || !text) { showToast('Title aur text zaroori hai!'); return; }
  
  try {
    await db.collection("admin_ads").add({
      title, text, link: link || null, image: image || null,
      target, active: true, postedBy: currentUser,
      postedAt: firebase.firestore.FieldValue.serverTimestamp(),
      impressions: 0, clicks: 0
    });
    
    showToast(`📢 Ad broadcasted to all users!`);
    document.getElementById('admin-ad-title').value = '';
    document.getElementById('admin-ad-text').value = '';
    document.getElementById('admin-ad-link').value = '';
    document.getElementById('admin-ad-image').value = '';
    adminLoadAds();
  } catch(e) { showToast('Error: ' + e.message); }
}

async function adminLoadAds() {
  const container = document.getElementById('admin-ads-list');
  try {
    const snap = await db.collection("admin_ads").orderBy("postedAt", "desc").limit(50).get();
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">No ads posted yet</p>';
      return;
    }
    snap.forEach(doc => {
      const d = doc.data();
      const div = document.createElement('div');
      div.className = 'bg-gray-900 border border-amber-500/30 rounded-xl p-3 space-y-1';
      div.innerHTML = `
        <div class="flex justify-between items-center">
          <p class="text-xs font-bold text-amber-400">${d.title}</p>
          <button onclick="adminDeleteAd('${doc.id}')" class="text-red-400 text-xs"><i class="fa-solid fa-trash"></i></button>
        </div>
        <p class="text-[10px] text-gray-300">${d.text}</p>
        <p class="text-[9px] text-gray-500">Target: ${d.target} • Views: ${d.impressions || 0} • Clicks: ${d.clicks || 0}</p>
      `;
      container.appendChild(div);
    });
  } catch(e) { container.innerHTML = '<p class="text-xs text-red-400 text-center py-4">Error</p>'; }
}

async function adminDeleteAd(id) {
  if (!confirm('Delete this ad?')) return;
  try {
    await db.collection("admin_ads").doc(id).delete();
    showToast('Ad deleted');
    adminLoadAds();
  } catch(e) { showToast('Error: ' + e.message); }
}

// ═══════════════ AUTO-LOAD ADMIN ADS IN FEED ═══════════════
async function loadAdminAdsForFeed() {
  try {
    const snap = await db.collection("admin_ads")
      .where("active", "==", true)
      .orderBy("postedAt", "desc")
      .limit(3).get();
    
    if (snap.empty) return;
    
    const feedContainer = document.getElementById('video-feed-container');
    if (!feedContainer) return;
    
    snap.forEach(doc => {
      const ad = doc.data();
      const adReel = document.createElement('div');
      adReel.className = 'w-full h-full reel-item relative bg-gradient-to-br from-cyan-900 via-blue-900 to-red-900 flex flex-col items-center justify-center p-6 text-center';
      adReel.innerHTML = `
        <div class="bg-black/40 px-3 py-1 rounded-full text-[10px] font-bold text-amber-400 mb-4">📢 SPONSORED</div>
        ${ad.image ? `<img src="${ad.image}" class="max-h-48 mb-4 rounded-xl">` : ''}
        <h2 class="text-2xl font-extrabold mb-3">${ad.title}</h2>
        <p class="text-sm text-gray-200 mb-6 max-w-xs">${ad.text}</p>
        ${ad.link ? `<a href="${ad.link}" target="_blank" class="px-6 py-3 btn-gradient rounded-full text-sm font-bold" onclick="event.stopPropagation(); db.collection('admin_ads').doc('${doc.id}').update({clicks: firebase.firestore.FieldValue.increment(1)})">Learn More →</a>` : ''}
      `;
      feedContainer.appendChild(adReel);
      try { db.collection("admin_ads").doc(doc.id).update({ impressions: firebase.firestore.FieldValue.increment(1) }); } catch(e){}
    });
  } catch(e) { console.log('Ad load:', e.message); }
}

// ═══════════════ ADMIN BUTTON INJECT ═══════════════
window.addEventListener('load', () => {
  setTimeout(() => {
    if (isAdmin(currentUser)) {
      // Admin button header mein add karo
      const header = document.querySelector('header');
      if (header) {
        const adminBtn = document.createElement('button');
        adminBtn.onclick = openAdminPanel;
        adminBtn.className = 'px-3 py-1.5 bg-red-600 hover:bg-red-500 text-xs rounded-full text-white flex items-center gap-1 font-bold ml-1';
        adminBtn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Admin';
        adminBtn.title = 'Admin Panel';
        header.querySelector('div').appendChild(adminBtn);
      }
      // Ads feed mein load karo
      loadAdminAdsForFeed();
    }
  }, 2000);
});
