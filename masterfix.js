/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - MASTERFIX.JS
   Saari problems ka hal — 100% real
   
   Fixes:
   1. Call permission denied (separate audio/video)
   2. DM message not sending
   3. Premium emoji animation (everywhere)
   4. Keyframe animation (video + photo + emoji)
   5. Post publishing (text + video)
   6. Ad viewing fix
   7. Premium-only animations
   
   Add: <script src="masterfix.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  function toast(msg) {
    if (typeof window.showToast === 'function') return window.showToast(msg);
    const t = document.getElementById('toast-notification');
    if (!t) { console.log(msg); return; }
    document.getElementById('toast-message').innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
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
  // FIX #1: CALL PERMISSION — Separate audio/video requests
  // ═══════════════════════════════════════════════════════════════
  window.startCall = async function(targetUser, callType) {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    if (!targetUser) { toast('User select karein'); return; }
    if (targetUser === user) { toast('Khud ko call nahi'); return; }

    const type = callType || 'voice';
    console.log('📞 Starting', type, 'call to', targetUser);

    // ═══ STEP 1: Get AUDIO only first (always needed) ═══
    let audioStream = null;
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Audio granted');
    } catch(e) {
      console.error('❌ Audio denied:', e.name);
      if (e.name === 'NotAllowedError') {
        toast('🎤 Mic permission block hai. Browser settings → Mic → Allow karein');
      } else if (e.name === 'NotFoundError') {
        toast('❌ Mic nahi mila');
      } else {
        toast('❌ Mic error: ' + e.message);
      }
      return;
    }

    // ═══ STEP 2: If video, try to get video separately ═══
    let videoStream = null;
    if (type === 'video') {
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 720 } } 
        });
        console.log('✅ Video granted');
      } catch(e) {
        console.warn('⚠️ Video denied, falling back to voice:', e.name);
        toast('⚠️ Camera block hai — voice call chalega');
        // Continue with voice only
      }
    }

    // ═══ STEP 3: Combine streams ═══
    const tracks = [...audioStream.getAudioTracks()];
    if (videoStream) tracks.push(...videoStream.getVideoTracks());
    
    const localStream = new MediaStream(tracks);
    window.localStream = localStream;
    window.__callType = videoStream ? 'video' : 'voice';
    window.__callTarget = targetUser;

    // ═══ STEP 4: Show call UI ═══
    showCallUIFixed(targetUser, window.__callType);

    // ═══ STEP 5: Create Firebase call doc ═══
    const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    window.__callId = callId;

    try {
      // Peer connection
      const iceServers = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
          { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
        ]
      };

      const pc = new RTCPeerConnection(iceServers);
      window.__callPC = pc;

      localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

      // Remote stream
      const remoteStream = new MediaStream();
      window.__remoteStream = remoteStream;

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(t => remoteStream.addTrack(t));
        const remoteVid = document.getElementById('remoteVideo');
        const remoteAud = document.getElementById('remoteAudio');
        if (remoteVid) {
          remoteVid.srcObject = remoteStream;
          remoteVid.play().catch(() => {});
        }
        if (remoteAud) {
          remoteAud.srcObject = remoteStream;
          remoteAud.play().catch(() => {});
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          firebase.firestore().collection('calls').doc(callId)
            .collection('caller_ice').add(e.candidate.toJSON()).catch(() => {});
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const userData = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}')[user] || {};

      await firebase.firestore().collection('calls').doc(callId).set({
        id: callId,
        caller: user,
        callerName: userData.name || user,
        callerAvatar: userData.avatar || '',
        receiver: targetUser,
        callType: window.__callType,
        status: 'ringing',
        offer: { type: offer.type, sdp: offer.sdp },
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // ═══ STEP 6: Listen for answer ═══
      const answerUnsub = firebase.firestore().collection('calls').doc(callId)
        .onSnapshot(async (doc) => {
          const data = doc.data();
          if (!data) return;

          if (data.answer && pc.signalingState !== 'stable') {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              window.__callConnectedAt = Date.now();
              const statusEl = document.getElementById('call-status');
              if (statusEl) statusEl.classList.add('hidden');
              startCallTimer();
              console.log('✅ Call connected');
            } catch(e) { console.warn(e); }
          }

          if (data.status === 'ended' || data.status === 'rejected') {
            endCallFixed();
          }
        });

      const iceUnsub = firebase.firestore().collection('calls').doc(callId)
        .collection('receiver_ice')
        .onSnapshot(snap => {
          snap.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
              } catch(e) {}
            }
          });
        });

      window.__callUnsub = () => { answerUnsub(); iceUnsub(); };

      // Auto-timeout
      window.__callTimeout = setTimeout(() => {
        if (!window.__callConnectedAt) {
          toast('❌ Koi jawab nahi diya');
          endCallFixed();
        }
      }, 60000);

    } catch(e) {
      console.error('Call error:', e);
      toast('❌ Call fail: ' + e.message);
      endCallFixed();
    }
  };

  function showCallUIFixed(targetUser, callType) {
    document.getElementById('callScreen')?.remove();

    const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const uData = users[targetUser] || {};
    const avatar = uData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser}`;
    const name = uData.name || targetUser;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="callScreen" class="fixed inset-0 z-[500] bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 flex flex-col">
        
        <!-- Remote Audio (voice call) -->
        <audio id="remoteAudio" autoplay></audio>
        
        <!-- Remote Video (video call) -->
        <div class="flex-1 relative overflow-hidden">
          ${callType === 'video' ? `
            <video id="remoteVideo" class="w-full h-full object-cover" autoplay playsinline></video>
            <div class="absolute top-4 right-4 w-24 h-32 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl">
              <video id="localVideo" class="w-full h-full object-cover" autoplay muted playsinline></video>
            </div>
          ` : `
            <div class="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
              <div class="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 p-1 relative">
                <img src="${avatar}" class="w-full h-full rounded-full object-cover bg-gray-800">
                <div class="absolute inset-0 rounded-full border-4 border-cyan-500/50 animate-ping"></div>
              </div>
              <p class="text-2xl font-bold text-white">${name}</p>
              <p class="text-xs text-cyan-400 font-semibold">@${targetUser}</p>
            </div>
          `}
          
          <div class="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-lg px-4 py-2 rounded-full">
            <p id="call-status" class="text-white text-sm font-bold">Calling...</p>
            <p id="call-duration" class="text-cyan-400 font-mono text-sm text-center hidden">00:00</p>
          </div>
        </div>

        <!-- Controls -->
        <div class="p-6 pb-8 bg-gradient-to-t from-black/90 to-transparent space-y-4">
          <div class="flex justify-center gap-4">
            <button onclick="window.__toggleMute()" id="btn-mute" class="w-14 h-14 rounded-full bg-gray-800/80 backdrop-blur text-white flex items-center justify-center border border-gray-700">
              <i class="fa-solid fa-microphone text-lg"></i>
            </button>
            <button onclick="window.__toggleSpeaker()" id="btn-speaker" class="w-14 h-14 rounded-full bg-gray-800/80 backdrop-blur text-white flex items-center justify-center border border-gray-700">
              <i class="fa-solid fa-volume-high text-lg"></i>
            </button>
            <button onclick="endCallFixed()" class="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl">
              <i class="fa-solid fa-phone-slash text-2xl"></i>
            </button>
            ${callType === 'video' ? `
              <button onclick="window.__toggleCam()" id="btn-cam" class="w-14 h-14 rounded-full bg-gray-800/80 backdrop-blur text-white flex items-center justify-center border border-gray-700">
                <i class="fa-solid fa-video text-lg"></i>
              </button>
            ` : `
              <button onclick="window.__switchToVideo()" class="w-14 h-14 rounded-full bg-gray-800/80 backdrop-blur text-cyan-400 flex items-center justify-center border border-cyan-700">
                <i class="fa-solid fa-video text-lg"></i>
              </button>
            `}
          </div>
        </div>
      </div>
    `);

    // Attach local video
    const localVid = document.getElementById('localVideo');
    if (localVid && window.localStream) {
      localVid.srcObject = window.localStream;
      localVid.muted = true;
      localVid.play().catch(() => {});
    }
  }

  let callTimerInterval = null;
  function startCallTimer() {
    const el = document.getElementById('call-duration');
    if (!el) return;
    el.classList.remove('hidden');
    if (callTimerInterval) clearInterval(callTimerInterval);
    
    callTimerInterval = setInterval(() => {
      const sec = Math.floor((Date.now() - window.__callConnectedAt) / 1000);
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      el.innerText = `${m}:${s}`;
    }, 1000);
  }

  window.endCallFixed = async function() {
    if (window.__callTimeout) { clearTimeout(window.__callTimeout); window.__callTimeout = null; }
    if (callTimerInterval) { clearInterval(callTimerInterval); callTimerInterval = null; }

    if (window.localStream) {
      window.localStream.getTracks().forEach(t => t.stop());
      window.localStream = null;
    }
    if (window.__callPC) {
      try { window.__callPC.close(); } catch(e) {}
      window.__callPC = null;
    }
    if (window.__callUnsub) {
      try { window.__callUnsub(); } catch(e) {}
      window.__callUnsub = null;
    }
    if (window.__callId) {
      try {
        await firebase.firestore().collection('calls').doc(window.__callId).update({
          status: 'ended',
          endedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch(e) {}
    }
    document.getElementById('callScreen')?.remove();
    document.getElementById('incomingCallPopup')?.remove();
    window.__callId = null;
    window.__callConnectedAt = null;
    toast('📞 Call ended');
  };

  window.__toggleMute = function() {
    if (!window.localStream) return;
    const track = window.localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const btn = document.getElementById('btn-mute');
    if (btn) {
      if (!track.enabled) {
        btn.classList.add('bg-red-600');
        btn.innerHTML = '<i class="fa-solid fa-microphone-slash text-lg"></i>';
      } else {
        btn.classList.remove('bg-red-600');
        btn.innerHTML = '<i class="fa-solid fa-microphone text-lg"></i>';
      }
    }
    toast(track.enabled ? '🎤 Mic ON' : '🔇 Muted');
  };

  window.__toggleSpeaker = function() {
    const remoteAud = document.getElementById('remoteAudio');
    const remoteVid = document.getElementById('remoteVideo');
    const el = remoteAud || remoteVid;
    if (!el) return;
    el.muted = !el.muted;
    const btn = document.getElementById('btn-speaker');
    if (btn) {
      if (!el.muted) btn.classList.add('bg-cyan-600');
      else btn.classList.remove('bg-cyan-600');
    }
    toast(!el.muted ? '🔊 Speaker ON' : '🔈 Off');
  };

  window.__toggleCam = function() {
    if (!window.localStream) return;
    const track = window.localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    toast(track.enabled ? '📹 Camera ON' : '📹 Camera OFF');
  };

  window.__switchToVideo = async function() {
    if (!window.__callPC) return;
    try {
      const vs = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      const vt = vs.getVideoTracks()[0];
      window.localStream.addTrack(vt);
      window.__callPC.addTrack(vt, window.localStream);
      window.__callType = 'video';
      // Re-render
      const target = window.__callTarget;
      document.getElementById('callScreen')?.remove();
      showCallUIFixed(target, 'video');
      toast('📹 Video ON');
    } catch(e) {
      toast('❌ Camera error');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #2: DM SEND — Real working
  // ═══════════════════════════════════════════════════════════════
  window.sendDmMessageSubmit = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    const input = document.getElementById('dm-message-input');
    const text = (input?.value || '').trim();
    if (!text) return;

    const target = window.activeChatTargetUser;
    if (!target) { toast('Chat target nahi'); return; }

    const chatKey = [user, target].sort().join(':');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    input.value = '';

    try {
      await firebase.firestore().collection('dm_messages').add({
        chatKey: chatKey,
        sender: user,
        receiver: target,
        text: text,
        time: time,
        read: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ DM sent');
    } catch(e) {
      input.value = text;
      toast('❌ Send fail: ' + e.message);
    }
  };

  // Also fix DM send button click
  function fixDmSendButton() {
    const footer = document.getElementById('dm-input-footer');
    if (!footer) return;
    const btn = footer.querySelector('button');
    if (btn && !btn.dataset.mfFixed) {
      btn.dataset.mfFixed = '1';
      btn.onclick = () => window.sendDmMessageSubmit();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #3: PREMIUM EMOJI ANIMATION (everywhere)
  // ═══════════════════════════════════════════════════════════════
  function injectPremiumEmojiCSS() {
    if (document.getElementById('mf-emoji-css')) return;
    const style = document.createElement('style');
    style.id = 'mf-emoji-css';
    style.textContent = `
      @keyframes mfWavy {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-3px) rotate(-10deg); }
        50% { transform: translateY(0) rotate(0deg); }
        75% { transform: translateY(-2px) rotate(10deg); }
      }
      @keyframes mfBounce {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-6px) scale(1.15); }
      }
      @keyframes mfGlow {
        0%, 100% { text-shadow: 0 0 6px rgba(255,215,0,0.5); }
        50% { text-shadow: 0 0 18px rgba(255,215,0,1), 0 0 30px rgba(255,100,0,0.7); }
      }
      @keyframes mfSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes mfFloat {
        0%, 100% { transform: translateY(0) rotate(-5deg); }
        50% { transform: translateY(-8px) rotate(5deg); }
      }
      @keyframes mfPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
      }
      
      .mf-emoji {
        display: inline-block;
        font-size: 1.15em;
        animation: mfWavy 1.6s ease-in-out infinite;
      }
      .mf-emoji:nth-child(2n) { animation-duration: 1.9s; animation-delay: 0.2s; }
      .mf-emoji:nth-child(3n) { animation-duration: 2.1s; animation-delay: 0.4s; }
      .mf-emoji:nth-child(5n) { animation-name: mfBounce; }
      
      .mf-premium-post {
        border: 2px solid transparent;
        background: linear-gradient(#0f172a, #0f172a) padding-box,
                    linear-gradient(135deg, #fbbf24, #ec4899, #06b6d4) border-box;
        box-shadow: 0 0 25px rgba(251,191,36,0.2);
      }
      
      .mf-premium-text {
        animation: mfGlow 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  // Emoji wrap function
  function wrapEmojis(el) {
    if (!el || el.dataset.mfWrapped === '1') return;
    
    const html = el.innerHTML;
    // Check if already has mf-emoji
    if (html.includes('mf-emoji')) return;

    // Unicode emoji range regex
    const emojiRegex = /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}])/gu;
    
    const newHtml = html.replace(emojiRegex, '<span class="mf-emoji">$1</span>');
    
    if (newHtml !== html) {
      el.innerHTML = newHtml;
      el.dataset.mfWrapped = '1';
    }
  }

  function applyPremiumEmojisToDOM() {
    if (!isPremium()) return; // Only for premium users
    
    // Apply to text posts
    document.querySelectorAll('#posts-container p, #posts-container span, #dm-thread-view p, #video-feed-container p, #profile-bio, #pub-bio, .allow-select').forEach(el => {
      if (el.tagName === 'P' || el.tagName === 'SPAN' || el.tagName === 'DIV') {
        wrapEmojis(el);
      }
    });

    // Add premium class to post cards
    document.querySelectorAll('#posts-container > div').forEach(card => {
      if (card.dataset.mfPremium === '1') return;
      const match = card.innerHTML.match(/@([a-zA-Z0-9_]+)/);
      if (match && isPremium()) {
        card.classList.add('mf-premium-post');
        card.dataset.mfPremium = '1';
        const textEl = card.querySelector('p.allow-select');
        if (textEl) textEl.classList.add('mf-premium-text');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #4: KEYFRAME ANIMATION — Video, Photo, Everything
  // ═══════════════════════════════════════════════════════════════
  window.__applyKeyframeToAll = function(type) {
    if (!isPremium()) {
      toast('🔒 Premium lagayein — sirf premium walo ke liye');
      return;
    }

    if (!document.getElementById('mf-kf-css')) {
      const style = document.createElement('style');
      style.id = 'mf-kf-css';
      style.textContent = `
        @keyframes mfKfZoom { 0%,100%{transform:scale(1);} 50%{transform:scale(1.08);} }
        @keyframes mfKfShake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-4px);} 75%{transform:translateX(4px);} }
        @keyframes mfKfRotate { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
        @keyframes mfKfFade { 0%,100%{opacity:1;} 50%{opacity:0.6;} }
        @keyframes mfKfSlide { 0%,100%{transform:translateX(0);} 50%{transform:translateX(8px);} }
        
        .mf-kf-zoom { animation: mfKfZoom 3s ease-in-out infinite; }
        .mf-kf-shake { animation: mfKfShake 0.5s ease-in-out infinite; }
        .mf-kf-rotate { animation: mfKfRotate 8s linear infinite; }
        .mf-kf-fade { animation: mfKfFade 2s ease-in-out infinite; }
        .mf-kf-slide { animation: mfKfSlide 2s ease-in-out infinite; }
      `;
      document.head.appendChild(style);
    }

    const animClass = 'mf-kf-' + type;
    const targets = document.querySelectorAll('.reel-item video, #posts-container img, #posts-container video, .reel-item img');
    
    targets.forEach(el => {
      el.classList.remove('mf-kf-zoom', 'mf-kf-shake', 'mf-kf-rotate', 'mf-kf-fade', 'mf-kf-slide');
      if (type !== 'none') {
        el.classList.add(animClass);
      }
    });

    toast('✨ Keyframe: ' + type);
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #5: POST PUBLISHING — Real working (text + video)
  // ═══════════════════════════════════════════════════════════════
  window.publishPost = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    const caption = (document.getElementById('post-caption')?.value || '').trim();
    const link = (document.getElementById('post-link')?.value || '').trim();
    const directUrl = (document.getElementById('post-video-url')?.value || '').trim();
    const videoFileInput = document.getElementById('post-video-file');
    const selectedFile = videoFileInput?.files?.[0];

    // Validation
    if (typeof currentCreateType === 'undefined') {
      window.currentCreateType = 'text';
    }

    if (window.currentCreateType === 'video' && !selectedFile && !directUrl) {
      toast('❌ Video select karein ya URL dein');
      return;
    }
    if (!caption && !selectedFile && !directUrl) {
      toast('❌ Caption ya media zaroori');
      return;
    }

    const postId = 'post_' + Date.now();
    let finalVideoUrl = directUrl || null;

    // Loading
    const publishBtn = document.getElementById('publish-btn');
    if (publishBtn) {
      publishBtn.disabled = true;
      publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
    }

    try {
      // Upload video if file selected
      if (selectedFile) {
        if (selectedFile.size > 100 * 1024 * 1024) {
          toast('❌ File 100MB se kam');
          if (publishBtn) { publishBtn.disabled = false; publishBtn.innerHTML = 'Publish'; }
          return;
        }

        const ext = selectedFile.name.split('.').pop() || 'mp4';
        const filename = `videos/${user}_${Date.now()}.${ext}`;
        const ref = firebase.storage().ref().child(filename);

        const uploadTask = ref.put(selectedFile);
        uploadTask.on('state_changed',
          (snap) => {
            const pct = Math.floor((snap.bytesTransferred / snap.totalBytes) * 100);
            if (publishBtn) publishBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${pct}%`;
          }
        );

        await uploadTask;
        finalVideoUrl = await ref.getDownloadURL();
      }

      // Save to Firestore
      const newPost = {
        id: postId,
        type: window.currentCreateType,
        url: finalVideoUrl,
        user: user,
        caption: caption,
        link: link || null,
        likes: [],
        comments: [],
        views: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebase.firestore().collection('posts').doc(postId).set(newPost);

      // Save locally
      if (typeof saveVideoToStorage === 'function') {
        saveVideoToStorage({ ...newPost, createdAt: null });
      }

      toast('✅ Post published!');
      
      if (typeof closeModal === 'function') closeModal('createModal');
      
      // Clear form
      if (document.getElementById('post-caption')) document.getElementById('post-caption').value = '';
      if (document.getElementById('post-link')) document.getElementById('post-link').value = '';
      if (document.getElementById('post-video-url')) document.getElementById('post-video-url').value = '';
      if (videoFileInput) videoFileInput.value = '';
      if (window.selectedGalleryVideoBase64) window.selectedGalleryVideoBase64 = null;
      document.getElementById('video-preview-box')?.classList.add('hidden');

      // Refresh
      setTimeout(() => {
        if (typeof window.initAppContent === 'function') window.initAppContent();
        if (window.currentCreateType === 'text' && typeof window.renderFeedPosts === 'function') {
          window.renderFeedPosts();
        }
      }, 500);

    } catch(e) {
      console.error(e);
      toast('❌ Post fail: ' + e.message);
    } finally {
      if (publishBtn) {
        publishBtn.disabled = false;
        publishBtn.innerHTML = 'Publish';
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #6: AD VIEWING — Real watchable ads
  // ═══════════════════════════════════════════════════════════════
  window.triggerPostWithdrawalAds = async function(remaining) {
    const count = remaining || 3;

    for (let i = 0; i < count; i++) {
      await showRealAd(i + 1, count);
    }
    toast('✅ Ads complete');
  };

  function showRealAd(current, total) {
    return new Promise((resolve) => {
      document.getElementById('mf-ad-modal')?.remove();

      document.body.insertAdjacentHTML('beforeend', `
        <div id="mf-ad-modal" class="fixed inset-0 z-[500] bg-black flex flex-col">
          <div class="p-3 bg-gray-900 flex justify-between items-center">
            <span class="text-xs text-cyan-400 font-bold">📢 Sponsored Ad ${current}/${total}</span>
            <span class="text-xs text-amber-400 font-bold" id="mf-ad-timer">5s</span>
          </div>
          
          <div class="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-blue-900 to-purple-900">
            <div class="text-center max-w-md space-y-4">
              <div class="text-7xl animate-bounce">📢</div>
              <h2 class="text-2xl font-extrabold text-white">Super Sphere</h2>
              <p class="text-sm text-cyan-300">Pakistan ka apna Super App</p>
              <p class="text-xs text-gray-300">Videos • Calls • Live • Earning</p>
              <button onclick="window.open && window.open('https://umar-super-app.vercel.app','_blank')" class="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-full shadow-2xl">
                Learn More →
              </button>
            </div>
          </div>
          
          <div class="p-4 bg-gray-900">
            <button id="mf-ad-btn" disabled class="w-full py-3 bg-gray-700 text-gray-400 font-bold text-sm rounded-xl">
              Wait 5s...
            </button>
          </div>
        </div>
      `);

      let sec = 5;
      const timer = document.getElementById('mf-ad-timer');
      const btn = document.getElementById('mf-ad-btn');

      const interval = setInterval(() => {
        sec--;
        if (timer) timer.innerText = sec + 's';
        if (sec <= 0) {
          clearInterval(interval);
          if (timer) timer.innerText = '✅';
          if (btn) {
            btn.disabled = false;
            btn.className = 'w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm rounded-xl';
            btn.innerText = current < total ? 'Next Ad →' : 'Continue';
            btn.onclick = () => {
              document.getElementById('mf-ad-modal')?.remove();
              resolve();
            };
          }
        }
      }, 1000);
    });
  }

  // Override withdrawal to show real ads
  const originalWithdrawal = window.processWithdrawalSubmit;
  if (typeof originalWithdrawal === 'function') {
    window.processWithdrawalSubmit = async function() {
      const result = await originalWithdrawal.apply(this, arguments);
      setTimeout(() => {
        showRealAd(1, 3).then(() => {
          showRealAd(2, 3).then(() => {
            showRealAd(3, 3);
          });
        });
      }, 2000);
      return result;
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #7: PREMIUM EMOJI BUTTON IN EDITOR
  // ═══════════════════════════════════════════════════════════════
  function addPremiumEmojiButton() {
    const editorContent = document.getElementById('editor-tab-content');
    if (!editorContent) return;
    if (!isPremium()) return;

    // Only add in stickers tab
    const stickersBtn = document.getElementById('tab-stickers');
    if (!stickersBtn || !stickersBtn.classList.contains('bg-cyan-600')) return;
    if (document.getElementById('mf-premium-emoji-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'mf-premium-emoji-btn';
    btn.className = 'w-full mt-2 py-2 bg-gradient-to-r from-amber-500 to-pink-500 text-white rounded-lg text-xs font-bold';
    btn.innerHTML = '👑 Animate Emojis (Premium)';
    btn.onclick = () => {
      window.__applyKeyframeToAll('zoom');
      toast('✨ Emojis animated!');
    };

    editorContent.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    injectPremiumEmojiCSS();

    setInterval(() => {
      applyPremiumEmojisToDOM();
      fixDmSendButton();
      addPremiumEmojiButton();
    }, 2000);

    setTimeout(() => {
      applyPremiumEmojisToDOM();
      fixDmSendButton();
    }, 3000);

    console.log('✅ masterfix.js loaded — All fixes active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════
  window.__MASTERFIX__ = {
    startCall: window.startCall,
    endCall: window.endCallFixed,
    sendDM: window.sendDmMessageSubmit,
    publishPost: window.publishPost,
    applyKeyframe: window.__applyKeyframeToAll,
    showAd: showRealAd
  };
})();
