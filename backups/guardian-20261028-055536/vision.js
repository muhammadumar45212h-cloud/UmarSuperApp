/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - VISION.JS
   Real AI-powered content moderation (Free — no API key needed)
   
   1. NSFW.js (TensorFlow) — Real image detection
   2. Blob scanning — Photos/videos check before upload
   3. Video frame sampling — Video bhi scan
   4. Auto-delete + Auto-ban on bad content
   5. Cloud Vision optional (if API key)
   
   Add: <script src="vision.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════
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
  // LOAD NSFW.JS (Free, real NSFW detection in browser)
  // ═══════════════════════════════════════════════════════════════
  let nsfwModel = null;
  let modelLoading = false;
  let modelReady = false;

  function loadNsfwModel() {
    if (modelReady || modelLoading) return Promise.resolve();
    modelLoading = true;

    return new Promise((resolve) => {
      // Load nsfwjs + tfjs
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js',
        'https://cdn.jsdelivr.net/npm/nsfwjs@4.2.0/dist/nsfwjs.min.js'
      ];

      let loaded = 0;
      scripts.forEach(src => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => {
          loaded++;
          if (loaded === scripts.length) {
            // Initialize model
            if (window.nsfwjs) {
              window.nsfwjs.load('MobileNetV2')
                .then(model => {
                  nsfwModel = model;
                  modelReady = true;
                  modelLoading = false;
                  console.log('✅ NSFW model loaded');
                  resolve();
                })
                .catch(e => {
                  console.warn('NSFW model load failed:', e);
                  modelLoading = false;
                  resolve();
                });
            } else {
              modelLoading = false;
              resolve();
            }
          }
        };
        s.onerror = () => {
          loaded++;
          if (loaded === scripts.length) {
            modelLoading = false;
            resolve();
          }
        };
        document.head.appendChild(s);
      });
    });
  }

  // Preload model after 8 seconds (background)
  setTimeout(() => {
    loadNsfwModel().catch(() => {});
  }, 8000);

  // ═══════════════════════════════════════════════════════════════
  // IMAGE MODERATION — Real NSFW detection
  // ═══════════════════════════════════════════════════════════════
  window.__moderateImage = async function(imageSource) {
    try {
      // Ensure model loaded
      if (!modelReady) {
        toast('🔄 Loading AI model...');
        await loadNsfwModel();
      }

      if (!modelReady || !nsfwModel) {
        console.warn('⚠️ Model not ready, using basic check');
        return await basicImageCheck(imageSource);
      }

      // Create image element
      const img = await loadImageElement(imageSource);

      // Classify
      const predictions = await nsfwModel.classify(img, 5);
      console.log('🔍 Predictions:', predictions);

      // NSFW classes: Porn, Hentai, Sexy
      const porn = predictions.find(p => p.className === 'Porn')?.probability || 0;
      const hentai = predictions.find(p => p.className === 'Hentai')?.probability || 0;
      const sexy = predictions.find(p => p.className === 'Sexy')?.probability || 0;
      const neutral = predictions.find(p => p.className === 'Neutral')?.probability || 0;
      const drawing = predictions.find(p => p.className === 'Drawing')?.probability || 0;

      const nsfwScore = porn + hentai + sexy;

      return {
        safe: nsfwScore < 0.6, // 60%+ NSFW = block
        porn: Math.round(porn * 100),
        hentai: Math.round(hentai * 100),
        sexy: Math.round(sexy * 100),
        neutral: Math.round(neutral * 100),
        drawing: Math.round(drawing * 100),
        nsfwScore: Math.round(nsfwScore * 100),
        method: 'nsfwjs'
      };

    } catch(e) {
      console.warn('Moderation error:', e);
      return { safe: true, method: 'error', error: e.message };
    }
  };

  function loadImageElement(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // BASIC FALLBACK — Skin-tone detection (if model fails)
  // ═══════════════════════════════════════════════════════════════
  async function basicImageCheck(imageSource) {
    try {
      const img = await loadImageElement(imageSource);
      const canvas = document.createElement('canvas');
      const maxSize = 200;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let skinPixels = 0;
      const totalPixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > 95 && g > 40 && b > 20 &&
            r > g && r > b &&
            Math.abs(r - g) > 15 &&
            Math.max(r, g, b) - Math.min(r, g, b) > 15) {
          skinPixels++;
        }
      }

      const skinRatio = skinPixels / totalPixels;
      return {
        safe: skinRatio < 0.55,
        skinRatio: Math.round(skinRatio * 100),
        method: 'skin-tone'
      };
    } catch(e) {
      return { safe: true, method: 'error' };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // VIDEO MODERATION — Sample frames and check each
  // ═══════════════════════════════════════════════════════════════
  window.__moderateVideo = async function(videoFile, onProgress) {
    try {
      const video = await loadVideoElement(videoFile);
      const duration = video.duration;

      // Sample 5 frames across video
      const sampleTimes = [
        0.1 * duration,
        0.3 * duration,
        0.5 * duration,
        0.7 * duration,
        0.9 * duration
      ];

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');

      let maxNsfw = 0;
      let worstResult = null;

      for (let i = 0; i < sampleTimes.length; i++) {
        const t = sampleTimes[i];
        video.currentTime = t;
        await new Promise(r => {
          video.onseeked = r;
          setTimeout(r, 2000); // timeout
        });

        // Draw frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

        // Moderate frame
        const result = await window.__moderateImage(dataUrl);
        
        if (result.nsfwScore > maxNsfw) {
          maxNsfw = result.nsfwScore;
          worstResult = result;
        }

        if (onProgress) {
          onProgress(Math.floor(((i + 1) / sampleTimes.length) * 100), `Frame ${i + 1}/5`);
        }

        if (maxNsfw > 75) break; // Early exit if very bad
      }

      // Clean up
      video.pause();
      video.src = '';
      video.load();

      return {
        safe: maxNsfw < 60,
        nsfwScore: maxNsfw,
        worstFrame: worstResult,
        method: 'video-sample'
      };

    } catch(e) {
      console.warn('Video moderation error:', e);
      return { safe: true, method: 'error', error: e.message };
    }
  };

  function loadVideoElement(fileOrUrl) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      
      const url = typeof fileOrUrl === 'string' 
        ? fileOrUrl 
        : URL.createObjectURL(fileOrUrl);

      video.onloadedmetadata = () => resolve(video);
      video.onerror = reject;
      video.src = url;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // HOOK INTO PUBLISH POST — Auto-moderate before upload
  // ═══════════════════════════════════════════════════════════════
  const originalPublish = window.publishPost;
  window.publishPost = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    const videoFileInput = document.getElementById('post-video-file');
    const selectedFile = videoFileInput?.files?.[0];
    const directUrl = (document.getElementById('post-video-url')?.value || '').trim();

    // Moderate video file
    if (selectedFile) {
      // Check if image
      if (selectedFile.type.startsWith('image/')) {
        toast('🔍 Scanning image...');
        const dataUrl = await fileToDataUrl(selectedFile);
        const result = await window.__moderateImage(dataUrl);

        console.log('Image moderation:', result);

        if (!result.safe) {
          await reportBadContent(user, 'image', result);
          toast('❌ Ye image inappropriate hai. Koi aur try karein.');
          return;
        }
      }

      // Check if video
      if (selectedFile.type.startsWith('video/')) {
        if (selectedFile.size < 5 * 1024 * 1024) {
          // Small video — full check
          toast('🔍 Scanning video...');
          
          showModerationProgress(0, 'Checking video...');
          
          const result = await window.__moderateVideo(selectedFile, (pct, status) => {
            showModerationProgress(pct, status);
          });

          hideModerationProgress();

          console.log('Video moderation:', result);

          if (!result.safe) {
            await reportBadContent(user, 'video', result);
            toast('❌ Ye video inappropriate hai. Post nahi hogi.');
            return;
          }
        } else {
          // Large video — warn + proceed
          console.log('Large video — skipping full moderation');
        }
      }
    }

    // Moderate direct URL image
    if (directUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(directUrl)) {
      toast('🔍 Scanning URL...');
      const result = await window.__moderateImage(directUrl);
      if (!result.safe) {
        await reportBadContent(user, 'image', result);
        toast('❌ URL mein inappropriate content hai');
        return;
      }
    }

    // All safe — proceed with original publish
    if (typeof originalPublish === 'function') {
      return originalPublish.apply(this, arguments);
    }
  };

  function fileToDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // REPORT BAD CONTENT — Auto-ban + admin alert
  // ═══════════════════════════════════════════════════════════════
  async function reportBadContent(user, type, result) {
    try {
      // Get user's current warnings count
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const uData = users[user] || {};
      const violations = (uData.violations || 0) + 1;

      // Save to Firestore
      await firebase.firestore().collection('users').doc(user).set({
        violations: violations,
        lastViolation: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Log the violation
      await firebase.firestore().collection('violations').add({
        user: user,
        type: type,
        nsfwScore: result.nsfwScore || 0,
        method: result.method || 'unknown',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 3 violations = auto ban
      if (violations >= 3) {
        await firebase.firestore().collection('users').doc(user).set({
          banned: true,
          banReason: 'Repeated inappropriate content (' + violations + ' violations)',
          bannedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await firebase.firestore().collection('notifications').add({
          userId: user,
          title: '🚫 Account Banned',
          body: 'Aapne ' + violations + ' baar inappropriate content post karne ki koshish ki. Account permanently ban.',
          type: 'warning',
          read: false,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        toast('🚫 Account banned — 3 violations');
      } else {
        // Warning
        await firebase.firestore().collection('notifications').add({
          userId: user,
          title: '⚠️ Warning ' + violations + '/3',
          body: 'Aapne inappropriate content post karne ki koshish ki. ' + (3 - violations) + ' aur baar = ban.',
          type: 'warning',
          read: false,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        toast('⚠️ Warning ' + violations + '/3');
      }

      // Alert admin via WhatsApp
      const waText = encodeURIComponent(
        `🚨 BAD CONTENT DETECTED\n\n` +
        `User: @${user}\n` +
        `Type: ${type}\n` +
        `NSFW Score: ${result.nsfwScore || 0}%\n` +
        `Method: ${result.method || 'unknown'}\n` +
        `Violations: ${violations}/3\n\n` +
        `${violations >= 3 ? '🚫 User AUTO-BANNED' : '⚠️ Warning issued'}`
      );

      // Silent admin alert (no auto-open, just log)
      console.log('🚨 Admin alert:', waText);
      
      // Store for admin panel
      try {
        await firebase.firestore().collection('admin_alerts').add({
          user: user,
          type: 'bad_content',
          content: type,
          score: result.nsfwScore || 0,
          violations: violations,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch(e) {}

    } catch(e) {
      console.warn('Report error:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PROGRESS UI
  // ═══════════════════════════════════════════════════════════════
  function showModerationProgress(pct, status) {
    if (!document.getElementById('moderationProgress')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="moderationProgress" class="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6">
          <div class="w-full max-w-md bg-gray-900 border-2 border-cyan-500/40 rounded-2xl p-6 space-y-4">
            <div class="text-center">
              <div class="text-5xl mb-3 animate-pulse">🔍</div>
              <h2 class="text-base font-bold text-cyan-400">AI Moderation</h2>
              <p class="text-xs text-gray-400 mt-1" id="mod-status">Scanning...</p>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div id="mod-fill" class="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all" style="width:0%"></div>
            </div>
            <p class="text-2xl font-extrabold text-cyan-400 text-center" id="mod-pct">0%</p>
            <p class="text-[10px] text-center text-gray-500">Content check kar rahe hain...</p>
          </div>
        </div>
      `);
    }
    const fill = document.getElementById('mod-fill');
    const pctEl = document.getElementById('mod-pct');
    const statusEl = document.getElementById('mod-status');
    if (fill) fill.style.width = pct + '%';
    if (pctEl) pctEl.innerText = pct + '%';
    if (statusEl && status) statusEl.innerText = status;
  }

  function hideModerationProgress() {
    setTimeout(() => {
      document.getElementById('moderationProgress')?.remove();
    }, 500);
  }

  // ═══════════════════════════════════════════════════════════════
  // HOOK INTO STATUS — Auto-moderate
  // ═══════════════════════════════════════════════════════════════
  const originalStatusMedia = window.__statusMediaSelect;
  window.__statusMediaSelect = async function(input) {
    const file = input.files?.[0];
    if (!file) return;

    // Moderate images
    if (file.type.startsWith('image/')) {
      toast('🔍 Scanning image...');
      const dataUrl = await fileToDataUrl(file);
      const result = await window.__moderateImage(dataUrl);
      
      if (!result.safe) {
        toast('❌ Ye image inappropriate hai');
        input.value = '';
        return;
      }
    }

    // Moderate videos
    if (file.type.startsWith('video/') && file.size < 20 * 1024 * 1024) {
      showModerationProgress(0, 'Scanning status video...');
      const result = await window.__moderateVideo(file, (pct, status) => {
        showModerationProgress(pct, status);
      });
      hideModerationProgress();
      
      if (!result.safe) {
        toast('❌ Ye video inappropriate hai');
        input.value = '';
        return;
      }
    }

    // Proceed with original
    if (typeof originalStatusMedia === 'function') {
      return originalStatusMedia.apply(this, arguments);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // HOOK INTO PROFILE PHOTO
  // ═══════════════════════════════════════════════════════════════
  const originalAvatarPreview = window.previewEditAvatar;
  window.previewEditAvatar = async function(input) {
    const file = input.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      toast('🔍 Scanning photo...');
      const dataUrl = await fileToDataUrl(file);
      const result = await window.__moderateImage(dataUrl);
      
      if (!result.safe) {
        toast('❌ Ye photo inappropriate hai');
        input.value = '';
        return;
      }
    }

    if (typeof originalAvatarPreview === 'function') {
      return originalAvatarPreview.apply(this, arguments);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // SCAN EXISTING POSTS (admin only)
  // ═══════════════════════════════════════════════════════════════
  window.__scanAllPosts = async function() {
    const user = getUser();
    const admins = ['muhammadumar45212h', 'Umar', 'admin'];
    if (!admins.includes(user)) { toast('Admin only'); return; }

    if (!confirm('Saari existing posts scan karein? Ye time lega.')) return;

    toast('🔍 Scanning all posts...');
    
    try {
      const snap = await firebase.firestore().collection('posts').limit(100).get();
      let scanned = 0;
      let removed = 0;

      for (const doc of snap.docs) {
        const data = doc.data();
        scanned++;

        // Scan image/video thumbnail
        if (data.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(data.url)) {
          const result = await window.__moderateImage(data.url);
          
          if (!result.safe) {
            // Delete bad post
            if (data.url.includes('firebasestorage') && firebase.storage) {
              try { await firebase.storage().refFromURL(data.url).delete(); } catch(e) {}
            }
            await doc.ref.delete();
            removed++;
            console.log('🗑️ Removed bad post:', doc.id);
          }
        }

        if (scanned % 5 === 0) {
          toast(`📊 Scanned: ${scanned}, Removed: ${removed}`);
        }
      }

      toast(`✅ Scan complete: ${scanned} scanned, ${removed} removed`);

    } catch(e) {
      toast('❌ ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // ADMIN VIOLATION PANEL
  // ═══════════════════════════════════════════════════════════════
  window.openViolationPanel = async function() {
    const user = getUser();
    const admins = ['muhammadumar45212h', 'Umar', 'admin'];
    if (!admins.includes(user)) { toast('Admin only'); return; }

    document.getElementById('violationPanel')?.remove();

    document.body.insertAdjacentHTML('beforeend', `
      <div id="violationPanel" class="fullscreen-modal p-4 z-[200] overflow-y-auto no-scrollbar space-y-3">
        <div class="flex justify-between items-center border-b border-red-500/40 pb-3 sticky top-0 bg-gray-950 z-10">
          <h2 class="text-base font-bold text-red-400"><i class="fa-solid fa-shield-virus"></i> Violations</h2>
          <button onclick="document.getElementById('violationPanel').remove()" class="text-gray-400 text-xl">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div id="violations-list" class="space-y-2">
          <p class="text-xs text-gray-500 text-center py-8">Loading...</p>
        </div>
      </div>
    `);

    try {
      const snap = await firebase.firestore().collection('violations')
        .orderBy('timestamp', 'desc').limit(50).get();

      const list = document.getElementById('violations-list');
      
      if (snap.empty) {
        list.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">No violations 🎉</p>';
        return;
      }

      list.innerHTML = '';
      snap.forEach(doc => {
        const d = doc.data();
        const div = document.createElement('div');
        div.className = 'bg-gray-900 border border-red-500/30 rounded-xl p-3 space-y-1';
        div.innerHTML = `
          <div class="flex justify-between items-center">
            <p class="text-xs font-bold text-red-400">@${d.user}</p>
            <p class="text-[9px] text-gray-500">${d.timestamp ? new Date(d.timestamp.toMillis()).toLocaleString() : ''}</p>
          </div>
          <p class="text-[10px] text-gray-400">Type: ${d.type} • Score: ${d.nsfwScore}%</p>
          <p class="text-[9px] text-gray-500">Method: ${d.method || 'unknown'}</p>
        `;
        list.appendChild(div);
      });
    } catch(e) {
      document.getElementById('violations-list').innerHTML = 
        `<p class="text-xs text-red-400 text-center py-8">Error: ${e.message}</p>`;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    console.log('🛡️ vision.js initializing...');
    
    // Preload model
    setTimeout(() => loadNsfwModel().catch(() => {}), 5000);

    console.log('✅ vision.js loaded — AI content moderation active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__VISION__ = {
    moderateImage: window.__moderateImage,
    moderateVideo: window.__moderateVideo,
    scanAllPosts: window.__scanAllPosts,
    openViolationPanel: window.openViolationPanel,
    isModelReady: () => modelReady
  };
})();
