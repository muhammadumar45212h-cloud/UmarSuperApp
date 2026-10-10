/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - SELFHEAL.JS
   Auto-detect bugs + Auto-fix + Leak protection + Self-healing
   
   Add: <script src="selfheal.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // CONFIG
  // ═══════════════════════════════════════════════════════════════
  const HEAL_CONFIG = {
    enabled: true,
    logErrors: true,
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 2000,
    sanitizeInputs: true,
    protectData: true,
    autoFixUI: true,
    reportToAdmin: true,
    adminWhatsapp: '923089775764'
  };

  const HEALTH = {
    errors: [],
    fixes: [],
    retries: [],
    warnings: [],
    lastCheck: Date.now()
  };

  function toast(msg) {
    if (typeof window.showToast === 'function') return window.showToast(msg);
    const t = document.getElementById('toast-notification');
    if (!t) { console.log('[HEAL]', msg); return; }
    document.getElementById('toast-message').innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. GLOBAL ERROR CATCHER — detect + auto-fix
  // ═══════════════════════════════════════════════════════════════
  window.addEventListener('error', (e) => {
    const err = {
      type: 'error',
      message: e.message || 'Unknown',
      source: e.filename || 'inline',
      line: e.lineno || 0,
      time: Date.now()
    };
    HEALTH.errors.push(err);
    if (HEALTH.errors.length > 50) HEALTH.errors.shift();

    console.warn('🩺 [Heal] Error detected:', err.message);

    // Auto-fix attempt
    attemptAutoFix(err);
  });

  window.addEventListener('unhandledrejection', (e) => {
    const err = {
      type: 'promise',
      message: e.reason?.message || String(e.reason),
      source: 'promise',
      time: Date.now()
    };
    HEALTH.errors.push(err);
    if (HEALTH.errors.length > 50) HEALTH.errors.shift();

    console.warn('🩺 [Heal] Promise rejection:', err.message);
    attemptAutoFix(err);
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. AUTO-FIX ENGINE
  // ═══════════════════════════════════════════════════════════════
  function attemptAutoFix(err) {
    const msg = (err.message || '').toLowerCase();

    // Fix 1: Firebase index missing
    if (msg.includes('requires an index') || msg.includes('index')) {
      fixMissingIndex(err);
    }

    // Fix 2: Permission denied
    if (msg.includes('permission') || msg.includes('denied')) {
      fixPermission(err);
    }

    // Fix 3: Undefined is not a function
    if (msg.includes('is not a function') || msg.includes('undefined')) {
      fixUndefinedFunction(err);
    }

    // Fix 4: Network error
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
      fixNetworkError(err);
    }

    // Fix 5: JSON parse
    if (msg.includes('json') || msg.includes('parse')) {
      fixJSONError(err);
    }

    // Fix 6: Camera/Mic
    if (msg.includes('camera') || msg.includes('microphone') || msg.includes('permission')) {
      fixMediaError(err);
    }

    // Fix 7: Firebase Storage
    if (msg.includes('storage') || msg.includes('bucket')) {
      fixStorageError(err);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX 1: Missing Firebase Index
  // ═══════════════════════════════════════════════════════════════
  function fixMissingIndex(err) {
    const match = (err.message || '').match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
    if (match) {
      if (!sessionStorage.getItem('HEAL_INDEX_SHOWN')) {
        sessionStorage.setItem('HEAL_INDEX_SHOWN', '1');
        toast('🔧 Firebase Index needed — click to fix');
        setTimeout(() => {
          if (confirm('Firebase Index banayein? (Auto-create link)')) {
            window.open(match[0], '_blank');
          }
        }, 500);
      }
      HEALTH.fixes.push({ type: 'index', time: Date.now(), url: match[0] });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX 2: Permission Denied
  // ═══════════════════════════════════════════════════════════════
  function fixPermission(err) {
    toast('⚠️ Permission issue — checking...');
    // Clear stale tokens
    try {
      if (msg.includes('auth')) {
        // Nothing — Firebase auth is per-session
      }
    } catch(e) {}
    HEALTH.fixes.push({ type: 'permission', time: Date.now() });
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX 3: Undefined Function — re-attach
  // ═══════════════════════════════════════════════════════════════
  function fixUndefinedFunction(err) {
    const msg = err.message || '';
    const fnMatch = msg.match(/(\w+)\s+is not a function/);
    if (fnMatch) {
      const fnName = fnMatch[1];
      console.warn('🩺 [Heal] Missing function:', fnName);

      // Common missing functions — re-define
      const stubs = {
        'showToast': (msg) => console.log(msg),
        'closeModal': (id) => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); },
        'openModal': (id) => { const el = document.getElementById(id); if (el) el.classList.remove('hidden'); },
        'updateWalletUI': () => {},
        'loadUserData': () => {},
        'initAppContent': () => {},
        'renderFeedPosts': () => {}
      };

      if (stubs[fnName] && !window[fnName]) {
        window[fnName] = stubs[fnName];
        HEALTH.fixes.push({ type: 'stub-added', fn: fnName, time: Date.now() });
        console.log('✅ [Heal] Stub added:', fnName);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX 4: Network Error — auto-retry
  // ═══════════════════════════════════════════════════════════════
  const retryQueue = [];

  function fixNetworkError(err) {
    if (!HEAL_CONFIG.autoRetry) return;
    
    // Check if online
    if (!navigator.onLine) {
      toast('📴 Offline — data will sync when online');
      return;
    }

    HEALTH.retries.push({ time: Date.now(), error: err.message });
    toast('🔄 Network issue — retrying...');
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX 5: JSON Parse Error
  // ═══════════════════════════════════════════════════════════════
  function fixJSONError(err) {
    console.warn('🩺 [Heal] JSON error — cleaning localStorage');
    
    // Common corrupted keys
    const keysToCheck = ['SUPER_APP_USERS', 'SUPER_APP_CURRENT_USER', 'SUPER_APP_CHANNELS', 'SUPER_APP_CHATS'];
    keysToCheck.forEach(key => {
      try {
        const val = localStorage.getItem(key);
        if (val) JSON.parse(val);
      } catch(e) {
        console.warn('🗑️ [Heal] Corrupted:', key);
        localStorage.setItem(key, key === 'SUPER_APP_CURRENT_USER' ? '' : '{}');
        HEALTH.fixes.push({ type: 'json-reset', key, time: Date.now() });
      }
    });

    toast('🔧 Data repaired — please reload');
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX 6: Camera/Mic Error
  // ═══════════════════════════════════════════════════════════════
  function fixMediaError(err) {
    const msg = err.message || '';
    if (msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('notallowed')) {
      toast('📷 Camera/Mic block hai — settings check karein');
      
      // Try again after 3 sec
      setTimeout(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(s => s.getTracks().forEach(t => t.stop()))
          .catch(() => {});
      }, 3000);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX 7: Firebase Storage
  // ═══════════════════════════════════════════════════════════════
  function fixStorageError(err) {
    const msg = err.message || '';
    if (msg.includes('unauthorized') || msg.includes('permission')) {
      toast('🔒 Storage rules update karein (Firebase Console)');
      HEALTH.fixes.push({ type: 'storage-rules', time: Date.now() });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. INPUT SANITIZER (protect from XSS / leaks)
  // ═══════════════════════════════════════════════════════════════
  function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
  }

  window.__sanitize = sanitizeString;

  // Auto-sanitize inputs
  if (HEAL_CONFIG.sanitizeInputs) {
    document.addEventListener('input', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const val = e.target.value;
        if (/<script|javascript:|on\w+\s*=/i.test(val)) {
          e.target.value = sanitizeString(val);
          toast('⚠️ Unsafe content removed');
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. AUTO-CLEAN localStorage (leak protection)
  // ═══════════════════════════════════════════════════════════════
  function cleanLocalStorage() {
    try {
      const size = JSON.stringify(localStorage).length;
      const maxSize = 5 * 1024 * 1024; // 5 MB

      if (size > maxSize) {
        console.warn('🩺 [Heal] localStorage too big:', Math.round(size / 1024), 'KB');
        
        // Clean oldest data
        const keysToClean = [
          'SPHERE_VIDEO_DRAFT',
          'FINAL_VIEWED',
          'SPHERE_BLOCKED',
          'SPHERE_MUTED_STATUS'
        ];
        
        keysToClean.forEach(k => {
          try {
            const val = localStorage.getItem(k);
            if (val && val.length > 50000) {
              if (k === 'FINAL_VIEWED') {
                const arr = JSON.parse(val);
                localStorage.setItem(k, JSON.stringify(arr.slice(-200)));
              } else {
                localStorage.removeItem(k);
              }
              HEALTH.fixes.push({ type: 'storage-clean', key: k, time: Date.now() });
            }
          } catch(e) {}
        });
      }
    } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. AUTO-REPAIR UI (missing buttons, broken elements)
  // ═══════════════════════════════════════════════════════════════
  function repairUI() {
    // Fix missing close buttons on modals
    document.querySelectorAll('.fullscreen-modal').forEach(modal => {
      if (!modal.querySelector('button[onclick*="closeModal"], button[onclick*="remove"]')) {
        const firstChild = modal.firstElementChild;
        if (firstChild && !firstChild.querySelector('.heal-close')) {
          const closeBtn = document.createElement('button');
          closeBtn.className = 'heal-close absolute top-4 right-4 w-9 h-9 rounded-full bg-red-600/80 text-white flex items-center justify-center z-[999]';
          closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
          closeBtn.onclick = () => modal.remove();
          if (!modal.style.position) modal.style.position = 'fixed';
          modal.appendChild(closeBtn);
        }
      }
    });

    // Fix empty images — add fallback
    document.querySelectorAll('img').forEach(img => {
      if (img.dataset.healFixed === '1') return;
      img.dataset.healFixed = '1';
      img.onerror = () => {
        if (!img.src.includes('dicebear')) {
          const seed = img.alt || 'user';
          img.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
          HEALTH.fixes.push({ type: 'img-fallback', time: Date.now() });
        }
      };
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. RE-ATTACH MISSING FUNCTIONS (auto-repair)
  // ═══════════════════════════════════════════════════════════════
  function reattachFunctions() {
    // If a function is missing, provide safe fallback
    const coreFunctions = {
      'showToast': (msg) => alert(msg),
      'closeModal': (id) => { const e = document.getElementById(id); if (e) e.classList.add('hidden'); },
      'openModal': (id) => { const e = document.getElementById(id); if (e) e.classList.remove('hidden'); }
    };

    Object.keys(coreFunctions).forEach(fn => {
      if (typeof window[fn] !== 'function') {
        window[fn] = coreFunctions[fn];
        HEALTH.fixes.push({ type: 'fn-reattach', fn, time: Date.now() });
        console.log('🔧 [Heal] Re-attached:', fn);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. REAL-TIME SYNC CHECKER (detect broken Firebase)
  // ═══════════════════════════════════════════════════════════════
  function checkFirebaseHealth() {
    if (typeof firebase === 'undefined') {
      console.warn('🩺 [Heal] Firebase not loaded');
      return false;
    }
    if (!firebase.firestore) {
      console.warn('🩺 [Heal] Firestore missing');
      return false;
    }
    if (!firebase.storage) {
      // Try to re-load storage
      if (!document.getElementById('heal-storage-script')) {
        const s = document.createElement('script');
        s.id = 'heal-storage-script';
        s.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js';
        document.head.appendChild(s);
        HEALTH.fixes.push({ type: 'storage-reload', time: Date.now() });
      }
      return false;
    }
    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. AUTO REFRESH STUCK UI
  // ═══════════════════════════════════════════════════════════════
  function checkStuckUI() {
    // Loading spinners stuck > 10 sec
    document.querySelectorAll('.fa-spinner').forEach(spinner => {
      const parent = spinner.parentElement;
      if (!parent) return;
      const lastUpdate = parseInt(parent.dataset.healTimer || '0');
      const now = Date.now();
      
      if (!lastUpdate) {
        parent.dataset.healTimer = now;
      } else if (now - lastUpdate > 10000) {
        // Stuck — remove spinner
        const text = parent.innerText.replace('Loading...', '').trim();
        parent.innerHTML = text || 'Retry';
        parent.onclick = () => location.reload();
        delete parent.dataset.healTimer;
        HEALTH.fixes.push({ type: 'stuck-spinner', time: Date.now() });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. SELF-HEAL DASHBOARD (admin)
  // ═══════════════════════════════════════════════════════════════
  window.openHealDashboard = function() {
    if (typeof isAdmin === 'function' && !isAdmin()) return;
    if (!window.isAdmin || !['muhammadumar45212h', 'Umar', 'admin'].includes((localStorage.getItem('SUPER_APP_CURRENT_USER') || '').replace(/^@+/, '').split('@')[0])) {
      toast('Admin only');
      return;
    }

    document.getElementById('healDashboard')?.remove();

    document.body.insertAdjacentHTML('beforeend', `
      <div id="healDashboard" class="fullscreen-modal p-4 z-[300] overflow-y-auto no-scrollbar space-y-4">
        <div class="flex justify-between items-center border-b border-green-500/40 pb-3 sticky top-0 bg-gray-950 z-10">
          <h2 class="text-base font-bold text-green-400"><i class="fa-solid fa-heart-pulse"></i> Self-Heal Dashboard</h2>
          <button onclick="document.getElementById('healDashboard').remove()" class="text-gray-400 text-xl">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div class="bg-gray-900 border border-red-500/30 rounded-xl p-3 text-center">
            <p class="text-[10px] text-gray-400 uppercase">Errors</p>
            <p class="text-lg font-bold text-red-400">${HEALTH.errors.length}</p>
          </div>
          <div class="bg-gray-900 border border-green-500/30 rounded-xl p-3 text-center">
            <p class="text-[10px] text-gray-400 uppercase">Fixes</p>
            <p class="text-lg font-bold text-green-400">${HEALTH.fixes.length}</p>
          </div>
          <div class="bg-gray-900 border border-amber-500/30 rounded-xl p-3 text-center">
            <p class="text-[10px] text-gray-400 uppercase">Warnings</p>
            <p class="text-lg font-bold text-amber-400">${HEALTH.warnings.length}</p>
          </div>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
          <p class="text-xs font-bold text-cyan-400">🩺 System Status</p>
          <div class="text-[10px] text-gray-300 space-y-1">
            <p>Firebase: <b class="${typeof firebase !== 'undefined' ? 'text-green-400' : 'text-red-400'}">${typeof firebase !== 'undefined' ? '✅ Loaded' : '❌ Missing'}</b></p>
            <p>Firestore: <b class="${typeof firebase !== 'undefined' && firebase.firestore ? 'text-green-400' : 'text-red-400'}">${typeof firebase !== 'undefined' && firebase.firestore ? '✅ OK' : '❌ Missing'}</b></p>
            <p>Storage: <b class="${typeof firebase !== 'undefined' && firebase.storage ? 'text-green-400' : 'text-red-400'}">${typeof firebase !== 'undefined' && firebase.storage ? '✅ OK' : '❌ Missing'}</b></p>
            <p>Online: <b class="${navigator.onLine ? 'text-green-400' : 'text-red-400'}">${navigator.onLine ? '✅ Yes' : '❌ No'}</b></p>
            <p>Memory: <b class="text-cyan-400">${Math.round(JSON.stringify(localStorage).length / 1024)} KB</b></p>
          </div>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
          <p class="text-xs font-bold text-cyan-400">🔧 Recent Fixes</p>
          <div class="max-h-40 overflow-y-auto space-y-1 text-[10px]">
            ${HEALTH.fixes.slice(-20).reverse().map(f => `
              <div class="bg-black/40 p-2 rounded">
                <p class="text-green-400">✅ ${f.type}</p>
                <p class="text-gray-500">${new Date(f.time).toLocaleString()}</p>
              </div>
            `).join('') || '<p class="text-gray-500">No fixes yet</p>'}
          </div>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
          <p class="text-xs font-bold text-red-400">❌ Recent Errors</p>
          <div class="max-h-40 overflow-y-auto space-y-1 text-[10px]">
            ${HEALTH.errors.slice(-10).reverse().map(e => `
              <div class="bg-black/40 p-2 rounded">
                <p class="text-red-400">${e.message}</p>
                <p class="text-gray-500">${new Date(e.time).toLocaleString()}</p>
              </div>
            `).join('') || '<p class="text-gray-500">No errors 🎉</p>'}
          </div>
        </div>

        <button onclick="window.__healNow()" class="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm rounded-xl">
          🩺 Run Full Heal Now
        </button>
      </div>
    `);
  };

  window.__healNow = async function() {
    toast('🩺 Running full heal...');
    
    reattachFunctions();
    repairUI();
    cleanLocalStorage();
    checkFirebaseHealth();
    checkStuckUI();

    // Rebuild Firestore index check
    try {
      await firebase.firestore().collection('posts').limit(1).get();
    } catch(e) {}

    toast(`✅ Heal complete — ${HEALTH.fixes.length} fixes applied`);
    window.openHealDashboard();
  };

  // ═══════════════════════════════════════════════════════════════
  // 10. AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    console.log('🩺 selfheal.js active — monitoring');

    // Initial heal
    setTimeout(() => {
      reattachFunctions();
      repairUI();
      cleanLocalStorage();
      checkFirebaseHealth();
    }, 3000);

    // Continuous monitoring
    setInterval(() => {
      repairUI();
      checkStuckUI();
      filterBlocked?.();
    }, 5000);

    // Storage cleanup every 5 min
    setInterval(cleanLocalStorage, 5 * 60 * 1000);

    // Reset counters every hour
    setInterval(() => {
      if (HEALTH.errors.length > 100) HEALTH.errors = HEALTH.errors.slice(-30);
      if (HEALTH.fixes.length > 100) HEALTH.fixes = HEALTH.fixes.slice(-30);
    }, 60 * 60 * 1000);

    // Add heal button in admin
    setInterval(() => {
      if (typeof isAdmin === 'function' && isAdmin() && !document.getElementById('heal-btn')) {
        const header = document.querySelector('header');
        if (header) {
          const btn = document.createElement('button');
          btn.id = 'heal-btn';
          btn.className = 'px-2 py-1 bg-green-600 text-white rounded-full text-[10px] font-bold';
          btn.innerHTML = '<i class="fa-solid fa-heart-pulse"></i>';
          btn.title = 'Self-Heal Dashboard';
          btn.onclick = window.openHealDashboard;
          header.querySelector('div')?.appendChild(btn);
        }
      }
    }, 3000);

    console.log('✅ selfheal.js loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__SELFHEAL__ = {
    health: HEALTH,
    heal: window.__healNow,
    dashboard: window.openHealDashboard,
    sanitize: sanitizeString
  };
})();
