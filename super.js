/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - SUPER.JS (Card + IBAN Payment System)
   Add: <script src="super.js" defer></script>
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
  // ⚙️ CONFIG — YAHAN APNI DETAILS LAGAYEIN
  // ═══════════════════════════════════════════════════════════════
  const PAY_CONFIG = {
    // Card payment (Stripe/PayPal integration point)
    // Jab Stripe approve ho jaye, yahan payment link daalein
    stripePaymentLink: '', // e.g. 'https://buy.stripe.com/xxxxx'
    stripeEnabled: false,  // jab approve ho jaye toh true karein

    // ═══ YOUR BANK/IBAN DETAILS ═══
    bank: {
      bankName: 'SadaPay',
      accountTitle: 'Muhammad Umar',
      iban: 'PK94SADA0000003013816558',
      accountNumber: '5590490292264221',
      swiftCode: 'SADA' // SadaPay ka code (agar chahiye)
    },

    // Mobile wallets
    wallets: {
      easypaisa: { number: '+92 305 2163026', name: 'Muhammad Umar' },
      jazzcash: { number: '+92 305 2163026', name: 'Muhammad Umar' }
    },

    // Admin WhatsApp
    whatsappAdmin1: '923089775764',
    whatsappAdmin2: '923423373749'
  };

  window.__PAY_CONFIG = PAY_CONFIG;

  // ═══════════════════════════════════════════════════════════════
  // DIAMOND PACKAGES
  // ═══════════════════════════════════════════════════════════════
  const PACKAGES = [
    { id: 'p1', diamonds: 1, pkr: 1400 },
    { id: 'p2', diamonds: 5, pkr: 7000, bonus: 1 },
    { id: 'p3', diamonds: 10, pkr: 14000, bonus: 3 },
    { id: 'p4', diamonds: 25, pkr: 35000, bonus: 10 },
    { id: 'p5', diamonds: 50, pkr: 70000, bonus: 25 },
    { id: 'p6', diamonds: 100, pkr: 140000, bonus: 60 }
  ];
  let selectedPkg = null;
  let selectedMethod = 'card';

  // ═══════════════════════════════════════════════════════════════
  // OPEN BUY MODAL
  // ═══════════════════════════════════════════════════════════════
  window.openBuyDiamondsModal = function() {
    if (!document.getElementById('buyDiamondsModal')) {
      document.body.insertAdjacentHTML('beforeend', `<div id="buyDiamondsModal" class="fullscreen-modal hidden overflow-y-auto no-scrollbar z-[85]"></div>`);
    }
    selectedPkg = null;
    selectedMethod = 'card';
    const modal = document.getElementById('buyDiamondsModal');

    modal.innerHTML = `
      <div class="p-4 space-y-4 pb-32">
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-amber-500/40 pb-3 sticky top-0 bg-gray-950 z-10">
          <h2 class="text-base font-bold text-amber-400"><i class="fa-solid fa-gem"></i> Buy Diamonds</h2>
          <button onclick="closeModal('buyDiamondsModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <!-- Info -->
        <div class="bg-amber-900/20 border border-amber-500/40 rounded-xl p-3 space-y-1">
          <p class="text-[11px] text-amber-300 font-bold">💎 1 Diamond = $5 (≈ Rs 1400)</p>
          <p class="text-[10px] text-gray-300">Card se payment karein ya IBAN transfer</p>
        </div>

        <!-- Step 1: Packages -->
        <div>
          <p class="text-[10px] text-cyan-400 uppercase font-bold mb-2">Step 1: Package Select</p>
          <div id="pkgs-grid" class="grid grid-cols-2 gap-3"></div>
        </div>

        <!-- Step 2: Payment Method -->
        <div id="method-section" class="hidden">
          <p class="text-[10px] text-cyan-400 uppercase font-bold mb-2">Step 2: Payment Method</p>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="window.__selectMethod('card')" id="m-card" class="p-3 bg-gray-800 border-2 border-cyan-500 rounded-xl flex flex-col items-center">
              <i class="fa-solid fa-credit-card text-cyan-400 text-xl"></i>
              <span class="text-[10px] font-bold text-white mt-1">Card</span>
            </button>
            <button onclick="window.__selectMethod('iban')" id="m-iban" class="p-3 bg-gray-800 border-2 border-gray-700 rounded-xl flex flex-col items-center">
              <i class="fa-solid fa-building-columns text-cyan-400 text-xl"></i>
              <span class="text-[10px] font-bold text-white mt-1">IBAN</span>
            </button>
            <button onclick="window.__selectMethod('wallet')" id="m-wallet" class="p-3 bg-gray-800 border-2 border-gray-700 rounded-xl flex flex-col items-center">
              <i class="fa-solid fa-wallet text-cyan-400 text-xl"></i>
              <span class="text-[10px] font-bold text-white mt-1">Wallet</span>
            </button>
          </div>
        </div>

        <!-- Step 3: Payment Details -->
        <div id="payment-details" class="hidden"></div>

        <!-- Verify Button -->
        <button id="verify-btn" onclick="window.__submitPayment()" class="hidden w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg">
          <i class="fa-solid fa-check-circle"></i> Submit Payment Proof
        </button>

        <!-- Footer info -->
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-3">
          <p class="text-[10px] text-gray-400 leading-relaxed">
            🔒 <b class="text-gray-300">Secure:</b> Aapka payment data encrypted hai.
            Payment ke baad admin manually verify karega (5-10 min).
          </p>
        </div>
      </div>
    `;

    if (typeof openModal === 'function') openModal('buyDiamondsModal');
    renderPkgs();
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER PACKAGES
  // ═══════════════════════════════════════════════════════════════
  function renderPkgs() {
    const grid = document.getElementById('pkgs-grid');
    if (!grid) return;
    grid.innerHTML = '';
    PACKAGES.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'p-3 bg-gray-800 border-2 border-amber-500/40 rounded-xl flex flex-col items-center';
      btn.onclick = () => {
        selectedPkg = p;
        document.querySelectorAll('#pkgs-grid > button').forEach(b => {
          b.classList.remove('border-amber-400', 'bg-amber-900/20');
        });
        btn.classList.add('border-amber-400', 'bg-amber-900/20');
        document.getElementById('method-section').classList.remove('hidden');
        document.getElementById('method-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      btn.innerHTML = `
        <span class="text-3xl">💎</span>
        <span class="text-base font-bold text-amber-400 mt-1">${p.diamonds}</span>
        ${p.bonus ? `<span class="text-[10px] text-green-400">+${p.bonus} bonus</span>` : ''}
        <span class="text-xs font-bold text-white mt-1">Rs ${p.pkr.toLocaleString()}</span>
      `;
      grid.appendChild(btn);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SELECT METHOD
  // ═══════════════════════════════════════════════════════════════
  window.__selectMethod = function(method) {
    selectedMethod = method;
    ['card', 'iban', 'wallet'].forEach(m => {
      const btn = document.getElementById('m-' + m);
      if (btn) {
        btn.className = m === method
          ? 'p-3 bg-gray-800 border-2 border-cyan-500 rounded-xl flex flex-col items-center'
          : 'p-3 bg-gray-800 border-2 border-gray-700 rounded-xl flex flex-col items-center';
      }
    });
    renderPaymentDetails(method);
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER PAYMENT DETAILS
  // ═══════════════════════════════════════════════════════════════
  function renderPaymentDetails(method) {
    const el = document.getElementById('payment-details');
    if (!el) return;
    el.classList.remove('hidden');

    if (method === 'card') {
      el.innerHTML = renderCardForm();
    } else if (method === 'iban') {
      el.innerHTML = renderIbanDetails();
    } else if (method === 'wallet') {
      el.innerHTML = renderWalletDetails();
    }

    document.getElementById('verify-btn').classList.remove('hidden');
  }

  // ═══════════════════════════════════════════════════════════════
  // CARD FORM
  // ═══════════════════════════════════════════════════════════════
  function renderCardForm() {
    if (PAY_CONFIG.stripeEnabled && PAY_CONFIG.stripePaymentLink) {
      // Real Stripe card payment
      return `
        <p class="text-[10px] text-cyan-400 uppercase font-bold mb-2">Step 3: Card Payment</p>
        <div class="bg-cyan-900/20 border border-cyan-500/40 rounded-xl p-4 space-y-3">
          <div class="text-center">
            <div class="flex justify-center gap-2 mb-3">
              <i class="fa-brands fa-cc-visa text-2xl text-blue-500"></i>
              <i class="fa-brands fa-cc-mastercard text-2xl text-red-500"></i>
              <i class="fa-brands fa-cc-amex text-2xl text-blue-400"></i>
            </div>
            <p class="text-xs text-white font-bold mb-1">Secure Card Payment</p>
            <p class="text-[10px] text-gray-400 mb-3">Visa, Mastercard, Amex accepted</p>
          </div>
          <button onclick="window.__openStripeCheckout()" class="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs rounded-xl">
            <i class="fa-solid fa-lock"></i> Pay Rs ${selectedPkg?.pkr.toLocaleString() || '0'} Securely
          </button>
          <div class="flex items-center justify-center gap-1 text-[9px] text-green-400">
            <i class="fa-solid fa-shield-halved"></i> 256-bit SSL Encrypted
          </div>
        </div>
      `;
    }

    // Manual card payment (until Stripe approved)
    return `
      <p class="text-[10px] text-cyan-400 uppercase font-bold mb-2">Step 3: Card Payment</p>
      <div class="bg-amber-900/20 border border-amber-500/40 rounded-xl p-4 space-y-3">
        <div class="flex justify-center gap-2 mb-2">
          <i class="fa-brands fa-cc-visa text-2xl text-blue-500"></i>
          <i class="fa-brands fa-cc-mastercard text-2xl text-red-500"></i>
          <i class="fa-brands fa-cc-amex text-2xl text-blue-400"></i>
        </div>
        <div class="bg-amber-950/40 border border-amber-500/40 rounded-lg p-3">
          <p class="text-[11px] text-amber-300 font-bold mb-2">⚠️ Card Payment Coming Soon</p>
          <p class="text-[10px] text-gray-300 mb-3">
            Secure card payment abhi process mein hai (Stripe/PayPal approval).
            Is dauran IBAN ya Wallet se payment karein.
          </p>
          <button onclick="window.__selectMethod('iban')" class="w-full py-2 bg-cyan-600 text-white text-xs font-bold rounded-lg">
            Switch to IBAN →
          </button>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════
  // IBAN DETAILS
  // ═══════════════════════════════════════════════════════════════
  function renderIbanDetails() {
    const b = PAY_CONFIG.bank;
    return `
      <p class="text-[10px] text-cyan-400 uppercase font-bold mb-2">Step 3: IBAN Transfer</p>
      <div class="bg-cyan-900/20 border border-cyan-500/40 rounded-xl p-4 space-y-3">
        <div class="bg-gray-900 rounded-lg p-3 space-y-2">
          <div>
            <p class="text-[9px] text-gray-500 uppercase">Bank Name</p>
            <p class="text-xs font-bold text-white">${b.bankName}</p>
          </div>
          <div>
            <p class="text-[9px] text-gray-500 uppercase">Account Title</p>
            <p class="text-xs font-bold text-white">${b.accountTitle}</p>
          </div>
          <div>
            <p class="text-[9px] text-gray-500 uppercase">IBAN</p>
            <div class="flex items-center justify-between gap-2">
              <p class="text-[11px] font-mono font-bold text-cyan-400 break-all">${b.iban}</p>
              <button onclick="window.__copyText('${b.iban}')" class="p-1.5 bg-cyan-900/50 rounded text-cyan-400">
                <i class="fa-solid fa-copy text-xs"></i>
              </button>
            </div>
          </div>
          <div>
            <p class="text-[9px] text-gray-500 uppercase">Account Number</p>
            <div class="flex items-center justify-between gap-2">
              <p class="text-xs font-mono font-bold text-white">${b.accountNumber}</p>
              <button onclick="window.__copyText('${b.accountNumber}')" class="p-1.5 bg-cyan-900/50 rounded text-cyan-400">
                <i class="fa-solid fa-copy text-xs"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="bg-amber-900/20 border border-amber-500/40 rounded-lg p-3">
          <p class="text-[10px] text-amber-300 leading-relaxed">
            <b>Steps:</b><br>
            1. Apni bank app kholein<br>
            2. IBAN transfer karein <b>Rs ${selectedPkg?.pkr.toLocaleString() || '0'}</b><br>
            3. Screenshot lein<br>
            4. Neeche upload karein
          </p>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════
  // WALLET DETAILS (Easypaisa/JazzCash)
  // ═══════════════════════════════════════════════════════════════
  function renderWalletDetails() {
    const w = PAY_CONFIG.wallets;
    return `
      <p class="text-[10px] text-cyan-400 uppercase font-bold mb-2">Step 3: Mobile Wallet</p>
      <div class="bg-cyan-900/20 border border-cyan-500/40 rounded-xl p-4 space-y-3">
        <div class="bg-gray-900 rounded-lg p-3 space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[9px] text-gray-500 uppercase">Easypaisa</p>
              <p class="text-xs font-bold text-white">${w.easypaisa.number}</p>
              <p class="text-[9px] text-gray-500">${w.easypaisa.name}</p>
            </div>
            <button onclick="window.__copyText('${w.easypaisa.number}')" class="p-1.5 bg-cyan-900/50 rounded text-cyan-400">
              <i class="fa-solid fa-copy text-xs"></i>
            </button>
          </div>
          <hr class="border-gray-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[9px] text-gray-500 uppercase">JazzCash</p>
              <p class="text-xs font-bold text-white">${w.jazzcash.number}</p>
              <p class="text-[9px] text-gray-500">${w.jazzcash.name}</p>
            </div>
            <button onclick="window.__copyText('${w.jazzcash.number}')" class="p-1.5 bg-cyan-900/50 rounded text-cyan-400">
              <i class="fa-solid fa-copy text-xs"></i>
            </button>
          </div>
        </div>

        <div class="bg-amber-900/20 border border-amber-500/40 rounded-lg p-3">
          <p class="text-[10px] text-amber-300 leading-relaxed">
            <b>Steps:</b><br>
            1. Easypaisa/JazzCash app kholein<br>
            2. Send Money → Upar wala number<br>
            3. Amount: <b>Rs ${selectedPkg?.pkr.toLocaleString() || '0'}</b><br>
            4. Screenshot lein aur neeche upload karein
          </p>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════
  // COPY TEXT HELPER
  // ═══════════════════════════════════════════════════════════════
  window.__copyText = function(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast('✅ Copied: ' + text);
    }).catch(() => {
      prompt('Copy karein:', text);
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // OPEN STRIPE CHECKOUT
  // ═══════════════════════════════════════════════════════════════
  window.__openStripeCheckout = function() {
    if (!PAY_CONFIG.stripeEnabled || !PAY_CONFIG.stripePaymentLink) {
      toast('Card payment abhi available nahi');
      return;
    }
    if (!selectedPkg) { toast('Package select karein'); return; }
    const url = PAY_CONFIG.stripePaymentLink + '?client_reference_id=' + getUser();
    window.open(url, '_blank');
    toast('💳 Card payment page khul raha hai...');
  };

  // ═══════════════════════════════════════════════════════════════
  // SUBMIT PAYMENT PROOF
  // ═══════════════════════════════════════════════════════════════
  window.__submitPayment = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    if (!selectedPkg) { toast('Package select karein'); return; }
    if (selectedMethod === 'card' && PAY_CONFIG.stripeEnabled) {
      toast('Card payment Stripe pe complete karein');
      return;
    }

    // Show upload + txn form
    const el = document.getElementById('payment-details');
    if (document.getElementById('upload-form')) return;

    el.insertAdjacentHTML('beforeend', `
      <div id="upload-form" class="mt-3 space-y-3">
        <div class="bg-gray-900 border border-cyan-500/40 rounded-xl p-3 space-y-3">
          <p class="text-[10px] text-cyan-400 uppercase font-bold">Upload Payment Proof</p>
          <input type="file" id="pay-ss" accept="image/*" class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white">
          <input type="text" id="pay-txn" class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white" placeholder="Transaction ID (optional)">
          <input type="text" id="pay-sender" class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white" placeholder="Sender name / number (optional)">
          <button onclick="window.__finalSubmit()" class="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xs rounded-xl">
            <i class="fa-brands fa-whatsapp"></i> Send to Admin WhatsApp
          </button>
        </div>
      </div>
    `);
    document.getElementById('upload-form').scrollIntoView({ behavior: 'smooth' });
  };

  // ═══════════════════════════════════════════════════════════════
  // FINAL SUBMIT — Save to Firebase + Send WhatsApp
  // ═══════════════════════════════════════════════════════════════
  window.__finalSubmit = async function() {
    const user = getUser();
    const scr = document.getElementById('pay-ss');
    const txn = (document.getElementById('pay-txn')?.value || '').trim();
    const sender = (document.getElementById('pay-sender')?.value || '').trim();

    if (!scr || !scr.files || !scr.files[0]) {
      toast('Payment screenshot upload karein'); return;
    }

    const totalDiamonds = selectedPkg.diamonds + (selectedPkg.bonus || 0);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Save to Firebase
        await firebase.firestore().collection('payments').add({
          user,
          method: selectedMethod,
          amountPkr: selectedPkg.pkr,
          diamonds: totalDiamonds,
          screenshot: e.target.result,
          txn,
          sender,
          status: 'pending',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Send WhatsApp
        const waText = encodeURIComponent(
          `🔔 NEW DIAMOND ORDER\n\n` +
          `👤 User: @${user}\n` +
          `💎 Package: ${selectedPkg.diamonds} (+${selectedPkg.bonus || 0} bonus)\n` +
          `💰 Amount: Rs ${selectedPkg.pkr.toLocaleString()}\n` +
          `💳 Method: ${selectedMethod.toUpperCase()}\n` +
          `📝 Txn ID: ${txn || 'N/A'}\n` +
          `📞 Sender: ${sender || 'N/A'}\n\n` +
          `Screenshot Firestore 'payments' collection mein hai.\n` +
          `Admin panel se approve karein.`
        );

        const admin = Math.random() < 0.5 ? PAY_CONFIG.whatsappAdmin1 : PAY_CONFIG.whatsappAdmin2;
        window.open(`https://wa.me/${admin}?text=${waText}`, '_blank');

        // Notification
        await firebase.firestore().collection('notifications').add({
          userId: user,
          title: '💎 Order Submitted',
          body: `${totalDiamonds} diamonds ka order submit. Admin 5-10 min mein approve karega.`,
          type: 'general',
          read: false,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        toast('✅ Order submitted!');
        setTimeout(() => {
          if (typeof closeModal === 'function') closeModal('buyDiamondsModal');
        }, 1000);
      } catch(err) {
        toast('❌ ' + err.message);
      }
    };
    reader.readAsDataURL(scr.files[0]);
  };

  // ═══════════════════════════════════════════════════════════════
  // WITHDRAWAL — IBAN/Card payout
  // ═══════════════════════════════════════════════════════════════
  window.processWithdrawalSubmit = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    const method = document.getElementById('withdraw-method')?.value;
    const currency = document.getElementById('withdraw-currency')?.value;
    const amount = parseFloat(document.getElementById('withdraw-amount')?.value);
    const account = document.getElementById('withdraw-account')?.value.trim();
    const password = document.getElementById('withdraw-password')?.value.trim();

    if (!amount || !account || !password) { toast('Sab fields bharein'); return; }

    // KYC check
    try {
      const kycDoc = await firebase.firestore().collection('kyc').doc(user).get();
      if (!kycDoc.exists || kycDoc.data().status !== 'Approved') {
        toast('❌ Pehle KYC verify karwayein');
        return;
      }
    } catch(e) { console.log(e); }

    let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const u = users[user] || {};
    if (u.password !== password) { toast('Galat password'); return; }

    const currentUsd = u.balanceUsd || 0;
    const reqUsd = currency === 'PKR' ? (amount / 278) : amount;
    if (reqUsd > currentUsd) { toast('Balance kam hai'); return; }

    users[user].balanceUsd = currentUsd - reqUsd;
    localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));

    const wdId = 'wd_' + Date.now();
    const cancelUntil = new Date(Date.now() + 10 * 60 * 1000);

    try {
      await firebase.firestore().collection('withdrawals').doc(wdId).set({
        id: wdId,
        user,
        method,
        currency,
        amount,
        account,
        status: 'Pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        cancelUntil: firebase.firestore.Timestamp.fromDate(cancelUntil)
      });

      await firebase.firestore().collection('users').doc(user).set({
        balanceUsd: users[user].balanceUsd
      }, { merge: true });

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
            <p class="text-[10px] text-amber-300">Cancel window:</p>
            <p class="text-3xl font-extrabold text-amber-400" id="wd-timer">10:00</p>
          </div>
          <div class="flex gap-2">
            <button onclick="window.__cancelWd('${id}')" class="flex-1 py-3 bg-red-600 text-white font-bold text-xs rounded-xl">Cancel</button>
            <button onclick="document.getElementById('cancelWdModal').remove(); clearInterval(window.__wdTimer);" class="flex-1 py-3 bg-gray-800 text-gray-300 font-bold text-xs rounded-xl">OK</button>
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

        // WhatsApp to admin for payout
        const admin = Math.random() < 0.5 ? PAY_CONFIG.whatsappAdmin1 : PAY_CONFIG.whatsappAdmin2;
        const waText = encodeURIComponent(
          `💸 WITHDRAWAL REQUEST\n\n` +
          `👤 User: @${getUser()}\n` +
          `💳 Method: ${method}\n` +
          `💰 Amount: ${currency} ${amount}\n` +
          `📞 Account: ${account}\n\n` +
          `Please send payment and approve.`
        );
        window.open(`https://wa.me/${admin}?text=${waText}`, '_blank');
        toast('✅ Withdrawal processing!');
      }
    }, 1000);
  }

  window.__cancelWd = async function(id) {
    try {
      const doc = await firebase.firestore().collection('withdrawals').doc(id).get();
      if (!doc.exists) return;
      const data = doc.data();
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const refundUsd = data.currency === 'PKR' ? (data.amount / 278) : data.amount;
      if (users[data.user]) {
        users[data.user].balanceUsd = (users[data.user].balanceUsd || 0) + refundUsd;
        localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
        await firebase.firestore().collection('users').doc(data.user).set({
          balanceUsd: users[data.user].balanceUsd
        }, { merge: true });
      }
      await firebase.firestore().collection('withdrawals').doc(id).update({
        status: 'Cancelled',
        cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      clearInterval(window.__wdTimer);
      document.getElementById('cancelWdModal')?.remove();
      if (typeof window.updateWalletUI === 'function') window.updateWalletUI();
      toast('✅ Cancelled + refunded');
    } catch(e) { toast('Error: ' + e.message); }
  };

  // ═══════════════════════════════════════════════════════════════
  // PAYMENT HISTORY (User)
  // ═══════════════════════════════════════════════════════════════
  window.openPaymentHistory = async function() {
    const user = getUser();
    if (!user) return;

    if (!document.getElementById('payHistoryModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="payHistoryModal" class="fullscreen-modal hidden p-4 z-[85] overflow-y-auto no-scrollbar">
          <div class="flex justify-between items-center border-b border-cyan-500/40 pb-3 mb-3 sticky top-0 bg-gray-950 z-10">
            <h2 class="text-base font-bold text-cyan-400"><i class="fa-solid fa-clock-rotate-left"></i> Payment History</h2>
            <button onclick="closeModal('payHistoryModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="pay-history-content" class="space-y-3"></div>
        </div>
      `);
    }
    if (typeof openModal === 'function') openModal('payHistoryModal');

    const c = document.getElementById('pay-history-content');
    c.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Loading...</p>';

    try {
      // Get payments
      const paySnap = await firebase.firestore().collection('payments')
        .where('user', '==', user).limit(50).get();

      // Get withdrawals
      const wdSnap = await firebase.firestore().collection('withdrawals')
        .where('user', '==', user).limit(50).get();

      const items = [];
      paySnap.forEach(d => {
        const data = d.data();
        items.push({
          type: 'deposit',
          amount: data.amountPkr,
          diamonds: data.diamonds,
          status: data.status,
          time: data.timestamp,
          method: data.method
        });
      });
      wdSnap.forEach(d => {
        const data = d.data();
        items.push({
          type: 'withdrawal',
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          time: data.createdAt,
          method: data.method
        });
      });

      items.sort((a, b) => {
        const ta = a.time ? a.time.toMillis() : 0;
        const tb = b.time ? b.time.toMillis() : 0;
        return tb - ta;
      });

      c.innerHTML = '';
      if (items.length === 0) {
        c.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">Koi transaction nahi</p>';
        return;
      }

      items.forEach(item => {
        const div = document.createElement('div');
        const color = item.status === 'approved' || item.status === 'Approved' ? 'green'
                    : item.status === 'rejected' || item.status === 'Rejected' ? 'red'
                    : 'amber';
        div.className = `bg-gray-900 border border-${color}-500/30 rounded-xl p-3 space-y-1`;
        div.innerHTML = `
          <div class="flex justify-between items-center">
            <p class="text-xs font-bold text-${color}-400">
              ${item.type === 'deposit' ? '⬇️ Deposit' : '⬆️ Withdrawal'}
            </p>
            <p class="text-[9px] text-gray-500">${item.time ? new Date(item.time.toMillis()).toLocaleString() : ''}</p>
          </div>
          <p class="text-sm font-bold text-white">
            ${item.type === 'deposit'
              ? `Rs ${item.amount?.toLocaleString()} → 💎 ${item.diamonds}`
              : `${item.currency} ${item.amount?.toLocaleString()}`}
          </p>
          <p class="text-[10px] text-gray-400">Method: ${item.method || 'N/A'}</p>
          <p class="text-[10px] font-bold text-${color}-400 uppercase">${item.status}</p>
        `;
        c.appendChild(div);
      });
    } catch(e) {
      c.innerHTML = '<p class="text-xs text-red-400">Error: ' + e.message + '</p>';
    }
  };

  // Add Payment History button in Settings
  function addPaymentHistoryBtn() {
    const settings = document.getElementById('settingsModal');
    if (!settings || document.getElementById('pay-history-btn')) return;
    const walletBox = settings.querySelector('.bg-gray-900');
    if (!walletBox) return;

    const btn = document.createElement('button');
    btn.id = 'pay-history-btn';
    btn.onclick = () => { closeModal('settingsModal'); window.openPaymentHistory(); };
    btn.className = 'w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 mt-2';
    btn.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> Payment History';
    walletBox.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    setInterval(addPaymentHistoryBtn, 2000);
    console.log('✅ super.js loaded - Card + IBAN payment system active');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.__SUPER__ = {
    PAY_CONFIG,
    PACKAGES,
    openPaymentHistory
  };
})();
