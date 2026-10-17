// ==========================================
// ⚡ SUPER APP - ADMIN PANEL (KYC Approval)
// File: admin-panel.js
// ==========================================

(function() {
  'use strict';

  const ADMIN_USERNAME = 'muhammadumar45212h'; // ⚠️ Aapka username

  function isAdmin() {
    return currentUser && formatHandle(currentUser) === ADMIN_USERNAME;
  }

  // Add Admin Button in Settings
  function injectAdminUI() {
    if (!isAdmin()) return;
    if (document.getElementById('admin-kyc-btn')) return;

    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      const btn = document.createElement('button');
      btn.id = 'admin-kyc-btn';
      btn.onclick = window.openAdminKycPanel;
      btn.className = 'w-full py-2.5 bg-red-600 text-white rounded-lg text-xs font-bold mt-4 shadow-lg';
      btn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Admin: KYC Approvals';
      
      const firstCard = settingsModal.querySelector('.bg-gray-900');
      if (firstCard) firstCard.after(btn);
    }
  }

  // Open Admin Panel
  window.openAdminKycPanel = async function() {
    if (!isAdmin()) return;

    const existing = document.getElementById('adminKycModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'adminKycModal';
    modal.className = 'fullscreen-modal bg-gray-950 z-[100] flex flex-col';
    modal.innerHTML = `
      <div class="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
        <h2 class="text-sm font-bold text-red-500"><i class="fa-solid fa-shield"></i> Pending KYC Requests</h2>
        <button onclick="document.getElementById('adminKycModal').remove()" class="text-gray-400"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>
      <div class="flex-1 p-4 overflow-y-auto space-y-4" id="admin-kyc-list">
        <p class="text-xs text-center text-gray-500 py-10">Loading requests...</p>
      </div>
    `;
    document.body.appendChild(modal);

    const list = document.getElementById('admin-kyc-list');
    
    try {
      // Fetch pending KYC
      const snap = await db.collection("kyc").where("status", "==", "Pending").get();
      
      if (snap.empty) {
        list.innerHTML = '<p class="text-xs text-center text-gray-500 py-10">No pending requests.</p>';
        return;
      }

      list.innerHTML = '';
      snap.forEach(doc => {
        const d = doc.data();
        const card = document.createElement('div');
        card.className = 'bg-gray-900 border border-gray-700 p-3 rounded-xl space-y-3';
        card.innerHTML = `
          <div class="flex justify-between items-center">
            <p class="text-xs font-bold text-cyan-400">@${d.username}</p>
            <span class="text-[10px] text-gray-400">${new Date(d.submittedAt.toMillis()).toLocaleDateString()}</span>
          </div>
          <div class="grid grid-cols-3 gap-1">
            <img src="${d.front}" class="w-full h-16 object-cover rounded border border-gray-600" onclick="window.open('${d.front}', '_blank')">
            <img src="${d.back}" class="w-full h-16 object-cover rounded border border-gray-600" onclick="window.open('${d.back}', '_blank')">
            <img src="${d.selfie}" class="w-full h-16 object-cover rounded border border-gray-600" onclick="window.open('${d.selfie}', '_blank')">
          </div>
          <div class="flex gap-2">
            <button onclick="approveKyc('${doc.id}', '${d.username}')" class="flex-1 py-2 bg-green-600 text-white text-xs font-bold rounded-lg">Approve</button>
            <button onclick="rejectKyc('${doc.id}', '${d.username}')" class="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-lg">Reject</button>
          </div>
        `;
        list.appendChild(card);
      });

    } catch(e) {
      list.innerHTML = '<p class="text-xs text-red-500 text-center py-10">Error loading: ' + e.message + '</p>';
    }
  };

  window.approveKyc = async function(docId, username) {
    try {
      await db.collection("kyc").doc(docId).update({ status: "Approved" });
      await db.collection("users").doc(username).set({ kycVerified: true }, { merge: true });
      
      // Send notification DM
      await db.collection("dm_messages").add({
        chatKey: [username, 'Super App Official'].sort().join(':'),
        sender: 'Super App Official',
        receiver: username,
        text: "✅ Your KYC has been Approved! You are now verified.",
        time: new Date().toLocaleTimeString(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      showToast("✅ Approved");
      window.openAdminKycPanel(); // Refresh
    } catch(e) { showToast("Error: " + e.message); }
  };

  window.rejectKyc = async function(docId, username) {
    try {
      await db.collection("kyc").doc(docId).update({ status: "Rejected" });
      showToast("❌ Rejected");
      window.openAdminKycPanel();
    } catch(e) { showToast("Error: " + e.message); }
  };

  // Init
  window.addEventListener('load', () => {
    setTimeout(injectAdminUI, 4000);
  });

})();
