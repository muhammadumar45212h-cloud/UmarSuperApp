/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - SUPER-KHAN.JS (100% REAL FIX)
   Real Firebase Storage + Real Video Upload + Real Everything
   Add: <script src="super-khan.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // LOAD FIREBASE STORAGE SDK
  // ═══════════════════════════════════════════════════════════════
  if (typeof firebase !== 'undefined' && typeof firebase.storage !== 'function') {
    const s = document.createElement('script');
    s.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js';
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════
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
  // INIT FIREBASE STORAGE
  // ═══════════════════════════════════════════════════════════════
  let storage = null;
  function getStorage() {
    if (!storage && typeof firebase !== 'undefined' && firebase.storage) {
      storage = firebase.storage();
    }
    return storage;
  }

  // ═══════════════════════════════════════════════════════════════
  // UPLOAD PROGRESS MODAL (Real Progress)
  // ═══════════════════════════════════════════════════════════════
  function ensureProgressModal() {
    if (document.getElementById('sk-upload-modal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="sk-upload-modal" class="fixed inset-0 z-[100] hidden bg-black/95 flex items-center justify-center p-6">
        <div class="w-full max-w-md bg-gray-900 border-2 border-cyan-500/40 rounded-2xl p-6 space-y-4">
          <div class="text-center">
            <div class="text-6xl mb-3" id="sk-up-icon">📤</div>
            <h2 class="text-base font-bold text-cyan-400" id="sk-up-title">Uploading...</h2>
            <p class="text-xs text-gray-400 mt-1" id="sk-up-status">Please wait</p>
          </div>
          <div class="w-full bg-gray-800 rounded-full h-5 overflow-hidden border border-gray-700">
            <div id="sk-up-fill" class="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-200" style="width:0%"></div>
          </div>
          <p class="text-3xl font-extrabold text-cyan-400 text-center" id="sk-up-pct">0%</p>
          <p class="text-center text-xs text-gray-500" id="sk-up-size">0 KB / 0 KB</p>
        </div>
      </div>
    `);
  }

  function showProgress(pct, status, sizeText) {
    ensureProgressModal();
    const modal = document.getElementById('sk-upload-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.getElementById('sk-up-fill').style.width = pct + '%';
    document.getElementById('sk-up-pct').innerText = pct + '%';
    if (status) document.getElementById('sk-up-status').innerText = status;
    if (sizeText) document.getElementById('sk-up-size').innerText = sizeText;
  }

  function hideProgress() {
    document.getElementById('sk-upload-modal')?.classList.add('hidden');
    document.getElementById('sk-up-icon').innerText = '📤';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  // ═══════════════════════════════════════════════════════════════
  // REAL VIDEO UPLOAD TO FIREBASE STORAGE
  // ═══════════════════════════════════════════════════════════════
  async function uploadFileToStorage(file, folder, onProgress) {
    const st = getStorage();
    if (!st) throw new Error('Storage not ready');

    const user = getUser();
    const ext = file.name.split('.').pop() || 'mp4';
    const filename = `${folder}/${user}_${Date.now()}.${ext}`;
    const ref = st.ref().child(filename);

    return new Promise((resolve, reject) => {
      const task = ref.put(file);

      task.on('state_changed',
        (snapshot) => {
          const pct = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) {
            onProgress(pct, snapshot.bytesTransferred, snapshot.totalBytes);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          const url = await task.snapshot.ref.getDownloadURL();
          resolve(url);
        }
      );
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // OVERRIDE: PUBLISH POST — REAL UPLOAD
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
    if (currentCreateType === 'video' && !selectedFile && !directUrl) {
      toast('❌ Video select karein ya URL dein');
      return;
    }
    if (!caption && !selectedFile && !directUrl) {
      toast('❌ Caption ya media zaroori');
      return;
    }

    const postId = 'post_' + Date.now();
    let finalVideoUrl = directUrl || null;

    try {
      // ═══ IF FILE SELECTED — REAL UPLOAD ═══
      if (selectedFile) {
        const sizeMB = selectedFile.size / 1024 / 1024;

        // Size check (100 MB limit)
        if (sizeMB > 100) {
          toast(`❌ File ${sizeMB.toFixed(1)}MB hai — 100MB se kam chahiye`);
          return;
        }

        // Show progress
        showProgress(0, `Preparing ${formatBytes(selectedFile.size)}...`, `0 KB / ${formatBytes(selectedFile.size)}`);

        // Upload with real progress
        finalVideoUrl = await uploadFileToStorage(
          selectedFile,
          'videos',
          (pct, loaded, total) => {
            showProgress(
              pct,
              `Uploading... ${pct}%`,
              `${formatBytes(loaded)} / ${formatBytes(total)}`
            );
          }
        );

        showProgress(100, '✅ Upload complete!', '');
        document.getElementById('sk-up-icon').innerText = '✅';

        await new Promise(r => setTimeout(r, 800));
      }

      // ═══ SAVE POST TO FIRESTORE ═══
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

      // Save to Firestore
      await firebase.firestore().collection('posts').doc(postId).set(newPost);

      // Save to local IndexedDB
      if (typeof saveVideoToStorage === 'function') {
        const localPost = { ...newPost };
        delete localPost.createdAt;
        saveVideoToStorage(localPost);
      }

      // Success
      hideProgress();
      toast('✅ Post published! Sabko dikhega');
      closeModal('createModal');

      // Reset form
      document.getElementById('post-caption').value = '';
      document.getElementById('post-link').value = '';
      document.getElementById('post-video-url').value = '';
      if (videoFileInput) videoFileInput.value = '';
      if (typeof selectedGalleryVideoBase64 !== 'undefined') selectedGalleryVideoBase64 = null;
      document.getElementById('video-preview-box')?.classList.add('hidden');

      // Refresh feed
      setTimeout(() => {
        if (typeof initAppContent === 'function') initAppContent();
        if (currentCreateType === 'text' && typeof renderFeedPosts === 'function') {
          renderFeedPosts();
        }
      }, 500);

    } catch(e) {
      hideProgress();
      console.error(e);
      toast('❌ Upload fail: ' + (e.message || e.code || 'Unknown error'));
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // OVERRIDE: PROFILE PHOTO UPLOAD (Real)
  // ═══════════════════════════════════════════════════════════════
  window.__uploadProfilePhoto = async function(file) {
    if (!file) return null;
    try {
      showProgress(0, 'Uploading profile photo...', '');
      const url = await uploadFileToStorage(file, 'avatars', (pct, loaded, total) => {
        showProgress(pct, `Uploading ${pct}%`, `${formatBytes(loaded)} / ${formatBytes(total)}`);
      });
      showProgress(100, '✅ Done', '');
      await new Promise(r => setTimeout(r, 500));
      hideProgress();
      return url;
    } catch(e) {
      hideProgress();
      toast('❌ Photo upload fail: ' + e.message);
      return null;
    }
  };

  // Override edit profile avatar preview
  const origPreviewEditAvatar = window.previewEditAvatar;
  window.previewEditAvatar = async function(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('edit-avatar-preview');
      if (preview) {
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        document.getElementById('edit-avatar-icon')?.classList.add('hidden');
      }
    };
    reader.readAsDataURL(file);

    // Upload to Storage in background
    const url = await window.__uploadProfilePhoto(file);
    if (url) {
      window.__pendingAvatarUrl = url;
      toast('✅ Photo uploaded');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // OVERRIDE: SAVE EDIT PROFILE (with real URL)
  // ═══════════════════════════════════════════════════════════════
  const origSaveEditProfile = window.saveEditProfile;
  window.saveEditProfile = async function() {
    const user = getUser();
    if (!user) return;

    const name = document.getElementById('edit-name')?.value.trim() || '';
    const bio = document.getElementById('edit-bio')?.value.trim() || '';
    const phone = document.getElementById('edit-phone')?.value.trim() || '';
    
    // Use uploaded URL if available, otherwise keep existing
    let avatar = window.__pendingAvatarUrl || '';

    try {
      let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      if (!users[user]) users[user] = {};
      users[user].name = name;
      users[user].bio = bio;
      users[user].phone = phone;
      if (avatar) users[user].avatar = avatar;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));

      await firebase.firestore().collection('users').doc(user).set({
        name: name,
        bio: bio,
        phone: phone,
        ...(avatar ? { avatar: avatar } : {})
      }, { merge: true });

      window.__pendingAvatarUrl = null;
      closeModal('editProfileModal');
      if (typeof loadUserData === 'function') loadUserData();
      toast('✅ Profile updated!');
    } catch(e) {
      toast('❌ ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // OVERRIDE: KYC IMAGE UPLOAD (Real)
  // ═══════════════════════════════════════════════════════════════
  const kycFiles = { front: null, back: null, selfie: null };

  window.kycPreview = function(type, input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    kycFiles[type] = file;

    // Local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const pv = document.getElementById('kyc-' + type + '-preview');
      if (pv) {
        pv.src = e.target.result;
        pv.classList.remove('hidden');
      }
      document.getElementById('kyc-' + type + '-icon')?.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  };

  const origSubmitKyc = window.submitKyc;
  window.submitKyc = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    const fullName = document.getElementById('kyc-fullname')?.value.trim() || '';
    const cnic = document.getElementById('kyc-cnic')?.value.trim() || '';
    const dob = document.getElementById('kyc-dob')?.value || '';
    const cnicClean = cnic.replace(/[^0-9]/g, '');

    if (cnicClean.length !== 13) { toast('❌ CNIC 13 digits'); return; }
    if (!fullName) { toast('❌ Full name zaroori'); return; }
    if (!kycFiles.front || !kycFiles.back || !kycFiles.selfie) {
      toast('❌ 3 photos zaroori (CNIC front, back, selfie)');
      return;
    }

    try {
      showProgress(0, 'Uploading KYC documents...', '');

      // Upload all 3 images
      const frontUrl = await uploadFileToStorage(kycFiles.front, 'kyc/front', (pct, l, t) => {
        showProgress(Math.floor(pct / 3), `CNIC Front ${pct}%`, `${formatBytes(l)}/${formatBytes(t)}`);
      });
      const backUrl = await uploadFileToStorage(kycFiles.back, 'kyc/back', (pct, l, t) => {
        showProgress(33 + Math.floor(pct / 3), `CNIC Back ${pct}%`, `${formatBytes(l)}/${formatBytes(t)}`);
      });
      const selfieUrl = await uploadFileToStorage(kycFiles.selfie, 'kyc/selfie', (pct, l, t) => {
        showProgress(66 + Math.floor(pct / 3), `Selfie ${pct}%`, `${formatBytes(l)}/${formatBytes(t)}`);
      });

      showProgress(100, '✅ Saving...', '');

      // Save to Firestore
      await firebase.firestore().collection('kyc').doc(user).set({
        user: user,
        fullName: fullName,
        cnic: cnicClean,
        dob: dob,
        front: frontUrl,
        back: backUrl,
        selfie: selfieUrl,
        status: 'Pending',
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      hideProgress();
      toast('✅ KYC submitted! Admin verify karega');
      closeModal('kycModal');

      // WhatsApp alert
      const waText = encodeURIComponent(
        `🔔 KYC Submission\n\nUser: @${user}\nName: ${fullName}\nCNIC: ${cnicClean}\n\nApprove: check KYC section`
      );
      setTimeout(() => {
        if (confirm('WhatsApp pe admin ko bhejein?')) {
          const admin = Math.random() < 0.5 ? '923089775764' : '923423373749';
          window.open(`https://wa.me/${admin}?text=${waText}`, '_blank');
        }
      }, 500);

    } catch(e) {
      hideProgress();
      toast('❌ KYC upload fail: ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // OVERRIDE: DELETE POST (Real Storage Delete)
  // ═══════════════════════════════════════════════════════════════
  window.__deletePost = async function(postId) {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    if (!confirm('Ye post delete karein? Wapas nahi aayega.')) return;

    try {
      const doc = await firebase.firestore().collection('posts').doc(postId).get();
      if (!doc.exists) { toast('Post nahi mila'); return; }
      
      const data = doc.data();
      if (fmt(data.user) !== user) {
        toast('❌ Sirf apni post delete kar sakte hain');
        return;
      }

      // Delete from Storage if URL exists
      if (data.url && data.url.includes('firebasestorage')) {
        try {
          const st = getStorage();
          const fileRef = st.refFromURL(data.url);
          await fileRef.delete();
          console.log('✅ Storage file deleted');
        } catch(e) { console.log('Storage delete skip:', e.message); }
      }

      // Delete from Firestore
      await firebase.firestore().collection('posts').doc(postId).delete();

      // Delete from local IndexedDB
      if (typeof getVideosFromStorage === 'function' && typeof dbInstance !== 'undefined') {
        const tx = dbInstance.transaction('videos', 'readwrite');
        tx.objectStore('videos').delete(postId);
      }

      toast('✅ Post deleted');
      setTimeout(() => {
        if (typeof initAppContent === 'function') initAppContent();
        if (typeof renderFeedPosts === 'function') renderFeedPosts();
      }, 500);

    } catch(e) {
      toast('❌ Delete fail: ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // ADD DELETE BUTTONS (Real)
  // ═══════════════════════════════════════════════════════════════
  function addDeleteButtons() {
    const user = getUser();
    if (!user) return;

    document.querySelectorAll('#video-feed-container video').forEach(video => {
      const videoId = video.id.replace('video-elem-', '');
      if (!videoId) return;
      const reel = video.closest('.reel-item');
      if (!reel || reel.dataset.delAdded === '1') return;
      
      const match = reel.innerHTML.match(/@([a-zA-Z0-9_]+)/);
      if (!match || match[1] !== user) return;
      
      reel.dataset.delAdded = '1';
      const btn = document.createElement('button');
      btn.className = 'absolute top-4 right-4 w-9 h-9 rounded-full bg-red-600/80 text-white flex items-center justify-center z-30';
      btn.innerHTML = '<i class="fa-solid fa-trash text-sm"></i>';
      btn.onclick = (e) => { e.stopPropagation(); window.__deletePost(videoId); };
      reel.appendChild(btn);
    });

    document.querySelectorAll('#posts-container > div').forEach(card => {
      const postId = card.dataset.postId;
      if (!postId || card.dataset.delAdded === '1') return;
      const match = card.innerHTML.match(/@([a-zA-Z0-9_]+)/);
      if (!match || match[1] !== user) return;
      
      card.dataset.delAdded = '1';
      const header = card.querySelector('.flex.justify-between');
      if (header) {
        const btn = document.createElement('button');
        btn.className = 'text-red-500 p-1';
        btn.innerHTML = '<i class="fa-solid fa-trash text-xs"></i>';
        btn.onclick = (e) => { e.stopPropagation(); window.__deletePost(postId); };
        header.appendChild(btn);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // REAL-TIME POSTS SYNC (har device pe)
  // ═══════════════════════════════════════════════════════════════
  let postsUnsub = null;
  function startRealtimePostsSync() {
    if (postsUnsub) return;
    try {
      postsUnsub = firebase.firestore()
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .onSnapshot(snap => {
          snap.docChanges().forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
              const data = change.doc.data();
              const post = {
                id: data.id,
                type: data.type,
                url: data.url || null,
                user: data.user,
                caption: data.caption || '',
                link: data.link || null,
                likes: data.likes || [],
                comments: data.comments || [],
                views: data.views || 0
              };
              if (typeof saveVideoToStorage === 'function') {
                saveVideoToStorage(post);
              }
            } else if (change.type === 'removed') {
              if (typeof dbInstance !== 'undefined') {
                try {
                  const tx = dbInstance.transaction('videos', 'readwrite');
                  tx.objectStore('videos').delete(change.doc.id);
                } catch(e) {}
              }
            }
          });

          // Refresh UI
          if (typeof initAppContent === 'function') initAppContent();
        }, err => {
          console.log('Posts sync (fallback):', err.message);
        });
    } catch(e) {
      console.log('Realtime posts err:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // REAL-TIME COMMENTS SYNC
  // ═══════════════════════════════════════════════════════════════
  let commentsUnsub = null;
  window.openCommentsDrawer = function(videoId) {
    window.__currentCommentVideoId = videoId;
    document.getElementById('commentDrawer')?.classList.add('open');
    const area = document.getElementById('drawer-content-area');
    if (area) area.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">Loading...</p>';

    if (commentsUnsub) { try { commentsUnsub(); } catch(e){} }

    try {
      commentsUnsub = firebase.firestore()
        .collection('posts').doc(videoId)
        .collection('comments')
        .orderBy('timestamp', 'asc')
        .limit(100)
        .onSnapshot(snap => {
          const comments = [];
          snap.forEach(d => comments.push({ id: d.id, ...d.data() }));
          renderComments(comments);
        }, err => {
          // Fallback without orderBy
          firebase.firestore().collection('posts').doc(videoId)
            .collection('comments').limit(100).onSnapshot(snap2 => {
              const comments = [];
              snap2.forEach(d => comments.push({ id: d.id, ...d.data() }));
              renderComments(comments);
            });
        });
    } catch(e) {
      console.log(e);
    }
  };

  function renderComments(comments) {
    const area = document.getElementById('drawer-content-area');
    if (!area) return;
    area.innerHTML = '';
    if (comments.length === 0) {
      area.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">No comments yet. Pehla comment karein!</p>';
      return;
    }
    comments.forEach(c => {
      const div = document.createElement('div');
      div.className = 'bg-gray-800/80 p-2.5 rounded-xl border border-gray-700/60 text-xs space-y-1';
      div.innerHTML = `
        <div class="flex justify-between">
          <span class="font-bold text-cyan-400">@${c.user}</span>
          <span class="text-[9px] text-gray-400">${c.time || ''}</span>
        </div>
        <p class="text-gray-200" style="white-space:pre-wrap;">${c.text}</p>
      `;
      area.appendChild(div);
    });
    area.scrollTop = area.scrollHeight;
  }

  window.addCommentSubmit = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    const input = document.getElementById('new-comment-input');
    const text = input.value.trim();
    if (!text) return;
    const vid = window.__currentCommentVideoId;
    if (!vid) return;

    try {
      await firebase.firestore()
        .collection('posts').doc(vid)
        .collection('comments').add({
          user: user,
          text: text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      input.value = '';
      toast('✅ Comment added');
    } catch(e) {
      toast('❌ ' + e.message);
    }
  };

  window.closeCommentDrawer = function() {
    if (commentsUnsub) { try { commentsUnsub(); } catch(e){} commentsUnsub = null; }
    document.getElementById('commentDrawer')?.classList.remove('open');
  };

  // ═══════════════════════════════════════════════════════════════
  // REAL-TIME LIKES SYNC
  // ═══════════════════════════════════════════════════════════════
  window.toggleLikeVideo = function(id) {
    if (!currentUser) return;
    const cleanCurr = formatHandle(currentUser);

    getVideosFromStorage(function(vids) {
      const vid = vids.find(x => x.id === id);
      if (!vid) return;
      if (!vid.likes) vid.likes = [];
      const idx = vid.likes.indexOf(cleanCurr);
      if (idx > -1) vid.likes.splice(idx, 1);
      else vid.likes.push(cleanCurr);
      saveVideoToStorage(vid);

      // Update UI
      const icon = document.getElementById(`like-icon-${id}`);
      const count = document.getElementById(`like-count-${id}`);
      if (icon) icon.className = `fa-solid fa-heart text-2xl ${idx > -1 ? 'text-white' : 'text-red-500'}`;
      if (count) count.innerText = vid.likes.length;

      // Sync to Firebase
      try {
        firebase.firestore().collection('posts').doc(id).update({ likes: vid.likes });
      } catch(e) {}
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    // Start realtime sync after Firebase ready
    setTimeout(() => {
      startRealtimePostsSync();
      console.log('✅ super-khan.js loaded - 100% REAL');
    }, 3000);

    // Add delete buttons periodically
    setInterval(addDeleteButtons, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export
  window.__SUPERKHAN__ = {
    uploadFileToStorage,
    showProgress,
    hideProgress
  };

})();
