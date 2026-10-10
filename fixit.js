/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - FIXIT.JS
   1. Cross-device user search (Firestore se)
   2. Video posts sabko dikhein (real-time sync)
   3. Live camera + mic fix (separate permissions)
   
   Add: <script src="fixit.js" defer></script>
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
  // FIX #1: LIVE CAMERA + MIC (Separate permissions)
  // ═══════════════════════════════════════════════════════════════
  window.__getLiveStreamSafe = async function() {
    console.log('🎥 Getting live stream (safe mode)...');

    let videoStream = null;
    let audioStream = null;

    // ═══ STEP 1: Try to get VIDEO ═══
    const videoConfigs = [
      { video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } } },
      { video: { facingMode: 'user' } },
      { video: true }
    ];

    for (const cfg of videoConfigs) {
      try {
        videoStream = await navigator.mediaDevices.getUserMedia(cfg);
        console.log('✅ Video granted:', cfg);
        break;
      } catch(e) {
        console.log('❌ Video config failed:', e.name, cfg);
      }
    }

    if (!videoStream) {
      toast('❌ Camera permission block hai. Browser settings mein camera allow karein.');
      return null;
    }

    // ═══ STEP 2: Try to get AUDIO (optional) ═══
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Audio granted');
    } catch(e) {
      console.log('⚠️ Audio denied — video only:', e.name);
      toast('⚠️ Mic block hai — video only chalega');
    }

    // ═══ STEP 3: Combine ═══
    const tracks = [...videoStream.getVideoTracks()];
    if (audioStream) {
      tracks.push(...audioStream.getAudioTracks());
    }

    return new MediaStream(tracks);
  };

  // Override openLiveStreamRoom to use safe stream
  const originalOpenLive = window.openLiveStreamRoom;
  window.openLiveStreamRoom = async function(mode) {
    // Show UI first
    const soloBox = document.getElementById('stream-solo-box');
    const pkBox = document.getElementById('stream-pk-box');
    const title = document.getElementById('stream-type-title');

    if (mode === 'pk') {
      soloBox?.classList.add('hidden');
      pkBox?.classList.remove('hidden');
      if (title) title.innerText = "⚔️ 2-PLAYER PK MATCH LIVE";
    } else {
      pkBox?.classList.add('hidden');
      soloBox?.classList.remove('hidden');
      if (title) title.innerText = "🔴 SOLO LIVE STREAM";
    }

    if (typeof openModal === 'function') openModal('liveStreamModal');

    try {
      // Stop previous stream
      if (window.localStream) {
        window.localStream.getTracks().forEach(t => t.stop());
      }

      // Get new safe stream
      const stream = await window.__getLiveStreamSafe();
      
      if (!stream) {
        closeModal('liveStreamModal');
        return;
      }

      window.localStream = stream;

      // Attach to video elements
      const soloVid = document.getElementById('solo-live-video');
      const pkLeft = document.getElementById('pk-video-left');
      
      if (mode === 'pk' && pkLeft) {
        pkLeft.srcObject = stream;
        pkLeft.muted = true;
        try { await pkLeft.play(); } catch(e) {}
      } else if (soloVid) {
        soloVid.srcObject = stream;
        soloVid.muted = true;
        try { await soloVid.play(); } catch(e) {}
      }

      // Set host label
      const cleanUser = getUser() || 'Guest';
      const soloLabel = document.getElementById('solo-host-label');
      const pkLabel = document.getElementById('pk-host-label');
      if (soloLabel) soloLabel.innerText = '@' + cleanUser + ' (Host)';
      if (pkLabel) pkLabel.innerText = '@' + cleanUser;

      toast('🔴 Live started!');
      console.log('✅ Live stream active');

    } catch(e) {
      console.error('Live error:', e);
      closeModal('liveStreamModal');
      toast('❌ Live error: ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #2: CROSS-DEVICE USER SEARCH (Firestore)
  // ═══════════════════════════════════════════════════════════════
  window.performFullSearch = async function(query) {
    const q = (query || '').toLowerCase().trim();
    const results = document.getElementById('searchResults');
    if (!results) return;

    if (!q) {
      results.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">Type to search...</p>';
      return;
    }

    results.innerHTML = '<p class="text-xs text-cyan-400 text-center py-4"><i class="fa-solid fa-spinner fa-spin"></i> Searching...</p>';

    const found = { users: [], posts: [], channels: [] };

    // ═══ SEARCH USERS FROM FIRESTORE ═══
    try {
      // Get all users (Firestore query)
      const usersSnap = await firebase.firestore().collection('users').limit(200).get();
      
      usersSnap.forEach(doc => {
        const u = doc.id.toLowerCase();
        const data = doc.data();
        const name = (data.name || '').toLowerCase();
        const phone = data.phone || '';
        
        if (u.includes(q) || name.includes(q) || phone.includes(q)) {
          found.users.push({
            id: doc.id,
            name: data.name || doc.id,
            avatar: data.avatar || '',
            bio: data.bio || '',
            isVerified: data.isVerified || data.isPremium || false
          });
        }
      });
      console.log('👥 Users found:', found.users.length);
    } catch(e) {
      console.log('User search error:', e.message);
    }

    // ═══ SEARCH CHANNELS ═══
    try {
      const chSnap = await firebase.firestore().collection('channels').limit(100).get();
      chSnap.forEach(doc => {
        const data = doc.data();
        const name = (data.name || '').toLowerCase();
        const username = (data.username || '').toLowerCase();
        
        if (name.includes(q) || username.includes(q)) {
          found.channels.push({
            id: doc.id,
            name: data.name,
            username: data.username,
            photo: data.photo || ''
          });
        }
      });
    } catch(e) {
      console.log('Channel search error:', e.message);
    }

    // ═══ SEARCH POSTS (videos + captions) ═══
    try {
      const postsSnap = await firebase.firestore().collection('posts')
        .orderBy('createdAt', 'desc').limit(200).get();
      postsSnap.forEach(doc => {
        const data = doc.data();
        const caption = (data.caption || '').toLowerCase();
        const user = (data.user || '').toLowerCase();
        const hashtagMatch = q.startsWith('#') && caption.includes(q);
        
        if (caption.includes(q) || user.includes(q) || hashtagMatch) {
          found.posts.push({
            id: doc.id,
            user: data.user,
            caption: data.caption || '',
            type: data.type,
            url: data.url
          });
        }
      });
    } catch(e) {
      console.log('Post search error:', e.message);
    }

    // ═══ RENDER RESULTS ═══
    results.innerHTML = '';
    let total = 0;

    // USERS
    found.users.slice(0, 20).forEach(u => {
      total++;
      const div = document.createElement('div');
      div.className = 'p-3 bg-gray-900 border border-cyan-500/30 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-800';
      div.onclick = () => {
        if (typeof closeSearchOverlay === 'function') closeSearchOverlay();
        if (typeof openPublicUserProfileModal === 'function') {
          openPublicUserProfileModal(u.id);
        }
      };
      div.innerHTML = `
        <img src="${u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}" class="w-10 h-10 rounded-full bg-gray-800">
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-cyan-400 flex items-center gap-1">
            @${u.id} ${u.isVerified ? '<i class="fa-solid fa-circle-check text-cyan-400 text-[10px]"></i>' : ''}
          </p>
          <p class="text-[10px] text-gray-400 truncate">${u.name}</p>
        </div>
        <i class="fa-solid fa-chevron-right text-gray-600 text-xs"></i>
      `;
      results.appendChild(div);
    });

    // CHANNELS
    found.channels.slice(0, 10).forEach(c => {
      total++;
      const div = document.createElement('div');
      div.className = 'p-3 bg-gray-900 border border-amber-500/30 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-800';
      div.onclick = () => {
        if (typeof closeSearchOverlay === 'function') closeSearchOverlay();
        if (typeof openChannelConversation === 'function') openChannelConversation(c.id);
      };
      div.innerHTML = `
        <img src="${c.photo || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.id}`}" class="w-10 h-10 rounded-full bg-gray-800">
        <div class="flex-1">
          <p class="text-xs font-bold text-amber-400">${c.name}</p>
          <p class="text-[10px] text-gray-400">Channel @${c.username}</p>
        </div>
        <i class="fa-solid fa-chevron-right text-gray-600 text-xs"></i>
      `;
      results.appendChild(div);
    });

    // POSTS
    found.posts.slice(0, 15).forEach(p => {
      total++;
      const div = document.createElement('div');
      div.className = 'p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-800';
      div.onclick = () => {
        if (typeof closeSearchOverlay === 'function') closeSearchOverlay();
        if (p.type === 'video' && p.url) {
          if (typeof openSingleVideoPlayer === 'function') openSingleVideoPlayer(p.id);
        } else {
          if (typeof switchTab === 'function') switchTab('feed');
        }
      };
      div.innerHTML = `
        <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
          <i class="fa-solid ${p.type === 'video' ? 'fa-play' : 'fa-pen'} text-cyan-400"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-white">@${p.user}</p>
          <p class="text-[10px] text-gray-400 line-clamp-1">${p.caption || 'Post'}</p>
        </div>
      `;
      results.appendChild(div);
    });

    if (total === 0) {
      results.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">Kuch nahi mila. Doosra keyword try karein.</p>';
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #3: REAL-TIME POSTS (sab devices pe instant)
  // ═══════════════════════════════════════════════════════════════
  let postsSyncUnsub = null;
  
  function startGlobalPostsSync() {
    if (postsSyncUnsub) {
      try { postsSyncUnsub(); } catch(e) {}
    }

    console.log('🔄 Starting global posts sync...');

    postsSyncUnsub = firebase.firestore().collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .onSnapshot(snap => {
        let changes = 0;
        
        snap.docChanges().forEach(change => {
          const data = change.doc.data();
          const post = {
            id: change.doc.id,
            type: data.type,
            url: data.url || null,
            user: data.user,
            caption: data.caption || '',
            link: data.link || null,
            likes: data.likes || [],
            comments: data.comments || [],
            views: data.views || 0
          };

          if (change.type === 'added' || change.type === 'modified') {
            if (typeof saveVideoToStorage === 'function') {
              saveVideoToStorage(post);
              changes++;
            }
          } else if (change.type === 'removed') {
            if (typeof dbInstance !== 'undefined' && dbInstance) {
              try {
                const tx = dbInstance.transaction('videos', 'readwrite');
                tx.objectStore('videos').delete(post.id);
              } catch(e) {}
            }
          }
        });

        // Refresh UI if changes
        if (changes > 0) {
          console.log('🔄 Posts updated:', changes);
          if (typeof window.initAppContent === 'function') {
            window.initAppContent();
          }
        }
      }, err => {
        console.log('❌ Posts sync error:', err.message);
      });
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #4: PUBLISH POST — Ensure visible to ALL
  // ═══════════════════════════════════════════════════════════════
  window.publishPost = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    const caption = (document.getElementById('post-caption')?.value || '').trim();
    const link = (document.getElementById('post-link')?.value || '').trim();
    const directUrl = (document.getElementById('post-video-url')?.value || '').trim();
    const videoFileInput = document.getElementById('post-video-file');
    const selectedFile = videoFileInput?.files?.[0];

    if (currentCreateType === 'video' && !selectedFile && !directUrl) {
      toast('❌ Video select karein ya URL dein'); return;
    }
    if (!caption && !selectedFile && !directUrl) {
      toast('❌ Caption ya media zaroori'); return;
    }

    const postId = 'post_' + Date.now();
    let finalVideoUrl = directUrl || null;

    // Show loading
    const publishBtn = document.getElementById('publish-btn');
    if (publishBtn) {
      publishBtn.disabled = true;
      publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
    }

    try {
      // Upload video if selected
      if (selectedFile) {
        if (selectedFile.size > 100 * 1024 * 1024) {
          toast('❌ File 100MB se kam honi chahiye'); 
          if (publishBtn) { publishBtn.disabled = false; publishBtn.innerHTML = 'Publish'; }
          return;
        }

        const ext = selectedFile.name.split('.').pop() || 'mp4';
        const filename = `videos/${user}_${Date.now()}.${ext}`;
        const ref = firebase.storage().ref().child(filename);

        // Progress
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

      // Save to Firestore — REAL, sabko dikhega
      const newPost = {
        id: postId,
        type: currentCreateType,
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

      // Success
      toast('✅ Post sabko dikhega!');
      
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
        if (currentCreateType === 'text' && typeof window.renderFeedPosts === 'function') {
          window.renderFeedPosts();
        }
      }, 800);

    } catch(e) {
      console.error(e);
      toast('❌ Upload fail: ' + e.message);
    } finally {
      if (publishBtn) {
        publishBtn.disabled = false;
        publishBtn.innerHTML = 'Publish';
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #5: REGISTER USER TO FIRESTORE ON SIGNUP
  // ═══════════════════════════════════════════════════════════════
  function ensureUserInFirestore() {
    const user = getUser();
    if (!user) return;
    
    // Check if user is in Firestore
    firebase.firestore().collection('users').doc(user).get()
      .then(doc => {
        if (!doc.exists) {
          // Add user to Firestore
          const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
          const uData = users[user] || {};
          
          firebase.firestore().collection('users').doc(user).set({
            username: user,
            name: uData.name || user,
            bio: uData.bio || 'Verified Creator Profile',
            avatar: uData.avatar || '',
            phone: uData.phone || '',
            diamonds: uData.diamonds || 50,
            balanceUsd: uData.balanceUsd || 0,
            subscribersList: [],
            likes: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).then(() => {
            console.log('✅ User registered to Firestore:', user);
          }).catch(e => console.log('Register error:', e));
        }
      })
      .catch(e => console.log('User check error:', e));
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #6: LIVE STREAM CLEANUP
  // ═══════════════════════════════════════════════════════════════
  window.closeLiveStream = function() {
    if (window.localStream) {
      window.localStream.getTracks().forEach(t => t.stop());
      window.localStream = null;
    }
    
    const soloVid = document.getElementById('solo-live-video');
    const pkLeft = document.getElementById('pk-video-left');
    if (soloVid) soloVid.srcObject = null;
    if (pkLeft) pkLeft.srcObject = null;
    
    if (typeof closeModal === 'function') closeModal('liveStreamModal');
    toast('Live ended');
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    console.log('🚀 fixit.js initializing...');

    // Register user to Firestore
    setTimeout(ensureUserInFirestore, 3000);
    setInterval(ensureUserInFirestore, 30000);

    // Start global posts sync
    setTimeout(startGlobalPostsSync, 4000);

    console.log('✅ fixit.js loaded - Real fixes active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__FIXIT__ = {
    getLiveStreamSafe: window.__getLiveStreamSafe,
    performFullSearch: window.performFullSearch,
    publishPost: window.publishPost,
    closeLiveStream: window.closeLiveStream
  };
})();
