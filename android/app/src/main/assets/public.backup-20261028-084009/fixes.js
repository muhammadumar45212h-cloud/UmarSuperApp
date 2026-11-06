/* ═══════════════════════════════════════════════════════════════
   SUPER APP - FIXES MODULE
   Ye file 7 problems fix karti hai:
   1. Video black preview fix
   2. Profile grid black videos fix
   3. Text posts pe 🔊 TTS (sun-ne ka button)
   4. Comments working + Firebase sync
   5. Channel creation fix
   6. DM mein photo/video bhejna
   7. Text post formatting (line breaks preserve)
   
   Add to index.html: <script src="fixes.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ───── HELPERS ─────
  function toast(msg) {
    if (typeof window.showToast === 'function') return window.showToast(msg);
    const t = document.getElementById('toast-notification');
    if (!t) { alert(msg); return; }
    const m = document.getElementById('toast-message');
    if (m) m.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
  function fmt(s) { return (s || 'Umar').replace(/^@+/, '').split('@')[0]; }
  function getUser() { return fmt(localStorage.getItem('SUPER_APP_CURRENT_USER')); }

  // Load Firebase Storage if not loaded
  if (typeof firebase !== 'undefined' && typeof firebase.storage !== 'function') {
    const s = document.createElement('script');
    s.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js';
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX 1 & 2: VIDEO BLACK PREVIEW FIX
  // Har video ko force karke pehla frame load karwao
  // ═══════════════════════════════════════════════════════════════
  const videoFixer = new MutationObserver((mutations) => {
    document.querySelectorAll('video').forEach(v => {
      // Skip live video (jo srcObject use karte hain)
      if (v.srcObject) return;

      // Skip agar already fix ho chuka
      if (v.dataset.previewFixed === '1') return;
      v.dataset.previewFixed = '1';

      // Force metadata preload
      v.setAttribute('preload', 'metadata');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');

      // Add #t=0.1 to src agar nahi hai
      const src = v.getAttribute('src') || v.src;
      if (src && !src.includes('#t=') && !src.startsWith('data:') && !src.startsWith('blob:')) {
        try {
          v.src = src + '#t=0.1';
        } catch(e) {}
      }

      // Force load frame
      try {
        v.load();
      } catch(e) {}

      // Pause karo taake sirf preview dikhe (agar player nahi)
      if (!v.controls) {
        v.pause();
        v.currentTime = 0.1;
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FIX 3: TEXT POSTS 🔊 TTS (Sun-ne ka button)
  // ═══════════════════════════════════════════════════════════════
  function addTTSButtons() {
    const container = document.getElementById('posts-container');
    if (!container) return;

    // Har text card pe TTS button lagao
    Array.from(container.children).forEach(card => {
      if (card.dataset.ttsAdded === '1') return;
      card.dataset.ttsAdded = '1';

      // Text dhoondo (p tag jisme caption hai)
      const textEl = card.querySelector('p.allow-select') || card.querySelector('p');
      if (!textEl || !textEl.innerText.trim()) return;

      // Button banao
      const btn = document.createElement('button');
      btn.className = 'mt-2 px-3 py-1.5 bg-cyan-600/20 border border-cyan-500/40 rounded-full text-[10px] text-cyan-400 font-bold flex items-center gap-1.5';
      btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Sun ke sunao';

      btn.onclick = function(e) {
        e.stopPropagation();
        const text = textEl.innerText;

        // Agar already bol raha hai toh rok do
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Sun ke sunao';
          return;
        }

        // Speech banao
        const utt = new SpeechSynthesisUtterance(text);
        // Urdu/Hindi voice try karo
        const voices = window.speechSynthesis.getVoices();
        const urVoice = voices.find(v => v.lang.includes('ur') || v.lang.includes('hi') || v.lang.includes('IN'));
        if (urVoice) utt.voice = urVoice;
        utt.lang = urVoice ? urVoice.lang : 'hi-IN';
        utt.rate = 0.9;
        utt.pitch = 1;

        utt.onstart = () => {
          btn.innerHTML = '<i class="fa-solid fa-stop"></i> Rok do';
          btn.classList.add('bg-red-600/30', 'border-red-500/50', 'text-red-400');
        };
        utt.onend = () => {
          btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Sun ke sunao';
          btn.classList.remove('bg-red-600/30', 'border-red-500/50', 'text-red-400');
        };
        utt.onerror = () => {
          btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Sun ke sunao';
          btn.classList.remove('bg-red-600/30', 'border-red-500/50', 'text-red-400');
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utt);
      };

      card.appendChild(btn);
    });
  }

  // Voice list load hone ka wait
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {};
    window.speechSynthesis.getVoices();
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX 4: COMMENTS WORKING + FIREBASE SYNC
  // Purane functions ko override karke Firebase subcollection use karo
  // ═══════════════════════════════════════════════════════════════
  window.__commentUnsub = null;

  window.openCommentsDrawer = function(videoId) {
    window.__currentCommentVideoId = videoId;
    const area = document.getElementById('drawer-content-area');
    if (area) area.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">Loading...</p>';
    document.getElementById('commentDrawer')?.classList.add('open');

    // Firebase se real-time comments load karo
    if (window.__commentUnsub) { try { window.__commentUnsub(); } catch(e){} }
    window.__commentUnsub = firebase.firestore()
      .collection('posts').doc(videoId)
      .collection('comments')
      .orderBy('timestamp', 'asc')
      .limit(100)
      .onSnapshot(snap => {
        const arr = [];
        snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
        renderCommentsList(arr);
      }, err => {
        // Index error - fallback
        firebase.firestore().collection('posts').doc(videoId)
          .collection('comments').limit(100).onSnapshot(snap2 => {
            const arr = [];
            snap2.forEach(d => arr.push({ id: d.id, ...d.data() }));
            arr.sort((a,b) => (a.timestamp?.toMillis?.()||0) - (b.timestamp?.toMillis?.()||0));
            renderCommentsList(arr);
          });
      });
  };

  function renderCommentsList(comments) {
    const area = document.getElementById('drawer-content-area');
    if (!area) return;
    area.innerHTML = '';
    if (!comments || comments.length === 0) {
      area.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">No comments yet. Pehla comment aap karein!</p>';
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
        <p class="text-gray-200 allow-select" style="white-space: pre-wrap;">${c.text}</p>
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
    if (!text) { toast('Comment likhein'); return; }
    const vid = window.__currentCommentVideoId;
    if (!vid) return;

    try {
      await firebase.firestore().collection('posts').doc(vid).collection('comments').add({
        user: user,
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      input.value = '';
      toast('✅ Comment added');
    } catch(e) {
      // Fallback to local
      toast('Error: ' + e.message);
    }
  };

  window.closeCommentDrawer = function() {
    if (window.__commentUnsub) { try { window.__commentUnsub(); } catch(e){} window.__commentUnsub = null; }
    document.getElementById('commentDrawer')?.classList.remove('open');
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX 5: CHANNEL CREATION FIX
  // Wrapper jo purane function ko sahi se call karta hai
  // ═══════════════════════════════════════════════════════════════
  window.__origFinalizeChannelCreation = window.finalizeChannelCreation;

  window.finalizeChannelCreation = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    const name = document.getElementById('chan-name')?.value.trim();
    const username = document.getElementById('chan-username')?.value.trim().toLowerCase().replace(/\s+/g, '');
    const phone = document.getElementById('chan-number')?.value.trim() || '';
    const typeEl = document.querySelector('input[name="chan-type-radio"]:checked');
    const type = typeEl ? typeEl.value : 'public';

    if (!name || !username) { toast('Name aur Username zaroori'); return; }

    // Unique channel ID
    const chanId = 'chan_' + username;

    // Photo - preview se lo
    const previewEl = document.getElementById('chan-avatar-preview');
    let photo = '';
    if (previewEl && !previewEl.classList.contains('hidden') && previewEl.src) {
      photo = previewEl.src;
    } else {
      photo = `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`;
    }

    const chanData = {
      id: chanId,
      name: name,
      username: username,
      phone: phone,
      photo: photo,
      type: type,
      owner: user,
      link: `superapp.com/channel/${username}`,
      subscribers: [user],
      pendingRequests: [],
      posts: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      // Firebase mein save karo
      await firebase.firestore().collection('channels').doc(chanId).set(chanData);

      // Local mein bhi
      let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
      channels[chanId] = chanData;
      localStorage.setItem('SUPER_APP_CHANNELS', JSON.stringify(channels));

      // UI close karo
      document.getElementById('createChannelStep2Modal')?.classList.add('hidden');
      document.getElementById('createChannelStep1Modal')?.classList.add('hidden');

      toast('✅ Channel ban gaya: ' + name);

      // Inbox refresh
      if (typeof window.renderDmInboxList === 'function') {
        try { window.renderDmInboxList(); } catch(e) {}
      }

      // Channel kholo
      if (typeof window.openChannelConversation === 'function') {
        try { window.openChannelConversation(chanId); } catch(e) {}
      }
    } catch(e) {
      toast('❌ Error: ' + e.message);
      console.error(e);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX 6: DM MEIN PHOTO/VIDEO BHEJNA
  // ═══════════════════════════════════════════════════════════════
  function injectDmMediaButton() {
    const footer = document.getElementById('dm-input-footer');
    if (!footer || footer.dataset.mediaAdded === '1') return;
    footer.dataset.mediaAdded = '1';

    // File input (hidden)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*';
    fileInput.id = 'dm-media-input';
    fileInput.className = 'hidden';
    fileInput.onchange = (e) => handleDmMediaSelect(e);
    footer.appendChild(fileInput);

    // Photo button
    const photoBtn = document.createElement('button');
    photoBtn.className = 'px-3 py-2 bg-gray-800 text-cyan-400 rounded-xl border border-cyan-500/30 font-bold';
    photoBtn.innerHTML = '<i class="fa-solid fa-image"></i>';
    photoBtn.onclick = () => document.getElementById('dm-media-input').click();
    footer.insertBefore(photoBtn, footer.firstChild);

    // Preview area
    const preview = document.createElement('div');
    preview.id = 'dm-media-preview';
    preview.className = 'hidden w-full mb-2 relative';
    footer.parentNode.insertBefore(preview, footer);
  }

  let dmMediaBase64 = null;
  let dmMediaType = null;
  let dmMediaName = '';

  function handleDmMediaSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast('⚠️ File 2MB se kam honi chahiye (Firestore limit)');
      return;
    }

    dmMediaType = file.type.startsWith('video') ? 'video' : 'image';
    dmMediaName = file.name;

    const reader = new FileReader();
    reader.onload = (ev) => {
      dmMediaBase64 = ev.target.result;
      showDmPreview();
    };
    reader.readAsDataURL(file);
  }

  function showDmPreview() {
    const preview = document.getElementById('dm-media-preview');
    if (!preview) return;
    preview.classList.remove('hidden');
    preview.innerHTML = `
      <div class="relative bg-gray-900 border border-cyan-500/40 rounded-xl p-2">
        <button onclick="window.__clearDmMedia()" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center z-10">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="flex items-center gap-2">
          ${dmMediaType === 'video'
            ? `<video src="${dmMediaBase64}" class="w-16 h-16 object-cover rounded-lg" muted></video>`
            : `<img src="${dmMediaBase64}" class="w-16 h-16 object-cover rounded-lg">`}
          <div>
            <p class="text-xs text-cyan-400 font-bold">${dmMediaType === 'video' ? '🎥 Video' : '📷 Photo'}</p>
            <p class="text-[10px] text-gray-400">${dmMediaName}</p>
            <p class="text-[9px] text-gray-500">Ready to send</p>
          </div>
        </div>
      </div>
    `;
  }

  window.__clearDmMedia = function() {
    dmMediaBase64 = null;
    dmMediaType = null;
    dmMediaName = '';
    document.getElementById('dm-media-preview')?.classList.add('hidden');
    const input = document.getElementById('dm-media-input');
    if (input) input.value = '';
  };

  // Override sendDmMessageSubmit
  window.__origSendDmMessage = window.sendDmMessageSubmit;
  window.sendDmMessageSubmit = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    const target = window.activeChatTargetUser;
    if (!target) return;

    const input = document.getElementById('dm-message-input');
    const text = input?.value.trim() || '';

    // Agar media hai ya text hai
    if (!text && !dmMediaBase64) return;

    const chatKey = [user, target].sort().join(':');
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msgData = {
      chatKey: chatKey,
      sender: user,
      receiver: target,
      text: text || '',
      time: time,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Agar media hai toh attach karo
    if (dmMediaBase64) {
      msgData.media = dmMediaBase64;
      msgData.mediaType = dmMediaType;
      msgData.mediaName = dmMediaName;
    }

    try {
      await firebase.firestore().collection('dm_messages').add(msgData);
      if (input) input.value = '';
      window.__clearDmMedia();
    } catch(e) {
      toast('❌ Send fail: ' + e.message);
    }
  };

  // Render messages with media support
  window.__origRenderDmMessagesFromCloud = window.renderDmMessagesFromCloud;
  window.renderDmMessagesFromCloud = function(messages) {
    const threadView = document.getElementById('dm-thread-view');
    if (!threadView) return;
    const cleanCurr = getUser();
    threadView.innerHTML = '';

    if (!messages || messages.length === 0) {
      threadView.innerHTML = '<p class="text-xs text-gray-500 text-center py-12">No messages yet.</p>';
      return;
    }

    messages.forEach(m => {
      const isMine = (fmt(m.sender) === cleanCurr);
      const bubble = document.createElement('div');
      bubble.className = `max-w-[75%] p-2 rounded-2xl text-xs leading-relaxed ${isMine ? 'ml-auto btn-gradient text-white rounded-br-none' : 'mr-auto bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-none custom-chat-bubble'}`;

      let mediaHtml = '';
      if (m.media) {
        if (m.mediaType === 'video') {
          mediaHtml = `<video src="${m.media}" controls class="w-full max-w-[200px] rounded-lg mb-1" preload="metadata"></video>`;
        } else {
          mediaHtml = `<img src="${m.media}" class="w-full max-w-[200px] rounded-lg mb-1 cursor-pointer" onclick="window.__openMediaFull('${m.media}')">`;
        }
      }

      const textHtml = m.text ? `<p class="allow-select" style="white-space: pre-wrap;">${m.text}</p>` : '';

      bubble.innerHTML = `${mediaHtml}${textHtml}<span class="text-[9px] opacity-70 block text-right mt-1">${m.time || ''}</span>`;
      threadView.appendChild(bubble);
    });

    threadView.scrollTop = threadView.scrollHeight;
  };

  window.__openMediaFull = function(src) {
    const w = window.open('');
    if (w) {
      w.document.write(`<html><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh"><img src="${src}" style="max-width:100%;max-height:100%"></body></html>`);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX 7: TEXT POST FORMATTING (line breaks preserve)
  // ═══════════════════════════════════════════════════════════════
  function fixTextFormatting() {
    // Text posts mein white-space: pre-wrap lagao
    const container = document.getElementById('posts-container');
    if (!container) return;
    container.querySelectorAll('p').forEach(p => {
      if (!p.style.whiteSpace) {
        p.style.whiteSpace = 'pre-wrap';
        p.style.wordBreak = 'break-word';
      }
    });

    // Comments mein bhi
    document.querySelectorAll('#drawer-content-area p').forEach(p => {
      if (!p.style.whiteSpace) {
        p.style.whiteSpace = 'pre-wrap';
      }
    });

    // DM bubbles mein bhi
    document.querySelectorAll('#dm-thread-view p').forEach(p => {
      if (!p.style.whiteSpace) {
        p.style.whiteSpace = 'pre-wrap';
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO RUN
  // ═══════════════════════════════════════════════════════════════
  function init() {
    // MutationObserver shuru karo
    videoFixer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

    // DM media button inject karo (jab DM modal load ho)
    setInterval(injectDmMediaButton, 1000);

    // Text posts pe TTS button lagao
    setInterval(addTTSButtons, 1500);

    // Text formatting fix
    setInterval(fixTextFormatting, 2000);

    // Initial run
    setTimeout(() => {
      document.querySelectorAll('video').forEach(v => { if (!v.srcObject) v.dataset.previewFixed = ''; });
      addTTSButtons();
      fixTextFormatting();
    }, 2000);

    console.log('✅ fixes.js loaded - 7 fixes active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
