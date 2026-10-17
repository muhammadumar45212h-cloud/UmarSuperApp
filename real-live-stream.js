// ==========================================
// ⚡ SUPER APP - REAL LIVE STREAM (Agora + PeerJS)
// File: real-live-stream.js
// ==========================================

(function() {
  'use strict';

  // ⚠️ AGORA SETUP (Free Account Banayein: console.agora.io)
  // 1. Project banayein -> App ID copy karein.
  // 2. "App ID" ko bina token ke use karne ke liye project settings mein "Testing Mode" ON karein.
  const AGORA_APP_ID = "279f6b1e3323480aa035456da0bce2ad"; // ⚠️ Yahan apna Agora App ID dalein

  let agoraClient = null;
  let localTracks = [];
  let peer = null;
  let currentCall = null;

  // ==========================================
  // 1. REAL SOLO LIVE STREAM (Agora)
  // ==========================================
  window.openRealSoloLive = async function() {
    if (AGORA_APP_ID === "279f6b1e3323480aa035456da0bce2ad") {
      showToast("❌ Agora App ID missing! Code mein dalein.");
      return;
    }

    // Permission check
    const hasCam = await AppPermissions.request('camera');
    const hasMic = await AppPermissions.request('microphone');
    if (!hasCam || !hasMic) { showToast("Camera/Mic chahiye"); return; }

    openModal('liveStreamModal');
    document.getElementById('stream-type-title').innerText = "🔴 SOLO LIVE (Real)";
    document.getElementById('stream-pk-box').classList.add('hidden');
    document.getElementById('stream-solo-box').classList.remove('hidden');

    try {
      // Initialize Agora
      agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      
      const uid = String(Date.now());
      const channelName = "live_" + formatHandle(currentUser);
      
      // Host mode
      await agoraClient.setClientRole("host");
      await agoraClient.join(AGORA_APP_ID, channelName, null, uid);

      // Create and publish tracks
      localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      await agoraClient.publish(localTracks);

      // Play local video
      const videoContainer = document.getElementById('solo-live-video');
      localTracks[1].play(videoContainer);

      document.getElementById('solo-host-label').innerText = "@" + formatHandle(currentUser) + " (Host)";
      showToast("🔴 Live streaming started! (Real)");

    } catch (e) {
      console.error("Agora Error:", e);
      showToast("❌ Live start fail: " + e.message);
    }
  };

  // ==========================================
  // 2. REAL PK MATCH (PeerJS - WebRTC P2P)
  // ==========================================
  window.openRealPkMatch = function() {
    const roomId = prompt("Enter Opponent Room ID to join (leave blank to create new room):");
    
    openModal('liveStreamModal');
    document.getElementById('stream-type-title').innerText = "⚔️ PK MATCH (Real)";
    document.getElementById('stream-solo-box').classList.add('hidden');
    document.getElementById('stream-pk-box').classList.remove('hidden');

    // PeerJS init
    peer = new Peer();

    peer.on('open', (id) => {
      if (!roomId) {
        alert("Your Room ID: " + id + "\nShare this with your opponent.");
        setupPkHost(peer);
      } else {
        setupPkGuest(peer, roomId);
      }
    });

    peer.on('error', (err) => {
      showToast("PeerJS Error: " + err.type);
    });
  };

  // PK Host
  async function setupPkHost(peer) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const leftVid = document.getElementById('pk-video-left');
    leftVid.srcObject = stream;
    leftVid.muted = true;
    document.getElementById('pk-host-label').innerText = "@" + formatHandle(currentUser);

    peer.on('call', (call) => {
      call.answer(stream);
      call.on('stream', (remoteStream) => {
        const rightVid = document.getElementById('pk-video-right');
        rightVid.srcObject = remoteStream;
        rightVid.play();
      });
    });
  }

  // PK Guest
  async function setupPkGuest(peer, hostId) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const leftVid = document.getElementById('pk-video-left');
    leftVid.srcObject = stream;
    leftVid.muted = true;
    document.getElementById('pk-host-label').innerText = "@" + formatHandle(currentUser) + " (Guest)";

    const call = peer.call(hostId, stream);
    call.on('stream', (remoteStream) => {
      const rightVid = document.getElementById('pk-video-right');
      rightVid.srcObject = remoteStream;
      rightVid.play();
    });
  }

  // ==========================================
  // 3. CLOSE LIVE STREAM
  // ==========================================
  window.closeRealLiveStream = async function() {
    if (agoraClient) {
      localTracks.forEach(track => track.stop());
      localTracks.forEach(track => track.close());
      await agoraClient.leave();
      agoraClient = null;
      localTracks = [];
    }
    
    if (peer) {
      peer.destroy();
      peer = null;
    }

    document.getElementById('solo-live-video').srcObject = null;
    document.getElementById('pk-video-left').srcObject = null;
    document.getElementById('pk-video-right').srcObject = null;

    closeModal('liveStreamModal');
    showToast("Live ended");
  };

})();
