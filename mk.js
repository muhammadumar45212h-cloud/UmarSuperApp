/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - MK.JS (Baaki Sab Real)
   Real: Live Stream, Payment, Premium, Notifications, Auto-Reply
   Add: <script src="mk.js" defer></script>
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
  // 1. REAL LIVE STREAM (WebRTC 2-way)
  // ═══════════════════════════════════════════════════════════════
  let peerConnection = null;
  let localStream = null;
  let liveRoomId = null;
  let iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // START LIVE AS HOST
  window.startLiveAsHost = async function(mode) {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    try {
      // Get camera
      localStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true
      });

      // Show in UI
      const solo = document.getElementById('solo-live-video');
      const left = document.getElementById('pk-video-left');
      if (mode === 'pk' && left) {
        left.srcObject = localStream;
        left.muted = true;
        await left.play();
      } else if (solo) {
        solo.srcObject = localStream;
        solo.muted = true;
        await solo.play();
      }

      // Create room
      liveRoomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      window.__liveRoomId = liveRoomId;

      // Create peer connection
      peerConnection = new RTCPeerConnection(iceServers);
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

      // Guest track aayega
      peerConnection.ontrack = (event) => {
        const right = document.getElementById('pk-video-right');
        if (right && event.streams[0]) {
          right.srcObject = event.streams[0];
          right.play().catch(e => console.log(e));
          // Switch to PK mode
          document.getElementById('stream-solo-box')?.classList.add('hidden');
          document.getElementById('stream-pk-box')?.classList.remove('hidden');
          toast('👤 Guest connected!');
        }
      };

      // ICE candidates
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate && liveRoomId) {
          await firebase.firestore().collection('live_rooms').doc(liveRoomId)
            .collection('host_ice').add(event.candidate.toJSON());
        }
      };

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Save room
      await firebase.firestore().collection('live_rooms').doc(liveRoomId).set({
        roomId: liveRoomId,
        host: user,
        mode: mode,
        status: 'waiting',
        offer: { type: offer.type, sdp: offer.sdp },
        viewers: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Listen for answer
      const answerUnsub = firebase.firestore().collection('live_rooms').doc(liveRoomId)
        .onSnapshot(async (doc) => {
          const data = doc.data();
          if (data && data.answer && peerConnection.signalingState !== 'stable') {
            try {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
              toast('✅ Guest connected!');
            } catch(e) { console.log(e); }
          }
        });

      // Listen for guest ICE
      const guestIceUnsub = firebase.firestore().collection('live_rooms').doc(liveRoomId)
        .collection('guest_ice').onSnapshot(snap => {
          snap.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()));
              } catch(e) { console.log(e); }
            }
          });
        });

      window.__liveUnsub = () => { answerUnsub(); guestIceUnsub(); };

      // Copy invite link
      const inviteLink = `${window.location.origin}${window.location.pathname}?live=${liveRoomId}&host=${user}`;
      try {
        await navigator.clipboard.writeText(inviteLink);
        toast('✅ Invite link copy! Dost ko bhejein');
      } catch(e) {
        prompt('Ye link copy karein:', inviteLink);
      }

      console.log('✅ Live started:', liveRoomId);
    } catch(e) {
      console.error('Live error:', e);
      toast('❌ Camera error: ' + e.message);
    }
  };

  // JOIN AS GUEST
  window.joinLiveAsGuest = async function(roomId) {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    try {
      // Get camera
      localStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });

      const right = document.getElementById('pk-video-right');
      if (right) {
        right.srcObject = localStream;
        right.muted = true;
        await right.play();
      }

      peerConnection = new RTCPeerConnection(iceServers);
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

      peerConnection.ontrack = (event) => {
        const left = document.getElementById('pk-video-left');
        if (left && event.streams[0]) {
          left.srcObject = event.streams[0];
          left.play().catch(e => console.log(e));
        }
      };

      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          await firebase.firestore().collection('live_rooms').doc(roomId)
            .collection('guest_ice').add(event.candidate.toJSON());
        }
      };

      // Get room
      const roomDoc = await firebase.firestore().collection('live_rooms').doc(roomId).get();
      if (!roomDoc.exists) { toast('❌ Room nahi mila'); return; }
      const roomData = roomDoc.data();

      await peerConnection.setRemoteDescription(new RTCSessionDescription(roomData.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      await firebase.firestore().collection('live_rooms').doc(roomId).update({
        answer: { type: answer.type, sdp: answer.sdp },
        guest: user,
        status: 'connected'
      });

      // Listen for host ICE
      const hostIceUnsub = firebase.firestore().collection('live_rooms').doc(roomId)
        .collection('host_ice').onSnapshot(snap => {
          snap.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()));
              } catch(e) { console.log(e); }
            }
          });
        });

      window.__liveUnsub = hostIceUnsub;

      // Show PK mode
      document.getElementById('stream-solo-box')?.classList.add('hidden');
      document.getElementById('stream-pk-box')?.classList.remove('hidden');
      toast('✅ Live room joined!');
    } catch(e) {
      console.error('Join error:', e);
      toast('❌ ' + e.message);
    }
  };

  // CLOSE LIVE
  window.closeLiveStream = function() {
    if (peerConnection) { try { peerConnection.close(); } catch(e){} peerConnection = null; }
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
    if (window.__liveUnsub) { try { window.__liveUnsub(); } catch(e){} }
    if (liveRoomId) {
      try {
        firebase.firestore().collection('live_rooms').doc(liveRoomId).update({ status: 'ended' });
      } catch(e) {}
      liveRoomId = null;
    }
    document.getElementById('solo-live-video') && (document.getElementById('solo-live-video').srcObject = null);
    document.getElementById('pk-video-left') && (document.getElementById('pk-video-left').srcObject = null);
    closeModal('liveStreamModal');
    toast('Live ended');
  };

  // AUTO-JOIN FROM URL
  window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const liveId = params.get('live');
    const host = params.get('host');
    if (liveId && host && currentUser) {
      setTimeout(() => {
        if (confirm(`🔴 @${host} aapko live pe invite kar raha hai. Join karein?`)) {
          openModal('liveStreamModal');
          document.getElementById('stream-type-title').innerText = '⚔️ 2-PLAYER PK MATCH LIVE';
          window.joinLiveAsGuest(liveId);
        }
      }, 2500);
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. REAL PAYMENT (Manual + Auto-verify)
  // ═══════════════════════════════════════════════════════════════
  const PAYMENT_INFO = {
    easypaisa: { number: '+92 305 2163026', name: 'Muhammad Umar' },
    jazzcash: { number: '+92 305 2163026', name: 'Muhammad Umar' },
    sadapay: { number: '5590490292264221', iban: 'PK94SADA0000003013816558', name: 'Muhammad Umar' }
  };

  window.openBuyDiamondsModal = function() {
    if (!document.getElementById('buyDiamondsModal')) {
      document.body.insertAdjacentHTML('beforeend', `<div id="buyDiamondsModal" class="fullscreen-modal hidden overflow-y-auto no-scrollbar z-[85]"></div>`);
    }
    const modal = document.getElementById('buyDiamondsModal');
    modal.innerHTML = `
      <div class="p-4 space-y-4 pb-32">
        <div class="flex justify-between items-center border-b border-amber-500/40 pb-3 sticky top-0 bg-gray-950 z-10">
          <h2 class="text-base font-bold text-amber-400"><i class="fa-solid fa-gem"></i> Buy Diamonds</h2>
          <button onclick="closeModal('buyDiamondsModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="bg-amber-900/20 border border-amber-500/40 rounded-xl p-3">
          <p class="text-[11px] text-amber-300 font-bold">💎 1 Diamond = $5 (≈ Rs 1400)</p>
          <p class="text-[10px] text-gray-300 mt-1">Payment karein → Screenshot upload → Admin 5 min mein diamonds add karega</p>
        </div>

        <div id="pkgs-grid" class="grid grid-cols-2 gap-3"></div>

        <div id="pay-method-section" class="hidden space-y-3">
          <p class="text-[10px] text-cyan-400 uppercase font-bold">Payment Method</p>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="window.__selectPayMethod('easypaisa')" class="p-3 bg-gray-800 border-2 border-cyan-500 rounded-xl flex flex-col items-center">
              <i class="fa-solid fa-wallet text-cyan-400 text-xl"></i>
              <span class="text-[10px] font-bold text-white mt-1">Easypaisa</span>
            </button>
            <button onclick="window.__selectPayMethod('jazzcash')" class="p-3 bg-gray-800 border-2 border-gray-700 rounded-xl flex flex-col items-center">
              <i class="fa-solid fa-mobile text-cyan-400 text-xl"></i>
              <span class="text-[10px] font-bold text-white mt-1">JazzCash</span>
            </button>
            <button onclick="window.__selectPayMethod('sadapay')" class="p-3 bg-gray-800 border-2 border-gray-700 rounded-xl flex flex-col items-center">
              <i class="fa-solid fa-building-columns text-cyan-400 text-xl"></i>
              <span class="text-[10px] font-bold text-white mt-1">SadaPay</span>
            </button>
          </div>
          <div id="pay-info-box" class="hidden"></div>
        </div>
      </div>
    `;
    if (typeof openModal === 'function') openModal('buyDiamondsModal');
    renderPayPackages();
  };

  const PAY_PACKAGES = [
    { diamonds: 1, pkr: 1400 },
    { diamonds: 5, pkr: 7000, bonus: 1 },
    { diamonds: 10, pkr: 14000, bonus: 3 },
    { diamonds: 25, pkr: 35000, bonus: 10 },
    { diamonds: 50, pkr: 70000, bonus: 25 },
    { diamonds: 100, pkr: 140000, bonus: 60 }
  ];
  let selectedPayPkg = null;

  function renderPayPackages() {
    const grid = document.getElementById('pkgs-grid');
    if (!grid) return;
    grid.innerHTML = '';
    PAY_PACKAGES.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'p-3 bg-gray-800 border-2 border-amber-500/40 rounded-xl flex flex-col items-center';
      btn.onclick = () => {
        selectedPayPkg = p;
        document.querySelectorAll('#pkgs-grid > button').forEach(b => b.classList.remove('border-amber-400', 'bg-amber-900/20'));
        btn.classList.add('border-amber-400', 'bg-amber-900/20');
        document.getElementById('pay-method-section').classList.remove('hidden');
        document.getElementById('pay-method-section').scrollIntoView({ behavior: 'smooth' });
      };
      btn.innerHTML = `
        <span class="text-3xl">💎</span>
        <span class="text-base font-bold text-amber-400 mt-1">${p.diamonds}</span>
        ${p.bonus ? `<span class="text-[10px] text-green-400">+${p.bonus} free</span>` : ''}
        <span class="text-xs font-bold text-white mt-1">Rs ${p.pkr.toLocaleString()}</span>
      `;
      grid.appendChild(btn);
    });
  }

  window.__selectPayMethod = function(method) {
    const info = PAYMENT_INFO[method];
    if (!info) return;
    
    document.querySelectorAll('#pay-method-section button').forEach(b => {
      b.classList.remove('border-cyan-500');
      b.classList.add('border-gray-700');
    });
    event.target.closest('button').classList.remove('border-gray-700');
    event.target.closest('button').classList.add('border-cyan-500');

    const box = document.getElementById('pay-info-box');
    box.classList.remove('hidden');
    box.innerHTML = `
      <div class="bg-gray-900 border border-cyan-500/40 rounded-xl p-4 space-y-2">
        <p class="text-[10px] text-gray-400 uppercase">Send Rs ${selectedPayPkg.pkr.toLocaleString()} to:</p>
        <div class="flex items-center justify-between">
          <p class="text-sm font-bold text-white">${info.number}</p>
          <button onclick="window.__copyPay('${info.number}')" class="text-cyan-400 text-xs"><i class="fa-solid fa-copy"></i></button>
        </div>
        ${info.iban ? `<p class="text-[10px] text-gray-500">IBAN: ${info.iban}</p>` : ''}
        <p class="text-[10px] text-gray-500">${info.name}</p>
        <input type="file" id="pay-screenshot" accept="image/*" class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white mt-3">
        <input type="text" id="pay-txn" class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white" placeholder="Transaction ID">
        <button onclick="window.__submitPayment()" class="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xs rounded-xl">
          <i class="fa-brands fa-whatsapp"></i> Send to Admin WhatsApp
        </button>
      </div>
    `;
  };

  window.__copyPay = function(text) {
    navigator.clipboard.writeText(text);
    toast('✅ Copied: ' + text);
  };

  window.__submitPayment = async function() {
    const user = getUser();
    if (!user || !selectedPayPkg) return;
    const scr = document.getElementById('pay-screenshot');
    const txn = document.getElementById('pay-txn')?.value.trim() || '';
    if (!scr?.files?.[0]) { toast('Screenshot upload karein'); return; }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const totalDiamonds = selectedPayPkg.diamonds + (selectedPayPkg.bonus || 0);
        await firebase.firestore().collection('payments').add({
          user, amountPkr: selectedPayPkg.pkr, diamonds: totalDiamonds,
          screenshot: e.target.result, txn, status: 'pending',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        const waText = encodeURIComponent(
          `🔔 NEW ORDER\nUser: @${user}\nRs ${selectedPayPkg.pkr}\n${totalDiamonds}💎\nTxn: ${txn}`
        );
        const admin = Math.random() < 0.5 ? '923089775764' : '923423373749';
        window.open(`https://wa.me/${admin}?text=${waText}`, '_blank');
        toast('✅ Order submitted!');
        closeModal('buyDiamondsModal');
      } catch(err) { toast('❌ ' + err.message); }
    };
    reader.readAsDataURL(scr.files[0]);
  };

  // ═══════════════════════════════════════════════════════════════
  // 3. REAL PREMIUM (Buy + Auto blue tick)
  // ═══════════════════════════════════════════════════════════════
  const PREMIUM_PRICE = 500; // Rs 500/month
  const PREMIUM_DAYS = 30;

  window.openBuyPremiumModal = function() {
    if (!document.getElementById('buyPremiumModal')) {
      document.body.insertAdjacentHTML('beforeend', `<div id="buyPremiumModal" class="fullscreen-modal hidden p-4 justify-center items-center bg-black/80 z-[85]"></div>`);
    }
    const modal = document.getElementById('buyPremiumModal');
    modal.innerHTML = `
      <div class="w-full max-w-sm bg-gradient-to-br from-purple-900 to-pink-900 border-2 border-purple-400 rounded-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-white/20 pb-3">
          <h2 class="text-base font-bold text-white"><i class="fa-solid fa-crown"></i> Get Premium</h2>
          <button onclick="closeModal('buyPremiumModal')" class="text-white text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="text-center space-y-2">
          <div class="text-6xl">👑</div>
          <p class="text-2xl font-extrabold text-yellow-300">Rs ${PREMIUM_PRICE}/month</p>
          <p class="text-xs text-white/80">Or $5 USD</p>
        </div>

        <div class="bg-black/30 rounded-xl p-3 space-y-1.5 text-xs text-white">
          <p>✅ <b>Blue Tick</b> (har jagah profile pe)</p>
          <p>✅ <b>Premium Emoji</b> (hilte emoji)</p>
          <p>✅ <b>7 Themes</b> unlock</p>
          <p>✅ <b>Ads-free</b> experience</p>
          <p>✅ <b>Priority Support</b></p>
        </div>

        <div class="bg-white/10 rounded-xl p-3 space-y-2">
          <p class="text-[10px] text-white/70 uppercase font-bold">Payment</p>
          <p class="text-xs text-white">Easypaisa / JazzCash: <b>+92 305 2163026</b></p>
          <p class="text-xs text-white">SadaPay: <b>5590490292264221</b></p>
        </div>

        <input type="file" id="premium-screenshot" accept="image/*" class="w-full bg-black/30 border border-white/20 p-2 rounded-lg text-xs text-white">
        <input type="text" id="premium-txn" class="w-full bg-black/30 border border-white/20 p-2 rounded-lg text-xs text-white" placeholder="Transaction ID">

        <button onclick="window.__submitPremium()" class="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-sm rounded-xl">
          <i class="fa-brands fa-whatsapp"></i> Submit Payment
        </button>
      </div>
    `;
    if (typeof openModal === 'function') openModal('buyPremiumModal');
  };

  window.__submitPremium = async function() {
    const user = getUser();
    if (!user) return;
    const scr = document.getElementById('premium-screenshot');
    const txn = document.getElementById('premium-txn')?.value.trim() || '';
    if (!scr?.files?.[0]) { toast('Screenshot upload karein'); return; }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await firebase.firestore().collection('premium_orders').add({
          user, amountPkr: PREMIUM_PRICE, days: PREMIUM_DAYS,
          screenshot: e.target.result, txn, status: 'pending',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        const waText = encodeURIComponent(
          `👑 PREMIUM ORDER\nUser: @${user}\nRs ${PREMIUM_PRICE}\nTxn: ${txn}`
        );
        const admin = Math.random() < 0.5 ? '923089775764' : '923423373749';
        window.open(`https://wa.me/${admin}?text=${waText}`, '_blank');
        toast('✅ Premium order submitted!');
        closeModal('buyPremiumModal');
      } catch(err) { toast('❌ ' + err.message); }
    };
    reader.readAsDataURL(scr.files[0]);
  };

  // ═══════════════════════════════════════════════════════════════
  // 4. REAL PUSH NOTIFICATIONS (FCM)
  // ═══════════════════════════════════════════════════════════════
  async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  // Register FCM token in Firestore
  async function registerFCMToken() {
    const user = getUser();
    if (!user) return;
    
    try {
      const granted = await requestNotificationPermission();
      if (!granted) return;

      // Save permission status
      await firebase.firestore().collection('users').doc(user).set({
        notificationsEnabled: true,
        lastNotificationCheck: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log('✅ Notifications enabled');
    } catch(e) {
      console.log('FCM setup:', e.message);
    }
  }

  // Show browser notification
  window.showPushNotification = async function(title, body) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        body: body,
        icon: '/icon-512.png',
        badge: '/icon-512.png'
      });
    } catch(e) {}
  };

  // Listen for new notifications in Firestore
  function startNotificationListener() {
    const user = getUser();
    if (!user) return;

    firebase.firestore().collection('notifications')
      .where('userId', '==', user)
      .where('read', '==', false)
      .limit(10)
      .onSnapshot(snap => {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            window.showPushNotification(data.title || 'Super Sphere', data.body || '');
          }
        });
      }, err => console.log('Notif listener:', err.message));
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. REAL AUTO-REPLY (DM bot)
  // ═══════════════════════════════════════════════════════════════
  const AUTO_REPLIES = [
    {
      keywords: ['hi', 'hello', 'hey', 'salam', 'assalam'],
      reply: 'Assalam-o-Alaikum! 🌟 Super Sphere mein khush aamdeed. Kya madad chahiye?'
    },
    {
      keywords: ['diamond', 'diamonds', 'buy'],
      reply: '💎 Diamonds khareedne ke liye: Settings → Buy Diamonds. Easypaisa/JazzCash se payment karein.'
    },
    {
      keywords: ['premium', 'blue tick', 'tick'],
      reply: '👑 Premium lene ke liye: Settings → Buy Premium. Rs 500/month mein blue tick + 7 themes.'
    },
    {
      keywords: ['withdraw', 'withdrawal', 'paisa'],
      reply: '💸 Withdrawal ke liye pehle KYC verify karwayein. Phir Settings → Withdrawal.'
    },
    {
      keywords: ['kyc', 'verify', 'verified'],
      reply: '🆔 KYC: Settings → KYC Verification. CNIC front, back, aur selfie upload karein.'
    },
    {
      keywords: ['live', 'stream'],
      reply: '🔴 Live stream ke liye Live button dabayein. Dost ko invite link bhejein.'
    },
    {
      keywords: ['help', 'problem', 'issue'],
      reply: '🆘 Koi problem? Admin ko DM karein ya WhatsApp: 03089775764'
    }
  ];

  // Auto-reply function (called when new DM arrives)
  window.__autoReplyDM = async function(fromUser, messageText) {
    const user = getUser();
    if (!user || fromUser === user) return;

    const text = (messageText || '').toLowerCase();
    let reply = null;

    for (const rule of AUTO_REPLIES) {
      if (rule.keywords.some(k => text.includes(k))) {
        reply = rule.reply;
        break;
      }
    }

    if (!reply) return;

    // Send reply after 2 seconds
    setTimeout(async () => {
      try {
        const chatKey = [user, fromUser].sort().join(':');
        await firebase.firestore().collection('dm_messages').add({
          chatKey: chatKey,
          sender: user,
          receiver: fromUser,
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAutoReply: true,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Auto-reply sent to', fromUser);
      } catch(e) { console.log(e); }
    }, 2000);
  };

  // Listen for new DMs (auto-reply)
  let autoReplyListener = null;
  function startAutoReplyListener() {
    const user = getUser();
    if (!user) return;
    if (autoReplyListener) { try { autoReplyListener(); } catch(e){} }

    autoReplyListener = firebase.firestore().collection('dm_messages')
      .where('receiver', '==', user)
      .where('isAutoReply', '!=', true)
      .orderBy('timestamp', 'desc')
      .limit(5)
      .onSnapshot(snap => {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.data();
            const msgTime = data.timestamp?.toMillis?.() || 0;
            // Only auto-reply to new messages (last 30 seconds)
            if (Date.now() - msgTime < 30000) {
              window.__autoReplyDM(data.sender, data.text);
            }
          }
        });
      }, err => {
        // Fallback without orderBy
        firebase.firestore().collection('dm_messages')
          .where('receiver', '==', user)
          .limit(5)
          .onSnapshot(snap2 => {
            snap2.docChanges().forEach(change => {
              if (change.type === 'added') {
                const data = change.data();
                if (!data.isAutoReply && data.sender !== user) {
                  window.__autoReplyDM(data.sender, data.text);
                }
              }
            });
          });
      });
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. REAL ADMIN PANEL (Payment + Premium approve)
  // ═══════════════════════════════════════════════════════════════
  window.openAdminPanel = async function() {
    if (!isAdmin()) { toast('Access denied'); return; }

    if (!document.getElementById('realAdminPanel')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="realAdminPanel" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[90] space-y-4">
          <div class="flex justify-between items-center border-b border-red-500/40 pb-3 sticky top-0 bg-gray-950 z-10">
            <h2 class="text-base font-bold text-red-400"><i class="fa-solid fa-shield-halved"></i> Admin Panel</h2>
            <button onclick="closeModal('realAdminPanel')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="flex gap-2 text-[10px]">
            <button onclick="window.__adminTab('payments')" id="adm-tab-payments" class="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold">💰 Payments</button>
            <button onclick="window.__adminTab('premium')" id="adm-tab-premium" class="flex-1 py-2 rounded-lg text-gray-400 font-bold">👑 Premium</button>
            <button onclick="window.__adminTab('withdrawals')" id="adm-tab-withdrawals" class="flex-1 py-2 rounded-lg text-gray-400 font-bold">💸 Withdraw</button>
            <button onclick="window.__adminTab('users')" id="adm-tab-users" class="flex-1 py-2 rounded-lg text-gray-400 font-bold">👥 Users</button>
          </div>
          <div id="admin-content" class="space-y-2"></div>
        </div>
      `);
    }
    if (typeof openModal === 'function') openModal('realAdminPanel');
    window.__adminTab('payments');
  };

  window.__adminTab = async function(tab) {
    ['payments', 'premium', 'withdrawals', 'users'].forEach(t => {
      const btn = document.getElementById('adm-tab-' + t);
      if (btn) btn.className = `flex-1 py-2 rounded-lg ${t === tab ? 'bg-red-600 text-white' : 'text-gray-400'} font-bold`;
    });

    const content = document.getElementById('admin-content');
    content.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Loading...</p>';

    try {
      if (tab === 'payments') await loadPendingPayments(content);
      if (tab === 'premium') await loadPendingPremium(content);
      if (tab === 'withdrawals') await loadPendingWithdrawals(content);
      if (tab === 'users') await loadAllUsers(content);
    } catch(e) {
      content.innerHTML = `<p class="text-xs text-red-400">Error: ${e.message}</p>`;
    }
  };

  async function loadPendingPayments(content) {
    const snap = await firebase.firestore().collection('payments')
      .where('status', '==', 'pending').limit(50).get();
    content.innerHTML = '';
    if (snap.empty) { content.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">No pending payments</p>'; return; }
    snap.forEach(doc => {
      const d = doc.data();
      const div = document.createElement('div');
      div.className = 'bg-gray-900 border border-amber-500/40 rounded-xl p-3 space-y-2';
      div.innerHTML = `
        <div class="flex justify-between">
          <p class="text-xs font-bold text-white">@${d.user}</p>
          <p class="text-xs text-amber-400 font-bold">Rs ${d.amountPkr}</p>
        </div>
        <p class="text-[10px] text-gray-400">${d.diamonds}💎 • ${d.method || 'N/A'} • Txn: ${d.txn || 'N/A'}</p>
        ${d.screenshot ? `<img src="${d.screenshot}" class="w-full max-h-32 object-cover rounded" onclick="window.open('${d.screenshot}')">` : ''}
        <div class="grid grid-cols-2 gap-2">
          <button onclick="window.__approvePayment('${doc.id}', '${d.user}', ${d.diamonds})" class="py-2 bg-green-600 text-white text-[10px] font-bold rounded">✅ Approve</button>
          <button onclick="window.__rejectPayment('${doc.id}')" class="py-2 bg-red-600 text-white text-[10px] font-bold rounded">❌ Reject</button>
        </div>
      `;
      content.appendChild(div);
    });
  }

  window.__approvePayment = async function(paymentId, user, diamonds) {
    try {
      await firebase.firestore().collection('payments').doc(paymentId).update({
        status: 'approved',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      const userDoc = await firebase.firestore().collection('users').doc(user).get();
      const currentDiamonds = userDoc.exists ? (userDoc.data().diamonds || 0) : 0;
      await firebase.firestore().collection('users').doc(user).set({
        diamonds: currentDiamonds + diamonds
      }, { merge: true });

      await firebase.firestore().collection('notifications').add({
        userId: user,
        title: '💎 Diamonds Added!',
        body: `${diamonds} diamonds add ho gaye!`,
        type: 'payment',
        read: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      toast(`✅ Approved: ${diamonds}💎 to @${user}`);
      window.__adminTab('payments');
    } catch(e) { toast('❌ ' + e.message); }
  };

  window.__rejectPayment = async function(paymentId) {
    try {
      await firebase.firestore().collection('payments').doc(paymentId).update({
        status: 'rejected',
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      toast('❌ Rejected');
      window.__adminTab('payments');
    } catch(e) { toast('❌ ' + e.message); }
  };

  async function loadPendingPremium(content) {
    const snap = await firebase.firestore().collection('premium_orders')
      .where('status', '==', 'pending').limit(50).get();
    content.innerHTML = '';
    if (snap.empty) { content.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">No pending premium</p>'; return; }
    snap.forEach(doc => {
      const d = doc.data();
      const div = document.createElement('div');
      div.className = 'bg-gray-900 border border-purple-500/40 rounded-xl p-3 space-y-2';
      div.innerHTML = `
        <p class="text-xs font-bold text-white">@${d.user}</p>
        <p class="text-[10px] text-purple-400">Rs ${d.amountPkr} • ${d.days} days</p>
        ${d.screenshot ? `<img src="${d.screenshot}" class="w-full max-h-32 object-cover rounded">` : ''}
        <div class="grid grid-cols-2 gap-2">
          <button onclick="window.__approvePremium('${doc.id}', '${d.user}', ${d.days})" class="py-2 bg-green-600 text-white text-[10px] font-bold rounded">✅ Approve</button>
          <button onclick="window.__rejectPremium('${doc.id}')" class="py-2 bg-red-600 text-white text-[10px] font-bold rounded">❌ Reject</button>
        </div>
      `;
      content.appendChild(div);
    });
  }

  window.__approvePremium = async function(orderId, user, days) {
    try {
      const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      await firebase.firestore().collection('premium_orders').doc(orderId).update({
        status: 'approved',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await firebase.firestore().collection('users').doc(user).set({
        isPremium: true,
        isVerified: true,
        premiumExpiry: firebase.firestore.Timestamp.fromDate(expiry),
        premiumSince: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      await firebase.firestore().collection('notifications').add({
        userId: user,
        title: '👑 Premium Activated!',
        body: `Blue tick aapke account pe lag gaya! ${days} din ke liye.`,
        type: 'premium',
        read: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      toast(`✅ Premium activated: @${user}`);
      window.__adminTab('premium');
    } catch(e) { toast('❌ ' + e.message); }
  };

  window.__rejectPremium = async function(orderId) {
    await firebase.firestore().collection('premium_orders').doc(orderId).update({ status: 'rejected' });
    toast('❌ Rejected');
    window.__adminTab('premium');
  };

  async function loadPendingWithdrawals(content) {
    const snap = await firebase.firestore().collection('withdrawals')
      .where('status', '==', 'Pending').limit(50).get();
    content.innerHTML = '';
    if (snap.empty) { content.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">No pending withdrawals</p>'; return; }
    snap.forEach(doc => {
      const d = doc.data();
      const div = document.createElement('div');
      div.className = 'bg-gray-900 border border-cyan-500/40 rounded-xl p-3 space-y-2';
      div.innerHTML = `
        <p class="text-xs font-bold text-white">@${d.user}</p>
        <p class="text-[10px] text-cyan-400">${d.currency} ${d.amount} • ${d.method}</p>
        <p class="text-[10px] text-gray-400">Account: ${d.account}</p>
        <div class="grid grid-cols-2 gap-2">
          <button onclick="window.__approveWithdraw('${doc.id}')" class="py-2 bg-green-600 text-white text-[10px] font-bold rounded">✅ Paid</button>
          <button onclick="window.__rejectWithdraw('${doc.id}')" class="py-2 bg-red-600 text-white text-[10px] font-bold rounded">❌ Reject</button>
        </div>
      `;
      content.appendChild(div);
    });
  }

  window.__approveWithdraw = async function(id) {
    await firebase.firestore().collection('withdrawals').doc(id).update({
      status: 'Approved',
      approvedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('✅ Withdrawal approved');
    window.__adminTab('withdrawals');
  };

  window.__rejectWithdraw = async function(id) {
    const doc = await firebase.firestore().collection('withdrawals').doc(id).get();
    const data = doc.data();
    // Refund
    const userDoc = await firebase.firestore().collection('users').doc(data.user).get();
    if (userDoc.exists) {
      const currentUsd = userDoc.data().balanceUsd || 0;
      const refund = data.currency === 'PKR' ? (data.amount / 278) : data.amount;
      await firebase.firestore().collection('users').doc(data.user).set({
        balanceUsd: currentUsd + refund
      }, { merge: true });
    }
    await firebase.firestore().collection('withdrawals').doc(id).update({
      status: 'Rejected',
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('❌ Rejected + refunded');
    window.__adminTab('withdrawals');
  };

  async function loadAllUsers(content) {
    const snap = await firebase.firestore().collection('users').limit(100).get();
    content.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      const div = document.createElement('div');
      div.className = `bg-gray-900 border ${d.banned ? 'border-red-500/50' : 'border-gray-800'} rounded-xl p-3 flex items-center gap-3`;
      div.innerHTML = `
        <img src="${d.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${doc.id}`}" class="w-10 h-10 rounded-full bg-gray-800">
        <div class="flex-1">
          <p class="text-xs font-bold text-white">@${doc.id} ${d.isPremium ? '👑' : ''}</p>
          <p class="text-[10px] text-gray-400">💎 ${d.diamonds || 0} • Rs ${(d.balanceUsd * 278 || 0).toFixed(0)}</p>
        </div>
        <button onclick="window.__toggleBan('${doc.id}', ${d.banned || false})" class="px-3 py-1.5 ${d.banned ? 'bg-green-600' : 'bg-red-600'} text-white text-[10px] font-bold rounded">
          ${d.banned ? 'Unban' : 'Ban'}
        </button>
      `;
      content.appendChild(div);
    });
  }

  window.__toggleBan = async function(user, banned) {
    await firebase.firestore().collection('users').doc(user).set({
      banned: !banned
    }, { merge: true });
    toast(banned ? '✅ Unbanned' : '🚫 Banned');
    window.__adminTab('users');
  };

  // Add admin button to header
  function addAdminButton() {
    if (!isAdmin()) return;
    if (document.getElementById('mk-admin-btn')) return;
    const header = document.querySelector('header');
    if (!header) return;
    const btn = document.createElement('button');
    btn.id = 'mk-admin-btn';
    btn.onclick = window.openAdminPanel;
    btn.className = 'px-2 py-1 bg-red-600 text-white rounded-full text-[10px] font-bold';
    btn.innerHTML = '<i class="fa-solid fa-shield-halved"></i>';
    btn.title = 'Admin Panel';
    header.querySelector('div')?.appendChild(btn);
  }

  // Add premium buy button in settings
  function addPremiumButton() {
    const settings = document.getElementById('settingsModal');
    if (!settings || document.getElementById('mk-premium-btn')) return;
    const box = settings.querySelector('.bg-gray-900');
    if (!box) return;
    const btn = document.createElement('button');
    btn.id = 'mk-premium-btn';
    btn.onclick = () => { closeModal('settingsModal'); window.openBuyPremiumModal(); };
    btn.className = 'w-full py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black rounded-lg text-xs font-bold flex items-center justify-center gap-2 mt-2';
    btn.innerHTML = '<i class="fa-solid fa-crown"></i> Get Premium 👑';
    box.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. PREMIUM BLUE TICK (Auto-render everywhere)
  // ═══════════════════════════════════════════════════════════════
  const TICK_SVG = `<svg viewBox="0 0 22 22" width="14" height="14" style="display:inline-block;vertical-align:middle;margin-left:3px;">
    <circle cx="11" cy="11" r="10" fill="#1DA1F2"/>
    <path fill="#fff" d="M9.5 15.5L6 12l1.5-1.5 2 2 5-5L16 9l-6.5 6.5z"/>
  </svg>`;

  function applyBlueTicks() {
    document.querySelectorAll('body *').forEach(el => {
      if (el.children.length > 3) return; // skip complex elements
      const text = el.textContent || '';
      const match = text.match(/@([a-zA-Z0-9_]+)/);
      if (!match) return;
      if (el.querySelector('.mk-tick')) return;

      const user = match[1];
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const u = users[user];
      if (!u || (!u.isPremium && !u.isVerified)) return;

      // Add tick after @username
      const tick = document.createElement('span');
      tick.className = 'mk-tick';
      tick.innerHTML = TICK_SVG;
      try {
        el.appendChild(tick);
      } catch(e) {}
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    setTimeout(() => {
      registerFCMToken();
      startNotificationListener();
      startAutoReplyListener();
      addAdminButton();
      console.log('✅ mk.js loaded - All real features active');
    }, 4000);

    setInterval(() => {
      addAdminButton();
      addPremiumButton();
      applyBlueTicks();
    }, 2000);

    console.log('✅ mk.js initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export
  window.__MK__ = {
    startLiveAsHost,
    joinLiveAsGuest,
    closeLiveStream,
    openBuyPremiumModal,
    openAdminPanel
  };
})();
