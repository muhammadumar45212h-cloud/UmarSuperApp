/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - HIDE.JS
   1. Live Stream → Settings mein move
   2. Hashtag System (tap → sab posts dikhein)
   3. Username tap → profile
   4. Links tap → open
   5. Auto-Clean (real content only)
   
   Add: <script src="hide.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

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
  function isAdmin() { return ['muhammadumar45212h', 'Umar', 'admin'].includes(getUser()); }

  // ═══════════════════════════════════════════════════════════════
  // 1. LIVE STREAM → MOVE TO SETTINGS
  // ═══════════════════════════════════════════════════════════════
  function moveLiveToSettings() {
    // Header se Live button hatayein (agar hai)
    const header = document.querySelector('header');
    if (header) {
      const liveBtn = header.querySelector('button[onclick*="openLiveStreamRoom"]');
      if (liveBtn && !liveBtn.dataset.hidden) {
        liveBtn.style.display = 'none';
        liveBtn.dataset.hidden = '1';
      }
    }

    // Profile se "Start Live Match" hatayein
    const profileLiveBtn = document.querySelector('#tab-profile button[onclick*="openLiveStreamRoom"]');
    if (profileLiveBtn && !profileLiveBtn.dataset.hidden) {
      profileLiveBtn.style.display = 'none';
      profileLiveBtn.dataset.hidden = '1';
    }

    // Settings mein Live buttons add karein
    const settings = document.getElementById('settingsModal');
    if (settings && !document.getElementById('hide-live-section')) {
      const walletBox = settings.querySelector('.bg-gray-900');
      if (walletBox) {
        const div = document.createElement('div');
        div.id = 'hide-live-section';
        div.className = 'bg-gradient-to-r from-red-900/40 to-pink-900/40 border-2 border-red-500/40 rounded-xl p-4 space-y-2';
        div.innerHTML = `
          <h3 class="text-xs font-bold text-red-400 uppercase flex items-center gap-1.5 mb-2">
            <i class="fa-solid fa-satellite-dish"></i> Live Streaming
          </h3>
          <button onclick="closeModal('settingsModal'); window.openLiveStreamRoom('solo');" 
                  class="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
            🔴 Go Live (Solo Stream)
          </button>
          <button onclick="closeModal('settingsModal'); window.openLiveStreamRoom('pk');" 
                  class="w-full py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
            ⚔️ Start PK Match
          </button>
        `;
        walletBox.parentNode.insertBefore(div, walletBox.nextSibling);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. HASHTAG SYSTEM (tap → sab posts)
  // ═══════════════════════════════════════════════════════════════
  window.openHashtagFeed = async function(hashtag) {
    if (!hashtag) return;
    const tag = hashtag.startsWith('#') ? hashtag : '#' + hashtag;

    if (!document.getElementById('hashtagFeedModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="hashtagFeedModal" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[85] space-y-3">
          <div class="flex justify-between items-center border-b border-cyan-500/40 pb-3 sticky top-0 bg-gray-950 z-10">
            <div class="flex items-center gap-2">
              <button onclick="closeModal('hashtagFeedModal')" class="text-cyan-400 text-lg">
                <i class="fa-solid fa-chevron-left"></i>
              </button>
              <h2 class="text-base font-bold text-cyan-400" id="htf-title">#hashtag</h2>
            </div>
            <span class="text-xs text-gray-400" id="htf-count">0 posts</span>
          </div>
          <div id="htf-content" class="space-y-3"></div>
        </div>
      `);
    }

    if (typeof openModal === 'function') openModal('hashtagFeedModal');
    document.getElementById('htf-title').innerText = tag;
    
    const content = document.getElementById('htf-content');
    content.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">Loading posts...</p>';

    try {
      // Firestore se posts dhoondein jisme ye hashtag ho
      const snap = await firebase.firestore().collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(100).get();

      const matched = [];
      const tagLower = tag.toLowerCase();

      snap.forEach(doc => {
        const d = doc.data();
        const caption = (d.caption || '').toLowerCase();
        if (caption.includes(tagLower)) {
          matched.push({ id: doc.id, ...d });
        }
      });

      if (matched.length === 0) {
        content.innerHTML = `<p class="text-xs text-gray-500 text-center py-8">Is hashtag ke saath koi post nahi mili</p>`;
        document.getElementById('htf-count').innerText = '0 posts';
        return;
      }

      document.getElementById('htf-count').innerText = matched.length + ' posts';
      content.innerHTML = '';

      matched.forEach(post => {
        const cleanUser = fmt(post.user);
        const card = document.createElement('div');
        card.className = 'bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3 shadow-xl';
        
        let mediaHtml = '';
        if (post.url && (post.type === 'video' || post.url.includes('.mp4') || post.url.includes('firebasestorage'))) {
          mediaHtml = `<video src="${post.url}#t=0.1" preload="metadata" class="w-full rounded-xl max-h-64 object-cover" controls></video>`;
        } else if (post.url) {
          mediaHtml = `<img src="${post.url}" class="w-full rounded-xl max-h-64 object-cover">`;
        }

        card.innerHTML = `
          <div class="flex items-center gap-2 cursor-pointer" onclick="closeModal('hashtagFeedModal'); window.openPublicUserProfileModal && window.openPublicUserProfileModal('${cleanUser}')">
            <img src="${(JSON.parse(localStorage.getItem('SUPER_APP_USERS')||'{}')[cleanUser]||{}).avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`}" class="w-8 h-8 rounded-full bg-gray-800">
            <span class="text-xs font-bold text-cyan-400">@${cleanUser}</span>
          </div>
          ${mediaHtml}
          <p class="text-xs text-gray-200 leading-relaxed" style="white-space:pre-wrap;">${window.__linkifyText ? window.__linkifyText(post.caption || '') : (post.caption || '')}</p>
          <div class="flex items-center gap-4 border-t border-gray-800 pt-2 text-[11px] text-gray-400">
            <span><i class="fa-solid fa-heart text-red-500"></i> ${(post.likes||[]).length}</span>
            <span><i class="fa-solid fa-comment"></i> ${(post.comments||[]).length}</span>
            <span><i class="fa-solid fa-eye"></i> ${post.views||0}</span>
          </div>
        `;
        content.appendChild(card);
      });

    } catch(e) {
      content.innerHTML = `<p class="text-xs text-red-400 text-center py-8">Error: ${e.message}</p>`;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 3. LINKIFY — @username, #hashtag, URLs
  // ═══════════════════════════════════════════════════════════════
  window.__linkifyText = function(text) {
    if (!text) return '';
    let out = text;

    // URLs first (avoid double-matching @ inside URLs)
    out = out.replace(/(https?:\/\/[^\s]+)/g, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener" class="text-cyan-400 underline">${url}</a>`;
    });

    // @username (excluding emails)
    out = out.replace(/(^|[^\w])@([a-zA-Z0-9_]{2,30})/g, (m, pre, user) => {
      return `${pre}<a href="#" onclick="event.preventDefault(); event.stopPropagation(); if(window.openPublicUserProfileModal) window.openPublicUserProfileModal('${user}');" class="text-cyan-400 font-bold hover:underline">@${user}</a>`;
    });

    // #hashtag
    out = out.replace(/(^|[^\w#])#([a-zA-Z0-9_\u0600-\u06FF]{1,50})/g, (m, pre, tag) => {
      return `${pre}<a href="#" onclick="event.preventDefault(); event.stopPropagation(); if(window.openHashtagFeed) window.openHashtagFeed('${tag}');" class="text-amber-400 font-bold hover:underline">#${tag}</a>`;
    });

    return out;
  };

  // ═══════════════════════════════════════════════════════════════
  // 4. OVERRIDE renderFeedPosts — WITH LINKIFY
  // ═══════════════════════════════════════════════════════════════
  window.renderFeedPosts = function() {
    if (typeof getVideosFromStorage !== 'function') return;
    
    getVideosFromStorage(function(vids) {
      const container = document.getElementById('posts-container');
      if (!container) return;
      container.innerHTML = '';
      
      const textPosts = vids.filter(v => !v.url && v.type !== 'video');
      
      if (textPosts.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-500 text-center py-12">No text posts yet. Tap + to create one!</p>';
        return;
      }
      
      textPosts.forEach(v => {
        const cleanU = fmt(v.user);
        const isLiked = (v.likes || []).includes(getUser());
        const card = document.createElement('div');
        card.className = 'bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3 shadow-xl';
        card.dataset.postId = v.id;
        card.innerHTML = `
          <div class="flex justify-between items-center">
            <div onclick="if(window.openPublicUserProfileModal) window.openPublicUserProfileModal('${cleanU}')" class="flex items-center gap-2 cursor-pointer">
              <img src="${(JSON.parse(localStorage.getItem('SUPER_APP_USERS')||'{}')[cleanU]||{}).avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanU}`}" class="w-8 h-8 rounded-full bg-gray-800">
              <span class="text-xs font-bold text-cyan-400">@${cleanU}</span>
            </div>
            <button onclick="openGiftModal('${cleanU}')" class="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold">🎁 Gift</button>
          </div>
          <p class="text-xs text-gray-200 leading-relaxed" style="white-space:pre-wrap;">${window.__linkifyText(v.caption || '')}</p>
          ${v.link ? `<a href="${v.link}" target="_blank" class="text-xs text-cyan-400 underline block truncate">${v.link}</a>` : ''}
          <div class="flex items-center justify-between border-t border-gray-800 pt-2 text-[11px]">
            <button onclick="window.__likeTxt && window.__likeTxt('${v.id}')" class="flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-gray-400'}">
              <i class="fa-solid fa-heart"></i> <span class="lc">${(v.likes||[]).length}</span>
            </button>
            <button onclick="window.__commentTxt && window.__commentTxt('${v.id}')" class="flex items-center gap-1.5 text-gray-400">
              <i class="fa-solid fa-comment"></i> <span>${(v.comments||[]).length}</span>
            </button>
            <button onclick="window.__shareTxt && window.__shareTxt('${v.id}')" class="flex items-center gap-1.5 text-gray-400">
              <i class="fa-solid fa-share"></i> Share
            </button>
            <button onclick="window.__subUser && window.__subUser('${cleanU}')" class="flex items-center gap-1.5 text-cyan-400">
              <i class="fa-solid fa-user-plus"></i> Sub
            </button>
          </div>
        `;
        container.appendChild(card);
      });
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // 5. HASHTAG TAP — Post Caption mein
  // ═══════════════════════════════════════════════════════════════
  // Video reel captions mein bhi linkify lagayein
  const origRenderVideoReels = window.renderVideoReels;
  window.renderVideoReels = function(vids) {
    if (typeof origRenderVideoReels === 'function') {
      origRenderVideoReels.apply(this, arguments);
    }
    // Baad mein captions ko linkify karein
    setTimeout(() => {
      document.querySelectorAll('#video-feed-container .reel-item p.allow-select, #video-feed-container .reel-item p').forEach(p => {
        if (p.dataset.linkified === '1') return;
        const text = p.innerText;
        if (/[@#]/.test(text) || /https?:\/\//.test(text)) {
          p.innerHTML = window.__linkifyText(text);
          p.dataset.linkified = '1';
        }
      });
    }, 500);
  };

  // ═══════════════════════════════════════════════════════════════
  // 6. PROFILE BIO + NAME LINKIFY
  // ═══════════════════════════════════════════════════════════════
  function linkifyProfile() {
    const bio = document.getElementById('profile-bio');
    if (bio && bio.dataset.linkified !== '1') {
      const text = bio.innerText;
      if (/[@#]/.test(text) || /https?:\/\//.test(text)) {
        bio.innerHTML = window.__linkifyText(text);
        bio.dataset.linkified = '1';
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. CHANNEL POSTS — Hashtag + Username
  // ═══════════════════════════════════════════════════════════════
  const origRenderChannelPosts = window.renderChannelPosts;
  window.renderChannelPosts = function(channelId) {
    if (typeof origRenderChannelPosts === 'function') {
      origRenderChannelPosts.apply(this, arguments);
    }
    setTimeout(() => {
      document.querySelectorAll('#dm-thread-view p').forEach(p => {
        if (p.dataset.linkified === '1') return;
        const text = p.innerText;
        if (/[@#]/.test(text) || /https?:\/\//.test(text)) {
          p.innerHTML = window.__linkifyText(text);
          p.dataset.linkified = '1';
        }
      });
    }, 300);
  };

  // ═══════════════════════════════════════════════════════════════
  // 8. CLEAN — FAKE POSTS REMOVE
  // ═══════════════════════════════════════════════════════════════
  async function cleanFakePosts() {
    if (!isAdmin()) return;
    try {
      const snap = await firebase.firestore().collection('posts').limit(200).get();
      let deleted = 0;

      for (const doc of snap.docs) {
        const data = doc.data();
        const url = (data.url || '').toLowerCase();
        const caption = (data.caption || '').toLowerCase();

        // Fake content detection
        const isFake =
          url.includes('commondatastorage.googleapis.com/gtv-videos') || // Sample videos
          url.includes('sample') ||
          url.includes('test.com') ||
          caption.includes('dummy') ||
          caption.includes('test post') ||
          caption.includes('lorem ipsum') ||
          caption === 'hello guys' ||
          caption === 'hi' ||
          caption === 'wow';

        if (isFake) {
          // Delete from Firestore
          await doc.ref.delete();
          
          // Delete from Storage
          if (data.url && data.url.includes('firebasestorage') && typeof firebase.storage === 'function') {
            try {
              await firebase.storage().refFromURL(data.url).delete();
            } catch(e) {}
          }
          
          // Delete from IndexedDB
          if (typeof dbInstance !== 'undefined') {
            try {
              const tx = dbInstance.transaction('videos', 'readwrite');
              tx.objectStore('videos').delete(doc.id);
            } catch(e) {}
          }
          
          deleted++;
          console.log('🗑️ Fake post removed:', doc.id);
        }
      }

      if (deleted > 0) {
        toast(`🗑️ ${deleted} fake posts removed`);
        if (typeof window.initAppContent === 'function') window.initAppContent();
      }
    } catch(e) {
      console.log('Clean error:', e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. TRENDING HASHTAGS (Auto-collect from posts)
  // ═══════════════════════════════════════════════════════════════
  async function getTrendingHashtags() {
    try {
      const snap = await firebase.firestore().collection('posts').limit(200).get();
      const tags = {};
      
      snap.forEach(doc => {
        const caption = doc.data().caption || '';
        const matches = caption.match(/#[a-zA-Z0-9_\u0600-\u06FF]+/g) || [];
        matches.forEach(t => {
          const tag = t.toLowerCase();
          tags[tag] = (tags[tag] || 0) + 1;
        });
      });

      // Sort by count
      const sorted = Object.entries(tags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

      return sorted;
    } catch(e) {
      return [];
    }
  }

  // Trending hashtags modal
  window.openTrendingHashtags = async function() {
    if (!document.getElementById('trendingModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="trendingModal" class="fullscreen-modal hidden p-4 z-[85] overflow-y-auto no-scrollbar">
          <div class="flex justify-between items-center border-b border-amber-500/40 pb-3 mb-3 sticky top-0 bg-gray-950 z-10">
            <h2 class="text-base font-bold text-amber-400"><i class="fa-solid fa-fire"></i> Trending Hashtags</h2>
            <button onclick="closeModal('trendingModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="trending-list" class="space-y-2"></div>
        </div>
      `);
    }
    if (typeof openModal === 'function') openModal('trendingModal');

    const list = document.getElementById('trending-list');
    list.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">Loading...</p>';

    const trending = await getTrendingHashtags();

    if (trending.length === 0) {
      list.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">Abhi koi trending hashtag nahi. Pehle posts karein!</p>';
      return;
    }

    list.innerHTML = '';
    trending.forEach(([tag, count], idx) => {
      const div = document.createElement('div');
      div.className = 'p-3 bg-gray-900 border border-amber-500/30 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-800';
      div.onclick = () => { closeModal('trendingModal'); window.openHashtagFeed(tag); };
      div.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center text-white text-xs font-bold">#${idx + 1}</div>
        <div class="flex-1">
          <p class="text-sm font-bold text-amber-400">${tag}</p>
          <p class="text-[10px] text-gray-400">${count} posts</p>
        </div>
        <i class="fa-solid fa-chevron-right text-gray-500 text-xs"></i>
      `;
      list.appendChild(div);
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // 10. HASHTAG AUTO-SUGGEST (post caption mein)
  // ═══════════════════════════════════════════════════════════════
  function setupHashtagSuggest() {
    const captionInput = document.getElementById('post-caption');
    if (!captionInput || captionInput.dataset.hashtagSetup === '1') return;
    captionInput.dataset.hashtagSetup = '1';

    captionInput.addEventListener('input', async () => {
      const text = captionInput.value;
      const lastHashIdx = text.lastIndexOf('#');
      if (lastHashIdx === -1) return;
      
      const partial = text.substring(lastHashIdx + 1).split(/\s/)[0];
      if (partial.length < 1) return;

      // Common hashtags list
      const suggestions = ['#XAUUSD', '#BTCUSD', '#Forex', '#Trading', '#Gold', '#Crypto', '#Pakistan', '#SuperSphere', '#Live', '#Gift'];
      const matched = suggestions.filter(s => s.toLowerCase().includes('#' + partial.toLowerCase()));

      if (matched.length === 0) return;
      console.log('Hashtag suggestions:', matched);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 11. AUTO-LINKIFY OBSERVER (har 2 second)
  // ═══════════════════════════════════════════════════════════════
  function autoLinkify() {
    document.querySelectorAll('#posts-container p, #video-feed-container p, #dm-thread-view p, #profile-bio, #pub-bio, .allow-select').forEach(el => {
      if (el.dataset.linkified === '1') return;
      const text = el.innerText || '';
      if (/[@#]/.test(text) || /https?:\/\//.test(text)) {
        el.innerHTML = window.__linkifyText(text);
        el.dataset.linkified = '1';
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 12. TRENDING BUTTON IN HEADER
  // ═══════════════════════════════════════════════════════════════
  function addTrendingButton() {
    if (document.getElementById('trending-btn')) return;
    const header = document.querySelector('header');
    if (!header) return;
    const btn = document.createElement('button');
    btn.id = 'trending-btn';
    btn.onclick = window.openTrendingHashtags;
    btn.className = 'px-2.5 py-1 bg-gray-800 text-amber-400 rounded-full text-xs border border-amber-500/30 font-bold';
    btn.innerHTML = '<i class="fa-solid fa-fire"></i>';
    btn.title = 'Trending';
    const div = header.querySelector('div');
    if (div) div.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    // Move live to settings
    setTimeout(moveLiveToSettings, 2000);
    setInterval(moveLiveToSettings, 3000);

    // Auto linkify
    setInterval(autoLinkify, 2000);
    setInterval(linkifyProfile, 2000);

    // Hashtag suggest
    setInterval(setupHashtagSuggest, 2000);

    // Trending button
    setTimeout(addTrendingButton, 3000);

    // Clean fake posts (admin only)
    if (isAdmin()) {
      setTimeout(cleanFakePosts, 6000);
    }

    console.log('✅ hide.js loaded — Live moved, hashtags active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════
  window.__HIDE__ = {
    openHashtagFeed: window.openHashtagFeed,
    openTrendingHashtags: window.openTrendingHashtags,
    linkifyText: window.__linkifyText,
    cleanFakePosts,
    moveLiveToSettings
  };
})();
