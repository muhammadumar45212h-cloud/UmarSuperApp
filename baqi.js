/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - BAQI.JS
   Ye file saara baqi kaam karegi:
   1. Firebase Storage Rules auto-setup guide
   2. KYC Admin Approval Panel (Real)
   3. AdMob Interstitial + Rewarded setup
   4. FCM Push setup guide
   5. Firebase Index auto-detect + link
   6. Video CDN wrapper
   7. Real Payment Gateway hook
   
   Add: <script src="baqi.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════
  function toast(msg) {
    if (typeof window.showToast === 'function') return window.showToast(msg);
    const t = document.getElementById('toast-notification');
    if (!t) { alert(msg); return; }
    document.getElementById('toast-message').innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
  function fmt(s) { return (s || 'Umar').replace(/^@+/, '').split('@')[0]; }
  function getUser() { return fmt(localStorage.getItem('SUPER_APP_CURRENT_USER')); }
  function isAdmin() { return ['muhammadumar45212h', 'Umar', 'admin'].includes(getUser()); }

  // ═══════════════════════════════════════════════════════════════
  // 1. FIREBASE STORAGE — VIDEO UPLOAD (Real)
  // ═══════════════════════════════════════════════════════════════
  let storage = null;
  function getStorage() {
    if (!storage && typeof firebase !== 'undefined' && firebase.storage) {
      storage = firebase.storage();
    }
    return storage;
  }

  window.__uploadVideoReal = async function(file, onProgress) {
    const st = getStorage();
    if (!st) throw new Error('Storage not ready');
    const user = getUser();
    const ext = file.name.split('.').pop() || 'mp4';
    const path = `videos/${user}_${Date.now()}.${ext}`;
    const ref = st.ref().child(path);

    return new Promise((resolve, reject) => {
      const task = ref.put(file);
      task.on('state_changed',
        (snap) => {
          const pct = Math.floor((snap.bytesTransferred / snap.totalBytes) * 100);
          if (onProgress) onProgress(pct, snap.bytesTransferred, snap.totalBytes);
        },
        reject,
        async () => {
          const url = await task.snapshot.ref.getDownloadURL();
          resolve(url);
        }
      );
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // 2. KYC ADMIN APPROVAL PANEL (Real)
  // ═══════════════════════════════════════════════════════════════
  window.openKycAdminPanel = async function() {
    if (!isAdmin()) { toast('Access denied'); return; }

    if (!document.getElementById('kycAdminPanel')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="kycAdminPanel" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[90] space-y-4">
          <div class="flex justify-between items-center border-b border-cyan-500/40 pb-3 sticky top-0 bg-gray-950 z-10">
            <h2 class="text-base font-bold text-cyan-400"><i class="fa-solid fa-id-card"></i> KYC Approvals</h2>
            <button onclick="closeModal('kycAdminPanel')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="kyc-admin-list" class="space-y-3"></div>
        </div>
      `);
    }
    if (typeof openModal === 'function') openModal('kycAdminPanel');
    await loadPendingKYC();
  };

  async function loadPendingKYC() {
    const list = document.getElementById('kyc-admin-list');
    list.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Loading...</p>';
    try {
      const snap = await firebase.firestore().collection('kyc')
        .where('status', '==', 'Pending').limit(50).get();
      
      list.innerHTML = '';
      if (snap.empty) {
        list.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">No pending KYC</p>';
        return;
      }
      
      snap.forEach(doc => {
        const d = doc.data();
        const div = document.createElement('div');
        div.className = 'bg-gray-900 border border-cyan-500/40 rounded-xl p-3 space-y-3';
        div.innerHTML = `
          <div class="flex justify-between">
            <p class="text-xs font-bold text-white">@${d.user}</p>
            <p class="text-[10px] text-gray-400">${d.submittedAt ? new Date(d.submittedAt.toMillis()).toLocaleString() : ''}</p>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p class="text-[9px] text-gray-500 uppercase">Full Name</p>
              <p class="text-white font-bold">${d.fullName || 'N/A'}</p>
            </div>
            <div>
              <p class="text-[9px] text-gray-500 uppercase">CNIC</p>
              <p class="text-white font-mono text-[11px]">${d.cnic || 'N/A'}</p>
            </div>
            <div>
              <p class="text-[9px] text-gray-500 uppercase">DOB</p>
              <p class="text-white">${d.dob || 'N/A'}</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-1">
            ${d.front ? `<img src="${d.front}" class="w-full h-20 object-cover rounded border border-gray-700" onclick="window.open('${d.front}')">` : ''}
            ${d.back ? `<img src="${d.back}" class="w-full h-20 object-cover rounded border border-gray-700" onclick="window.open('${d.back}')">` : ''}
            ${d.selfie ? `<img src="${d.selfie}" class="w-full h-20 object-cover rounded border border-gray-700" onclick="window.open('${d.selfie}')">` : ''}
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="window.__approveKYC('${d.user}')" class="py-2 bg-green-600 text-white text-[10px] font-bold rounded">✅ Approve</button>
            <button onclick="window.__rejectKYC('${d.user}')" class="py-2 bg-red-600 text-white text-[10px] font-bold rounded">❌ Reject</button>
          </div>
        `;
        list.appendChild(div);
      });
    } catch(e) {
      list.innerHTML = `<p class="text-xs text-red-400 text-center py-4">Error: ${e.message}</p>`;
    }
  }

  window.__approveKYC = async function(user) {
    try {
      await firebase.firestore().collection('kyc').doc(user).update({
        status: 'Approved',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await firebase.firestore().collection('users').doc(user).set({
        kycVerified: true,
        kycApprovedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      await firebase.firestore().collection('notifications').add({
        userId: user,
        title: '✅ KYC Verified!',
        body: 'Aapka KYC approve ho gaya. Ab withdrawal kar sakte hain.',
        type: 'general',
        read: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      toast('✅ KYC Approved: @' + user);
      loadPendingKYC();
    } catch(e) { toast('❌ ' + e.message); }
  };

  window.__rejectKYC = async function(user) {
    const reason = prompt('Rejection reason?') || 'Invalid documents';
    try {
      await firebase.firestore().collection('kyc').doc(user).update({
        status: 'Rejected',
        reason: reason,
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await firebase.firestore().collection('notifications').add({
        userId: user,
        title: '❌ KYC Rejected',
        body: 'Reason: ' + reason + '. Dobara submit karein.',
        type: 'general',
        read: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      toast('❌ KYC Rejected: @' + user);
      loadPendingKYC();
    } catch(e) { toast('❌ ' + e.message); }
  };

  // ═══════════════════════════════════════════════════════════════
  // 3. ADMOB INTERSTITIAL + REWARDED (Auto-detect setup)
  // ═══════════════════════════════════════════════════════════════
  window.__setupAdMobInterstitial = function() {
    // Ye function tab call hoga jab user ad unit banaye
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    const AdMob = isNative && window.Capacitor.Plugins ? window.Capacitor.Plugins.AdMob : null;
    
    if (!AdMob) {
      console.log('ℹ️ AdMob not available (browser mode)');
      return false;
    }

    // Check if interstitial ID exists
    const interstitialId = window.__ADMOB_CONFIG?.realInterstitialId;
    if (!interstitialId) {
      console.log('⚠️ Interstitial ID missing. Add in admob.js');
      return false;
    }
    return true;
  };

  // ═══════════════════════════════════════════════════════════════
  // 4. FCM PUSH NOTIFICATIONS (Real)
  // ═══════════════════════════════════════════════════════════════
  async function setupFCM() {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) {
      console.log('ℹ️ FCM only works in APK');
      return;
    }

    try {
      const PushNotifications = window.Capacitor.Plugins?.PushNotifications;
      if (!PushNotifications) {
        console.log('⚠️ PushNotifications plugin not installed');
        return;
      }

      // Request permission
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== 'granted') {
        console.log('❌ Push permission denied');
        return;
      }

      // Register
      await PushNotifications.register();

      // Get token
      PushNotifications.addListener('registration', async (token) => {
        const user = getUser();
        if (!user) return;
        try {
          await firebase.firestore().collection('users').doc(user).set({
            fcmToken: token.value,
            fcmUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          console.log('✅ FCM token saved');
        } catch(e) { console.log(e); }
      });

      // Handle notifications
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('📬 Notification:', notification);
        if (typeof window.showToast === 'function') {
          window.showToast(notification.title + ': ' + notification.body);
        }
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const data = action.notification.data;
        if (data.type === 'payment') window.switchTab && window.switchTab('profile');
        if (data.type === 'dm') window.openDmInboxModal && window.openDmInboxModal();
      });

      console.log('✅ FCM setup complete');
    } catch(e) {
      console.log('FCM setup:', e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. FIREBASE INDEX AUTO-DETECT (Error se link nikaale)
  // ═══════════════════════════════════════════════════════════════
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const msg = args.join(' ');
    if (msg.includes('The query requires an index')) {
      const match = msg.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
      if (match) {
        // Show in-app notification
        setTimeout(() => {
          const shouldOpen = confirm(
            '🔥 Firebase Index Required\n\n' +
            '1 click mein index banayein. Auto-open karein?'
          );
          if (shouldOpen) window.open(match[0], '_blank');
        }, 2000);
      }
    }
    originalConsoleError.apply(console, args);
  };

  // ═══════════════════════════════════════════════════════════════
  // 6. VIDEO CDN WRAPPER (Firebase Storage + fast delivery)
  // ═══════════════════════════════════════════════════════════════
  window.__getFastVideoUrl = function(firebaseUrl) {
    if (!firebaseUrl) return firebaseUrl;
    // Firebase Storage already uses Google CDN
    // Agar Bunny/Cloudinary add karna ho yahan wrap karein
    // Example: return firebaseUrl.replace('firebasestorage.googleapis.com', 'cdn.superapp.com');
    return firebaseUrl;
  };

  // ═══════════════════════════════════════════════════════════════
  // 7. REAL PAYMENT GATEWAY HOOK (Future Stripe/PayPal)
  // ═══════════════════════════════════════════════════════════════
  window.__createStripeCheckout = async function(packageData) {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    // Jab Stripe account approve ho jaye:
    // 1. Stripe Dashboard → Payment Links → Create
    // 2. Amount: Rs 1400, 7000, 14000, etc.
    // 3. Success URL: window.location.origin + '?paid=true'
    // 4. Payment link ko yahan use karein

    const STRIPE_LINKS = {
      1400: 'https://buy.stripe.com/YOUR_LINK_1',
      7000: 'https://buy.stripe.com/YOUR_LINK_2',
      14000: 'https://buy.stripe.com/YOUR_LINK_3',
      35000: 'https://buy.stripe.com/YOUR_LINK_4',
      70000: 'https://buy.stripe.com/YOUR_LINK_5',
      140000: 'https://buy.stripe.com/YOUR_LINK_6'
    };

    const link = STRIPE_LINKS[packageData.pkr];
    if (!link || link.includes('YOUR_LINK')) {
      toast('💳 Card payment abhi setup mein hai. Easypaisa/SadaPay use karein.');
      return;
    }

    window.open(link + '?client_reference_id=' + user, '_blank');
    toast('💳 Stripe payment page khul raha hai...');
  };

  // Check if user paid (Stripe return)
  window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === 'true') {
      toast('✅ Payment successful! Admin verify karega.');
      // Clear param
      window.history.replaceState({}, '', window.location.pathname);
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // 8. AUTO-DETECT MISSING AD MOB IDs
  // ═══════════════════════════════════════════════════════════════
  function checkAdMobSetup() {
    const config = window.__ADMOB_CONFIG;
    if (!config) return;

    const missing = [];
    if (!config.realInterstitialId) missing.push('Interstitial');
    if (!config.realRewardedId) missing.push('Rewarded');

    if (missing.length > 0) {
      console.log('⚠️ Missing AdMob IDs:', missing.join(', '));
      console.log('   AdMob Console → Ad units → Create');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. ADMIN KYC BUTTON IN ADMIN PANEL
  // ═══════════════════════════════════════════════════════════════
  function addKycAdminButton() {
    if (!isAdmin()) return;
    if (document.getElementById('kyc-admin-btn')) return;
    
    // Find admin panel
    const adminPanel = document.getElementById('realAdminPanel');
    if (!adminPanel) return;
    
    const tabsContainer = adminPanel.querySelector('.flex.gap-2');
    if (!tabsContainer) return;
    
    const btn = document.createElement('button');
    btn.id = 'kyc-admin-btn';
    btn.onclick = window.openKycAdminPanel;
    btn.className = 'flex-1 py-2 rounded-lg text-gray-400 font-bold';
    btn.innerText = '🆔 KYC';
    tabsContainer.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. FIREBASE INDEX HELPER — User ko bataye
  // ═══════════════════════════════════════════════════════════════
  window.__showIndexHelp = function() {
    const indexes = [
      { collection: 'dm_messages', fields: 'chatKey (ASC) + timestamp (ASC)' },
      { collection: 'user_ads', fields: 'active (ASC) + expiresAt (ASC)' },
      { collection: 'notifications', fields: 'userId (ASC) + read (ASC)' },
      { collection: 'withdrawals', fields: 'user (ASC) + status (ASC)' },
      { collection: 'posts', fields: 'user (ASC) + createdAt (DESC)' }
    ];

    const msg = '🔧 Firebase Indexes Needed:\n\n' +
      indexes.map(i => `📌 ${i.collection}\n   ${i.fields}`).join('\n\n') +
      '\n\nYe index banane ke liye:\n' +
      '1. Console error mein link aayega\n' +
      '2. Link click karein\n' +
      '3. Auto-create ho jayega';

    alert(msg);
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    // FCM setup (APK only)
    setTimeout(setupFCM, 3000);

    // Check AdMob config
    setTimeout(checkAdMobSetup, 2000);

    // Add KYC button to admin panel
    setInterval(addKycAdminButton, 2000);

    console.log('✅ baqi.js loaded - All remaining features ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════
  window.__BAQI__ = {
    uploadVideoReal: window.__uploadVideoReal,
    openKycAdminPanel: window.openKycAdminPanel,
    setupFCM,
    showIndexHelp: window.__showIndexHelp,
    createStripeCheckout: window.__createStripeCheckout
  };
})();
