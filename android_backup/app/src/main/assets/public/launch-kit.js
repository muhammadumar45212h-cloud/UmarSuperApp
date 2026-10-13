/* ═══════════════════════════════════════════════════════════════
   SUPER APP - LAUNCH KIT MODULE
   Ye file 5 kaam karti hai:
   1. Ad Code (AdSense/Adsterra auto-load)
   2. WebRTC Full 2-User Live (Firestore signaling)
   3. Privacy Policy + Terms + Disclaimer (auto-inject)
   4. App Icon Generator (SVG → PNG download)
   5. Capacitor Guide (HTML → APK)
   
   Add to index.html <head>: <script src="launch-kit.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══════════════ HELPERS ═══════════════
  function toast(msg) {
    if (typeof window.showToast === 'function') { window.showToast(msg); return; }
    const t = document.getElementById('toast-notification');
    if (!t) { alert(msg); return; }
    const m = document.getElementById('toast-message');
    if (m) m.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
  function fmt(s) { return (s || 'Umar').replace(/^@+/, '').split('@')[0]; }
  function openM(id) { const e = document.getElementById(id); if (e) e.classList.remove('hidden'); }
  function closeM(id) { const e = document.getElementById(id); if (e) e.classList.add('hidden'); }
  function waitDB(cb) {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) cb();
    else setTimeout(() => waitDB(cb), 500);
  }

  // ═══════════════════════════════════════════════════════════════
  // PART 1: AD CODE (AdSense + Adsterra fallback)
  // ═══════════════════════════════════════════════════════════════
  // YAHAN APNI ADSENSE / ADSTERRA DETAILS LAGAYEIN
  const AD_CONFIG = {
    network: 'adsense', // 'adsense' ya 'adsterra'
    adsense: {
      publisherId: 'ca-app-pub-9780067506108310', // <-- Apna AdSense publisher ID
      adSlot: '1234567890'                        // <-- Apna Ad Slot ID (AdSense dashboard se)
    },
    adsterra: {
      // Agar AdSense approve nahi hai toh Adsterra use karein
      directLink: 'https://www.profitableratecpm.com/XXXXX', // <-- Adsterra se milega
      bannerKey: 'XXXXXXXX' // <-- Adsterra banner key
    }
  };

  // Ad display function (withdrawal ke baad call hota hai)
  window.showRealAd = function() {
    if (AD_CONFIG.network === 'adsense') {
      // AdSense auto-ads - already in <head> of index.html
      // Manual ad trigger
      try {
        (adsbygoogle = window.adsbygoogle || []).push({});
      } catch(e) { console.log('AdSense:', e); }
    } else {
      // Adsterra direct link
      const link = AD_CONFIG.adsterra.directLink;
      if (link && !link.includes('XXXXX')) {
        window.open(link, '_blank');
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // PART 2: WEBRTC FULL 2-USER LIVE (Firestore signaling)
  // ═══════════════════════════════════════════════════════════════
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  let pc = null;           // peer connection
  let guestStream = null;  // guest ka camera
  let hostStream = null;   // host ka camera
  let currentLiveRole = null; // 'host' | 'guest'
  let signalingUnsub = null;

  // HOST: Room banao aur offer bhejo
  window.startLiveAsHost = async function(mode) {
    try {
      currentLiveRole = 'host';
      if (hostStream) { hostStream.getTracks().forEach(t => t.stop()); }
      hostStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true
      });
      
      const solo = document.getElementById('solo-live-video');
      const left = document.getElementById('pk-video-left');
      if (mode === 'pk' && left) { left.srcObject = hostStream; left.muted = true; await left.play(); }
      else if (solo) { solo.srcObject = hostStream; solo.muted = true; await solo.play(); }

      const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      window.__liveRoomId = roomId;

      pc = new RTCPeerConnection(rtcConfig);
      hostStream.getTracks().forEach(track => pc.addTrack(track, hostStream));

      // Guest ka video aayega yahan
      pc.ontrack = (event) => {
        const pkRight = document.getElementById('pk-video-right');
        if (pkRight && event.streams[0]) {
          pkRight.srcObject = event.streams[0];
          pkRight.muted = false;
          pkRight.play().catch(e => console.log(e));
          // Switch to PK mode automatically
          document.getElementById('stream-solo-box')?.classList.add('hidden');
          document.getElementById('stream-pk-box')?.classList.remove('hidden');
          toast('👤 Guest joined!');
        }
      };

      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          await firebase.firestore().collection('live_rooms').doc(roomId)
            .collection('host_ice').add(e.candidate.toJSON());
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await firebase.firestore().collection('live_rooms').doc(roomId).set({
        roomId, host: fmt(localStorage.getItem('SUPER_APP_CURRENT_USER')),
        mode, status: 'waiting',
        offer: { type: offer.type, sdp: offer.sdp },
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Guest ka answer suno
      const answerUnsub = firebase.firestore().collection('live_rooms').doc(roomId)
        .onSnapshot(async (doc) => {
          const data = doc.data();
          if (data && data.answer && pc.signalingState !== 'stable') {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              toast('✅ Guest connected!');
            } catch(e) { console.log(e); }
          }
        });

      // Guest ke ICE candidates suno
      const guestIceUnsub = firebase.firestore().collection('live_rooms').doc(roomId)
        .collection('guest_ice').onSnapshot(snap => {
          snap.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              try { await pc.addIceCandidate(new RTCIceCandidate(change.doc.data())); } catch(e) { console.log(e); }
            }
          });
        });

      signalingUnsub = () => { answerUnsub(); guestIceUnsub(); };

      toast('🔴 Live started! Invite link copy karein.');
      return roomId;
    } catch(e) {
      console.error(e);
      toast('❌ Error: ' + e.message);
      return null;
    }
  };

  // GUEST: Room join karo
  window.joinLiveAsGuest = async function(roomId) {
    try {
      currentLiveRole = 'guest';
      guestStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, audio: true
      });

      const pkRight = document.getElementById('pk-video-right');
      if (pkRight) { pkRight.srcObject = guestStream; pkRight.muted = true; await pkRight.play(); }

      pc = new RTCPeerConnection(rtcConfig);
      guestStream.getTracks().forEach(track => pc.addTrack(track, guestStream));

      // Host ka video
      pc.ontrack = (event) => {
        const pkLeft = document.getElementById('pk-video-left');
        if (pkLeft && event.streams[0]) {
          pkLeft.srcObject = event.streams[0];
          pkLeft.play().catch(e => console.log(e));
        }
      };

      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          await firebase.firestore().collection('live_rooms').doc(roomId)
            .collection('guest_ice').add(e.candidate.toJSON());
        }
      };

      const roomDoc = await firebase.firestore().collection('live_rooms').doc(roomId).get();
      if (!roomDoc.exists) { toast('❌ Room nahi mila'); return; }
      const roomData = roomDoc.data();

      await pc.setRemoteDescription(new RTCSessionDescription(roomData.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await firebase.firestore().collection('live_rooms').doc(roomId).update({
        answer: { type: answer.type, sdp: answer.sdp },
        guest: fmt(localStorage.getItem('SUPER_APP_CURRENT_USER')),
        status: 'connected'
      });

      // Host ke ICE candidates suno
      const hostIceUnsub = firebase.firestore().collection('live_rooms').doc(roomId)
        .collection('host_ice').onSnapshot(snap => {
          snap.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              try { await pc.addIceCandidate(new RTCIceCandidate(change.doc.data())); } catch(e) { console.log(e); }
            }
          });
        });

      signalingUnsub = hostIceUnsub;

      // Show PK mode
      document.getElementById('stream-solo-box')?.classList.add('hidden');
      document.getElementById('stream-pk-box')?.classList.remove('hidden');
      toast('✅ Live room joined!');
    } catch(e) {
      console.error(e);
      toast('❌ Join error: ' + e.message);
    }
  };

  // Leave live cleanup
  window.leaveLiveCompletely = function() {
    if (pc) { try { pc.close(); } catch(e){} pc = null; }
    if (guestStream) { guestStream.getTracks().forEach(t => t.stop()); guestStream = null; }
    if (hostStream) { hostStream.getTracks().forEach(t => t.stop()); hostStream = null; }
    if (signalingUnsub) { try { signalingUnsub(); } catch(e){} signalingUnsub = null; }
    if (window.__liveRoomId) {
      try {
        firebase.firestore().collection('live_rooms').doc(window.__liveRoomId).update({ status: 'ended' });
      } catch(e){}
      window.__liveRoomId = null;
    }
    currentLiveRole = null;
    toast('Live ended');
  };

  // ═══════════════════════════════════════════════════════════════
  // PART 3: PRIVACY / TERMS / DISCLAIMER (auto-inject)
  // ═══════════════════════════════════════════════════════════════
  function injectLegalPages() {
    if (document.getElementById('privacyModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="privacyModal" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[80] space-y-4">
        <div class="flex justify-between items-center border-b border-cyan-500/40 pb-3">
          <h2 class="text-base font-bold text-cyan-400"><i class="fa-solid fa-shield-halved"></i> Privacy Policy</h2>
          <button onclick="closeModal('privacyModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="text-xs text-gray-300 space-y-3 leading-relaxed">
          <p class="text-[10px] text-gray-500">Last Updated: 2026</p>
          <h3 class="text-cyan-400 font-bold">1. Information We Collect</h3>
          <p>Hum ye information collect karte hain: username, password (hashed), phone number, email (optional), profile photo, posts, messages, device info.</p>
          <h3 class="text-cyan-400 font-bold">2. How We Use Your Data</h3>
          <p>Aapka data use hota hai: account access, content share, ads display, feature improvement. Hum aapka data kisi third party ko bechte nahi hain.</p>
          <h3 class="text-cyan-400 font-bold">3. Cookies & Advertising</h3>
          <p>Hum Google AdSense/Adsterra use karte hain. Ye ad networks aapki interests ke hisaab se ads dikhate hain. Aap browser settings se cookies block kar sakte hain.</p>
          <h3 class="text-cyan-400 font-bold">4. Data Security</h3>
          <p>Aapka data Firebase (Google Cloud) mein encrypted store hota hai. Hum HTTPS use karte hain. Password plain text mein nahi rakha jata.</p>
          <h3 class="text-cyan-400 font-bold">5. Your Rights</h3>
          <p>Aap kabhi bhi apna account delete kar sakte hain. Aapka data 30 din mein permanently remove ho jayega.</p>
          <h3 class="text-cyan-400 font-bold">6. Children's Privacy</h3>
          <p>Ye app 13 saal se kam umar ke bachon ke liye nahi hai. Agar aap 18 saal se kam hain toh parent permission zaroori hai.</p>
          <h3 class="text-cyan-400 font-bold">7. Contact Us</h3>
          <p>Koi bhi sawaal ho toh: <b>support@superapp.com</b> (apna email daalein)</p>
          <p class="text-[10px] text-gray-500 pt-3 border-t border-gray-800">© 2026 Super App. All rights reserved.</p>
        </div>
      </div>

      <div id="termsModal" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[80] space-y-4">
        <div class="flex justify-between items-center border-b border-cyan-500/40 pb-3">
          <h2 class="text-base font-bold text-cyan-400"><i class="fa-solid fa-file-contract"></i> Terms of Service</h2>
          <button onclick="closeModal('termsModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="text-xs text-gray-300 space-y-3 leading-relaxed">
          <h3 class="text-cyan-400 font-bold">1. Acceptance</h3>
          <p>Super App use karke aap in terms ko accept karte hain. Agar aap agree nahi karte toh app use na karein.</p>
          <h3 class="text-cyan-400 font-bold">2. Account Responsibility</h3>
          <p>Aap apne account ke password ki zimmedari lete hain. Aapki account se hone wali har activity aapki zimmedari hai.</p>
          <h3 class="text-cyan-400 font-bold">3. Prohibited Content</h3>
          <p>Ye cheezein allowed nahi hain: illegal content, violence, nudity, harassment, spam, copyright infringement, hate speech, fake news.</p>
          <h3 class="text-cyan-400 font-bold">4. Reporting & Bans</h3>
          <p>Agar koi user aapki content ko 5 baar report karta hai toh aapka account ban ho jayega. Galat reports bhi bannable hain.</p>
          <h3 class="text-cyan-400 font-bold">5. Earnings & Withdrawals</h3>
          <p>Gifts se mila paisa real balance mein add hota hai. Withdrawal ke liye KYC zaroori hai. 5,000+ views pe 30% revenue share.</p>
          <h3 class="text-cyan-400 font-bold">6. Termination</h3>
          <p>Hum kisi bhi account ko bina warning ke terminate kar sakte hain agar aap ye terms violate karein.</p>
          <h3 class="text-cyan-400 font-bold">7. Changes</h3>
          <p>Hum terms kabhi bhi update kar sakte hain. Continued use = acceptance of new terms.</p>
        </div>
      </div>

      <div id="disclaimerModal" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[80] space-y-4">
        <div class="flex justify-between items-center border-b border-amber-500/40 pb-3">
          <h2 class="text-base font-bold text-amber-400"><i class="fa-solid fa-triangle-exclamation"></i> Disclaimer</h2>
          <button onclick="closeModal('disclaimerModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="text-xs text-gray-300 space-y-3 leading-relaxed">
          <h3 class="text-amber-400 font-bold">📈 Trading Disclaimer</h3>
          <p>Super App mein diye gaye market charts, analysis, aur signals sirf <b>educational purpose</b> ke liye hain. Ye koi financial advice nahi hai.</p>
          <p>Trading mein loss/profit aapki zimmedari hai. Hum kisi bhi loss ke liye responsible nahi hain. Trading mein risk hai, apna paisa invest karne se pehle research karein.</p>
          <h3 class="text-amber-400 font-bold">💰 Earning Disclaimer</h3>
          <p>App mein earning features (gifts, ads, views) se hone wali income guaranteed nahi hai. Ye aapke content aur audience pe depend karta hai.</p>
          <h3 class="text-amber-400 font-bold">🌐 User Content</h3>
          <p>Users jo bhi content upload karte hain, uske liye wo khud zimmedar hain. Copyright violation pe account ban hoga.</p>
          <h3 class="text-amber-400 font-bold">⚖️ Legal</h3>
          <p>Ye app kisi bhi country ke laws ko violate karne ke liye nahi banaya gaya. Use karne se pehle apne local laws check karein.</p>
          <p class="text-[10px] text-gray-500 pt-3 border-t border-gray-800">Agar aap in disclaimers se agree nahi karte toh app use na karein.</p>
        </div>
      </div>
    `);
  }

  window.openPrivacyModal = function() { openM('privacyModal'); };
  window.openTermsModal = function() { openM('termsModal'); };
  window.openDisclaimerModal = function() { openM('disclaimerModal'); };

  // ═══════════════════════════════════════════════════════════════
  // PART 4: APP ICON GENERATOR (SVG → PNG download)
  // ═══════════════════════════════════════════════════════════════
  const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00f2fe"/>
        <stop offset="50%" stop-color="#4facfe"/>
        <stop offset="100%" stop-color="#ff0055"/>
      </linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="8" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="512" height="512" rx="112" fill="#090d16"/>
    <circle cx="256" cy="256" r="220" fill="none" stroke="url(#mg)" stroke-width="10" filter="url(#glow)"/>
    <polygon points="256,90 400,168 400,344 256,422 112,344 112,168" fill="none" stroke="url(#mg)" stroke-width="5" opacity="0.35"/>
    <path d="M 200 170 Q 200 130 256 130 Q 312 130 312 170 Q 312 210 256 230 Q 200 250 200 290 Q 200 330 256 330 Q 312 330 312 290" fill="none" stroke="url(#mg)" stroke-width="28" stroke-linecap="round" filter="url(#glow)"/>
    <path d="M 400 100 L 408 130 L 438 138 L 408 146 L 400 176 L 392 146 L 362 138 L 392 130 Z" fill="#00f2fe"/>
  </svg>`;

  window.openIconGeneratorModal = function() {
    if (document.getElementById('iconGenModal')) { openM('iconGenModal'); return; }
    document.body.insertAdjacentHTML('beforeend', `
      <div id="iconGenModal" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[80] space-y-4">
        <div class="flex justify-between items-center border-b border-cyan-500/40 pb-3">
          <h2 class="text-base font-bold text-cyan-400"><i class="fa-solid fa-image"></i> App Icon Generator</h2>
          <button onclick="closeModal('iconGenModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="text-xs text-gray-400">Play Store ke liye 512x512 icon chahiye. Ye generator aapko 4 sizes dega.</p>
        <div class="bg-gray-900 border border-cyan-500/30 rounded-xl p-4 space-y-3">
          <div class="flex justify-center">
            <div class="w-40 h-40 bg-gray-950 rounded-2xl p-4 border border-cyan-500/40">${LOGO_SVG}</div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="downloadLogoSize(512)" class="py-2.5 btn-gradient text-white font-bold text-xs rounded-xl">📥 512x512 (Play Store)</button>
            <button onclick="downloadLogoSize(192)" class="py-2.5 bg-gray-800 border border-cyan-500/40 text-cyan-400 font-bold text-xs rounded-xl">📥 192x192</button>
            <button onclick="downloadLogoSize(1024)" class="py-2.5 bg-gray-800 border border-amber-500/40 text-amber-400 font-bold text-xs rounded-xl">📥 1024x1024</button>
            <button onclick="downloadFeatureGraphic()" class="py-2.5 bg-gray-800 border border-purple-500/40 text-purple-400 font-bold text-xs rounded-xl">📥 Feature Graphic</button>
          </div>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-3 text-[10px] text-gray-400 space-y-1">
          <p><b class="text-cyan-400">Play Store sizes:</b></p>
          <p>• App Icon: 512x512 PNG</p>
          <p>• Feature Graphic: 1024x500 PNG</p>
          <p>• Screenshots: 1080x1920 (5-8 pics)</p>
        </div>
      </div>
    `);
    openM('iconGenModal');
  };

  window.downloadLogoSize = function(size) {
    const blob = new Blob([LOGO_SVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob(b => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'superapp_icon_' + size + '.png';
        a.click();
        toast('✅ ' + size + 'x' + size + ' icon downloaded!');
      }, 'image/png');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  window.downloadFeatureGraphic = function() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 500;
    const ctx = canvas.getContext('2d');
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 500);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#0a1428');
    grad.addColorStop(1, '#1a0a1f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 500);
    // Decorative circles
    ctx.fillStyle = 'rgba(0,242,254,0.12)';
    ctx.beginPath(); ctx.arc(900, 100, 250, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,0,85,0.12)';
    ctx.beginPath(); ctx.arc(100, 450, 200, 0, Math.PI*2); ctx.fill();
    // Logo
    const logoImg = new Image();
    const logoBlob = new Blob([LOGO_SVG], { type: 'image/svg+xml' });
    const logoUrl = URL.createObjectURL(logoBlob);
    logoImg.onload = function() {
      ctx.drawImage(logoImg, 60, 130, 240, 240);
      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 90px system-ui, sans-serif';
      ctx.fillText('SUPER APP', 340, 240);
      // Subtitle
      ctx.font = '32px system-ui, sans-serif';
      ctx.fillStyle = '#00f2fe';
      ctx.fillText('Live • Trade • Earn', 340, 300);
      // Features
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('🎥 Reels   🎁 Gifts   📈 Trading', 340, 370);
      URL.revokeObjectURL(logoUrl);
      canvas.toBlob(b => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'superapp_feature_graphic_1024x500.png';
        a.click();
        toast('✅ Feature Graphic downloaded!');
      }, 'image/png');
    };
    logoImg.src = logoUrl;
  };

  // ═══════════════════════════════════════════════════════════════
  // PART 5: CAPACITOR GUIDE (HTML → APK)
  // ═══════════════════════════════════════════════════════════════
  window.openCapacitorGuide = function() {
    if (document.getElementById('capacitorModal')) { openM('capacitorModal'); return; }
    document.body.insertAdjacentHTML('beforeend', `
      <div id="capacitorModal" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[80] space-y-4">
        <div class="flex justify-between items-center border-b border-cyan-500/40 pb-3">
          <h2 class="text-base font-bold text-cyan-400"><i class="fa-solid fa-mobile-screen"></i> HTML → APK Guide</h2>
          <button onclick="closeModal('capacitorModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="text-xs text-gray-300 space-y-3 leading-relaxed">
          <h3 class="text-cyan-400 font-bold">📱 Kaise APK banayein (Termux se):</h3>
          <div class="bg-gray-950 border border-gray-800 rounded-xl p-3 font-mono text-[10px] text-green-400 space-y-1 overflow-x-auto">
            <p># 1. Termux mein ye run karein</p>
            <p>pkg install nodejs npm git -y</p>
            <p>npm install -g @capacitor/cli</p>
            <p>&nbsp;</p>
            <p># 2. Apne project folder mein jaayein</p>
            <p>cd ~/SuperAppNew</p>
            <p>&nbsp;</p>
            <p># 3. Capacitor initialize karein</p>
            <p>npx cap init "Super App" com.umar.superapp --web-dir=.</p>
            <p>&nbsp;</p>
            <p># 4. Android platform add karein</p>
            <p>npm install @capacitor/core @capacitor/android</p>
            <p>npx cap add android</p>
            <p>&nbsp;</p>
            <p># 5. Files sync karein</p>
            <p>npx cap sync</p>
            <p>&nbsp;</p>
            <p># 6. Android Studio mein kholein</p>
            <p>npx cap open android</p>
          </div>
          <h3 class="text-cyan-400 font-bold">🔨 APK Build karne ke liye:</h3>
          <p><b>Option A (Aasaan):</b> PWABuilder.com pe jaayein → URL daalein → APK download karein</p>
          <p><b>Option B (Advanced):</b> Android Studio mein "Build → Generate Signed Bundle/APK"</p>
          <h3 class="text-cyan-400 font-bold">📦 Play Store Upload:</h3>
          <p>1. AAB file banayein (Android Studio se)</p>
          <p>2. Play Console mein upload karein</p>
          <p>3. Content rating bharein</p>
          <p>4. Privacy Policy URL daalein</p>
          <p>5. Screenshots + Description daalein</p>
          <p>6. Submit → 3-7 din mein review</p>
          <h3 class="text-cyan-400 font-bold">⚠️ Zaroori Notes:</h3>
          <p>• App mein HTTPS URLs use karein</p>
          <p>• Vercel pe host karein taake hamesha online rahe</p>
          <p>• Target SDK 34+ rakhein (Android 14)</p>
          <p>• Permissions: CAMERA, MICROPHONE, INTERNET</p>
          <h3 class="text-cyan-400 font-bold">🔗 Alternative Tools:</h3>
          <p>• <b>PWABuilder</b> (pwabuilder.com) — sabse aasaan</p>
          <p>• <b>Median.co</b> — paid but professional</p>
          <p>• <b>WebIntoApp</b> — free quick solution</p>
        </div>
      </div>
    `);
    openM('capacitorModal');
  };

  // ═══════════════════════════════════════════════════════════════
  // INJECT BUTTONS IN SETTINGS MODAL
  // ═══════════════════════════════════════════════════════════════
  function injectSettingsButtons() {
    const settingsModal = document.getElementById('settingsModal');
    if (!settingsModal || document.getElementById('settings-launchkit')) return;

    const walletBox = settingsModal.querySelector('.bg-gray-900');
    if (!walletBox) return;

    const div = document.createElement('div');
    div.id = 'settings-launchkit';
    div.className = 'bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2';
    div.innerHTML = `
      <h3 class="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5 mb-2">
        <i class="fa-solid fa-rocket"></i> Launch Kit
      </h3>
      <button onclick="openPrivacyModal()" class="w-full py-2 bg-gray-800 border border-cyan-500/40 text-cyan-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
        <i class="fa-solid fa-shield-halved"></i> Privacy Policy
      </button>
      <button onclick="openTermsModal()" class="w-full py-2 bg-gray-800 border border-blue-500/40 text-blue-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
        <i class="fa-solid fa-file-contract"></i> Terms of Service
      </button>
      <button onclick="openDisclaimerModal()" class="w-full py-2 bg-gray-800 border border-amber-500/40 text-amber-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
        <i class="fa-solid fa-triangle-exclamation"></i> Disclaimer
      </button>
      <button onclick="openIconGeneratorModal()" class="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
        <i class="fa-solid fa-image"></i> App Icon Generator
      </button>
      <button onclick="openCapacitorGuide()" class="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
        <i class="fa-solid fa-mobile-screen"></i> APK Build Guide
      </button>
    `;
    walletBox.parentNode.insertBefore(div, walletBox.nextSibling);
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    injectLegalPages();
    setTimeout(injectSettingsButtons, 2000);
    // Watch for login
    let lastU = null;
    setInterval(() => {
      const c = localStorage.getItem('SUPER_APP_CURRENT_USER');
      if (c !== lastU) {
        lastU = c;
        if (c) setTimeout(injectSettingsButtons, 1500);
      }
    }, 2000);
    console.log('🚀 Launch Kit loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // ═══════════════════════════════════════════════════════════════
  // AUTO-HOOK: Override openLiveStreamRoom for WebRTC
  // ═══════════════════════════════════════════════════════════════
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Purane function ko save karo
      const oldOpen = window.openLiveStreamRoom;
      if (typeof oldOpen === 'function' && !window.__liveHooked) {
        window.__liveHooked = true;
        window.openLiveStreamRoom = async function(mode) {
          // Purana UI open karne wala code
          const soloBox = document.getElementById('stream-solo-box');
          const pkBox = document.getElementById('stream-pk-box');
          if (mode === 'pk') {
            soloBox?.classList.add('hidden');
            pkBox?.classList.remove('hidden');
            const t = document.getElementById('stream-type-title');
            if (t) t.innerText = "⚔️ 2-PLAYER PK MATCH LIVE";
          } else {
            pkBox?.classList.add('hidden');
            soloBox?.classList.remove('hidden');
            const t = document.getElementById('stream-type-title');
            if (t) t.innerText = "🔴 SOLO LIVE STREAM";
          }
          openM('liveStreamModal');
          // WebRTC host start karo
          await window.startLiveAsHost(mode);
        };
      }
      // Close button hook - cleanup
      const oldClose = window.closeLiveStream;
      if (typeof oldClose === 'function' && !window.__closeHooked) {
        window.__closeHooked = true;
        window.closeLiveStream = function() {
          window.leaveLiveCompletely();
          closeM('liveStreamModal');
        };
      }
    }, 3000);
  });

  // Export for manual use
  window.__LAUNCH_KIT__ = {
    AD_CONFIG,
    startLiveAsHost: window.startLiveAsHost,
    joinLiveAsGuest: window.joinLiveAsGuest,
    showRealAd: window.showRealAd
  };
})();
