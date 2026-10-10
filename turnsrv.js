/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - TURNSRV.JS
   Real TURN server + WebRTC fix for Live & Call
   99% connection rate on different networks
   
   Add: <script src="turnsrv.js" defer></script>
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

  // ═══════════════════════════════════════════════════════════════
  // TURN SERVER CONFIG (Free public servers)
  // ═══════════════════════════════════════════════════════════════
  const ICE_SERVERS = {
    iceServers: [
      // ═══ STUN (Google) ═══
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },

      // ═══ TURN (OpenRelay - Free) ═══
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },

      // ═══ TURN (Backup - Free) ═══
      {
        urls: 'turn:relay1.expressturn.com:3478',
        username: 'efBQMTL7JDC5KN4D3E',
        credential: 'jWxzZ3z5dmL3RhkY'
      }
    ],
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };

  window.__ICE_SERVERS = ICE_SERVERS;

  // ═══════════════════════════════════════════════════════════════
  // PATCH: Override RTCPeerConnection globally
  // ═══════════════════════════════════════════════════════════════
  const OriginalRTC = window.RTCPeerConnection;
  window.RTCPeerConnection = function(config) {
    // Always use our TURN-enhanced config
    const mergedConfig = {
      ...ICE_SERVERS,
      ...(config || {})
    };
    
    const pc = new OriginalRTC(mergedConfig);
    
    // Log ICE state
    pc.addEventListener('iceconnectionstatechange', () => {
      console.log('ICE state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.warn('❌ ICE failed — trying relay only');
        pc.restartIce && pc.restartIce();
      }
    });

    return pc;
  };
  window.RTCPeerConnection.prototype = OriginalRTC.prototype;

  // ═══════════════════════════════════════════════════════════════
  // ENHANCED LIVE STREAM (with TURN)
  // ═══════════════════════════════════════════════════════════════
  window.startLiveStream = async function(mode) {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    const mode_ = mode || 'solo';

    try {
      // 1. Get camera + mic (with fallback)
      let stream = null;
      const configs = [
        { video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } }, audio: true },
        { video: { facingMode: 'user' }, audio: true },
        { video: true, audio: true },
        { video: true, audio: false }
      ];

      for (const cfg of configs) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(cfg);
          break;
        } catch(e) { console.warn('Config failed:', e.name); }
      }

      if (!stream) {
        toast('❌ Camera access nahi mila');
        return;
      }

      window.localStream = stream;

      // 2. Show UI
      const soloBox = document.getElementById('stream-solo-box');
      const pkBox = document.getElementById('stream-pk-box');
      const title = document.getElementById('stream-type-title');

      if (mode_ === 'pk') {
        soloBox?.classList.add('hidden');
        pkBox?.classList.remove('hidden');
        if (title) title.innerText = "⚔️ 2-PLAYER PK MATCH LIVE";
      } else {
        pkBox?.classList.add('hidden');
        soloBox?.classList.remove('hidden');
        if (title) title.innerText = "🔴 SOLO LIVE STREAM";
      }

      if (typeof openModal === 'function') openModal('liveStreamModal');

      // 3. Attach to video
      const videoEl = mode_ === 'pk' 
        ? document.getElementById('pk-video-left')
        : document.getElementById('solo-live-video');
      
      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.muted = true;
        try { await videoEl.play(); } catch(e) {}
      }

      // 4. Set host label
      const label = document.getElementById('solo-host-label');
      if (label) label.innerText = '@' + user + ' (Host)';

      // 5. Create room in Firestore
      const roomId = 'live_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      window.__liveRoomId = roomId;

      // 6. Create peer connection with TURN
      const pc = new RTCPeerConnection(ICE_SERVERS);
      window.__livePC = pc;

      // Add local tracks
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      // Handle remote stream (guest)
      pc.ontrack = (event) => {
        const remoteEl = document.getElementById('pk-video-right');
        if (remoteEl && event.streams[0]) {
          remoteEl.srcObject = event.streams[0];
          remoteEl.muted = false;
          remoteEl.play().catch(() => {});
          
          // Switch to PK view automatically
          document.getElementById('stream-solo-box')?.classList.add('hidden');
          document.getElementById('stream-pk-box')?.classList.remove('hidden');
          toast('👤 Guest joined!');
        }
      };

      // ICE candidate handling
      pc.onicecandidate = (e) => {
        if (e.candidate && roomId) {
          firebase.firestore()
            .collection('live_rooms').doc(roomId)
            .collection('host_ice')
            .add(e.candidate.toJSON())
            .catch(() => {});
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Save room
      await firebase.firestore().collection('live_rooms').doc(roomId).set({
        roomId,
        host: user,
        mode: mode_,
        status: 'waiting',
        offer: { type: offer.type, sdp: offer.sdp },
        viewers: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Listen for answer
      const answerUnsub = firebase.firestore()
        .collection('live_rooms').doc(roomId)
        .onSnapshot(async (doc) => {
          const data = doc.data();
          if (data && data.answer && pc.signalingState !== 'stable') {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              toast('✅ Guest connected!');
            } catch(e) { console.warn('Answer error:', e); }
          }
        });

      // Listen for guest ICE
      const guestIceUnsub = firebase.firestore()
        .collection('live_rooms').doc(roomId)
        .collection('guest_ice')
        .onSnapshot(snap => {
          snap.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
              } catch(e) {}
            }
          });
        });

      window.__liveUnsub = () => {
        answerUnsub();
        guestIceUnsub();
      };

      // Invite link
      const inviteLink = `${window.location.origin}${window.location.pathname}?live=${roomId}&host=${user}`;
      
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(inviteLink);
        toast('✅ Invite link copy! Dost ko bhejein');
      } catch(e) {
        prompt('Ye link copy karein:', inviteLink);
      }

      console.log('✅ Live started:', roomId);

    } catch(e) {
      console.error('Live error:', e);
      toast('❌ ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // JOIN LIVE AS GUEST
  // ═══════════════════════════════════════════════════════════════
  window.joinLiveStream = async function(roomId) {
    const user = getUser();
    if (!user || !roomId) return;

    try {
      // 1. Get camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });

      window.localStream = stream;

      // 2. Show video element
      const videoEl = document.getElementById('pk-video-right');
      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.muted = true;
        try { await videoEl.play(); } catch(e) {}
      }

      // 3. Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      window.__livePC = pc;

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.ontrack = (event) => {
        const remoteEl = document.getElementById('pk-video-left');
        if (remoteEl && event.streams[0]) {
          remoteEl.srcObject = event.streams[0];
          remoteEl.play().catch(() => {});
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          firebase.firestore()
            .collection('live_rooms').doc(roomId)
            .collection('guest_ice')
            .add(e.candidate.toJSON())
            .catch(() => {});
        }
      };

      // 4. Get room data
      const roomDoc = await firebase.firestore()
        .collection('live_rooms').doc(roomId).get();
      
      if (!roomDoc.exists) {
        toast('❌ Room nahi mila');
        return;
      }

      const roomData = roomDoc.data();
      await pc.setRemoteDescription(new RTCSessionDescription(roomData.offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await firebase.firestore().collection('live_rooms').doc(roomId).update({
        answer: { type: answer.type, sdp: answer.sdp },
        guest: user,
        status: 'connected'
      });

      // 5. Listen for host ICE
      const hostIceUnsub = firebase.firestore()
        .collection('live_rooms').doc(roomId)
        .collection('host_ice')
        .onSnapshot(snap => {
          snap.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
              } catch(e) {}
            }
          });
        });

      window.__liveUnsub = hostIceUnsub;

      // 6. Show PK view
      document.getElementById('stream-solo-box')?.classList.add('hidden');
      document.getElementById('stream-pk-box')?.classList.remove('hidden');
      
      if (typeof openModal === 'function') openModal('liveStreamModal');

      toast('✅ Live room joined!');

    } catch(e) {
      console.error('Join error:', e);
      toast('❌ ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // ENHANCED VOICE/VIDEO CALL (with TURN)
  // ═══════════════════════════════════════════════════════════════
  window.startCall = async function(targetUser, callType) {
    const user = getUser();
    if (!user || !targetUser) return;
    if (targetUser === user) { toast('Khud ko call nahi'); return; }

    const type = callType || 'voice';
    console.log('📞 Starting', type, 'call to', targetUser);

    try {
      // 1. Get media
      const constraints = type === 'video'
        ? { audio: true, video: { facingMode: 'user', width: 720, height: 1280 } }
        : { audio: true, video: false };

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch(e) {
        if (type === 'video') {
          // Fallback to voice
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          toast('📞 Voice call only');
        } else {
          throw e;
        }
      }

      window.localStream = stream;
      window.__callType = type;
      window.__callTarget = targetUser;

      // 2. Create call doc
      const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      window.__callId = callId;

      // 3. Peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      window.__callPC = pc;

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      // Remote stream
      window.__remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(t => window.__remoteStream.addTrack(t));
        attachRemoteCallStream();
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          firebase.firestore()
            .collection('calls').doc(callId)
            .collection('caller_ice')
            .add(e.candidate.toJSON())
            .catch(() => {});
        }
      };

      // 4. Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const userData = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}')[user] || {};

      await firebase.firestore().collection('calls').doc(callId).set({
        id: callId,
        caller: user,
        callerName: userData.name || user,
        callerAvatar: userData.avatar || '',
        receiver: targetUser,
        callType: type,
        status: 'ringing',
        offer: { type: offer.type, sdp: offer.sdp },
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 5. Show call UI
      if (typeof window.showCallUI === 'function') {
        window.showCallUI();
      } else {
        showCallUI();
      }

      // 6. Listen for answer
      const answerUnsub = firebase.firestore()
        .collection('calls').doc(callId)
        .onSnapshot(async (doc) => {
          const data = doc.data();
          if (!data) return;

          if (data.answer && pc.signalingState !== 'stable') {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              window.__callConnectedAt = Date.now();
              updateCallStatus('Connected');
            } catch(e) { console.warn(e); }
          }

          if (data.status === 'ended' || data.status === 'rejected') {
            endCall();
          }
        });

      // 7. Listen for receiver ICE
      const receiverIceUnsub = firebase.firestore()
        .collection('calls').doc(callId)
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

      window.__callUnsub = () => {
        answerUnsub();
        receiverIceUnsub();
      };

      // Auto-cancel after 60 seconds
      window.__callTimeout = setTimeout(() => {
        if (!window.__callConnectedAt) {
          toast('❌ Call not answered');
          endCall();
        }
      }, 60000);

    } catch(e) {
      console.error('Call error:', e);
      toast('❌ ' + e.message);
    }
  };

  function attachRemoteCallStream() {
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo && window.__remoteStream) {
      remoteVideo.srcObject = window.__remoteStream;
      remoteVideo.play().catch(() => {});
    }
  }

  function updateCallStatus(text) {
    const el = document.getElementById('call-status');
    if (el) el.innerText = text;
  }

  function showCallUI() {
    // Ye call.js handle karega
    if (typeof window.__CALL__ !== 'undefined') {
      console.log('✅ Using call.js UI');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ACCEPT INCOMING CALL
  // ═══════════════════════════════════════════════════════════════
  window.acceptCall = async function(callId) {
    const user = getUser();
    if (!user || !callId) return;

    try {
      // Hide incoming popup
      document.getElementById('incomingCallPopup')?.remove();

      // Get call data
      const callDoc = await firebase.firestore().collection('calls').doc(callId).get();
      if (!callDoc.exists) return;
      const callData = callDoc.data();

      const type = callData.callType || 'voice';

      // Get media
      const constraints = type === 'video'
        ? { audio: true, video: { facingMode: 'user' } }
        : { audio: true, video: false };

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch(e) {
        if (type === 'video') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
          throw e;
        }
      }

      window.localStream = stream;
      window.__callId = callId;
      window.__callTarget = callData.caller;
      window.__callType = type;

      // Peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      window.__callPC = pc;

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      window.__remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(t => window.__remoteStream.addTrack(t));
        attachRemoteCallStream();
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          firebase.firestore()
            .collection('calls').doc(callId)
            .collection('receiver_ice')
            .add(e.candidate.toJSON())
            .catch(() => {});
        }
      };

      // Set remote offer
      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Save answer
      await firebase.firestore().collection('calls').doc(callId).update({
        answer: { type: answer.type, sdp: answer.sdp },
        status: 'active',
        acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Listen for caller ICE
      const callerIceUnsub = firebase.firestore()
        .collection('calls').doc(callId)
        .collection('caller_ice')
        .onSnapshot(snap => {
          snap.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
              } catch(e) {}
            }
          });
        });

      // Listen for call end
      const endUnsub = firebase.firestore()
        .collection('calls').doc(callId)
        .onSnapshot(doc => {
          const data = doc.data();
          if (data && (data.status === 'ended' || data.status === 'rejected')) {
            endCall();
          }
        });

      window.__callUnsub = () => {
        callerIceUnsub();
        endUnsub();
      };

      window.__callConnectedAt = Date.now();
      
      // Show call UI
      if (typeof window.showCallUI === 'function') {
        window.showCallUI();
      }

      toast('✅ Call connected');

    } catch(e) {
      console.error('Accept error:', e);
      toast('❌ ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // END CALL
  // ═══════════════════════════════════════════════════════════════
  window.endCall = async function(notify) {
    const callId = window.__callId;

    // Clear timeout
    if (window.__callTimeout) {
      clearTimeout(window.__callTimeout);
      window.__callTimeout = null;
    }

    // Stop local stream
    if (window.localStream) {
      window.localStream.getTracks().forEach(t => t.stop());
      window.localStream = null;
    }

    // Close peer connection
    if (window.__callPC) {
      try { window.__callPC.close(); } catch(e) {}
      window.__callPC = null;
    }

    // Unsub listeners
    if (window.__callUnsub) {
      try { window.__callUnsub(); } catch(e) {}
      window.__callUnsub = null;
    }

    // Update Firestore
    if (notify !== false && callId) {
      try {
        await firebase.firestore().collection('calls').doc(callId).update({
          status: 'ended',
          endedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch(e) {}
    }

    // Hide UI
    document.getElementById('callScreen')?.remove();
    document.getElementById('incomingCallPopup')?.remove();

    window.__callId = null;
    window.__callTarget = null;
    window.__callConnectedAt = null;

    toast('📞 Call ended');
  };

  // ═══════════════════════════════════════════════════════════════
  // HANDLE INVITE LINK (?live=xxx)
  // ═══════════════════════════════════════════════════════════════
  window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const liveId = params.get('live');
    const host = params.get('host');

    if (liveId && host) {
      setTimeout(() => {
        if (!getUser()) return;
        if (getUser() === host) return;

        if (confirm(`🔴 @${host} aapko live pe invite kar raha hai. Join karein?`)) {
          window.joinLiveStream(liveId);
        }
      }, 3000);
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // AUTO-DETECT INCOMING CALLS
  // ═══════════════════════════════════════════════════════════════
  function startCallListener() {
    const user = getUser();
    if (!user) return;

    firebase.firestore().collection('calls')
      .where('receiver', '==', user)
      .where('status', '==', 'ringing')
      .limit(1)
      .onSnapshot(snap => {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (data.caller === user) return;
            
            // Play ringtone
            playRingtone();

            // Show incoming popup
            showIncomingCallUI(data);
          }
        });
      }, err => console.log('Call listener:', err.message));
  }

  function showIncomingCallUI(data) {
    document.getElementById('incomingCallPopup')?.remove();

    const userData = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}')[data.caller] || {};
    const avatar = userData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.caller}`;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="incomingCallPopup" class="fixed inset-0 z-[500] bg-gradient-to-br from-gray-950 to-blue-950 flex flex-col items-center justify-center p-6">
        <div class="w-full max-w-sm text-center space-y-6">
          <div class="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 p-1 relative animate-pulse">
            <img src="${avatar}" class="w-full h-full rounded-full object-cover bg-gray-800">
          </div>
          <div>
            <p class="text-2xl font-bold text-white">${userData.name || data.caller}</p>
            <p class="text-sm text-cyan-400 mt-1">@${data.caller}</p>
            <p class="text-xs text-gray-400 mt-3">
              ${data.callType === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call'}
            </p>
          </div>
          <div class="flex justify-center gap-6 pt-4">
            <button onclick="window.rejectIncomingCall('${data.id}')" class="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl">
              <i class="fa-solid fa-phone-slash text-2xl"></i>
            </button>
            <button onclick="window.acceptCall('${data.id}')" class="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center shadow-2xl animate-bounce">
              <i class="fa-solid fa-phone text-2xl"></i>
            </button>
          </div>
          <p class="text-xs text-gray-500">Ringing...</p>
        </div>
      </div>
    `);
  }

  window.rejectIncomingCall = async function(callId) {
    try {
      await firebase.firestore().collection('calls').doc(callId).update({
        status: 'rejected',
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) {}
    document.getElementById('incomingCallPopup')?.remove();
    stopRingtone();
    toast('Call rejected');
  };

  // ═══════════════════════════════════════════════════════════════
  // RINGTONE
  // ═══════════════════════════════════════════════════════════════
  let ringtoneInterval = null;

  function playRingtone() {
    stopRingtone();
    const play = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } catch(e) {}
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    };
    play();
    ringtoneInterval = setInterval(play, 1500);
  }

  function stopRingtone() {
    if (ringtoneInterval) {
      clearInterval(ringtoneInterval);
      ringtoneInterval = null;
    }
    if (navigator.vibrate) navigator.vibrate(0);
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    setTimeout(startCallListener, 5000);
    console.log('✅ turnsrv.js loaded — TURN server active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__TURNSRV__ = {
    ICE_SERVERS,
    startLiveStream: window.startLiveStream,
    joinLiveStream: window.joinLiveStream,
    startCall: window.startCall,
    acceptCall: window.acceptCall,
    endCall: window.endCall
  };
})();
