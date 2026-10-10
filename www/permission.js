/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - PERMISSION.JS
   Ek hi screen pe saari permissions maange
   Camera, Mic, Gallery, Storage, Notifications
   
   Add: <script src="permission.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // PERMISSIONS LIST
  // ═══════════════════════════════════════════════════════════════
  const PERMISSIONS = [
    {
      id: 'camera',
      name: 'Camera',
      icon: '📷',
      desc: 'Live stream aur video call ke liye',
      required: true
    },
    {
      id: 'microphone',
      name: 'Microphone',
      icon: '🎤',
      desc: 'Voice recording aur live audio ke liye',
      required: true
    },
    {
      id: 'photos',
      name: 'Gallery',
      icon: '🖼️',
      desc: 'Video/photo upload karne ke liye',
      required: true
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: '🔔',
      desc: 'Naye messages aur alerts ke liye',
      required: true
    },
    {
      id: 'storage',
      name: 'Storage',
      icon: '💾',
      desc: 'Videos save aur share karne ke liye',
      required: true
    }
  ];

  // ═══════════════════════════════════════════════════════════════
  // CHECK CAPACITOR
  // ═══════════════════════════════════════════════════════════════
  const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

  // ═══════════════════════════════════════════════════════════════
  // SHOW PERMISSION SCREEN — called on app start
  // ═══════════════════════════════════════════════════════════════
  function showPermissionScreen() {
    // Agar already granted hai toh skip
    if (localStorage.getItem('SPHERE_PERMS_GRANTED') === '1') {
      console.log('✅ Permissions already granted');
      return;
    }

    if (document.getElementById('permScreen')) return;

    // Build UI
    document.body.insertAdjacentHTML('beforeend', `
      <div id="permScreen" class="fixed inset-0 z-[200] bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 flex flex-col items-center justify-center p-6 overflow-y-auto no-scrollbar">
        <div class="w-full max-w-md space-y-5">
          
          <!-- Logo + Title -->
          <div class="text-center space-y-2">
            <div class="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center shadow-2xl">
              <span class="text-4xl">⚡</span>
            </div>
            <h1 class="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-500">
              Welcome to Super Sphere
            </h1>
            <p class="text-xs text-gray-400">Best experience ke liye kuch permissions chahiye</p>
          </div>

          <!-- Permissions List -->
          <div class="bg-gray-900/70 backdrop-blur-lg border border-cyan-500/30 rounded-2xl p-4 space-y-2">
            ${PERMISSIONS.map(p => `
              <div class="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-gray-800" data-perm="${p.id}">
                <div class="text-2xl">${p.icon}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <p class="text-sm font-bold text-white">${p.name}</p>
                    ${p.required ? '<span class="text-[8px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full font-bold">Required</span>' : ''}
                  </div>
                  <p class="text-[10px] text-gray-400 truncate">${p.desc}</p>
                </div>
                <div class="perm-status w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center" id="perm-${p.id}-status">
                  <i class="fa-solid fa-circle text-[8px] text-gray-600"></i>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Info -->
          <div class="bg-blue-900/30 border border-blue-500/30 rounded-xl p-3 flex items-start gap-2">
            <span class="text-blue-400 text-sm">ℹ️</span>
            <p class="text-[10px] text-blue-200 leading-relaxed">
              Aapki privacy hamari priority hai. Ye permissions sirf app ke features chalane ke liye chahiye, aur kisi third party ko data nahi bheja jata.
            </p>
          </div>

          <!-- Buttons -->
          <div class="space-y-2">
            <button id="perm-allow-all" onclick="window.__grantAllPermissions()" 
                    class="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-2xl shadow-2xl flex items-center justify-center gap-2">
              <i class="fa-solid fa-shield-halved"></i> Allow All Permissions
            </button>
            <button onclick="window.__skipPermissions()" 
                    class="w-full py-3 bg-gray-800/50 hover:bg-gray-800 text-gray-400 text-xs font-bold rounded-xl transition-all">
              Baad mein (Limited Features)
            </button>
          </div>

          <!-- Status -->
          <p id="perm-global-status" class="text-center text-xs text-cyan-400 font-semibold hidden"></p>
        </div>
      </div>
    `);
  }

  // ═══════════════════════════════════════════════════════════════
  // REQUEST ALL PERMISSIONS
  // ═══════════════════════════════════════════════════════════════
  window.__grantAllPermissions = async function() {
    const btn = document.getElementById('perm-allow-all');
    const status = document.getElementById('perm-global-status');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Requesting...';
    }
    if (status) {
      status.classList.remove('hidden');
      status.innerText = 'Permission maang rahe hain...';
    }

    let grantedCount = 0;

    // ═══ NATIVE (APK) — Capacitor Plugins ═══
    if (isNative) {
      const Plugins = window.Capacitor.Plugins;

      // 1. Camera
      try {
        if (Plugins.Camera) {
          const camPerm = await Plugins.Camera.checkPermissions();
          if (camPerm.camera !== 'granted') {
            const r = await Plugins.Camera.requestPermissions({ permissions: ['camera', 'photos'] });
            if (r.camera === 'granted') grantedCount++;
          } else {
            grantedCount++;
          }
          markStatus('camera', 'granted');
        }
      } catch(e) { console.log('Camera perm:', e); markStatus('camera', 'denied'); }

      // 2. Microphone — use getUserMedia (no dedicated plugin)
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach(t => t.stop());
        grantedCount++;
        markStatus('microphone', 'granted');
      } catch(e) { markStatus('microphone', 'denied'); }

      // 3. Photos/Gallery — via Camera plugin permissions
      try {
        if (Plugins.Camera) {
          markStatus('photos', 'granted');
          grantedCount++;
        }
      } catch(e) { markStatus('photos', 'denied'); }

      // 4. Notifications
      try {
        if (Plugins.PushNotifications) {
          const r = await Plugins.PushNotifications.requestPermissions();
          if (r.receive === 'granted') {
            grantedCount++;
            await Plugins.PushNotifications.register();
            markStatus('notifications', 'granted');
          } else {
            markStatus('notifications', 'denied');
          }
        } else if ('Notification' in window) {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            grantedCount++;
            markStatus('notifications', 'granted');
          } else {
            markStatus('notifications', 'denied');
          }
        }
      } catch(e) { markStatus('notifications', 'denied'); }

      // 5. Storage — Capacitor Filesystem check
      try {
        if (Plugins.Filesystem) {
          markStatus('storage', 'granted');
          grantedCount++;
        } else {
          markStatus('storage', 'granted'); // Native storage always available
          grantedCount++;
        }
      } catch(e) { markStatus('storage', 'granted'); grantedCount++; }

    } else {
      // ═══ BROWSER MODE ═══
      
      // Camera + Mic (single request)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true
        });
        stream.getTracks().forEach(t => t.stop());
        grantedCount += 2;
        markStatus('camera', 'granted');
        markStatus('microphone', 'granted');
      } catch(e) {
        // Try audio only
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioOnly.getTracks().forEach(t => t.stop());
          grantedCount++;
          markStatus('microphone', 'granted');
          markStatus('camera', 'denied');
        } catch(e2) {
          markStatus('camera', 'denied');
          markStatus('microphone', 'denied');
        }
      }

      // Photos — browser mein automatic hai
      markStatus('photos', 'granted');
      grantedCount++;

      // Notifications
      try {
        if ('Notification' in window) {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            grantedCount++;
            markStatus('notifications', 'granted');
          } else {
            markStatus('notifications', 'denied');
          }
        }
      } catch(e) { markStatus('notifications', 'denied'); }

      // Storage
      markStatus('storage', 'granted');
      grantedCount++;
    }

    // ═══ FINAL STATUS ═══
    if (status) {
      status.innerText = `✅ ${grantedCount}/${PERMISSIONS.length} permissions granted`;
    }

    // Save to localStorage
    if (grantedCount >= PERMISSIONS.length - 1) {
      localStorage.setItem('SPHERE_PERMS_GRANTED', '1');
    }

    // Success animation
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> ' + grantedCount + '/' + PERMISSIONS.length + ' Granted!';
      btn.className = 'w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm rounded-2xl shadow-2xl flex items-center justify-center gap-2';
    }

    // Close after 1.5 sec
    setTimeout(() => {
      closePermScreen();
    }, 1500);
  };

  // ═══════════════════════════════════════════════════════════════
  // MARK STATUS
  // ═══════════════════════════════════════════════════════════════
  function markStatus(permId, status) {
    const el = document.getElementById('perm-' + permId + '-status');
    if (!el) return;
    if (status === 'granted') {
      el.className = 'perm-status w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center';
      el.innerHTML = '<i class="fa-solid fa-check text-[10px] text-green-400"></i>';
    } else if (status === 'denied') {
      el.className = 'perm-status w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center';
      el.innerHTML = '<i class="fa-solid fa-xmark text-[10px] text-red-400"></i>';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SKIP (Limited mode)
  // ═══════════════════════════════════════════════════════════════
  window.__skipPermissions = function() {
    if (!confirm('⚠️ Kuch features kaam nahi karenge (Live, Video upload). Phir bhi skip karein?')) return;
    localStorage.setItem('SPHERE_PERMS_GRANTED', 'skipped');
    closePermScreen();
  };

  // ═══════════════════════════════════════════════════════════════
  // CLOSE SCREEN
  // ═══════════════════════════════════════════════════════════════
  function closePermScreen() {
    const screen = document.getElementById('permScreen');
    if (screen) {
      screen.style.transition = 'opacity 0.4s ease';
      screen.style.opacity = '0';
      setTimeout(() => screen.remove(), 400);
    }
    console.log('✅ Permission screen closed');
  }

  // ═══════════════════════════════════════════════════════════════
  // REQUEST ON DEMAND (jab feature use karein)
  // ═══════════════════════════════════════════════════════════════
  window.requestPermOnDemand = async function(type) {
    if (localStorage.getItem('SPHERE_PERMS_GRANTED') === '1') return true;

    try {
      if (type === 'camera' || type === 'video') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        return true;
      }
      if (type === 'mic' || type === 'audio') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        return true;
      }
      if (type === 'camera+mic') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(t => t.stop());
        return true;
      }
    } catch(e) {
      console.log('Perm denied:', type);
      return false;
    }
    return true;
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO-SHOW ON APP START
  // ═══════════════════════════════════════════════════════════════
  function init() {
    // 2 second baad dikhayein (app load hone dein)
    setTimeout(() => {
      const granted = localStorage.getItem('SPHERE_PERMS_GRANTED');
      if (granted !== '1') {
        showPermissionScreen();
      } else {
        console.log('✅ Permissions already granted — skipping screen');
      }
    }, 2000);

    console.log('✅ permission.js loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════
  window.__PERMISSION__ = {
    showPermissionScreen,
    grantAllPermissions: window.__grantAllPermissions,
    requestPermOnDemand: window.requestPermOnDemand,
    PERMISSIONS
  };
})();
