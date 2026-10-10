/* ═══════════════════════════════════════════════════════════════
   SUPER APP - PAYMENTS, KYC & REFERRAL MODULE
   Real payment info + Manual verification system
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

  // ═══════════════════════════════════════════════════════════════
  // REAL PAYMENT ACCOUNTS (Aapke accounts)
  // ═══════════════════════════════════════════════════════════════
  const PAYMENT_ACCOUNTS = {
    easypaisa: {
      name: 'Easypaisa',
      number: '+92 305 2163026',
      holder: 'Muhammad Umar'
    },
    jazzcash: {
      name: 'JazzCash',
      number: '+92 305 2163026',
      holder: 'Muhammad Umar'
    },
    sadapay: {
      name: 'SadaPay',
      number: '5590490292264221',
      iban: 'PK94SADA0000003013816558',
      holder: 'Muhammad Umar'
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // HIDDEN ADMIN WALLET (sirf aap dekh sakte hain)
  // ═══════════════════════════════════════════════════════════════
  const ADMIN_USERNAMES = ['muhammadumar45212h', 'Umar'];
  function isAdmin() { return ADMIN_USERNAMES.includes(getUser()); }

  window.openAdminWallet = async function() {
    if (!isAdmin()) { toast('Access denied'); return; }
    
    if (!document.getElementById('adminWalletModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="adminWalletModal" class="fullscreen-modal hidden p-4 z-[90] overflow-y-auto no-scrollbar">
          <div class="flex justify-between items-center border-b border-red-500/40 pb-3 mb-4">
            <h2 class="text-base font-bold text-red-400"><i class="fa-solid fa-vault"></i> Admin Wallet</h2>
            <button onclick="closeModal('adminWalletModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="admin-wallet-content" class="space-y-4"></div>
        </div>
      `);
    }
    openModal('adminWalletModal');
    await loadAdminWallet();
  };

  async function loadAdminWallet() {
    const container = document.getElementById('admin-wallet-content');
    container.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Loading...</p>';
    
    try {
      // Get all payments
      const paySnap = await firebase.firestore().collection('payments')
        .where('status', '==', 'approved').limit(500).get();
      
      let totalPkr = 0;
      let totalDiamonds = 0;
      const payments = [];
      
      paySnap.forEach(d => {
        const data = d.data();
        totalPkr += parseFloat(data.amountPkr || 0);
        totalDiamonds += parseInt(data.diamonds || 0);
        payments.push({ id: d.id, ...data });
      });

      // Withdrawals paid out
      const wdSnap = await firebase.firestore().collection('withdrawals')
        .where('status', '==', 'Approved').limit(500).get();
      let totalWithdrawn = 0;
      wdSnap.forEach(d => {
        const data = d.data();
        totalWithdrawn += parseFloat(data.amount || 0);
      });

      container.innerHTML = `
        <div class="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-2 border-green-500/50 rounded-2xl p-4 space-y-3">
          <p class="text-[10px] text-green-300 uppercase font-bold">Total Earned</p>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-900/60 rounded-xl p-3">
              <p class="text-[10px] text-gray-400">PKR Received</p>
              <p class="text-xl font-extrabold text-green-400">Rs ${totalPkr.toLocaleString()}</p>
            </div>
            <div class="bg-gray-900/60 rounded-xl p-3">
              <p class="text-[10px] text-gray-400">Diamonds Sold</p>
              <p class="text-xl font-extrabold text-amber-400">💎 ${totalDiamonds.toLocaleString()}</p>
            </div>
          </div>
          <div class="bg-gray-900/60 rounded-xl p-3">
            <p class="text-[10px] text-gray-400">Withdrawn to Users</p>
            <p class="text-lg font-bold text-red-400">- Rs ${totalWithdrawn.toLocaleString()}</p>
          </div>
          <div class="bg-gradient-to-r from-cyan-900/60 to-blue-900/60 rounded-xl p-3 mt-2">
            <p class="text-[10px] text-cyan-300 uppercase font-bold">Net Balance</p>
            <p class="text-2xl font-extrabold text-cyan-400">Rs ${(totalPkr - totalWithdrawn).toLocaleString()}</p>
          </div>
        </div>

        <div class="border-t border-gray-800 pt-4">
          <h3 class="text-xs font-bold text-cyan-400 mb-2">Recent Payments</h3>
          <div id="admin-payment-list" class="space-y-2"></div>
        </div>
      `;

      const list = document.getElementById('admin-payment-list');
      payments.slice(0, 20).forEach(p => {
        const div = document.createElement('div');
        div.className = 'bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs space-y-1';
        div.innerHTML = `
          <div class="flex justify-between">
            <b class="text-white">@${p.user}</b>
            <span class="text-green-400 font-bold">Rs ${p.amountPkr}</span>
          </div>
          <p class="text-gray-400 text-[10px]">Method: ${p.method} • 💎 ${p.diamonds}</p>
          <p class="text-gray-500 text-[9px]">${p.timestamp ? new Date(p.timestamp.toMillis()).toLocaleString() : ''}</p>
        `;
        list.appendChild(div);
      });

    } catch(e) {
      container.innerHTML = '<p class="text-xs text-red-400 text-center">Error: ' + e.message + '</p>';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BUY DIAMONDS - Real payment info
  // ═══════════════════════════════════════════════════════════════
  window.openBuyDiamondsModal = function() {
    if (!document.getElementById('buyDiamondsModal')) return;
    
    // Replace content
    const modal = document.getElementById('buyDiamondsModal');
    modal.innerHTML = `
      <div class="flex justify-between items-center border-b border-amber-500/40 pb-3 mb-3">
        <h2 class="text-base font-bold text-amber-400"><i class="fa-solid fa-gem"></i> Buy Diamonds</h2>
        <button onclick="closeModal('buyDiamondsModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
      </div>
      
      <div class="bg-amber-900/20 border border-amber-500/40 rounded-xl p-3 mb-4 space-y-1">
        <p class="text-[10px] text-amber-300 uppercase font-bold">📢 How to Buy</p>
        <p class="text-[11px] text-gray-300">1. Neeche koi package select karein</p>
        <p class="text-[11px] text-gray-300">2. Payment karein (Easypaisa/JazzCash/SadaPay)</p>
        <p class="text-[11px] text-gray-300">3. Screenshot upload karein</p>
        <p class="text-[11px] text-gray-300">4. Admin 5 minute mein approve karega</p>
      </div>
      
      <div id="diamond-packages" class="grid grid-cols-2 gap-3 mb-4"></div>
      
      <div id="payment-instructions" class="hidden bg-cyan-900/20 border border-cyan-500/40 rounded-xl p-4 space-y-3">
        <h3 class="text-xs font-bold text-cyan-400">💳 Payment Details</h3>
        <div class="space-y-2 text-xs">
          <div class="bg-gray-900 rounded-lg p-3">
            <p class="text-[10px] text-gray-400">Easypaisa / JazzCash</p>
            <p class="text-sm font-bold text-white">+92 305 2163026</p>
            <p class="text-[10px] text-gray-400">Muhammad Umar</p>
          </div>
          <div class="bg-gray-900 rounded-lg p-3">
            <p class="text-[10px] text-gray-400">SadaPay</p>
            <p class="text-sm font-bold text-white">5590490292264221</p>
            <p class="text-[10px] text-gray-400">IBAN: PK94SADA0000003013816558</p>
            <p class="text-[10px] text-gray-400">Muhammad Umar</p>
          </div>
        </div>
        <div>
          <label class="text-[10px] text-gray-400 block mb-1">Payment Screenshot *</label>
          <input type="file" id="payment-screenshot" accept="image/*" class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white">
        </div>
        <div>
          <label class="text-[10px] text-gray-400 block mb-1">Transaction ID / Last 4 digits</label>
          <input type="text" id="payment-txn" class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white" placeholder="e.g. 1234">
        </div>
        <button onclick="window.__submitDiamondOrder()" class="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xs rounded-xl">
          ✅ Submit Order for Approval
        </button>
      </div>
    `;
    
    openModal('buyDiamondsModal');
    renderPackages();
  };

  const DIAMOND_PACKAGES = [
    { diamonds: 100, pkr: 250 },
    { diamonds: 500, pkr: 1000, bonus: 50 },
    { diamonds: 1000, pkr: 1800, bonus: 150 },
    { diamonds: 2500, pkr: 4000, bonus: 500 },
    { diamonds: 5000, pkr: 7500, bonus: 1200 },
    { diamonds: 10000, pkr: 14000, bonus: 3000 }
  ];

  let selectedPkg = null;

  function renderPackages() {
    const grid = document.getElementById('diamond-packages');
    if (!grid) return;
    grid.innerHTML = '';
    DIAMOND_PACKAGES.forEach((p, i) => {
      const btn = document.createElement('button');
      btn.className = 'p-3 bg-gray-800 border-2 border-amber-500/40 rounded-xl flex flex-col items-center hover:border-amber-400';
      btn.dataset.idx = i;
      btn.onclick = () => {
        selectedPkg = p;
        document.querySelectorAll('#diamond-packages > button').forEach(b => b.classList.remove('border-amber-400', 'bg-amber-900/20'));
        btn.classList.add('border-amber-400', 'bg-amber-900/20');
        document.getElementById('payment-instructions').classList.remove('hidden');
      };
      btn.innerHTML = `
        <span class="text-2xl">💎</span>
        <span class="text-sm font-bold text-amber-400 mt-1">${p.diamonds.toLocaleString()}</span>
        ${p.bonus ? `<span class="text-[9px] text-green-400">+${p.bonus} Bonus</span>` : ''}
        <span class="text-[11px] font-bold text-white mt-1">Rs ${p.pkr}</span>
      `;
      grid.appendChild(btn);
    });
  }

  window.__submitDiamondOrder = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    if (!selectedPkg) { toast('Package select karein'); return; }
    const screenshot = document.getElementById('payment-screenshot');
    const txn = document.getElementById('payment-txn').value.trim();
    
    if (!screenshot.files || !screenshot.files[0]) {
      toast('Payment screenshot upload karein');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await firebase.firestore().collection('payments').add({
          user: user,
          amountPkr: selectedPkg.pkr,
          diamonds: selectedPkg.diamonds + (selectedPkg.bonus || 0),
          screenshot: e.target.result,
          txn: txn,
          status: 'pending',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await firebase.firestore().collection('notifications').add({
          userId: user,
          title: '💎 Order Submitted',
          body: `${selectedPkg.diamonds + (selectedPkg.bonus || 0)} diamonds ka order submitted. Admin 5 min mein approve karega.`,
          type: 'general',
          read: false,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        toast('✅ Order submitted! Approval ka wait karein.');
        closeModal('buyDiamondsModal');
      } catch(err) {
        toast('❌ ' + err.message);
      }
    };
    reader.readAsDataURL(screenshot.files[0]);
  };

  // ═══════════════════════════════════════════════════════════════
  // WITHDRAWAL - 10 minute cancel window
  // ═══════════════════════════════════════════════════════════════
  window.processWithdrawalSubmit = async function() {
    const user = getUser();
    if (!user) return;
    
    const method = document.getElementById('withdraw-method').value;
    const currency = document.getElementById('withdraw-currency').value;
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const account = document.getElementById('withdraw-account').value.trim();
    const password = document.getElementById('withdraw-password').value.trim();
    
    if (!amount || !account || !password) { toast('Sab fields bharein'); return; }
    
    let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const u = users[user] || {};
    if (u.password !== password) { toast('Galat password'); return; }
    
    const currentUsd = u.balanceUsd || 0;
    const reqUsd = currency === 'PKR' ? (amount / 278) : amount;
    if (reqUsd > currentUsd) { toast('Balance kam hai'); return; }
    
    // Deduct
    users[user].balanceUsd = currentUsd - reqUsd;
    localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
    
    const withdrawId = 'wd_' + Date.now();
    const createdAt = new Date();
    const cancelUntil = new Date(createdAt.getTime() + 10 * 60 * 1000); // 10 minutes
    
    try {
      await firebase.firestore().collection('withdrawals').doc(withdrawId).set({
        id: withdrawId,
        user: user,
        method: method,
        currency: currency,
        amount: amount,
        account: account,
        status: 'Pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        cancelUntil: firebase.firestore.Timestamp.fromDate(cancelUntil)
      });
      
      await firebase.firestore().collection('users').doc(user).set({
        balanceUsd: users[user].balanceUsd
      }, { merge: true });
      
      if (typeof window.updateWalletUI === 'function') window.updateWalletUI();
      
      // Show cancel popup
      showCancelWindow(withdrawId, amount, currency);
      
    } catch(e) {
      // Refund on error
      users[user].balanceUsd = currentUsd;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
      toast('❌ Error: ' + e.message);
    }
  };

  function showCancelWindow(withdrawId, amount, currency) {
    if (document.getElementById('withdrawCancelModal')) {
      document.getElementById('withdrawCancelModal').remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', `
      <div id="withdrawCancelModal" class="fullscreen-modal p-4 justify-center items-center bg-black/90 z-[95] flex">
        <div class="w-full max-w-sm bg-gray-900 border-2 border-amber-500/50 rounded-2xl p-6 text-center space-y-4">
          <div class="text-5xl">⏳</div>
          <h2 class="text-base font-bold text-amber-400">Withdrawal Submitted!</h2>
          <p class="text-xs text-gray-300">Aapke ${currency} ${amount} ka withdrawal request submit ho gaya.</p>
          <div class="bg-amber-900/20 border border-amber-500/40 rounded-xl p-3">
            <p class="text-[10px] text-amber-300">Auto-process mein:</p>
            <p class="text-3xl font-extrabold text-amber-400 mt-1" id="withdraw-countdown">10:00</p>
            <p class="text-[10px] text-gray-400 mt-1">Is dauran cancel kar sakte hain</p>
          </div>
          <div class="flex gap-2">
            <button onclick="window.__cancelWithdrawal('${withdrawId}')" class="flex-1 py-3 bg-red-600 text-white font-bold text-xs rounded-xl">
              <i class="fa-solid fa-xmark"></i> Cancel
            </button>
            <button onclick="document.getElementById('withdrawCancelModal').remove(); clearInterval(window.__wdTimer);" class="flex-1 py-3 bg-gray-800 border border-gray-700 text-gray-300 font-bold text-xs rounded-xl">
              OK
            </button>
          </div>
        </div>
      </div>
    `);
    
    let seconds = 600;
    window.__wdTimer = setInterval(() => {
      seconds--;
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      const el = document.getElementById('withdraw-countdown');
      if (el) el.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
      if (seconds <= 0) {
        clearInterval(window.__wdTimer);
        if (document.getElementById('withdrawCancelModal')) {
          document.getElementById('withdrawCancelModal').remove();
        }
        toast('✅ Withdrawal process ho gaya!');
      }
    }, 1000);
    
    toast(`⏳ ${currency} ${amount} withdrawal submitted. 10 min mein cancel kar sakte hain.`);
  }

  window.__cancelWithdrawal = async function(withdrawId) {
    try {
      const doc = await firebase.firestore().collection('withdrawals').doc(withdrawId).get();
      if (!doc.exists) return;
      const data = doc.data();
      
      // Refund
      const user = data.user;
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const refundUsd = data.currency === 'PKR' ? (data.amount / 278) : data.amount;
      if (users[user]) {
        users[user].balanceUsd = (users[user].balanceUsd || 0) + refundUsd;
        localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
        await firebase.firestore().collection('users').doc(user).set({
          balanceUsd: users[user].balanceUsd
        }, { merge: true });
      }
      
      await firebase.firestore().collection('withdrawals').doc(withdrawId).update({
        status: 'Cancelled',
        cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      if (window.__wdTimer) clearInterval(window.__wdTimer);
      const modal = document.getElementById('withdrawCancelModal');
      if (modal) modal.remove();
      
      if (typeof window.updateWalletUI === 'function') window.updateWalletUI();
      toast('✅ Withdrawal cancelled + balance refunded');
    } catch(e) {
      toast('❌ ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // KYC - Card validation + WhatsApp alert
  // ═══════════════════════════════════════════════════════════════
  window.submitKyc = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    
    const fullName = document.getElementById('kyc-fullname').value.trim();
    const cnic = document.getElementById('kyc-cnic').value.trim();
    const dob = document.getElementById('kyc-dob').value;
    
    // CNIC validation (13 digits)
    const cnicClean = cnic.replace(/[^0-9]/g, '');
    if (cnicClean.length !== 13) {
      toast('❌ CNIC 13 digits ka hona chahiye');
      return;
    }
    
    if (!fullName || !kycFrontImage || !kycBackImage || !kycSelfieImage) {
      toast('Sab fields aur 3 images zaroori');
      return;
    }
    
    try {
      await firebase.firestore().collection('kyc').doc(user).set({
        user: user,
        fullName: fullName,
        cnic: cnicClean,
        dob: dob,
        front: kycFrontImage,
        back: kycBackImage,
        selfie: kycSelfieImage,
        status: 'Pending',
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // WhatsApp alert to admin (using WhatsApp link)
      const waText = encodeURIComponent(
        `🔔 New KYC Submitted\n\n` +
        `User: @${user}\n` +
        `Name: ${fullName}\n` +
        `CNIC: ${cnicClean}\n` +
        `DOB: ${dob}\n\n` +
        `Verify: ${window.location.origin}/verify-kyc.html?user=${user}`
      );
      
      // Save WhatsApp link
      localStorage.setItem('last_kyc_whatsapp', `https://wa.me/923052163026?text=${waText}`);
      
      toast('✅ KYC submitted! Verification 24 ghante mein.');
      
      // Show verification link
      setTimeout(() => {
        if (confirm('KYC submitted! Kya aap WhatsApp pe admin ko bhejna chahte hain?')) {
          window.open(localStorage.getItem('last_kyc_whatsapp'), '_blank');
        }
      }, 1000);
      
      closeModal('kycModal');
    } catch(e) {
      toast('❌ ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // REFERRAL - 40% commission on diamond purchases
  // ═══════════════════════════════════════════════════════════════
  window.initReferralSystem = function() {
    const user = getUser();
    if (!user) return;
    
    // Check if user came via referral
    const params = new URLSearchParams(window.location.search);
    const refBy = params.get('ref');
    if (refBy && refBy !== user) {
      const key = 'ref_joined_' + user;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, refBy);
        localStorage.setItem('ref_' + user, refBy);
        
        // Save to Firebase
        firebase.firestore().collection('users').doc(user).set({
          referredBy: refBy
        }, { merge: true });
        
        toast('🎉 Referred by @' + refBy);
      }
    }
    
    // Load referral link
    const refLink = `${window.location.origin}${window.location.pathname}?ref=${user}`;
    const el = document.getElementById('referral-link');
    if (el) el.innerText = refLink;
  };

  // Called when a user buys diamonds - 40% to referrer
  window.__applyReferralCommission = async function(buyerUser, diamondsPurchased) {
    const referrer = localStorage.getItem('ref_' + buyerUser);
    if (!referrer) return;
    
    // 40% commission
    const commission = Math.floor(diamondsPurchased * 0.4);
    if (commission <= 0) return;
    
    try {
      // Give commission to referrer
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (users[referrer]) {
        users[referrer].diamonds = (users[referrer].diamonds || 0) + commission;
        localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
        
        await firebase.firestore().collection('users').doc(referrer).set({
          diamonds: users[referrer].diamonds
        }, { merge: true });
      }
      
      // Log commission
      await firebase.firestore().collection('referral_commissions').add({
        referrer: referrer,
        buyer: buyerUser,
        diamonds: commission,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Notify referrer
      await firebase.firestore().collection('notifications').add({
        userId: referrer,
        title: '💰 Referral Commission!',
        body: `@${buyerUser} ne ${diamondsPurchased} 💎 khareede. Aapko ${commission} 💎 mile!`,
        type: 'reward',
        read: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) { console.log(e); }
  };

  // ═══════════════════════════════════════════════════════════════
  // RECEIVED GIFTS on Profile (70% to user)
  // ═══════════════════════════════════════════════════════════════
  window.showReceivedGifts = async function() {
    const user = getUser();
    if (!user) return;
    
    if (!document.getElementById('receivedGiftsModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="receivedGiftsModal" class="fullscreen-modal hidden p-4 z-[85]">
          <div class="flex justify-between items-center border-b border-amber-500/40 pb-3 mb-3">
            <h2 class="text-base font-bold text-amber-400"><i class="fa-solid fa-gift"></i> Received Gifts</h2>
            <button onclick="closeModal('receivedGiftsModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="received-gifts-list" class="space-y-2"></div>
        </div>
      `);
    }
    openModal('receivedGiftsModal');
    
    try {
      const snap = await firebase.firestore().collection('gifts')
        .where('receiver', '==', user).limit(50).get();
      
      const list = document.getElementById('received-gifts-list');
      list.innerHTML = '';
      
      if (snap.empty) {
        list.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">No gifts received yet</p>';
        return;
      }
      
      const gifts = [];
      snap.forEach(d => gifts.push({ id: d.id, ...d.data() }));
      gifts.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
      
      let totalEarned = 0;
      gifts.forEach(g => {
        const pkrValue = g.pkrValue || 0;
        const userShare = Math.floor(pkrValue * 0.7); // 70% to user
        totalEarned += userShare;
        
        const div = document.createElement('div');
        div.className = 'bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3';
        div.innerHTML = `
          <div class="text-3xl">${g.emoji || '🎁'}</div>
          <div class="flex-1">
            <p class="text-xs font-bold text-white">${g.gift || 'Gift'}</p>
            <p class="text-[10px] text-gray-400">From: @${g.sender}</p>
            <p class="text-[10px] text-green-400 font-bold">You earned: Rs ${userShare}</p>
          </div>
          <p class="text-[9px] text-gray-500">${g.timestamp ? new Date(g.timestamp.toMillis()).toLocaleDateString() : ''}</p>
        `;
        list.appendChild(div);
      });
      
      // Summary at top
      list.insertAdjacentHTML('afterbegin', `
        <div class="bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border border-amber-500/40 rounded-xl p-3 mb-3">
          <p class="text-[10px] text-amber-300 uppercase font-bold">Total Earned (70% share)</p>
          <p class="text-2xl font-extrabold text-amber-400">Rs ${totalEarned.toLocaleString()}</p>
          <p class="text-[9px] text-gray-400">Withdrawal ke liye KYC zaroori</p>
        </div>
      `);
    } catch(e) {
      toast('Error: ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // ADD RECEIVED GIFTS BUTTON TO PROFILE
  // ═══════════════════════════════════════════════════════════════
  function addReceivedGiftsButton() {
    const profileSection = document.getElementById('tab-profile');
    if (!profileSection || document.getElementById('received-gifts-btn')) return;
    
    const btnContainer = profileSection.querySelector('.flex.items-center.gap-2');
    if (!btnContainer) return;
    
    const btn = document.createElement('button');
    btn.id = 'received-gifts-btn';
    btn.onclick = window.showReceivedGifts;
    btn.className = 'px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-1';
    btn.innerHTML = '<i class="fa-solid fa-gift"></i> My Gifts';
    btnContainer.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO-INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    setInterval(() => {
      addReceivedGiftsButton();
    }, 2000);
    
    window.initReferralSystem();
    
    console.log('✅ payments.js loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
