/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - REAL PAYMENT, KYC, REFERRAL, GIFTS
   Add: <script src="realpay.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

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
  // CONFIG: Real payment accounts + WhatsApp numbers
  // ═══════════════════════════════════════════════════════════════
  const CONFIG = {
    easypaisa: { number: '+92 305 2163026', name: 'Muhammad Umar' },
    jazzcash:  { number: '+92 305 2163026', name: 'Muhammad Umar' },
    sadapay:   { number: '5590490292264221', iban: 'PK94SADA0000003013816558', name: 'Muhammad Umar' },
    whatsappAdmin1: '923089775764',   // 03089775764
    whatsappAdmin2: '923423373749',   // 03423373749
    // 1 diamond = $5 (approx Rs 1400). 100 coins = 1 diamond
    coinToDiamondRate: 100,
    usdPerDiamond: 5,
    pkrPerUsd: 278,
    referrerCommission: 0.40 // 40%
  };

  window.__SUPER_CONFIG = CONFIG;

  // ═══════════════════════════════════════════════════════════════
  // BUY DIAMONDS — Real payment info
  // ═══════════════════════════════════════════════════════════════
  const PKGS = [
    { id: 'p1', diamonds: 1,   pkr: 1400 },
    { id: 'p2', diamonds: 5,   pkr: 7000,   bonus: 1 },
    { id: 'p3', diamonds: 10,  pkr: 14000,  bonus: 3 },
    { id: 'p4', diamonds: 25,  pkr: 35000,  bonus: 10 },
    { id: 'p5', diamonds: 50,  pkr: 70000,  bonus: 25 },
    { id: 'p6', diamonds: 100, pkr: 140000, bonus: 60 }
  ];
  let selectedPkg = null;

  window.openBuyDiamondsModal = function() {
    if (!document.getElementById('buyDiamondsModal')) {
      document.body.insertAdjacentHTML('beforeend', `<div id="buyDiamondsModal" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[85] space-y-4"></div>`);
    }
    const modal = document.getElementById('buyDiamondsModal');
    modal.innerHTML = `
      <div class="flex justify-between items-center border-b border-amber-500/40 pb-3">
        <h2 class="text-base font-bold text-amber-400"><i class="fa-solid fa-gem"></i> Buy Diamonds</h2>
        <button onclick="closeModal('buyDiamondsModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="bg-amber-900/20 border border-amber-500/40 rounded-xl p-3 space-y-1">
        <p class="text-[11px] text-amber-300 font-bold">💎 1 Diamond = $5 (≈ Rs 1400)</p>
        <p class="text-[10px] text-gray-300">Step 1: Package select karein</p>
        <p class="text-[10px] text-gray-300">Step 2: Paisa bhejein (EasyPaisa/JazzCash/SadaPay)</p>
        <p class="text-[10px] text-gray-300">Step 3: Screenshot + Txn ID upload karein</p>
        <p class="text-[10px] text-gray-300">Step 4: Admin 5-10 min mein diamonds add karega</p>
      </div>
      <div id="pkgs-grid" class="grid grid-cols-2 gap-3"></div>
      <div id="pay-details" class="hidden bg-cyan-900/20 border border-cyan-500/40 rounded-xl p-4 space-y-3">
        <h3 class="text-xs font-bold text-cyan-400">💳 Payment Accounts</h3>
        <div class="bg-gray-900 rounded-lg p-3 space-y-1">
          <p class="text-[10px] text-gray-400">Easypaisa / JazzCash</p>
          <p class="text-sm font-bold text-white">+92 305 2163026</p>
          <p class="text-[10px] text-gray-500">Muhammad Umar</p>
        </div>
        <div class="bg-gray-900 rounded-lg p-3 space-y-1">
          <p class="text-[10px] text-gray-400">SadaPay (Preferred)</p>
          <p class="text-sm font-bold text-white">5590490292264221</p>
          <p class="text-[9px] text-gray-500">IBAN: PK94SADA0000003013816558</p>
        </div>
        <input type="file" id="pay-ss" accept="image/*" class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white">
        <input type="text" id="pay-txn" class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white" placeholder="Transaction ID / Last 4 digits">
        <button onclick="window.__submitOrder()" class="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xs rounded-xl">
          ✅ Submit for Approval
        </button>
      </div>
    `;
    if (typeof openModal === 'function') openModal('buyDiamondsModal');
    renderPkgs();
  };

  function renderPkgs() {
    const grid = document.getElementById('pkgs-grid');
    if (!grid) return;
    grid.innerHTML = '';
    PKGS.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'p-3 bg-gray-800 border-2 border-amber-500/40 rounded-xl flex flex-col items-center';
      btn.onclick = () => {
        selectedPkg = p;
        document.querySelectorAll('#pkgs-grid > button').forEach(b => b.classList.remove('border-amber-400', 'bg-amber-900/20'));
        btn.classList.add('border-amber-400', 'bg-amber-900/20');
        document.getElementById('pay-details').classList.remove('hidden');
      };
      btn.innerHTML = `
        <span class="text-2xl">💎</span>
        <span class="text-sm font-bold text-amber-400">${p.diamonds}</span>
        ${p.bonus ? `<span class="text-[9px] text-green-400">+${p.bonus} free</span>` : ''}
        <span class="text-[11px] font-bold text-white">Rs ${p.pkr.toLocaleString()}</span>
      `;
      grid.appendChild(btn);
    });
  }

  window.__submitOrder = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    if (!selectedPkg) { toast('Package select karein'); return; }
    const scr = document.getElementById('pay-ss');
    const txn = document.getElementById('pay-txn').value.trim();
    if (!scr.files || !scr.files[0]) { toast('Screenshot upload karein'); return; }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const totalDiamonds = selectedPkg.diamonds + (selectedPkg.bonus || 0);
      try {
        await firebase.firestore().collection('payments').add({
          user, amountPkr: selectedPkg.pkr, diamonds: totalDiamonds,
          screenshot: e.target.result, txn, status: 'pending',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // WhatsApp admin
        const waText = encodeURIComponent(
          `🔔 New Diamond Order\n\nUser: @${user}\nAmount: Rs ${selectedPkg.pkr}\nDiamonds: ${totalDiamonds}\nTxn: ${txn}\n\nApprove in admin panel.`
        );
        window.open(`https://wa.me/${CONFIG.whatsappAdmin1}?text=${waText}`, '_blank');

        toast('✅ Order submitted! Admin 5-10 min mein approve karega.');
        if (typeof closeModal === 'function') closeModal('buyDiamondsModal');
      } catch(err) { toast('❌ ' + err.message); }
    };
    reader.readAsDataURL(scr.files[0]);
  };

  // ═══════════════════════════════════════════════════════════════
  // WITHDRAWAL — 10 min cancel → auto payout via admin
  // ═══════════════════════════════════════════════════════════════
  window.processWithdrawalSubmit = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    const method = document.getElementById('withdraw-method').value;
    const currency = document.getElementById('withdraw-currency').value;
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const account = document.getElementById('withdraw-account').value.trim();
    const password = document.getElementById('withdraw-password').value.trim();

    // reCAPTCHA (skip if error)
    try {
      if (typeof grecaptcha !== 'undefined' && grecaptcha.getResponse && grecaptcha.getResponse.length) {
        const r = grecaptcha.getResponse();
        // Only check if visible & has proper key
      }
    } catch(e) {}

    if (!amount || !account || !password) { toast('Sab fields bharein'); return; }

    let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const u = users[user] || {};
    if (u.password !== password) { toast('Galat password'); return; }

    const currentUsd = u.balanceUsd || 0;
    const reqUsd = currency === 'PKR' ? (amount / CONFIG.pkrPerUsd) : amount;
    if (reqUsd > currentUsd) { toast('Balance kam hai'); return; }

    users[user].balanceUsd = currentUsd - reqUsd;
    localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));

    const wdId = 'wd_' + Date.now();
    const cancelUntil = new Date(Date.now() + 10 * 60 * 1000);

    try {
      await firebase.firestore().collection('withdrawals').doc(wdId).set({
        id: wdId, user, method, currency, amount, account,
        status: 'Pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        cancelUntil: firebase.firestore.Timestamp.fromDate(cancelUntil)
      });
      await firebase.firestore().collection('users').doc(user).set({ balanceUsd: users[user].balanceUsd }, { merge: true });

      try { if (typeof grecaptcha !== 'undefined') grecaptcha.reset(); } catch(e) {}
      if (typeof window.updateWalletUI === 'function') window.updateWalletUI();
      showCancelWindow(wdId, amount, currency, account, method);
    } catch(e) {
      users[user].balanceUsd = currentUsd;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
      toast('❌ ' + e.message);
    }
  };

  function showCancelWindow(id, amount, currency, account, method) {
    document.getElementById('cancelWdModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', `
      <div id="cancelWdModal" class="fullscreen-modal p-4 justify-center items-center bg-black/90 z-[95] flex">
        <div class="w-full max-w-sm bg-gray-900 border-2 border-amber-500/50 rounded-2xl p-6 text-center space-y-4">
          <div class="text-5xl">⏳</div>
          <h2 class="text-base font-bold text-amber-400">Withdrawal Submitted!</h2>
          <p class="text-xs text-gray-300">${currency} ${amount} to <b>${account}</b></p>
          <div class="bg-amber-900/20 border border-amber-500/40 rounded-xl p-3">
            <p class="text-[10px] text-amber-300">Paisa bhejne ka time:</p>
            <p class="text-3xl font-extrabold text-amber-400" id="wd-timer">10:00</p>
            <p class="text-[10px] text-gray-400">Cancel karne ka time</p>
          </div>
          <div class="flex gap-2">
            <button onclick="window.__cancelWd('${id}')" class="flex-1 py-3 bg-red-600 text-white font-bold text-xs rounded-xl">Cancel</button>
            <button onclick="document.getElementById('cancelWdModal').remove(); clearInterval(window.__wdTimer);" class="flex-1 py-3 bg-gray-800 border border-gray-700 text-gray-300 font-bold text-xs rounded-xl">OK</button>
          </div>
        </div>
      </div>
    `);

    let sec = 600;
    window.__wdTimer = setInterval(() => {
      sec--;
      const m = Math.floor(sec / 60), s = sec % 60;
      const el = document.getElementById('wd-timer');
      if (el) el.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
      if (sec <= 0) {
        clearInterval(window.__wdTimer);
        document.getElementById('cancelWdModal')?.remove();
        // Send to admin WhatsApp for manual payout
        const admin = Math.random() < 0.5 ? CONFIG.whatsappAdmin1 : CONFIG.whatsappAdmin2;
        const waText = encodeURIComponent(
          `💸 WITHDRAWAL REQUEST\n\nUser: @${getUser()}\nMethod: ${method}\nAmount: ${currency} ${amount}\nAccount: ${account}\n\nPaisa bhejein aur admin panel se approve karein.`
        );
        window.open(`https://wa.me/${admin}?text=${waText}`, '_blank');
        toast('✅ Withdrawal processing! Admin paisa bhej raha hai.');
      }
    }, 1000);
  }

  window.__cancelWd = async function(id) {
    try {
      const doc = await firebase.firestore().collection('withdrawals').doc(id).get();
      if (!doc.exists) return;
      const data = doc.data();
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const refundUsd = data.currency === 'PKR' ? (data.amount / CONFIG.pkrPerUsd) : data.amount;
      if (users[data.user]) {
        users[data.user].balanceUsd = (users[data.user].balanceUsd || 0) + refundUsd;
        localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
        await firebase.firestore().collection('users').doc(data.user).set({ balanceUsd: users[data.user].balanceUsd }, { merge: true });
      }
      await firebase.firestore().collection('withdrawals').doc(id).update({
        status: 'Cancelled', cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      clearInterval(window.__wdTimer);
      document.getElementById('cancelWdModal')?.remove();
      if (typeof window.updateWalletUI === 'function') window.updateWalletUI();
      toast('✅ Cancelled + refunded');
    } catch(e) { toast('Error: ' + e.message); }
  };

  // ═══════════════════════════════════════════════════════════════
  // KYC — Photo + CNIC sent to Admin WhatsApp
  // ═══════════════════════════════════════════════════════════════
  let kycImgs = { front: null, back: null, selfie: null };
  window.__kycImgs = kycImgs;

  window.kycPreview = function(type, input) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
      kycImgs[type] = e.target.result;
      const pv = document.getElementById('kyc-' + type + '-preview');
      if (pv) { pv.src = e.target.result; pv.classList.remove('hidden'); }
      const ic = document.getElementById('kyc-' + type + '-icon');
      if (ic) ic.classList.add('hidden');
    };
    reader.readAsDataURL(input.files[0]);
  };

  window.submitKyc = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    const fullName = (document.getElementById('kyc-fullname') || {}).value || '';
    const cnic = (document.getElementById('kyc-cnic') || {}).value || '';
    const dob = (document.getElementById('kyc-dob') || {}).value || '';
    const cnicClean = cnic.replace(/[^0-9]/g, '');

    if (cnicClean.length !== 13) { toast('❌ CNIC 13 digits (XXXXX-XXXXXXX-X)'); return; }
    if (!fullName || !kycImgs.front || !kycImgs.back || !kycImgs.selfie) {
      toast('Sab fields + 3 photos zaroori'); return;
    }

    try {
      // Save to Firebase
      await firebase.firestore().collection('kyc').doc(user).set({
        user, fullName, cnic: cnicClean, dob,
        front: kycImgs.front, back: kycImgs.back, selfie: kycImgs.selfie,
        status: 'Pending',
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Build verification links for admin
      const verifyBase = `${window.location.origin}${window.location.pathname}`;
      const verifyLink = `${verifyBase}?verify=${user}&code=${Math.random().toString(36).substr(2, 8)}`;
      const rejectLink = `${verifyBase}?reject=${user}&code=${Math.random().toString(36).substr(2, 8)}`;

      const waText = encodeURIComponent(
        `🔔 NEW KYC SUBMISSION\n\n` +
        `User: @${user}\n` +
        `Name: ${fullName}\n` +
        `CNIC: ${cnicClean}\n` +
        `DOB: ${dob}\n\n` +
        `✅ APPROVE: ${verifyLink}\n\n` +
        `❌ REJECT: ${rejectLink}\n\n` +
        `(Photos Firestore kyc collection mein hain)`
      );

      toast('✅ KYC submitted!');
      setTimeout(() => {
        if (confirm('WhatsApp pe admin ko bhejein?')) {
          const admin = Math.random() < 0.5 ? CONFIG.whatsappAdmin1 : CONFIG.whatsappAdmin2;
          window.open(`https://wa.me/${admin}?text=${waText}`, '_blank');
        }
      }, 800);
      if (typeof closeModal === 'function') closeModal('kycModal');
    } catch(e) { toast('❌ ' + e.message); }
  };

  // ═══════════════════════════════════════════════════════════════
  // KYC Verification handler — URL params ?verify=user / ?reject=user
  // ═══════════════════════════════════════════════════════════════
  async function handleKycVerification() {
    const params = new URLSearchParams(window.location.search);
    const verifyUser = params.get('verify');
    const rejectUser = params.get('reject');

    if (verifyUser) {
      const ok = confirm(`Approve KYC for @${verifyUser}?`);
      if (ok) {
        try {
          await firebase.firestore().collection('kyc').doc(verifyUser).update({
            status: 'Approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          await firebase.firestore().collection('notifications').add({
            userId: verifyUser,
            title: '✅ KYC Verified!',
            body: 'Aapka KYC verify ho gaya. Ab aap withdrawal kar sakte hain.',
            type: 'general', read: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          alert('✅ KYC Approved for @' + verifyUser);
        } catch(e) { alert('Error: ' + e.message); }
      }
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (rejectUser) {
      const ok = confirm(`Reject KYC for @${rejectUser}?`);
      if (ok) {
        try {
          await firebase.firestore().collection('kyc').doc(rejectUser).update({
            status: 'Rejected',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          await firebase.firestore().collection('notifications').add({
            userId: rejectUser,
            title: '❌ KYC Rejected',
            body: 'Aapka KYC verify nahi ho saka. Please sahi documents ke saath dobara submit karein.',
            type: 'general', read: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          alert('❌ KYC Rejected for @' + rejectUser);
        } catch(e) { alert('Error: ' + e.message); }
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }
  handleKycVerification();

  // ═══════════════════════════════════════════════════════════════
  // REFERRAL — 40% commission on diamond purchase ONLY (no free money)
  // ═══════════════════════════════════════════════════════════════
  window.initReferralSystem = function() {
    const user = getUser();
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const refBy = params.get('ref');
    if (refBy && refBy !== user) {
      const key = 'ref_joined_' + user;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, refBy);
        localStorage.setItem('ref_' + user, refBy);
        try { firebase.firestore().collection('users').doc(user).set({ referredBy: refBy }, { merge: true }); } catch(e) {}
        toast('🎉 Joined via @' + refBy);
      }
    }
    const refLink = `${window.location.origin}${window.location.pathname}?ref=${user}`;
    const el = document.getElementById('referral-link');
    if (el) el.innerText = refLink;
  };

  // Called when diamonds bought — 40% to referrer
  window.__applyReferralCommission = async function(buyer, diamondsBought) {
    const referrer = localStorage.getItem('ref_' + buyer);
    if (!referrer) return;
    const commission = Math.floor(diamondsBought * CONFIG.referrerCommission);
    if (commission <= 0) return;
    try {
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (users[referrer]) {
        users[referrer].diamonds = (users[referrer].diamonds || 0) + commission;
        localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
        await firebase.firestore().collection('users').doc(referrer).set({ diamonds: users[referrer].diamonds }, { merge: true });
        await firebase.firestore().collection('notifications').add({
          userId: referrer, title: '💰 Referral Commission',
          body: `@${buyer} ne ${diamondsBought}💎 khareede. Aapko ${commission}💎 (40%) mile!`,
          type: 'reward', read: false,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch(e) {}
  };

  // ═══════════════════════════════════════════════════════════════
  // RECEIVED GIFTS — View only, 70% earnings
  // ═══════════════════════════════════════════════════════════════
  window.showReceivedGifts = async function() {
    const user = getUser();
    if (!user) return;
    if (!document.getElementById('giftsViewModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="giftsViewModal" class="fullscreen-modal hidden p-4 z-[85] overflow-y-auto no-scrollbar">
          <div class="flex justify-between items-center border-b border-amber-500/40 pb-3 mb-3">
            <h2 class="text-base font-bold text-amber-400"><i class="fa-solid fa-gift"></i> Received Gifts</h2>
            <button onclick="closeModal('giftsViewModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="gifts-list" class="space-y-2"></div>
        </div>
      `);
    }
    if (typeof openModal === 'function') openModal('giftsViewModal');
    try {
      const snap = await firebase.firestore().collection('gifts').where('receiver', '==', user).limit(50).get();
      const list = document.getElementById('gifts-list');
      list.innerHTML = '';
      if (snap.empty) { list.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">No gifts yet</p>'; return; }
      const gifts = [];
      snap.forEach(d => gifts.push(d.data()));
      gifts.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
      let total = 0;
      gifts.forEach(g => {
        const earn = Math.floor((g.pkrValue || 0) * 0.7);
        total += earn;
        const div = document.createElement('div');
        div.className = 'bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3';
        div.innerHTML = `
          <div class="text-3xl">${g.emoji || '🎁'}</div>
          <div class="flex-1">
            <p class="text-xs font-bold text-white">${g.gift || 'Gift'}</p>
            <p class="text-[10px] text-gray-400">From: @${g.sender}</p>
            <p class="text-[10px] text-green-400 font-bold">+Rs ${earn} (70%)</p>
          </div>
          <p class="text-[9px] text-gray-500">${g.timestamp ? new Date(g.timestamp.toMillis()).toLocaleDateString() : ''}</p>
        `;
        list.appendChild(div);
      });
      list.insertAdjacentHTML('afterbegin', `
        <div class="bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border border-amber-500/40 rounded-xl p-3 mb-3">
          <p class="text-[10px] text-amber-300 uppercase font-bold">Total Earned (70%)</p>
          <p class="text-2xl font-extrabold text-amber-400">Rs ${total.toLocaleString()}</p>
        </div>
      `);
    } catch(e) { toast('Error: ' + e.message); }
  };

  function addGiftsBtn() {
    const profile = document.getElementById('tab-profile');
    if (!profile || document.getElementById('my-gifts-btn')) return;
    const row = profile.querySelector('.flex.items-center.gap-2');
    if (!row) return;
    const btn = document.createElement('button');
    btn.id = 'my-gifts-btn';
    btn.onclick = window.showReceivedGifts;
    btn.className = 'px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-xs font-bold flex items-center gap-1';
    btn.innerHTML = '<i class="fa-solid fa-gift"></i> My Gifts';
    row.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // ADMIN WALLET (hidden — only admin sees)
  // ═══════════════════════════════════════════════════════════════
  window.openAdminWallet = async function() {
    if (!isAdmin()) { toast('Access denied'); return; }
    if (!document.getElementById('adminWalletModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="adminWalletModal" class="fullscreen-modal hidden p-4 z-[90] overflow-y-auto no-scrollbar">
          <div class="flex justify-between items-center border-b border-red-500/40 pb-3 mb-4">
            <h2 class="text-base font-bold text-red-400"><i class="fa-solid fa-vault"></i> Admin Wallet (Private)</h2>
            <button onclick="closeModal('adminWalletModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="admin-wallet-content" class="space-y-4"></div>
        </div>
      `);
    }
    if (typeof openModal === 'function') openModal('adminWalletModal');
    await loadAdminWallet();
  };

  async function loadAdminWallet() {
    const c = document.getElementById('admin-wallet-content');
    c.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Loading...</p>';
    try {
      const paySnap = await firebase.firestore().collection('payments').where('status', '==', 'approved').limit(500).get();
      let totalPkr = 0, totalDiamonds = 0;
      paySnap.forEach(d => {
        const x = d.data();
        totalPkr += parseFloat(x.amountPkr || 0);
        totalDiamonds += parseInt(x.diamonds || 0);
      });
      const wdSnap = await firebase.firestore().collection('withdrawals').where('status', '==', 'Approved').limit(500).get();
      let withdrawn = 0;
      wdSnap.forEach(d => withdrawn += parseFloat(d.data().amount || 0));

      c.innerHTML = `
        <div class="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-2 border-green-500/50 rounded-2xl p-4 space-y-3">
          <p class="text-[10px] text-green-300 uppercase font-bold">Total Received (PKR)</p>
          <p class="text-3xl font-extrabold text-green-400">Rs ${totalPkr.toLocaleString()}</p>
          <div class="grid grid-cols-2 gap-2 mt-2">
            <div class="bg-gray-900/60 rounded-lg p-2">
              <p class="text-[9px] text-gray-400">Diamonds Sold</p>
              <p class="text-sm font-bold text-amber-400">💎 ${totalDiamonds}</p>
            </div>
            <div class="bg-gray-900/60 rounded-lg p-2">
              <p class="text-[9px] text-gray-400">Paid Out</p>
              <p class="text-sm font-bold text-red-400">Rs ${withdrawn.toLocaleString()}</p>
            </div>
          </div>
          <div class="bg-gradient-to-r from-cyan-900/60 to-blue-900/60 rounded-lg p-3 mt-2">
            <p class="text-[10px] text-cyan-300 uppercase font-bold">Net Balance</p>
            <p class="text-2xl font-extrabold text-cyan-400">Rs ${(totalPkr - withdrawn).toLocaleString()}</p>
          </div>
        </div>
      `;
    } catch(e) { c.innerHTML = '<p class="text-xs text-red-400">Error: ' + e.message + '</p>'; }
  }

  // Admin button
  function addAdminBtn() {
    if (!isAdmin()) return;
    if (document.getElementById('admin-wallet-btn')) return;
    const header = document.querySelector('header');
    if (!header) return;
    const btn = document.createElement('button');
    btn.id = 'admin-wallet-btn';
    btn.onclick = window.openAdminWallet;
    btn.className = 'px-2 py-1 bg-red-600 text-white rounded-full text-[10px] font-bold';
    btn.innerHTML = '<i class="fa-solid fa-vault"></i>';
    btn.title = 'Admin Wallet';
    header.querySelector('div').appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // CAMERA PERMISSIONS (APK)
  // ═══════════════════════════════════════════════════════════════
  async function requestNativePerms() {
    if (!window.Capacitor?.isNativePlatform?.()) return;
    try {
      if (window.Capacitor.Plugins.Camera) {
        const p = await window.Capacitor.Plugins.Camera.checkPermissions();
        if (p.camera !== 'granted') await window.Capacitor.Plugins.Camera.requestPermissions();
      }
    } catch(e) {}
  }
  requestNativePerms();
  setInterval(requestNativePerms, 60000);

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    setInterval(() => {
      addGiftsBtn();
      addAdminBtn();
    }, 2000);
    setTimeout(() => {
      addGiftsBtn();
      addAdminBtn();
      window.initReferralSystem();
    }, 2500);
    console.log('✅ realpay.js loaded');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
