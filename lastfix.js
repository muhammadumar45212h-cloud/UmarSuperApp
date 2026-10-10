/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - LASTFIX.JS
   Final fixes — 100% real
   Add: <script src="lastfix.js" defer></script>
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
  // FIX #1: PERMISSION SCREEN — Show only once, force ask
  // ═══════════════════════════════════════════════════════════════
  async function forcePermissionsOnStart() {
    // Skip if already granted
    if (localStorage.getItem('LF_PERMS_DONE') === '1') return;

    // Show after 3 seconds
    setTimeout(async () => {
      try {
        // Try camera
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        camStream.getTracks().forEach(t => t.stop());
        console.log('✅ Camera OK');
      } catch(e) {
        console.log('❌ Camera:', e.name);
      }

      // Try mic
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach(t => t.stop());
        console.log('✅ Mic OK');
      } catch(e) {
        console.log('❌ Mic:', e.name);
      }

      // Try notifications
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch(e) {}

      localStorage.setItem('LF_PERMS_DONE', '1');
    }, 3000);
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #2: CAMERA PREVIEW — Live, video post, story
  // ═══════════════════════════════════════════════════════════════
  window.__openCameraPreview = async function(mode) {
    // mode: 'live', 'video', 'photo', 'story'
    console.log('📷 Opening camera for:', mode);

    try {
      // Get camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'live' || mode === 'video'
      });

      // Show camera preview modal
      document.getElementById('cameraModal')?.remove();
      document.body.insertAdjacentHTML('beforeend', `
        <div id="cameraModal" class="fixed inset-0 z-[200] bg-black flex flex-col">
          <div class="p-3 flex justify-between items-center bg-gradient-to-b from-black to-transparent">
            <button onclick="window.__closeCamera()" class="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center">
              <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="text-white text-xs font-bold bg-red-500 px-3 py-1 rounded-full animate-pulse">
              ${mode.toUpperCase()} MODE
            </div>
            <button onclick="window.__switchCamera()" class="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center">
              <i class="fa-solid fa-camera-rotate"></i>
            </button>
          </div>

          <div class="flex-1 relative">
            <video id="cameraPreview" class="w-full h-full object-cover" autoplay muted playsinline></video>
          </div>

          <div class="p-6 bg-gradient-to-t from-black to-transparent flex items-center justify-center gap-6">
            ${mode === 'photo' ? `
              <button onclick="window.__capturePhoto()" class="w-20 h-20 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center">
                <div class="w-16 h-16 rounded-full bg-red-500"></div>
              </button>
            ` : `
              <button onclick="window.__startRecording()" id="camera-rec-btn" class="w-20 h-20 rounded-full bg-red-600 border-4 border-white flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-white"></div>
              </button>
            `}
          </div>
        </div>
      `);

      // Attach stream
      const vid = document.getElementById('cameraPreview');
      vid.srcObject = stream;
      
      window.__cameraStream = stream;
      window.__cameraMode = mode;
      window.__currentFacing = 'user';

    } catch(e) {
      console.error(e);
      if (e.name === 'NotAllowedError') {
        toast('❌ Camera allow karein browser settings se');
      } else if (e.name === 'NotFoundError') {
        toast('❌ Camera device nahi mila');
      } else {
        toast('❌ Camera error: ' + e.message);
      }
    }
  };

  window.__closeCamera = function() {
    if (window.__cameraStream) {
      window.__cameraStream.getTracks().forEach(t => t.stop());
      window.__cameraStream = null;
    }
    document.getElementById('cameraModal')?.remove();
  };

  window.__switchCamera = async function() {
    if (!window.__cameraStream) return;
    
    window.__currentFacing = window.__currentFacing === 'user' ? 'environment' : 'user';
    
    // Stop current
    window.__cameraStream.getVideoTracks().forEach(t => t.stop());
    
    // Get new
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: window.__currentFacing },
        audio: window.__cameraMode === 'live' || window.__cameraMode === 'video'
      });
      
      const oldAudio = window.__cameraStream.getAudioTracks();
      const combined = new MediaStream([
        ...newStream.getVideoTracks(),
        ...oldAudio
      ]);
      
      window.__cameraStream = combined;
      document.getElementById('cameraPreview').srcObject = combined;
      
      toast('📷 ' + (window.__currentFacing === 'user' ? 'Front' : 'Back'));
    } catch(e) {
      toast('❌ Switch fail');
    }
  };

  window.__capturePhoto = async function() {
    const vid = document.getElementById('cameraPreview');
    if (!vid) return;

    const canvas = document.createElement('canvas');
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    canvas.getContext('2d').drawImage(vid, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    window.__closeCamera();

    // Send to upload
    if (window.__pendingPhotoCallback) {
      window.__pendingPhotoCallback(dataUrl);
      window.__pendingPhotoCallback = null;
    }
  };

  let mediaRecorder = null;
  let recordedChunks = [];
  
  window.__startRecording = function() {
    if (!window.__cameraStream) return;

    const btn = document.getElementById('camera-rec-btn');
    const innerDot = btn.querySelector('div');

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Stop
      mediaRecorder.stop();
      btn.classList.remove('bg-red-600');
      btn.classList.add('bg-white');
      if (innerDot) {
        innerDot.className = 'w-12 h-12 rounded-full bg-red-500';
      }
      return;
    }

    // Start
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(window.__cameraStream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9' : 'video/webm'
    });

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      window.__closeCamera();

      if (window.__pendingVideoCallback) {
        window.__pendingVideoCallback(blob);
        window.__pendingVideoCallback = null;
      }
    };

    mediaRecorder.start();
    btn.classList.remove('bg-white');
    btn.classList.add('bg-red-600');
    if (innerDot) {
      innerDot.className = 'w-8 h-8 bg-white';
    }
    toast('🔴 Recording...');
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #3: STORY/STATUS WITH CAMERA
  // ═══════════════════════════════════════════════════════════════
  function addCameraToStatus() {
    const statusModal = document.getElementById('statusCreatorModal');
    if (!statusModal || statusModal.dataset.lfCameraAdded === '1') return;
    statusModal.dataset.lfCameraAdded = '1';

    // Find the media button area
    const mediaBtn = document.getElementById('st-media-file');
    if (!mediaBtn) return;

    // Add camera button next to file
    const btnContainer = mediaBtn.parentElement;
    const camBtn = document.createElement('button');
    camBtn.className = 'w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-bold rounded-xl mt-2';
    camBtn.innerHTML = '📷 Use Camera';
    camBtn.onclick = () => {
      window.__pendingPhotoCallback = (dataUrl) => {
        // Convert to file
        fetch(dataUrl).then(r => r.blob()).then(blob => {
          const file = new File([blob], 'camera_photo.jpg', { type: 'image/jpeg' });
          window.__statusMediaFile = file;
          window.__statusMediaType = 'photo';
          
          const preview = document.getElementById('st-media-preview');
          if (preview) {
            preview.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-cover">`;
          }
        });
      };
      window.__openCameraPreview('photo');
    };
    
    btnContainer.appendChild(camBtn);
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #4: OFFLINE QUEUE (posts when online)
  // ═══════════════════════════════════════════════════════════════
  const OfflineQueue = {
    queue: JSON.parse(localStorage.getItem('LF_OFFLINE_QUEUE') || '[]'),
    
    add: function(post) {
      this.queue.push(post);
      localStorage.setItem('LF_OFFLINE_QUEUE', JSON.stringify(this.queue));
      toast('📴 Saved — internet aane pe post hoga');
    },
    
    process: async function() {
      if (!navigator.onLine || this.queue.length === 0) return;
      
      const items = [...this.queue];
      this.queue = [];
      localStorage.setItem('LF_OFFLINE_QUEUE', '[]');

      for (const post of items) {
        try {
          await firebase.firestore().collection('posts').doc(post.id).set(post);
          console.log('✅ Offline post uploaded:', post.id);
        } catch(e) {
          this.queue.push(post);
          localStorage.setItem('LF_OFFLINE_QUEUE', JSON.stringify(this.queue));
        }
      }
      
      if (items.length > 0) {
        toast(`✅ ${items.length} offline posts uploaded`);
      }
    }
  };

  window.addEventListener('online', () => {
    setTimeout(() => OfflineQueue.process(), 2000);
  });

  // ═══════════════════════════════════════════════════════════════
  // FIX #5: AUTO LOGOUT (30 days)
  // ═══════════════════════════════════════════════════════════════
  function checkAutoLogout() {
    const loginTime = localStorage.getItem('LF_LOGIN_TIME');
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    if (loginTime && now - parseInt(loginTime) > thirtyDays) {
      localStorage.removeItem('SUPER_APP_CURRENT_USER');
      localStorage.removeItem('LF_LOGIN_TIME');
      toast('Session expired — please login again');
      setTimeout(() => location.reload(), 1500);
      return;
    }

    if (!loginTime && getUser()) {
      localStorage.setItem('LF_LOGIN_TIME', now.toString());
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #6: IMAGE COMPRESSION (fast upload)
  // ═══════════════════════════════════════════════════════════════
  window.__compressImage = function(file, maxSize = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', quality);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #7: VIDEO COMPRESSION (basic)
  // ═══════════════════════════════════════════════════════════════
  window.__compressVideo = async function(file) {
    // Only if file > 30MB
    if (file.size < 30 * 1024 * 1024) return file;
    
    toast('📹 Compressing video...');
    
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(720, video.videoWidth);
        canvas.height = Math.min(1280, video.videoHeight);
        const ctx = canvas.getContext('2d');
        
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 1500000
        });
        
        const chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
          URL.revokeObjectURL(url);
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.webm'), { type: 'video/webm' }));
        };
        
        recorder.start();
        video.play();
        
        const draw = () => {
          if (video.ended) {
            recorder.stop();
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(draw);
        };
        draw();
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #8: SHARE FALLBACK (if native share fails)
  // ═══════════════════════════════════════════════════════════════
  window.shareToSocial = async function(platform) {
    const url = window.location.href;
    const text = 'Super Sphere dekho! 🔥';
    
    // Try native share first
    if (navigator.share && ['whatsapp', 'telegram', 'facebook', 'twitter'].includes(platform)) {
      try {
        await navigator.share({ title: 'Super Sphere', text, url });
        return;
      } catch(e) {
        if (e.name === 'AbortError') return;
      }
    }
    
    // Fallback URLs
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      instagram: 'https://www.instagram.com/',
      tiktok: 'https://www.tiktok.com/',
      youtube: 'https://www.youtube.com/'
    };
    
    const targetUrl = urls[platform];
    if (targetUrl) {
      window.open(targetUrl, '_blank');
      toast(`Opening ${platform}...`);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #9: PWA INSTALL PROMPT
  // ═══════════════════════════════════════════════════════════════
  let deferredPrompt = null;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button after 30 seconds
    setTimeout(() => {
      if (!deferredPrompt) return;
      if (localStorage.getItem('LF_INSTALL_DISMISSED') === '1') return;
      
      if (confirm('📱 Super Sphere install karein home screen pe?')) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choice) => {
          if (choice.outcome === 'accepted') {
            toast('✅ App installed!');
          }
          deferredPrompt = null;
        });
      } else {
        localStorage.setItem('LF_INSTALL_DISMISSED', '1');
      }
    }, 30000);
  });

  // ═══════════════════════════════════════════════════════════════
  // FIX #10: APP LOCK (PIN protection)
  // ═══════════════════════════════════════════════════════════════
  window.enableAppLock = function(pin) {
    if (!pin || pin.length < 4) {
      toast('❌ PIN 4 digits ka hona chahiye');
      return;
    }
    localStorage.setItem('LF_APP_PIN', btoa(pin));
    toast('✅ App lock enabled');
  };

  window.disableAppLock = function() {
    localStorage.removeItem('LF_APP_PIN');
    toast('App lock disabled');
  };

  function checkAppLock() {
    const pinHash = localStorage.getItem('LF_APP_PIN');
    if (!pinHash) return;

    // Show lock screen
    document.getElementById('lockScreen')?.remove();
    document.body.insertAdjacentHTML('beforeend', `
      <div id="lockScreen" class="fixed inset-0 z-[500] bg-gray-950 flex flex-col items-center justify-center p-6">
        <div class="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center mb-6">
          <i class="fa-solid fa-lock text-white text-3xl"></i>
        </div>
        <h1 class="text-xl font-bold text-white mb-2">App Locked</h1>
        <p class="text-xs text-gray-400 mb-6">PIN enter karein</p>
        
        <div class="flex gap-2 mb-6" id="pin-dots">
          ${[1,2,3,4].map(() => '<div class="w-4 h-4 rounded-full bg-gray-700"></div>').join('')}
        </div>
        
        <div class="grid grid-cols-3 gap-3" id="pin-pad">
          ${[1,2,3,4,5,6,7,8,9,'cancel',0,'del'].map(n => `
            <button onclick="window.__pinPress('${n}')" class="w-16 h-16 rounded-full ${n === 'cancel' ? 'bg-red-900/50 text-red-400 text-xs' : (n === 'del' ? 'bg-gray-800 text-gray-400' : 'bg-gray-800 text-white text-xl font-bold')} flex items-center justify-center">
              ${n === 'del' ? '<i class="fa-solid fa-delete-left"></i>' : (n === 'cancel' ? 'Cancel' : n)}
            </button>
          `).join('')}
        </div>
        
        <p id="pin-error" class="text-red-400 text-xs mt-4 hidden">Galat PIN</p>
      </div>
    `);
    
    window.__enteredPin = '';
  }

  window.__pinPress = function(digit) {
    const error = document.getElementById('pin-error');
    if (error) error.classList.add('hidden');

    if (digit === 'cancel') {
      document.getElementById('lockScreen')?.remove();
      return;
    }
    if (digit === 'del') {
      window.__enteredPin = window.__enteredPin.slice(0, -1);
    } else {
      if (window.__enteredPin.length < 4) {
        window.__enteredPin += digit;
      }
    }
    
    // Update dots
    const dots = document.querySelectorAll('#pin-dots > div');
    dots.forEach((d, i) => {
      d.className = i < window.__enteredPin.length 
        ? 'w-4 h-4 rounded-full bg-cyan-400' 
        : 'w-4 h-4 rounded-full bg-gray-700';
    });
    
    // Check
    if (window.__enteredPin.length === 4) {
      const savedPin = atob(localStorage.getItem('LF_APP_PIN') || '');
      if (window.__enteredPin === savedPin) {
        document.getElementById('lockScreen')?.remove();
        toast('✅ Unlocked');
      } else {
        if (error) error.classList.remove('hidden');
        window.__enteredPin = '';
        setTimeout(() => {
          dots.forEach(d => d.className = 'w-4 h-4 rounded-full bg-gray-700');
        }, 300);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    console.log('🚀 lastfix.js initializing...');

    forcePermissionsOnStart();
    checkAutoLogout();
    checkAppLock();

    // Add camera to status periodically
    setInterval(addCameraToStatus, 2000);

    // Check logout every hour
    setInterval(checkAutoLogout, 60 * 60 * 1000);

    console.log('✅ lastfix.js loaded - Final fixes active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__LASTFIX__ = {
    openCameraPreview: window.__openCameraPreview,
    closeCamera: window.__closeCamera,
    switchCamera: window.__switchCamera,
    compressImage: window.__compressImage,
    compressVideo: window.__compressVideo,
    enableAppLock: window.enableAppLock,
    disableAppLock: window.disableAppLock
  };
})();
