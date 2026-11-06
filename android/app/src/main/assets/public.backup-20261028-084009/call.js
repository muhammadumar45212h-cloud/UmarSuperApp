/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - CALL.JS
   Free Voice + Video Calling (WebRTC + Firebase)
   
   Features:
   1. Voice Call (1-on-1)
   2. Video Call (1-on-1)
   3. Incoming call popup
   4. Call duration timer
   5. Mute / Speaker / End buttons
   6. Call history
   7. Missed call notifications
   8. Firebase signaling (no server needed)
   
   Add: <script src="call.js" defer></script>
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
  // WEBRTC CONFIG (free STUN servers)
  // ═══════════════════════════════════════════════════════════════
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' }
    ]
  };

  // ═══════════════════════════════════════════════════════════════
  // CALL STATE
  // ═══════════════════════════════════════════════════════════════
  const CallState = {
    pc: null,              // peer connection
    localStream: null,     // mic/camera
    remoteStream: null,    // other person
    currentCallId: null,   // call doc ID
    caller: null,          // who called
    receiver: null,        // who's receiving
    callType: 'voice',     // 'voice' | 'video'
    status: 'idle',        // idle | calling | ringing | active | ended
    isMuted: false,
    isSpeaker: false,
    startedAt: null,
    durationInterval: null,
    unsubCall: null,       // listener for call doc
    unsubIncoming: null    // listener for incoming calls
  };

  // ═══════════════════════════════════════════════════════════════
  // START CALL (caller side)
  // ═══════════════════════════════════════════════════════════════
  window.startCall = async function(targetUser, callType) {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    if (!targetUser) { toast('User select karein'); return; }
    if (targetUser === user) { toast('Khud ko call nahi kar sakte'); return; }

    // Check if already in call
    if (CallState.status !== 'idle') {
      toast('⚠️ Pehle se call chal rahi hai');
      return;
    }

    CallState.receiver = targetUser;
    CallState.caller = user;
    CallState.callType = callType || 'voice';
    CallState.status = 'calling';

    try {
      // 1. Get mic/camera
      const constraints = CallState.callType === 'video'
        ? { audio: true, video: { facingMode: 'user', width: 720, height: 1280 } }
        : { audio: true, video: false };
      
      CallState.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      CallState.remoteStream = new MediaStream();

      // 2. Create peer connection
      CallState.pc = new RTCPeerConnection(rtcConfig);
      
      // Add local tracks
      CallState.localStream.getTracks().forEach(track => {
        CallState.pc.addTrack(track, CallState.localStream);
      });

      // Remote track aayega
      CallState.pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          CallState.remoteStream.addTrack(track);
        });
        attachRemoteStream();
      };

      // 3. ICE candidates
      CallState.pc.onicecandidate = async (event) => {
        if (event.candidate && CallState.currentCallId) {
          await firebase.firestore()
            .collection('calls').doc(CallState.currentCallId)
            .collection('caller_ice').add(event.candidate.toJSON());
        }
      };

      // 4. Create call doc in Firebase
      const callRef = firebase.firestore().collection('calls').doc();
      CallState.currentCallId = callRef.id;

      const offer = await CallState.pc.createOffer();
      await CallState.pc.setLocalDescription(offer);

      await callRef.set({
        id: callRef.id,
        caller: user,
        receiver: targetUser,
        callType: CallState.callType,
        status: 'ringing',
        offer: { type: offer.type, sdp: offer.sdp },
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        callerName: (JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}')[user] || {}).name || user,
        callerAvatar: (JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}')[user] || {}).avatar || ''
      });

      // 5. Show call UI
      showCallUI();
      updateCallUI('calling');

      // 6. Listen for answer
      CallState.unsubCall = callRef.onSnapshot(async (doc) => {
        const data = doc.data();
        if (!data) return;

        // Answer aaya
        if (data.answer && CallState.pc.signalingState !== 'stable') {
          try {
            await CallState.pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            CallState.status = 'active';
            CallState.startedAt = Date.now();
            startDurationTimer();
            updateCallUI('active');
            toast('✅ Call connected');
          } catch(e) { console.log(e); }
        }

        // Call ended?
        if (data.status === 'ended' || data.status === 'rejected') {
          endCall(false);
        }
      });

      // 7. Listen for receiver ICE
      callRef.collection('receiver_ice').onSnapshot(snap => {
        snap.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            try {
              await CallState.pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            } catch(e) {}
          }
        });
      });

      // 8. Timeout — 60 sec baad auto-end
      setTimeout(() => {
        if (CallState.status === 'calling') {
          toast('❌ No answer');
          endCall(true);
        }
      }, 60000);

    } catch(e) {
      console.error('Start call error:', e);
      toast('❌ ' + (e.message || 'Call fail'));
      endCall(true);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RECEIVE CALL (callee side)
  // ═══════════════════════════════════════════════════════════════
  async function acceptIncomingCall(callId) {
    const user = getUser();
    if (!user) return;

    try {
      const callDoc = await firebase.firestore().collection('calls').doc(callId).get();
      if (!callDoc.exists) return;
      const callData = callDoc.data();

      CallState.currentCallId = callId;
      CallState.caller = callData.caller;
      CallState.receiver = user;
      CallState.callType = callData.callType || 'voice';
      CallState.status = 'connecting';

      // 1. Get mic/camera
      const constraints = CallState.callType === 'video'
        ? { audio: true, video: { facingMode: 'user', width: 720, height: 1280 } }
        : { audio: true, video: false };

      CallState.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      CallState.remoteStream = new MediaStream();

      // 2. Peer connection
      CallState.pc = new RTCPeerConnection(rtcConfig);
      CallState.localStream.getTracks().forEach(track => {
        CallState.pc.addTrack(track, CallState.localStream);
      });

      CallState.pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          CallState.remoteStream.addTrack(track);
        });
        attachRemoteStream();
      };

      CallState.pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await firebase.firestore()
            .collection('calls').doc(callId)
            .collection('receiver_ice').add(event.candidate.toJSON());
        }
      };

      // 3. Set remote offer
      await CallState.pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

      // 4. Create answer
      const answer = await CallState.pc.createAnswer();
      await CallState.pc.setLocalDescription(answer);

      // 5. Save answer
      await firebase.firestore().collection('calls').doc(callId).update({
        answer: { type: answer.type, sdp: answer.sdp },
        status: 'active',
        acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 6. Listen for caller ICE
      firebase.firestore().collection('calls').doc(callId)
        .collection('caller_ice').onSnapshot(snap => {
          snap.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              try {
                await CallState.pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
              } catch(e) {}
            }
          });
        });

      // 7. Listen for call end
      CallState.unsubCall = firebase.firestore().collection('calls').doc(callId)
        .onSnapshot(doc => {
          const data = doc.data();
          if (data && (data.status === 'ended' || data.status === 'rejected')) {
            endCall(false);
          }
        });

      // 8. Show UI
      hideIncomingPopup();
      showCallUI();
      CallState.status = 'active';
      CallState.startedAt = Date.now();
      startDurationTimer();
      updateCallUI('active');
      toast('✅ Call connected');

    } catch(e) {
      console.error('Accept error:', e);
      toast('❌ Call accept fail');
      rejectCall(callId);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // REJECT CALL
  // ═══════════════════════════════════════════════════════════════
  window.rejectCall = async function(callId) {
    hideIncomingPopup();
    if (!callId) callId = CallState.currentCallId;
    if (!callId) return;

    try {
      await firebase.firestore().collection('calls').doc(callId).update({
        status: 'rejected',
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Save to history
      await saveCallHistory(CallState.caller, CallState.receiver, CallState.callType, 'rejected', 0);
    } catch(e) {}

    cleanupCall();
  };

  // ═══════════════════════════════════════════════════════════════
  // END CALL
  // ═══════════════════════════════════════════════════════════════
  window.endCall = async function(notifyOthers = true) {
    const duration = CallState.startedAt ? Math.floor((Date.now() - CallState.startedAt) / 1000) : 0;

    if (notifyOthers && CallState.currentCallId) {
      try {
        await firebase.firestore().collection('calls').doc(CallState.currentCallId).update({
          status: 'ended',
          endedAt: firebase.firestore.FieldValue.serverTimestamp(),
          duration: duration
        });
      } catch(e) {}
    }

    // Save history
    if (CallState.caller && CallState.receiver) {
      const status = duration > 0 ? 'completed' : 'missed';
      await saveCallHistory(CallState.caller, CallState.receiver, CallState.callType, status, duration);
    }

    cleanupCall();
    toast('📞 Call ended');
  };

  // ═══════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════
  function cleanupCall() {
    // Stop tracks
    if (CallState.localStream) {
      CallState.localStream.getTracks().forEach(t => t.stop());
      CallState.localStream = null;
    }
    // Close PC
    if (CallState.pc) {
      try { CallState.pc.close(); } catch(e) {}
      CallState.pc = null;
    }
    // Unsub listeners
    if (CallState.unsubCall) {
      try { CallState.unsubCall(); } catch(e) {}
      CallState.unsubCall = null;
    }
    // Stop timer
    if (CallState.durationInterval) {
      clearInterval(CallState.durationInterval);
      CallState.durationInterval = null;
    }
    // Reset state
    CallState.currentCallId = null;
    CallState.caller = null;
    CallState.receiver = null;
    CallState.status = 'idle';
    CallState.startedAt = null;
    CallState.isMuted = false;
    CallState.isSpeaker = false;

    // Remove UI
    document.getElementById('callScreen')?.remove();
  }

  // ═══════════════════════════════════════════════════════════════
  // SAVE CALL HISTORY
  // ═══════════════════════════════════════════════════════════════
  async function saveCallHistory(caller, receiver, type, status, duration) {
    try {
      await firebase.firestore().collection('call_history').add({
        caller,
        receiver,
        type,
        status,
        duration,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) { console.log(e); }
  }

  // ═══════════════════════════════════════════════════════════════
  // SHOW CALL UI (active call screen)
  // ═══════════════════════════════════════════════════════════════
  function showCallUI() {
    document.getElementById('callScreen')?.remove();

    const otherUser = CallState.caller === getUser() ? CallState.receiver : CallState.caller;
    const userData = (JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}')[otherUser] || {});
    const avatar = userData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUser}`;
    const name = userData.name || otherUser;

    const isVideo = CallState.callType === 'video';

    document.body.insertAdjacentHTML('beforeend', `
      <div id="callScreen" class="fixed inset-0 z-[300] bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 flex flex-col">
        
        <!-- Remote Video (video call) -->
        <div class="flex-1 relative overflow-hidden">
          ${isVideo ? `
            <video id="remoteVideo" class="w-full h-full object-cover" autoplay playsinline></video>
          ` : `
            <div class="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
              <div class="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 p-1 relative">
                <img src="${avatar}" class="w-full h-full rounded-full object-cover bg-gray-800">
                <div class="absolute inset-0 rounded-full border-4 border-cyan-500/50 animate-ping"></div>
              </div>
              <p class="text-2xl font-bold text-white">${name}</p>
              <p class="text-xs text-cyan-400 font-semibold">@${otherUser}</p>
            </div>
          `}
          
          <!-- Local video preview (video call - small) -->
          ${isVideo ? `
            <div class="absolute top-4 right-4 w-24 h-32 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl">
              <video id="localVideo" class="w-full h-full object-cover" autoplay muted playsinline></video>
            </div>
          ` : ''}
          
          <!-- Call status/time -->
          <div class="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-lg px-4 py-2 rounded-full">
            <p id="call-status" class="text-white text-sm font-bold">Calling...</p>
          </div>
        </div>

        <!-- Call Controls -->
        <div class="p-6 pb-8 bg-gradient-to-t from-black/90 to-transparent space-y-4">
          <!-- Duration -->
          <p id="call-duration" class="text-center text-cyan-400 font-mono text-lg hidden">00:00</p>
          
          <div class="flex justify-center gap-4">
            <button onclick="window.toggleCallMute()" id="btn-mute" 
                    class="w-14 h-14 rounded-full bg-gray-800/80 backdrop-blur text-white flex items-center justify-center border border-gray-700 transition-all">
              <i class="fa-solid fa-microphone text-lg"></i>
            </button>
            
            <button onclick="window.toggleCallSpeaker()" id="btn-speaker" 
                    class="w-14 h-14 rounded-full bg-gray-800/80 backdrop-blur text-white flex items-center justify-center border border-gray-700 transition-all">
              <i class="fa-solid fa-volume-high text-lg"></i>
            </button>
            
            <button onclick="window.endCall(true)" 
                    class="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl transition-all">
              <i class="fa-solid fa-phone-slash text-2xl"></i>
            </button>
            
            ${isVideo ? `
              <button onclick="window.toggleCallCamera()" id="btn-cam" 
                      class="w-14 h-14 rounded-full bg-gray-800/80 backdrop-blur text-white flex items-center justify-center border border-gray-700 transition-all">
                <i class="fa-solid fa-video text-lg"></i>
              </button>
            ` : `
              <button onclick="window.switchCallToVideo()" 
                      class="w-14 h-14 rounded-full bg-gray-800/80 backdrop-blur text-cyan-400 flex items-center justify-center border border-cyan-700 transition-all">
                <i class="fa-solid fa-video text-lg"></i>
              </button>
            `}
            
            <button onclick="window.openChatDuringCall()" 
                    class="w-14 h-14 rounded-full bg-gray-800/80 backdrop-blur text-white flex items-center justify-center border border-gray-700 transition-all">
              <i class="fa-solid fa-comment text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    `);

    // Attach streams
    attachLocalStream();
    attachRemoteStream();
  }

  function attachLocalStream() {
    const localVideo = document.getElementById('localVideo');
    if (localVideo && CallState.localStream) {
      localVideo.srcObject = CallState.localStream;
      localVideo.muted = true;
      localVideo.play().catch(e => {});
    }
  }

  function attachRemoteStream() {
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo && CallState.remoteStream) {
      remoteVideo.srcObject = CallState.remoteStream;
      remoteVideo.play().catch(e => {});
    }
  }

  function updateCallUI(status) {
    const el = document.getElementById('call-status');
    if (!el) return;
    if (status === 'calling') el.innerText = 'Calling...';
    if (status === 'active') el.classList.add('hidden');
  }

  function startDurationTimer() {
    const el = document.getElementById('call-duration');
    if (!el) return;
    el.classList.remove('hidden');

    CallState.durationInterval = setInterval(() => {
      const sec = Math.floor((Date.now() - CallState.startedAt) / 1000);
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      el.innerText = `${m}:${s}`;
    }, 1000);
  }

  // ═══════════════════════════════════════════════════════════════
  // CALL CONTROLS
  // ═══════════════════════════════════════════════════════════════
  window.toggleCallMute = function() {
    if (!CallState.localStream) return;
    const audioTrack = CallState.localStream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    CallState.isMuted = !audioTrack.enabled;
    
    const btn = document.getElementById('btn-mute');
    if (btn) {
      if (CallState.isMuted) {
        btn.classList.add('bg-red-600', 'border-red-500');
        btn.innerHTML = '<i class="fa-solid fa-microphone-slash text-lg"></i>';
      } else {
        btn.classList.remove('bg-red-600', 'border-red-500');
        btn.innerHTML = '<i class="fa-solid fa-microphone text-lg"></i>';
      }
    }
    toast(CallState.isMuted ? '🔇 Muted' : '🎤 Unmuted');
  };

  window.toggleCallSpeaker = function() {
    const remoteAudio = document.getElementById('remoteVideo');
    if (remoteAudio) {
      remoteAudio.muted = !remoteAudio.muted;
      CallState.isSpeaker = !remoteAudio.muted;
    }
    const btn = document.getElementById('btn-speaker');
    if (btn) {
      if (CallState.isSpeaker) {
        btn.classList.add('bg-cyan-600', 'border-cyan-500');
      } else {
        btn.classList.remove('bg-cyan-600', 'border-cyan-500');
      }
    }
    toast(CallState.isSpeaker ? '🔊 Speaker ON' : '🔈 Speaker OFF');
  };

  window.toggleCallCamera = function() {
    if (!CallState.localStream) return;
    const videoTrack = CallState.localStream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    toast(videoTrack.enabled ? '📹 Camera ON' : '📹 Camera OFF');
  };

  window.switchCallToVideo = async function() {
    if (!CallState.pc) return;
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = videoStream.getVideoTracks()[0];
      CallState.pc.addTrack(videoTrack, videoStream);
      CallState.localStream.addTrack(videoTrack);
      CallState.callType = 'video';
      
      // Re-render UI
      showCallUI();
      toast('📹 Switched to video');
    } catch(e) {
      toast('❌ Camera error');
    }
  };

  window.openChatDuringCall = function() {
    // Minimize call, open DM
    const screen = document.getElementById('callScreen');
    if (screen) {
      screen.style.transform = 'translateY(-70%)';
      screen.style.transition = '0.3s';
      setTimeout(() => {
        if (window.openChatConversation) {
          window.openChatConversation(CallState.caller === getUser() ? CallState.receiver : CallState.caller);
        }
      }, 300);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // INCOMING CALL POPUP (jab koi call kare)
  // ═══════════════════════════════════════════════════════════════
  function showIncomingPopup(callData) {
    hideIncomingPopup();

    const userData = (JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}')[callData.caller] || {});
    const avatar = userData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${callData.caller}`;
    const name = userData.name || callData.caller;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="incomingCallPopup" class="fixed inset-0 z-[290] bg-gradient-to-br from-gray-950 to-blue-950 flex flex-col items-center justify-center p-6">
        <div class="w-full max-w-sm space-y-6 text-center">
          
          <div class="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 p-1 relative animate-pulse">
            <img src="${avatar}" class="w-full h-full rounded-full object-cover bg-gray-800">
          </div>
          
          <div>
            <p class="text-2xl font-bold text-white">${name}</p>
            <p class="text-sm text-cyan-400 mt-1">@${callData.caller}</p>
            <p class="text-xs text-gray-400 mt-3">
              ${callData.callType === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call'}
            </p>
          </div>

          <div class="flex justify-center gap-6 pt-4">
            <button onclick="window.rejectCall('${callData.id}')" 
                    class="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl transition-all">
              <i class="fa-solid fa-phone-slash text-2xl"></i>
            </button>
            
            <button onclick="window.__acceptCall('${callData.id}')" 
                    class="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center shadow-2xl transition-all animate-bounce">
              <i class="fa-solid fa-phone text-2xl"></i>
            </button>
          </div>

          <p class="text-xs text-gray-500">Ringing...</p>
        </div>
      </div>
    `);

    // Ringtone (vibrate + sound)
    playRingtone();
  }

  function hideIncomingPopup() {
    document.getElementById('incomingCallPopup')?.remove();
    stopRingtone();
  }

  window.__acceptCall = function(callId) {
    hideIncomingPopup();
    acceptIncomingCall(callId);
  };

  // ═══════════════════════════════════════════════════════════════
  // RINGTONE (Web Audio API + Vibration)
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
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch(e) {}
      if (navigator.vibrate) navigator.vibrate([300, 200, 300]);
    };
    play();
    ringtoneInterval = setInterval(play, 2000);
  }

  function stopRingtone() {
    if (ringtoneInterval) {
      clearInterval(ringtoneInterval);
      ringtoneInterval = null;
    }
    if (navigator.vibrate) navigator.vibrate(0);
  }

  // ═══════════════════════════════════════════════════════════════
  // LISTEN FOR INCOMING CALLS
  // ═══════════════════════════════════════════════════════════════
  function startIncomingListener() {
    const user = getUser();
    if (!user) return;
    if (CallState.unsubIncoming) {
      try { CallState.unsubIncoming(); } catch(e) {}
    }

    CallState.unsubIncoming = firebase.firestore().collection('calls')
      .where('receiver', '==', user)
      .where('status', '==', 'ringing')
      .limit(1)
      .onSnapshot(snap => {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            // Don't show if already in call
            if (CallState.status !== 'idle') return;
            // Don't show own call
            if (data.caller === user) return;
            
            CallState.currentCallId = data.id;
            CallState.caller = data.caller;
            CallState.receiver = user;
            CallState.callType = data.callType || 'voice';

            showIncomingPopup(data);
          }
        });
      }, err => console.log('Call listener:', err.message));
  }

  // ═══════════════════════════════════════════════════════════════
  // CALL HISTORY MODAL
  // ═══════════════════════════════════════════════════════════════
  window.openCallHistory = async function() {
    const user = getUser();
    if (!user) return;

    if (!document.getElementById('callHistoryModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="callHistoryModal" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[85] space-y-3">
          <div class="flex justify-between items-center border-b border-cyan-500/40 pb-3 sticky top-0 bg-gray-950 z-10">
            <h2 class="text-base font-bold text-cyan-400"><i class="fa-solid fa-phone"></i> Call History</h2>
            <button onclick="closeModal('callHistoryModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="call-history-list" class="space-y-2"></div>
        </div>
      `);
    }
    if (typeof openModal === 'function') openModal('callHistoryModal');

    const list = document.getElementById('call-history-list');
    list.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">Loading...</p>';

    try {
      // Get calls where user is caller or receiver
      const callerSnap = await firebase.firestore().collection('call_history')
        .where('caller', '==', user).limit(50).get();
      const receiverSnap = await firebase.firestore().collection('call_history')
        .where('receiver', '==', user).limit(50).get();

      const allCalls = [];
      callerSnap.forEach(d => allCalls.push({ id: d.id, ...d.data(), direction: 'outgoing' }));
      receiverSnap.forEach(d => allCalls.push({ id: d.id, ...d.data(), direction: 'incoming' }));

      allCalls.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));

      if (allCalls.length === 0) {
        list.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">No call history</p>';
        return;
      }

      list.innerHTML = '';
      allCalls.forEach(c => {
        const other = c.caller === user ? c.receiver : c.caller;
        const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
        const avatar = (users[other] || {}).avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${other}`;
        const statusIcon = c.status === 'missed' ? '❌' : (c.direction === 'outgoing' ? '↗️' : '↙️');
        const statusColor = c.status === 'missed' ? 'text-red-400' : 'text-green-400';

        const div = document.createElement('div');
        div.className = 'bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3 cursor-pointer';
        div.onclick = () => {
          closeModal('callHistoryModal');
          window.startCall(other, c.type || 'voice');
        };
        div.innerHTML = `
          <img src="${avatar}" class="w-10 h-10 rounded-full bg-gray-800">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-white">@${other}</p>
            <p class="text-[10px] text-gray-400">
              ${statusIcon} ${c.status} • ${c.duration > 0 ? Math.floor(c.duration / 60) + 'm ' + (c.duration % 60) + 's' : 'N/A'}
            </p>
          </div>
          <div class="text-right">
            <p class="text-[9px] text-gray-500">${c.timestamp ? new Date(c.timestamp.toMillis()).toLocaleString() : ''}</p>
            <button onclick="event.stopPropagation(); window.startCall('${other}', 'voice')" class="text-cyan-400 text-xs mt-1">
              <i class="fa-solid fa-phone"></i>
            </button>
          </div>
        `;
        list.appendChild(div);
      });
    } catch(e) {
      list.innerHTML = `<p class="text-xs text-red-400 text-center">Error: ${e.message}</p>`;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // ADD CALL BUTTONS TO DM CHAT
  // ═══════════════════════════════════════════════════════════════
  function addCallButtonsToDM() {
    const threadHeader = document.getElementById('dm-thread-header');
    if (!threadHeader || threadHeader.dataset.callBtnsAdded === '1') return;
    if (!activeChatTargetUser) return;

    threadHeader.dataset.callBtnsAdded = '1';

    // Insert call buttons before the last empty div
    const container = threadHeader.querySelector('.flex.items-center.gap-2');
    if (!container) return;
    const parent = container.parentElement;

    const callBtns = document.createElement('div');
    callBtns.className = 'flex gap-2 ml-2';
    callBtns.innerHTML = `
      <button onclick="window.startCall('${activeChatTargetUser}', 'voice')" 
              class="w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center shadow">
        <i class="fa-solid fa-phone text-xs"></i>
      </button>
      <button onclick="window.startCall('${activeChatTargetUser}', 'video')" 
              class="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow">
        <i class="fa-solid fa-video text-xs"></i>
      </button>
    `;
    parent.appendChild(callBtns);
  }

  // ═══════════════════════════════════════════════════════════════
  // ADD CALL BUTTON TO PUBLIC PROFILE
  // ═══════════════════════════════════════════════════════════════
  function addCallToProfile() {
    const btnRow = document.querySelector('#publicProfileModal .flex.gap-2');
    if (!btnRow || btnRow.dataset.callAdded === '1') return;
    if (!currentActivePublicUser) return;

    btnRow.dataset.callAdded = '1';

    const callBtn = document.createElement('button');
    callBtn.className = 'px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-full text-xs font-bold shadow flex items-center gap-1';
    callBtn.innerHTML = '<i class="fa-solid fa-phone text-xs"></i> Call';
    callBtn.onclick = () => {
      if (typeof closeModal === 'function') closeModal('publicProfileModal');
      window.startCall(currentActivePublicUser, 'voice');
    };
    btnRow.appendChild(callBtn);
  }

  // ═══════════════════════════════════════════════════════════════
  // OBSERVER — auto-add buttons
  // ═══════════════════════════════════════════════════════════════
  const observer = new MutationObserver(() => {
    // DM chat open hua?
    const dmThread = document.getElementById('dm-thread-header');
    if (dmThread && !dmThread.classList.contains('hidden')) {
      addCallButtonsToDM();
    }
    // Profile open hua?
    const pubProfile = document.getElementById('publicProfileModal');
    if (pubProfile && !pubProfile.classList.contains('hidden')) {
      addCallToProfile();
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    // Start listening for incoming calls after 5 sec
    setTimeout(startIncomingListener, 5000);

    // Watch for DM/Profile open
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('✅ call.js loaded - Voice/Video calling ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════
  window.__CALL__ = {
    startCall: window.startCall,
    endCall: window.endCall,
    rejectCall: window.rejectCall,
    openCallHistory: window.openCallHistory,
    CallState
  };
})();
