/* ═══════════════════════════════════════════════════════════════
   SUPER APP - REMAINING FEATURES MODULE
   Ye file purani index.html mein add hogi, sab kuch auto-inject karegi
   Add: <script src="index.js" defer></script> in <head>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══════════════ WAIT FOR FIRESTORE ═══════════════
  function waitForDB(cb) {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      cb();
    } else {
      setTimeout(() => waitForDB(cb), 500);
    }
  }

  // ═══════════════ HELPER FUNCTIONS ═══════════════
  function showToast(msg) {
    if (typeof window.showToast === 'function') { window.showToast(msg); return; }
    const t = document.getElementById('toast-notification');
    if (!t) return;
    const m = document.getElementById('toast-message');
    if (m) m.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  function formatHandle(str) {
    if (!str) return 'Umar';
    return str.replace(/^@+/, '').split('@')[0];
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  // ═══════════════ 1. NOTIFICATIONS SYSTEM ═══════════════
  // Firebase se notifications fetch karke bell icon pe badge dikhayega
  let notifListener = null;
  let unreadNotifCount = 0;

  function initNotifications() {
    waitForDB(() => {
      const db = firebase.firestore();
      const cleanUser = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
      if (!cleanUser) return;

      if (notifListener) { try { notifListener(); } catch(e){} }
      notifListener = db.collection("notifications")
        .where("userId", "==", cleanUser)
        .limit(50)
        .onSnapshot(snap => {
          const notifs = [];
          snap.forEach(doc => notifs.push({ id: doc.id, ...doc.data() }));
          notifs.sort((a,b) => {
            const ta = a.timestamp ? a.timestamp.toMillis() : 0;
            const tb = b.timestamp ? b.timestamp.toMillis() : 0;
            return tb - ta;
          });
          unreadNotifCount = notifs.filter(n => !n.read).length;
          updateNotifBadge(unreadNotifCount);
          renderNotifications(notifs);
        }, err => console.log('notif listener:', err.message));
    });
  }

  function updateNotifBadge(count) {
    const badge = document.getElementById('notif-badge');
    if (badge) {
      if (count > 0) { badge.innerText = count > 99 ? '99+' : count; badge.classList.remove('hidden'); }
      else badge.classList.add('hidden');
    }
  }

  function renderNotifications(notifs) {
    const container = document.getElementById('notif-list');
    if (!container) return;
    container.innerHTML = '';
    if (notifs.length === 0) {
      container.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">No notifications yet</p>';
      return;
    }
    notifs.forEach(n => {
      const div = document.createElement('div');
      div.className = `p-3 rounded-xl border ${n.read ? 'bg-gray-900 border-gray-800' : 'bg-cyan-900/20 border-cyan-500/40'} cursor-pointer`;
      div.onclick = () => markNotifRead(n.id);
      const icon = n.type === 'gift' ? '🎁' : n.type === 'report' ? '🚨' : n.type === 'ad' ? '📢' : n.type === 'follow' ? '👥' : '🔔';
      div.innerHTML = `
        <div class="flex gap-2">
          <span class="text-xl">${icon}</span>
          <div class="flex-1">
            <p class="text-xs font-bold text-white">${n.title || 'Notification'}</p>
            <p class="text-[11px] text-gray-300 mt-0.5">${n.body || ''}</p>
            <p class="text-[9px] text-gray-500 mt-1">${n.timestamp ? new Date(n.timestamp.toMillis()).toLocaleString() : ''}</p>
          </div>
        </div>`;
      container.appendChild(div);
    });
  }

  async function markNotifRead(id) {
    try {
      await firebase.firestore().collection("notifications").doc(id).update({ read: true });
    } catch(e){}
  }

  function openNotificationsModal() {
    initNotifications();
    openModal('notifModal');
  }

  async function markAllNotifsRead() {
    const cleanUser = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
    if (!cleanUser) return;
    try {
      const snap = await firebase.firestore().collection("notifications")
        .where("userId", "==", cleanUser).where("read", "==", false).get();
      const batch = firebase.firestore().batch();
      snap.forEach(doc => batch.update(doc.ref, { read: true }));
      await batch.commit();
      showToast('✅ All marked as read');
    } catch(e) { showToast('Error'); }
  }

  // Send notification to a user (helper)
  window.sendPushNotification = async function(userId, title, body, type) {
    try {
      await firebase.firestore().collection("notifications").add({
        userId: formatHandle(userId),
        title: title,
        body: body,
        type: type || 'general',
        read: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) { console.log('notif send err:', e); }
  };

  // ═══════════════ 2. REFERRAL SYSTEM ═══════════════
  function initReferral() {
    const cleanUser = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
    if (!cleanUser) return;
    const refLink = `${window.location.origin}${window.location.pathname}?ref=${cleanUser}`;
    const refEl = document.getElementById('referral-link');
    if (refEl) refEl.innerText = refLink;

    // Check if user came via referral link
    const params = new URLSearchParams(window.location.search);
    const refBy = params.get('ref');
    if (refBy && refBy !== cleanUser) {
      const key = 'ref_' + cleanUser + '_' + refBy;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        applyReferralBonus(cleanUser, refBy);
      }
    }
  }

  async function applyReferralBonus(newUser, referrer) {
    try {
      const db = firebase.firestore();
      // Give 50 diamonds to both
      const refDoc = await db.collection("users").doc(formatHandle(referrer)).get();
      if (refDoc.exists) {
        const r = refDoc.data();
        await db.collection("users").doc(formatHandle(referrer)).set({
          diamonds: (r.diamonds || 0) + 50
        }, { merge: true });
        await db.collection("referrals").add({
          referrer: formatHandle(referrer),
          newUser: formatHandle(newUser),
          bonus: 50,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        window.sendPushNotification(referrer, '🎉 Referral Bonus!', '@' + newUser + ' ne aapke link se join kiya. 50 💎 mile!', 'reward');
      }
    } catch(e) { console.log(e); }
  }

  function copyReferralLink() {
    const cleanUser = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
    const link = `${window.location.origin}${window.location.pathname}?ref=${cleanUser}`;
    navigator.clipboard.writeText(link).then(() => {
      showToast('✅ Referral link copied!');
    }).catch(() => {
      prompt('Ye link copy karein:', link);
    });
  }

  // ═══════════════ 3. DIAMONDS PURCHASE ═══════════════
  function openBuyDiamondsModal() {
    openModal('buyDiamondsModal');
    renderDiamondPackages();
  }

  const DIAMOND_PACKAGES = [
    { diamonds: 100, pkr: 250, bonus: 0 },
    { diamonds: 500, pkr: 1000, bonus: 50 },
    { diamonds: 1000, pkr: 1800, bonus: 150 },
    { diamonds: 2500, pkr: 4000, bonus: 500 },
    { diamonds: 5000, pkr: 7500, bonus: 1200 },
    { diamonds: 10000, pkr: 14000, bonus: 3000 }
  ];

  function renderDiamondPackages() {
    const grid = document.getElementById('diamond-packages');
    if (!grid) return;
    grid.innerHTML = '';
    DIAMOND_PACKAGES.forEach((p, i) => {
      const btn = document.createElement('button');
      btn.className = 'p-3 bg-gray-800 border border-amber-500/40 rounded-xl flex flex-col items-center cursor-pointer hover:border-amber-400';
      btn.onclick = () => purchaseDiamonds(i);
      btn.innerHTML = `
        <span class="text-2xl">💎</span>
        <span class="text-sm font-bold text-amber-400 mt-1">${p.diamonds.toLocaleString()}</span>
        ${p.bonus > 0 ? `<span class="text-[9px] text-green-400">+${p.bonus} Bonus</span>` : ''}
        <span class="text-[11px] font-bold text-white mt-1">Rs ${p.pkr}</span>
      `;
      grid.appendChild(btn);
    });
  }

  async function purchaseDiamonds(index) {
    const p = DIAMOND_PACKAGES[index];
    const cleanUser = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
    if (!cleanUser) { showToast('Login zaroori'); return; }

    const method = prompt('Payment method (Easypaisa/JazzCash/SadaPay/NayaPay):', 'Easypaisa');
    if (!method) return;

    try {
      const db = firebase.firestore();
      await db.collection("diamond_orders").add({
        user: cleanUser,
        diamonds: p.diamonds + p.bonus,
        pkr: p.pkr,
        method: method,
        status: 'Pending',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast(`⏳ Order placed! Admin approve karega.`);
      window.sendPushNotification(cleanUser, '💎 Diamond Order', `${p.diamonds + p.bonus} diamonds ka order place hua. Admin review karega.`, 'general');
      closeModal('buyDiamondsModal');
    } catch(e) { showToast('Error: ' + e.message); }
  }

  // ═══════════════ 4. KYC SYSTEM ═══════════════
  function openKycModal() {
    const cleanUser = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
    if (!cleanUser) return;
    // Check existing KYC
    firebase.firestore().collection("kyc").doc(cleanUser).get().then(doc => {
      if (doc.exists) {
        const d = doc.data();
        const el = document.getElementById('kyc-status-display');
        if (el) {
          if (d.status === 'Approved') el.innerHTML = '<span class="text-green-400">✅ Verified</span>';
          else if (d.status === 'Pending') el.innerHTML = '<span class="text-amber-400">⏳ Under Review</span>';
          else el.innerHTML = '<span class="text-red-400">❌ Rejected</span>';
        }
      }
    }).catch(e => {});
    openModal('kycModal');
  }

  let kycFrontImage = null, kycBackImage = null, kycSelfieImage = null;

  function kycPreview(type, input) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
      if (type === 'front') kycFrontImage = e.target.result;
      if (type === 'back') kycBackImage = e.target.result;
      if (type === 'selfie') kycSelfieImage = e.target.result;
      const previewId = 'kyc-' + type + '-preview';
      const iconId = 'kyc-' + type + '-icon';
      const p = document.getElementById(previewId);
      if (p) { p.src = e.target.result; p.classList.remove('hidden'); }
      const ic = document.getElementById(iconId);
      if (ic) ic.classList.add('hidden');
    };
    reader.readAsDataURL(input.files[0]);
  }

  async function submitKyc() {
    const cleanUser = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
    if (!cleanUser) { showToast('Login zaroori'); return; }
    const fullName = (document.getElementById('kyc-fullname') || {}).value || '';
    const cnic = (document.getElementById('kyc-cnic') || {}).value || '';
    const dob = (document.getElementById('kyc-dob') || {}).value || '';
    if (!fullName || !cnic || !kycFrontImage || !kycBackImage || !kycSelfieImage) {
      showToast('Sab fields aur 3 images zaroori hain!'); return;
    }
    try {
      await firebase.firestore().collection("kyc").doc(cleanUser).set({
        user: cleanUser,
        fullName, cnic, dob,
        front: kycFrontImage, back: kycBackImage, selfie: kycSelfieImage,
        status: 'Pending',
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast('✅ KYC submitted! Review mein 24 ghante lagenge.');
      closeModal('kycModal');
    } catch(e) { showToast('Error: ' + e.message); }
  }

  // ═══════════════ 5. WEBRTC 2-USER LIVE (Basic) ═══════════════
  // Note: Ye basic signaling hai. Full WebRTC ke liye server signaling chahiye.
  let liveGuests = [];

  async function joinAsGuest(roomId) {
    try {
      const guestStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, audio: true
      });
      const pkRightVid = document.getElementById('pk-video-right');
      if (pkRightVid) { pkRightVid.srcObject = guestStream; pkRightVid.play(); }
      // Register guest
      await firebase.firestore().collection("live_rooms").doc(roomId).update({
        guests: firebase.firestore.FieldValue.arrayUnion(formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER')))
      });
      showToast('✅ Aap live mein shamil ho gaye');
    } catch(e) { showToast('❌ Camera error: ' + e.message); }
  }

  // ═══════════════ 6. AD INTEGRATION (Helper) ═══════════════
  // AdMob / AdSense ID change karne ke liye:
  window.setAdConfig = function(config) {
    window.__AD_CONFIG = config;
  };

  // Auto-trigger ad after every 5 video scrolls
  let videoScrollCount = 0;
  function trackVideoScroll() {
    const container = document.getElementById('video-feed-container');
    if (!container) return;
    container.addEventListener('scroll', () => {
      if (container.scrollTop % container.clientHeight === 0) {
        videoScrollCount++;
        if (videoScrollCount >= 5) {
          videoScrollCount = 0;
          if (typeof window.triggerPostWithdrawalAds === 'function') {
            window.triggerPostWithdrawalAds(1);
          }
        }
      }
    });
  }

  // ═══════════════ 7. UI INJECTION ═══════════════
  function injectUI() {
    // Header mein notification bell add karo
    const headerDivs = document.querySelectorAll('header > div');
    if (headerDivs.length > 0) {
      const headerDiv = headerDivs[0];
      if (!document.getElementById('notif-bell-btn')) {
        const bellBtn = document.createElement('button');
        bellBtn.id = 'notif-bell-btn';
        bellBtn.onclick = openNotificationsModal;
        bellBtn.className = 'relative w-8 h-8 rounded-full bg-gray-800 text-cyan-400 flex items-center justify-center border border-cyan-500/30';
        bellBtn.innerHTML = `<i class="fa-solid fa-bell text-xs"></i><span id="notif-badge" class="hidden absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">0</span>`;
        headerDiv.insertBefore(bellBtn, headerDiv.firstChild);
      }
    }

    // Modals inject karo (agar nahi hain)
    if (!document.getElementById('notifModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <!-- NOTIFICATIONS MODAL -->
        <div id="notifModal" class="fullscreen-modal hidden p-4 z-[70]">
          <div class="flex justify-between items-center border-b border-gray-800 pb-3 mb-3">
            <h2 class="text-base font-bold text-cyan-400"><i class="fa-solid fa-bell"></i> Notifications</h2>
            <div class="flex gap-2">
              <button onclick="markAllNotifsRead()" class="text-[10px] text-cyan-400 font-bold">Mark all read</button>
              <button onclick="closeModal('notifModal')" class="text-gray-400 text-lg"><i class="fa-solid fa-xmark"></i></button>
            </div>
          </div>
          <div id="notif-list" class="flex-1 overflow-y-auto no-scrollbar space-y-2"></div>
        </div>

        <!-- BUY DIAMONDS MODAL -->
        <div id="buyDiamondsModal" class="fullscreen-modal hidden p-4 z-[70]">
          <div class="flex justify-between items-center border-b border-amber-500/40 pb-3 mb-3">
            <h2 class="text-base font-bold text-amber-400"><i class="fa-solid fa-gem"></i> Buy Diamonds</h2>
            <button onclick="closeModal('buyDiamondsModal')" class="text-gray-400 text-lg"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <p class="text-xs text-gray-400 mb-3">Diamonds se aap gifts bhej sakte hain. Payment Easypaisa/JazzCash/SadaPay se karein.</p>
          <div id="diamond-packages" class="grid grid-cols-2 gap-3"></div>
        </div>

        <!-- KYC MODAL -->
        <div id="kycModal" class="fullscreen-modal hidden p-4 z-[70] overflow-y-auto no-scrollbar">
          <div class="flex justify-between items-center border-b border-cyan-500/40 pb-3 mb-3">
            <h2 class="text-base font-bold text-cyan-400"><i class="fa-solid fa-id-card"></i> KYC Verification</h2>
            <button onclick="closeModal('kycModal')" class="text-gray-400 text-lg"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <p class="text-[10px] text-gray-400 mb-3">Withdrawal ke liye KYC zaroori hai. CNIC aur selfie upload karein.</p>
          <div id="kyc-status-display" class="mb-3 text-xs font-bold"></div>
          <div class="space-y-3">
            <input type="text" id="kyc-fullname" class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white" placeholder="Full Name (as on CNIC)">
            <input type="text" id="kyc-cnic" class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white" placeholder="CNIC: 12345-1234567-1">
            <input type="date" id="kyc-dob" class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white">
            <div class="grid grid-cols-3 gap-2">
              <div class="flex flex-col items-center">
                <input type="file" id="kyc-front-input" accept="image/*" class="hidden" onchange="kycPreview('front', this)">
                <div onclick="document.getElementById('kyc-front-input').click()" class="w-full aspect-square bg-gray-800 border-2 border-dashed border-cyan-500 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                  <img id="kyc-front-preview" class="w-full h-full object-cover hidden">
                  <i id="kyc-front-icon" class="fa-solid fa-id-card text-2xl text-cyan-400"></i>
                  <span class="text-[9px] text-gray-400 mt-1">CNIC Front</span>
                </div>
              </div>
              <div class="flex flex-col items-center">
                <input type="file" id="kyc-back-input" accept="image/*" class="hidden" onchange="kycPreview('back', this)">
                <div onclick="document.getElementById('kyc-back-input').click()" class="w-full aspect-square bg-gray-800 border-2 border-dashed border-cyan-500 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                  <img id="kyc-back-preview" class="w-full h-full object-cover hidden">
                  <i id="kyc-back-icon" class="fa-solid fa-id-card text-2xl text-cyan-400"></i>
                  <span class="text-[9px] text-gray-400 mt-1">CNIC Back</span>
                </div>
              </div>
              <div class="flex flex-col items-center">
                <input type="file" id="kyc-selfie-input" accept="image/*" class="hidden" onchange="kycPreview('selfie', this)">
                <div onclick="document.getElementById('kyc-selfie-input').click()" class="w-full aspect-square bg-gray-800 border-2 border-dashed border-cyan-500 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                  <img id="kyc-selfie-preview" class="w-full h-full object-cover hidden">
                  <i id="kyc-selfie-icon" class="fa-solid fa-user text-2xl text-cyan-400"></i>
                  <span class="text-[9px] text-gray-400 mt-1">Selfie</span>
                </div>
              </div>
            </div>
          </div>
          <button onclick="submitKyc()" class="w-full mt-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs rounded-xl">
            <i class="fa-solid fa-paper-plane"></i> Submit KYC
          </button>
        </div>

        <!-- REFERRAL MODAL -->
        <div id="referralModal" class="fullscreen-modal hidden p-4 justify-center items-center bg-black/80 z-[70]">
          <div class="w-full max-w-sm bg-gray-900 border border-purple-500/40 rounded-2xl p-5 space-y-4">
            <div class="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 class="text-xs font-bold text-purple-400"><i class="fa-solid fa-users"></i> Refer & Earn</h3>
              <button onclick="closeModal('referralModal')" class="text-gray-400"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="text-center space-y-3">
              <div class="text-5xl">🎁</div>
              <p class="text-sm font-bold text-white">Dost ko invite karein</p>
              <p class="text-xs text-gray-400">Jab aapka dost aapke link se join karega, aapko <b class="text-amber-400">50 💎 Diamonds</b> milenge!</p>
              <div class="bg-gray-950 border border-purple-500/30 rounded-xl p-3 text-[10px] font-mono text-purple-300 break-all" id="referral-link">superapp.com/?ref=username</div>
              <button onclick="copyReferralLink()" class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs rounded-xl">
                <i class="fa-solid fa-copy"></i> Copy Referral Link
              </button>
            </div>
          </div>
        </div>
      `);
    }
  }

  // ═══════════════ 8. INJECT BUTTONS IN SETTINGS ═══════════════
  function injectSettingsButtons() {
    const settingsModal = document.getElementById('settingsModal');
    if (!settingsModal || document.getElementById('settings-extras')) return;
    
    const walletSection = settingsModal.querySelector('.bg-gray-900');
    if (!walletSection) return;
    
    const extras = document.createElement('div');
    extras.id = 'settings-extras';
    extras.className = 'bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2';
    extras.innerHTML = `
      <h3 class="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5 mb-2"><i class="fa-solid fa-star"></i> Extras</h3>
      <button onclick="openBuyDiamondsModal()" class="w-full py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
        💎 Buy Diamonds
      </button>
      <button onclick="openKycModal()" class="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
        <i class="fa-solid fa-id-card"></i> KYC Verification
      </button>
      <button onclick="openModal('referralModal')" class="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
        <i class="fa-solid fa-users"></i> Refer & Earn (50 💎)
      </button>
    `;
    walletSection.parentNode.insertBefore(extras, walletSection.nextSibling);
  }

  // ═══════════════ 9. AUTO-INIT ═══════════════
  function autoInit() {
    injectUI();
    setTimeout(() => {
      injectSettingsButtons();
      initReferral();
      trackVideoScroll();
      const cleanUser = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
      if (cleanUser) initNotifications();
    }, 2000);
  }

  // Watch for login state change
  let lastUser = null;
  setInterval(() => {
    const curr = localStorage.getItem('SUPER_APP_CURRENT_USER');
    if (curr !== lastUser) {
      lastUser = curr;
      if (curr) {
        setTimeout(() => {
          injectSettingsButtons();
          initReferral();
          initNotifications();
        }, 1500);
      }
    }
  }, 2000);

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // ═══════════════ EXPORT TO WINDOW ═══════════════
  window.openNotificationsModal = openNotificationsModal;
  window.markAllNotifsRead = markAllNotifsRead;
  window.openBuyDiamondsModal = openBuyDiamondsModal;
  window.purchaseDiamonds = purchaseDiamonds;
  window.openKycModal = openKycModal;
  window.kycPreview = kycPreview;
  window.submitKyc = submitKyc;
  window.copyReferralLink = copyReferralLink;

  console.log('✅ index.js loaded - All remaining features active');
})();
