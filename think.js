/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - THINK.JS (All Fixes)
   Add: <script src="think.js" defer></script>
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
  function isPremium() {
    try {
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const u = users[getUser()] || {};
      return !!(u.isPremium || u.isVerified);
    } catch(e) { return false; }
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #1: CHANNEL POSTING (typing + send button)
  // ═══════════════════════════════════════════════════════════════
  function ensureChannelInput() {
    const footer = document.getElementById('channel-input-footer');
    if (!footer) return;
    if (document.getElementById('channel-message-input')) return;
    
    footer.innerHTML = `
      <div id="ch-photo-preview" class="hidden relative w-16 h-16 rounded-lg overflow-hidden border border-cyan-500 mb-2">
        <img id="ch-photo-img" class="w-full h-full object-cover">
        <button onclick="window.__clearChPhoto()" class="absolute top-0 right-0 bg-black/70 text-white text-[10px] px-1"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="flex gap-2 items-center">
        <input type="file" id="ch-file" accept="image/*" class="hidden" onchange="window.__previewChPhoto(this)">
        <button onclick="document.getElementById('ch-file').click()" class="p-2.5 bg-gray-800 text-cyan-400 rounded-xl border border-gray-700"><i class="fa-solid fa-image"></i></button>
        <input type="text" id="channel-message-input" 
               class="flex-1 bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white focus:outline-none" 
               placeholder="Broadcast likhein..."
               onkeypress="if(event.key==='Enter'){window.sendChannelPostSubmit()}">
        <button onclick="window.sendChannelPostSubmit()" class="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-xs font-bold text-white">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    `;
  }

  window.__previewChPhoto = function(input) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        window.__tempChPhoto = e.target.result;
        document.getElementById('ch-photo-img').src = e.target.result;
        document.getElementById('ch-photo-preview').classList.remove('hidden');
      };
      reader.readAsDataURL(input.files[0]);
    }
  };
  window.__clearChPhoto = function() {
    window.__tempChPhoto = null;
    document.getElementById('ch-photo-preview')?.classList.add('hidden');
  };

  window.sendChannelPostSubmit = async function() {
    if (!activeChannelId || !currentUser) { toast('Channel missing'); return; }
    const input = document.getElementById('channel-message-input');
    const text = (input?.value || '').trim();
    if (!text && !window.__tempChPhoto) { toast('Text ya photo zaroori'); return; }
    
    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[activeChannelId];
    if (!chan) { toast('Channel nahi mila'); return; }
    
    const newPost = {
      id: 'cpost_' + Date.now(),
      text: text,
      photo: window.__tempChPhoto || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: {},
      postedBy: getUser()
    };
    if (!chan.posts) chan.posts = [];
    chan.posts.push(newPost);
    localStorage.setItem('SUPER_APP_CHANNELS', JSON.stringify(channels));
    
    try {
      await firebase.firestore().collection('channels').doc(activeChannelId).update({ posts: chan.posts });
    } catch(e) { console.log(e); }
    
    if (input) input.value = '';
    window.__clearChPhoto();
    if (typeof window.renderChannelPosts === 'function') window.renderChannelPosts(activeChannelId);
    toast('✅ Post published!');
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #2: BUY DIAMONDS MODAL (scroll + hidden payment info)
  // ═══════════════════════════════════════════════════════════════
  const SECURE_PAYMENT = {
    easypaisa: '+92 305 2163026',
    jazzcash: '+92 305 2163026',
    sadapay: '5590490292264221',
    iban: 'PK94SADA0000003013816558',
    name: 'Muhammad Umar'
  };

  window.openBuyDiamondsModal = function() {
    if (!document.getElementById('buyDiamondsModal')) {
      document.body.insertAdjacentHTML('beforeend', `<div id="buyDiamondsModal" class="fullscreen-modal hidden overflow-y-auto no-scrollbar z-[85]"></div>`);
    }
    const modal = document.getElementById('buyDiamondsModal');
    modal.innerHTML = `
      <div class="p-4 space-y-4 pb-24">
        <div class="flex justify-between items-center border-b border-amber-500/40 pb-3 sticky top-0 bg-gray-950 z-10">
          <h2 class="text-base font-bold text-amber-400"><i class="fa-solid fa-gem"></i> Buy Diamonds</h2>
          <button onclick="closeModal('buyDiamondsModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="bg-amber-900/20 border border-amber-500/40 rounded-xl p-3 space-y-1">
          <p class="text-[11px] text-amber-300 font-bold">💎 1 Diamond = $5 (≈ Rs 1400)</p>
          <p class="text-[10px] text-gray-300">Step 1: Package select</p>
          <p class="text-[10px] text-gray-300">Step 2: Admin ko bhejein screenshot</p>
          <p class="text-[10px] text-gray-300">Step 3: Admin 5-10 min mein add karega</p>
        </div>

        <div id="pkgs-grid" class="grid grid-cols-2 gap-3"></div>

        <div id="pay-hidden" class="hidden bg-cyan-900/20 border border-cyan-500/40 rounded-xl p-4 space-y-3">
          <h3 class="text-xs font-bold text-cyan-400">🔒 Secure Payment</h3>
          <p class="text-[10px] text-gray-400">Payment details aapko WhatsApp pe milengi. Screenshot bhejein aur admin process karega.</p>
          <button onclick="window.__sendOrderToAdmin()" class="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xs rounded-xl">
            <i class="fa-brands fa-whatsapp"></i> Send Order via WhatsApp
          </button>
          <input type="file" id="pay-ss" accept="image/*" class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white">
          <input type="text" id="pay-txn" class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white" placeholder="Transaction ID (optional)">
        </div>

        <button id="pay-scroll-btn" class="hidden w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs rounded-xl">
          Continue to Payment →
        </button>
      </div>
    `;
    if (typeof openModal === 'function') openModal('buyDiamondsModal');
    renderPkgs();
    
    // Auto scroll button
    setTimeout(() => {
      const btn = document.getElementById('pay-scroll-btn');
      if (btn) {
        btn.onclick = () => {
          document.getElementById('pay-hidden').classList.remove('hidden');
          btn.classList.add('hidden');
          modal.scrollTop = modal.scrollHeight;
        };
      }
    }, 100);
  };

  const PKGS = [
    { diamonds: 1,   pkr: 1400 },
    { diamonds: 5,   pkr: 7000,   bonus: 1 },
    { diamonds: 10,  pkr: 14000,  bonus: 3 },
    { diamonds: 25,  pkr: 35000,  bonus: 10 },
    { diamonds: 50,  pkr: 70000,  bonus: 25 },
    { diamonds: 100, pkr: 140000, bonus: 60 }
  ];
  let selectedPkg = null;

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
        document.getElementById('pay-scroll-btn').classList.remove('hidden');
        document.getElementById('pay-scroll-btn').scrollIntoView({ behavior: 'smooth' });
      };
      btn.innerHTML = `
        <span class="text-2xl">💎</span>
        <span class="text-sm font-bold text-amber-400">${p.diamonds}</span>
        ${p.bonus ? `<span class="text-[9px] text-green-400">+${p.bonus}</span>` : ''}
        <span class="text-[11px] font-bold text-white">Rs ${p.pkr.toLocaleString()}</span>
      `;
      grid.appendChild(btn);
    });
  }

  window.__sendOrderToAdmin = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    if (!selectedPkg) { toast('Package select karein'); return; }
    const scr = document.getElementById('pay-ss');
    const txn = (document.getElementById('pay-txn')?.value || '').trim();
    if (!scr.files || !scr.files[0]) { toast('Screenshot upload karein'); return; }
    
    const totalDiamonds = selectedPkg.diamonds + (selectedPkg.bonus || 0);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await firebase.firestore().collection('payments').add({
          user, amountPkr: selectedPkg.pkr, diamonds: totalDiamonds,
          screenshot: e.target.result, txn, status: 'pending',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const waText = encodeURIComponent(
          `🔔 NEW ORDER\n\nUser: @${user}\nPackage: ${selectedPkg.diamonds}💎 (+${selectedPkg.bonus || 0} bonus)\nAmount: Rs ${selectedPkg.pkr}\nTxn ID: ${txn || 'N/A'}\n\nPayment karke screenshot bhejein.`
        );
        const admin = Math.random() < 0.5 ? '923089775764' : '923423373749';
        window.open(`https://wa.me/${admin}?text=${waText}`, '_blank');
        
        toast('✅ Order submitted!');
        if (typeof closeModal === 'function') closeModal('buyDiamondsModal');
      } catch(err) { toast('❌ ' + err.message); }
    };
    reader.readAsDataURL(scr.files[0]);
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #3: KYC — Send to Admin WhatsApp (2 numbers)
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
    
    if (cnicClean.length !== 13) { toast('❌ CNIC 13 digits'); return; }
    if (!fullName || !kycImgs.front || !kycImgs.back || !kycImgs.selfie) {
      toast('Sab fields + 3 photos zaroori'); return;
    }
    
    try {
      await firebase.firestore().collection('kyc').doc(user).set({
        user, fullName, cnic: cnicClean, dob,
        front: kycImgs.front, back: kycImgs.back, selfie: kycImgs.selfie,
        status: 'Pending',
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      const base = `${window.location.origin}${window.location.pathname}`;
      const verifyLink = `${base}?verify=${user}&code=${Math.random().toString(36).substr(2, 8)}`;
      const rejectLink = `${base}?reject=${user}&code=${Math.random().toString(36).substr(2, 8)}`;
      
      const waText = encodeURIComponent(
        `🔔 KYC SUBMISSION\n\n` +
        `User: @${user}\n` +
        `Name: ${fullName}\n` +
        `CNIC: ${cnicClean}\n` +
        `DOB: ${dob}\n\n` +
        `✅ APPROVE: ${verifyLink}\n\n` +
        `❌ REJECT: ${rejectLink}`
      );
      
      toast('✅ KYC submitted!');
      setTimeout(() => {
        if (confirm('WhatsApp pe admin ko bhejein?')) {
          const admin = Math.random() < 0.5 ? '923089775764' : '923423373749';
          window.open(`https://wa.me/${admin}?text=${waText}`, '_blank');
        }
      }, 800);
      if (typeof closeModal === 'function') closeModal('kycModal');
    } catch(e) { toast('❌ ' + e.message); }
  };

  // KYC verify/reject via URL
  async function handleKycVerify() {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('verify');
    const r = params.get('reject');
    if (v) {
      if (confirm(`Approve KYC for @${v}?`)) {
        try {
          await firebase.firestore().collection('kyc').doc(v).update({
            status: 'Approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          await firebase.firestore().collection('notifications').add({
            userId: v, title: '✅ KYC Verified!',
            body: 'Your KYC has been verified. You can now withdraw.',
            type: 'general', read: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          alert('✅ Approved for @' + v);
        } catch(e) { alert('Error: ' + e.message); }
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (r) {
      if (confirm(`Reject KYC for @${r}?`)) {
        try {
          await firebase.firestore().collection('kyc').doc(r).update({
            status: 'Rejected',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          await firebase.firestore().collection('notifications').add({
            userId: r, title: '❌ KYC Rejected',
            body: 'Your KYC was rejected. Please resubmit.',
            type: 'general', read: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          alert('❌ Rejected for @' + r);
        } catch(e) { alert('Error: ' + e.message); }
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }
  handleKycVerify();

  // ═══════════════════════════════════════════════════════════════
  // FIX #4: PREMIUM EMOJI ANIMATION (wavy)
  // ═══════════════════════════════════════════════════════════════
  function injectPremiumEmojiCSS() {
    if (document.getElementById('premium-emoji-css')) return;
    const style = document.createElement('style');
    style.id = 'premium-emoji-css';
    style.textContent = `
      @keyframes emojiWavy {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-3px) rotate(-8deg); }
        50% { transform: translateY(0) rotate(0deg); }
        75% { transform: translateY(-2px) rotate(8deg); }
      }
      @keyframes emojiBounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
      }
      @keyframes emojiGlow {
        0%, 100% { text-shadow: 0 0 4px rgba(255,215,0,0.4); }
        50% { text-shadow: 0 0 16px rgba(255,215,0,0.9), 0 0 24px rgba(255,100,0,0.6); }
      }
      .premium-emoji {
        display: inline-block;
        animation: emojiWavy 1.5s ease-in-out infinite;
        font-size: 1.1em;
      }
      .premium-emoji:nth-child(2n) { animation-delay: 0.2s; animation-duration: 1.8s; }
      .premium-emoji:nth-child(3n) { animation-delay: 0.4s; animation-duration: 2s; }
      .premium-post {
        border: 2px solid transparent;
        background: linear-gradient(#0f172a, #0f172a) padding-box,
                    linear-gradient(135deg, #fbbf24, #ec4899, #06b6d4) border-box;
        box-shadow: 0 0 20px rgba(251,191,36,0.15);
      }
      .premium-post .allow-select {
        animation: emojiGlow 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  function applyPremiumEmojis() {
    document.querySelectorAll('#posts-container > div, #dm-thread-view > div').forEach(card => {
      const match = card.innerHTML.match(/@([a-zA-Z0-9_]+)/);
      if (!match) return;
      const user = match[1];
      if (!isPremium() && user !== getUser()) return;
      
      if (card.dataset.premiumApplied === '1') return;
      card.dataset.premiumApplied = '1';
      card.classList.add('premium-post');
      
      // Wrap emojis
      const textEls = card.querySelectorAll('p');
      textEls.forEach(p => {
        if (p.dataset.emojisWrapped === '1') return;
        p.dataset.emojisWrapped = '1';
        p.innerHTML = p.innerHTML.replace(
          /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}])/gu,
          '<span class="premium-emoji">$1</span>'
        );
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #5: PREMIUM THEMES (locked for non-premium)
  // ═══════════════════════════════════════════════════════════════
  const PREMIUM_THEMES = [
    { id: 'default', name: 'Default', bg: '#090d16', locked: false },
    { id: 'cyberpunk', name: 'Cyberpunk', bg: 'linear-gradient(135deg,#0a0e27,#1a0a3d)', locked: true },
    { id: 'sunset', name: 'Sunset', bg: 'linear-gradient(135deg,#1a0a1f,#3d1a0a)', locked: true },
    { id: 'ocean', name: 'Ocean', bg: 'linear-gradient(135deg,#0a1a2e,#0a2a3e)', locked: true },
    { id: 'forest', name: 'Forest', bg: 'linear-gradient(135deg,#0a1f0a,#1a3d1a)', locked: true },
    { id: 'rose', name: 'Rose Gold', bg: 'linear-gradient(135deg,#2a0a1a,#3d1a2a)', locked: true },
    { id: 'galaxy', name: 'Galaxy', bg: 'linear-gradient(135deg,#0a0a2e,#2a0a3d)', locked: true },
    { id: 'golden', name: 'Golden', bg: 'linear-gradient(135deg,#1f1a0a,#3d2a0a)', locked: true }
  ];

  window.openPremiumThemes = function() {
    if (!document.getElementById('themeModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="themeModal" class="fullscreen-modal hidden p-4 z-[85] overflow-y-auto no-scrollbar">
          <div class="flex justify-between items-center border-b border-purple-500/40 pb-3 mb-4 sticky top-0 bg-gray-950 z-10">
            <h2 class="text-base font-bold text-purple-400"><i class="fa-solid fa-palette"></i> Themes</h2>
            <button onclick="closeModal('themeModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <p class="text-[11px] text-gray-400 mb-3" id="theme-status"></p>
          <div id="themes-grid" class="grid grid-cols-2 gap-3"></div>
        </div>
      `);
    }
    if (typeof openModal === 'function') openModal('themeModal');
    renderThemes();
  };

  function renderThemes() {
    const grid = document.getElementById('themes-grid');
    if (!grid) return;
    const premium = isPremium();
    const statusEl = document.getElementById('theme-status');
    if (statusEl) {
      statusEl.innerHTML = premium
        ? '✅ All themes unlocked (Premium)'
        : '🔒 Premium lagayein toh saare themes khul jayenge';
    }
    grid.innerHTML = '';
    PREMIUM_THEMES.forEach(t => {
      const isLocked = t.locked && !premium;
      const btn = document.createElement('button');
      btn.className = `p-3 rounded-xl border-2 ${isLocked ? 'border-gray-700 opacity-60' : 'border-cyan-500/40'}`;
      btn.style.background = t.bg;
      btn.style.minHeight = '80px';
      btn.onclick = () => {
        if (isLocked) { toast('🔒 Premium lagayein'); return; }
        applyTheme(t);
      };
      btn.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full">
          ${isLocked ? '<div class="text-3xl">🔒</div>' : '<div class="text-3xl">🎨</div>'}
          <p class="text-xs font-bold mt-1 text-white">${t.name}</p>
        </div>
      `;
      grid.appendChild(btn);
    });
  }

  function applyTheme(theme) {
    const user = getUser();
    let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    if (!users[user]) users[user] = {};
    users[user].theme = theme.id;
    localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
    
    if (theme.id === 'default') {
      document.body.style.background = '#090d16';
    } else {
      document.body.style.background = theme.bg;
      document.body.style.backgroundAttachment = 'fixed';
    }
    toast('✅ Theme: ' + theme.name);
    try { firebase.firestore().collection('users').doc(user).set({ theme: theme.id }, { merge: true }); } catch(e) {}
  }

  // Load saved theme
  function loadSavedTheme() {
    const user = getUser();
    if (!user) return;
    const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const u = users[user] || {};
    if (u.theme) {
      const theme = PREMIUM_THEMES.find(t => t.id === u.theme);
      if (theme) {
        if (theme.locked && !isPremium()) return;
        if (theme.id === 'default') document.body.style.background = '#090d16';
        else document.body.style.background = theme.bg;
      }
    }
  }

  // Add theme button in settings
  function addThemeBtn() {
    const settings = document.getElementById('settingsModal');
    if (!settings || document.getElementById('theme-btn')) return;
    const walletBox = settings.querySelector('.bg-gray-900');
    if (!walletBox) return;
    const btn = document.createElement('button');
    btn.id = 'theme-btn';
    btn.onclick = () => { closeModal('settingsModal'); window.openPremiumThemes(); };
    btn.className = 'w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 mt-2';
    btn.innerHTML = '<i class="fa-solid fa-palette"></i> Themes ' + (isPremium() ? '' : '🔒');
    walletBox.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #6: CAMERA PERMISSION — Live only, not for video post
  // ═══════════════════════════════════════════════════════════════
  async function requestCameraForLive() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      return stream;
    } catch(e) {
      toast('❌ Camera permission chahiye live ke liye');
      return null;
    }
  }
  window.__requestCameraForLive = requestCameraForLive;

  // ═══════════════════════════════════════════════════════════════
  // FIX #7: DM SEND BUTTON
  // ═══════════════════════════════════════════════════════════════
  function ensureDmSend() {
    const footer = document.getElementById('dm-input-footer');
    if (!footer) return;
    const input = document.getElementById('dm-message-input');
    const sendBtn = footer.querySelector('button');
    if (input && sendBtn && !input.dataset.dmHooked) {
      input.dataset.dmHooked = '1';
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (typeof window.sendDmMessageSubmit === 'function') window.sendDmMessageSubmit();
        }
      });
      sendBtn.onclick = () => {
        if (typeof window.sendDmMessageSubmit === 'function') window.sendDmMessageSubmit();
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #8: REAL PAYMENT (not demo) — Withdrawal/Deposit
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
        id: wdId, user, method, currency, amount, account, status: 'Pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        cancelUntil: firebase.firestore.Timestamp.fromDate(cancelUntil)
      });
      await firebase.firestore().collection('users').doc(user).set({ balanceUsd: users[user].balanceUsd }, { merge: true });
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
            <p class="text-[10px] text-amber-300">Auto-process:</p>
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
        const admin = Math.random() < 0.5 ? '923089775764' : '923423373749';
        const waText = encodeURIComponent(
          `💸 WITHDRAWAL REQUEST\n\nUser: @${getUser()}\nMethod: ${method}\nAmount: ${currency} ${amount}\nAccount: ${account}\n\nPlease process.`
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
        await firebase.firestore().collection('users').doc(data.user).set({ balanceUsd: users[data.user].balanceUsd }, { merge: true });
      }
      await firebase.firestore().collection('withdrawals').doc(id).update({ status: 'Cancelled', cancelledAt: firebase.firestore.FieldValue.serverTimestamp() });
      clearInterval(window.__wdTimer);
      document.getElementById('cancelWdModal')?.remove();
      if (typeof window.updateWalletUI === 'function') window.updateWalletUI();
      toast('✅ Cancelled + refunded');
    } catch(e) { toast('Error: ' + e.message); }
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    injectPremiumEmojiCSS();
    loadSavedTheme();
    
    setInterval(() => {
      ensureChannelInput();
      ensureDmSend();
      addThemeBtn();
      applyPremiumEmojis();
    }, 1500);
    
    setTimeout(() => {
      ensureChannelInput();
      ensureDmSend();
      addThemeBtn();
      applyPremiumEmojis();
      loadSavedTheme();
    }, 2000);
    
    console.log('✅ think.js loaded - All fixes active');
  }
  
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.__THINK__ = {
    PREMIUM_THEMES,
    SECURE_PAYMENT,
    isPremium,
    openPremiumThemes
  };
})();
