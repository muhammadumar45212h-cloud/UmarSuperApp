/* ═══════════════════════════════════════════════════════════════
   SUPER APP - PREMIUM SYSTEM MODULE
   Ye file add karti hai:
   1. Blue Tick (Verified Badge) - TikTok jaisa
   2. Message Forward (Telegram jaisa)
   3. Channel Subscriber List (Owner sees list, others see count)
   4. Premium Content Animation (emoji hilein)
   5. Video 2-Sec Long-Press Menu (50 emojis + copy + report)
   6. Channel Privacy (screenshot block, copy/forward disable)
   
   Add to index.html: <script src="premium.js" defer></script>
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

  // ═══════════════════════════════════════════════════════════════
  // 1. BLUE TICK SYSTEM (Verified Badge - TikTok style)
  // ═══════════════════════════════════════════════════════════════
  
  // TikTok-style blue tick SVG
  const VERIFIED_TICK_SVG = `<svg viewBox="0 0 22 22" width="14" height="14" style="display:inline-block;vertical-align:middle;margin-left:3px;filter:drop-shadow(0 0 2px rgba(29,161,242,0.6))">
    <path fill="#1DA1F2" d="M11 0L13.5 2.5L17 2L18 5.5L21.5 6.5L21 10L23 12L21 14L21.5 17.5L18 18.5L17 22L13.5 21.5L11 24L8.5 21.5L5 22L4 18.5L0.5 17.5L1 14L-1 12L1 10L0.5 6.5L4 5.5L5 2L8.5 2.5L11 0Z" transform="translate(0,-1)"/>
    <path fill="#ffffff" d="M9.5 15.5L6 12L7.5 10.5L9.5 12.5L14.5 7.5L16 9L9.5 15.5Z"/>
  </svg>`;

  // Cache of verified users
  const verifiedCache = {};
  
  // Check verified from cache
  function isVerified(user) {
    if (!user) return false;
    const u = fmt(user);
    if (verifiedCache[u] !== undefined) return verifiedCache[u];
    try {
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      const data = users[u];
      const v = !!(data && (data.isPremium === true || data.isVerified === true));
      verifiedCache[u] = v;
      return v;
    } catch(e) { return false; }
  }

  // Load verified from Firebase on start
  async function loadVerifiedUsers() {
    try {
      const snap1 = await firebase.firestore().collection('users').where('isPremium', '==', true).get();
      snap1.forEach(d => { verifiedCache[d.id] = true; });
      
      try {
        const snap2 = await firebase.firestore().collection('users').where('isVerified', '==', true).get();
        snap2.forEach(d => { verifiedCache[d.id] = true; });
      } catch(e) {}
      
      // Also update local storage
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      Object.keys(verifiedCache).forEach(u => {
        if (verifiedCache[u] && users[u]) users[u].isPremium = true;
      });
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
      
      applyTicksToDOM();
      console.log('✅ Verified users loaded:', Object.keys(verifiedCache).length);
    } catch(e) { console.log('Verified load:', e.message); }
  }

  // Helper: tick HTML for a user
  function tickHTML(user) {
    if (!isVerified(user)) return '';
    return `<span class="premium-tick" data-user="${fmt(user)}">${VERIFIED_TICK_SVG}</span>`;
  }
  window.tickHTML = tickHTML;

  // Auto-apply ticks to all @username elements in DOM
  function applyTicksToDOM() {
    // Find elements containing @username
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.classList?.contains('premium-tick')) return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.querySelector?.('.premium-tick')) return NodeFilter.FILTER_REJECT;
          if (/@[a-zA-Z0-9_]+\b/.test(node.nodeValue)) return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    const nodes = [];
    let n;
    while (n = walker.nextNode()) nodes.push(n);
    
    nodes.forEach(node => {
      const text = node.nodeValue;
      const match = text.match(/@([a-zA-Z0-9_]+)/);
      if (!match) return;
      const user = match[1];
      if (!isVerified(user)) return;
      
      // Check if already has tick nearby
      const parent = node.parentElement;
      if (!parent) return;
      if (parent.nextElementSibling?.classList?.contains('premium-tick')) return;
      
      // Add tick after this text node
      const tickSpan = document.createElement('span');
      tickSpan.className = 'premium-tick';
      tickSpan.dataset.user = user;
      tickSpan.innerHTML = VERIFIED_TICK_SVG;
      
      if (parent.tagName === 'SPAN' || parent.tagName === 'B' || parent.tagName === 'STRONG') {
        parent.insertAdjacentElement('afterend', tickSpan);
      } else {
        try {
          parent.insertBefore(tickSpan, node.nextSibling);
        } catch(e) {
          parent.appendChild(tickSpan);
        }
      }
    });
  }

  // Observer to auto-add ticks to newly created elements
  const tickObserver = new MutationObserver(() => {
    clearTimeout(window.__premTickTimer);
    window.__premTickTimer = setTimeout(applyTicksToDOM, 400);
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. MESSAGE FORWARD SYSTEM (Telegram style)
  // ═══════════════════════════════════════════════════════════════
  
  let forwardMessageData = null;
  
  // Detect long-press on DM message
  function attachForwardListeners() {
    const threadView = document.getElementById('dm-thread-view');
    if (!threadView || threadView.dataset.fwdAttached === '1') return;
    threadView.dataset.fwdAttached = '1';
    
    let pressTimer;
    let pressedBubble;
    
    threadView.addEventListener('touchstart', (e) => {
      const bubble = e.target.closest('div[class*="max-w-"]');
      if (!bubble) return;
      pressedBubble = bubble;
      pressTimer = setTimeout(() => {
        const text = bubble.querySelector('p')?.innerText || '';
        const img = bubble.querySelector('img')?.src;
        const vid = bubble.querySelector('video')?.src;
        if (text || img || vid) {
          forwardMessageData = { text: text, media: img || vid, mediaType: img ? 'image' : (vid ? 'video' : null) };
          showForwardMenu(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, 600);
    }, { passive: true });
    
    threadView.addEventListener('touchend', () => clearTimeout(pressTimer));
    threadView.addEventListener('touchmove', () => clearTimeout(pressTimer));
    
    threadView.addEventListener('contextmenu', (e) => {
      const bubble = e.target.closest('div[class*="max-w-"]');
      if (!bubble) return;
      e.preventDefault();
      const text = bubble.querySelector('p')?.innerText || '';
      const img = bubble.querySelector('img')?.src;
      const vid = bubble.querySelector('video')?.src;
      if (text || img || vid) {
        forwardMessageData = { text: text, media: img || vid, mediaType: img ? 'image' : (vid ? 'video' : null) };
        showForwardMenu(e.clientX, e.clientY);
      }
    });
  }

  function showForwardMenu(x, y) {
    const existing = document.getElementById('forwardMenu');
    if (existing) existing.remove();
    
    const menu = document.createElement('div');
    menu.id = 'forwardMenu';
    menu.style.cssText = `position:fixed;left:${Math.min(x, window.innerWidth-200)}px;top:${Math.min(y, window.innerHeight-100)}px;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:6px;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,0.6);min-width:160px;`;
    menu.innerHTML = `
      <button onclick="window.__forwardMsg()" style="width:100%;text-align:left;padding:10px 12px;color:#22d3ee;font-size:13px;font-weight:700;background:transparent;border:none;border-radius:8px;cursor:pointer;">
        <i class="fa-solid fa-share"></i> Forward
      </button>
      <button onclick="window.__copyMsg()" style="width:100%;text-align:left;padding:10px 12px;color:#94a3b8;font-size:13px;background:transparent;border:none;border-radius:8px;cursor:pointer;">
        <i class="fa-solid fa-copy"></i> Copy
      </button>
      <button onclick="window.__deleteMsgLocal()" style="width:100%;text-align:left;padding:10px 12px;color:#ef4444;font-size:13px;background:transparent;border:none;border-radius:8px;cursor:pointer;">
        <i class="fa-solid fa-trash"></i> Delete
      </button>
    `;
    document.body.appendChild(menu);
    
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(ev) {
        if (!menu.contains(ev.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  }

  window.__forwardMsg = function() {
    document.getElementById('forwardMenu')?.remove();
    if (!forwardMessageData) return;
    openForwardTargetPicker();
  };

  window.__copyMsg = function() {
    document.getElementById('forwardMenu')?.remove();
    if (forwardMessageData?.text) {
      navigator.clipboard.writeText(forwardMessageData.text);
      toast('✅ Copied to clipboard');
    }
  };

  window.__deleteMsgLocal = function() {
    document.getElementById('forwardMenu')?.remove();
    toast('⚠️ Message deletion coming in next update');
  };

  async function openForwardTargetPicker() {
    if (!document.getElementById('forwardPickerModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="forwardPickerModal" class="fullscreen-modal hidden p-4 z-[85]">
          <div class="flex justify-between items-center border-b border-cyan-500/40 pb-3 mb-3">
            <h2 class="text-base font-bold text-cyan-400"><i class="fa-solid fa-share"></i> Forward to</h2>
            <button onclick="closeModal('forwardPickerModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <input type="text" id="forwardSearchInput" oninput="window.__filterForwardList()" class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white mb-3" placeholder="Search users/channels...">
          <div id="forwardList" class="flex-1 overflow-y-auto no-scrollbar space-y-2"></div>
        </div>
      `);
    }
    openModal('forwardPickerModal');
    loadForwardTargetList();
  }

  async function loadForwardTargetList() {
    const list = document.getElementById('forwardList');
    if (!list) return;
    list.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Loading...</p>';
    
    const cleanUser = getUser();
    const targets = [];
    
    // Get users from Firestore
    try {
      const snap = await firebase.firestore().collection('users').limit(100).get();
      snap.forEach(d => {
        if (d.id !== cleanUser) {
          targets.push({ id: d.id, type: 'user', name: d.data().name || d.id, avatar: d.data().avatar || '' });
        }
      });
    } catch(e) {}
    
    // Get channels
    try {
      const chSnap = await firebase.firestore().collection('channels').limit(50).get();
      chSnap.forEach(d => {
        const data = d.data();
        targets.push({ id: d.id, type: 'channel', name: data.name || d.id, avatar: data.photo || '' });
      });
    } catch(e) {}
    
    window.__forwardTargets = targets;
    renderForwardTargets(targets);
  }

  function renderForwardTargets(targets) {
    const list = document.getElementById('forwardList');
    if (!list) return;
    if (targets.length === 0) {
      list.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Koi target nahi mila</p>';
      return;
    }
    list.innerHTML = '';
    targets.forEach(t => {
      const div = document.createElement('div');
      div.className = 'p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-800';
      div.onclick = () => window.__doForward(t);
      const avatar = t.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${t.id}`;
      div.innerHTML = `
        <img src="${avatar}" class="w-10 h-10 rounded-full bg-gray-800">
        <div class="flex-1">
          <p class="text-xs font-bold text-white">@${t.id} ${t.type === 'channel' ? '<i class="fa-solid fa-bullhorn text-amber-400 text-[10px]"></i>' : ''}</p>
          <p class="text-[10px] text-gray-400">${t.name}</p>
        </div>
      `;
      list.appendChild(div);
    });
  }

  window.__filterForwardList = function() {
    const q = document.getElementById('forwardSearchInput').value.toLowerCase();
    const filtered = (window.__forwardTargets || []).filter(t => 
      t.id.toLowerCase().includes(q) || (t.name || '').toLowerCase().includes(q)
    );
    renderForwardTargets(filtered);
  };

  window.__doForward = async function(target) {
    if (!forwardMessageData || !target) return;
    const user = getUser();
    if (!user) return;
    
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const fwdData = {
      sender: user,
      text: (forwardMessageData.text || '') + '\n\n📤 Forwarded',
      time: time,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      forwarded: true
    };
    if (forwardMessageData.media) {
      fwdData.media = forwardMessageData.media;
      fwdData.mediaType = forwardMessageData.mediaType;
    }
    
    try {
      if (target.type === 'user') {
        const chatKey = [user, target.id].sort().join(':');
        await firebase.firestore().collection('dm_messages').add({
          ...fwdData, chatKey, receiver: target.id
        });
        toast('✅ Forwarded to @' + target.id);
      } else if (target.type === 'channel') {
        const chRef = firebase.firestore().collection('channels').doc(target.id);
        const chDoc = await chRef.get();
        if (chDoc.exists) {
          const ch = chDoc.data();
          const newPost = {
            id: 'cpost_' + Date.now(),
            text: (forwardMessageData.text || '') + '\n\n📤 Forwarded from @' + user,
            photo: forwardMessageData.mediaType === 'image' ? forwardMessageData.media : null,
            time: time,
            reactions: {}
          };
          const posts = ch.posts || [];
          posts.push(newPost);
          await chRef.update({ posts });
          toast('✅ Forwarded to channel: ' + ch.name);
        }
      }
    } catch(e) {
      toast('❌ Forward error: ' + e.message);
    }
    
    closeModal('forwardPickerModal');
    forwardMessageData = null;
  };

  // ═══════════════════════════════════════════════════════════════
  // 3. CHANNEL SUBSCRIBER LIST (Owner sees list, others see count)
  // ═══════════════════════════════════════════════════════════════
  
  // Override channel subscriber display
  function enhanceChannelSubscriberDisplay() {
    const subtitle = document.getElementById('chat-target-subtitle');
    if (!subtitle || !activeChannelId) return;
    
    const user = getUser();
    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[activeChannelId];
    if (!chan) return;
    
    const isOwner = chan.owner === user;
    const count = (chan.subscribers || []).length;
    
    if (isOwner) {
      // Owner can tap to see list
      subtitle.style.cursor = 'pointer';
      subtitle.style.textDecoration = 'underline';
      subtitle.dataset.ownerList = '1';
      subtitle.title = 'Tap to see subscriber list';
      
      if (!subtitle.dataset.listenerAttached) {
        subtitle.dataset.listenerAttached = '1';
        subtitle.addEventListener('click', () => window.__showSubscriberList(activeChannelId));
      }
    } else {
      subtitle.style.cursor = 'default';
      subtitle.dataset.ownerList = '';
      subtitle.title = '';
    }
  }

  window.__showSubscriberList = function(channelId) {
    if (!channelId) return;
    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[channelId];
    if (!chan) return;
    
    if (chan.owner !== getUser()) {
      toast('Sirf owner subscriber list dekh sakta hai');
      return;
    }
    
    const subs = chan.subscribers || [];
    
    if (!document.getElementById('subscriberListModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="subscriberListModal" class="fullscreen-modal hidden p-4 z-[85]">
          <div class="flex justify-between items-center border-b border-cyan-500/40 pb-3 mb-3">
            <h2 class="text-base font-bold text-cyan-400"><i class="fa-solid fa-users"></i> Subscribers</h2>
            <button onclick="closeModal('subscriberListModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="subscriberListContent" class="flex-1 overflow-y-auto no-scrollbar space-y-2"></div>
        </div>
      `);
    }
    
    const content = document.getElementById('subscriberListContent');
    if (subs.length === 0) {
      content.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">Abhi koi subscriber nahi</p>';
    } else {
      content.innerHTML = '';
      subs.forEach(subId => {
        let users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
        const u = users[subId] || {};
        const div = document.createElement('div');
        div.className = 'p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-center gap-3';
        div.innerHTML = `
          <img src="${u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${subId}`}" class="w-10 h-10 rounded-full bg-gray-800">
          <div class="flex-1">
            <p class="text-xs font-bold text-white">@${subId} ${tickHTML(subId)}</p>
            <p class="text-[10px] text-gray-400">${u.name || 'User'}</p>
          </div>
          <button onclick="window.__dmFromSubscriberList('${subId}')" class="px-3 py-1.5 bg-cyan-600 text-white text-[10px] font-bold rounded-lg">
            <i class="fa-solid fa-paper-plane"></i> Msg
          </button>
        `;
        content.appendChild(div);
      });
    }
    
    openModal('subscriberListModal');
  };

  window.__dmFromSubscriberList = function(userId) {
    closeModal('subscriberListModal');
    closeModal('dmModal');
    if (typeof window.openChatConversation === 'function') {
      window.openChatConversation(userId);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 4. PREMIUM CONTENT ANIMATION (Emoji posts "hilte" hain)
  // ═══════════════════════════════════════════════════════════════
  
  // CSS for animation
  function injectPremiumCSS() {
    if (document.getElementById('premium-anim-css')) return;
    const style = document.createElement('style');
    style.id = 'premium-anim-css';
    style.textContent = `
      @keyframes premiumBounce {
        0%, 100% { transform: translateY(0) scale(1); }
        25% { transform: translateY(-4px) scale(1.05); }
        50% { transform: translateY(0) scale(1); }
        75% { transform: translateY(-2px) scale(1.03); }
      }
      @keyframes premiumShake {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-3deg); }
        75% { transform: rotate(3deg); }
      }
      @keyframes premiumPulse {
        0%, 100% { text-shadow: 0 0 4px rgba(255,215,0,0.3); }
        50% { text-shadow: 0 0 16px rgba(255,215,0,0.9), 0 0 24px rgba(255,100,0,0.5); }
      }
      .premium-post-animate {
        animation: premiumBounce 2s ease-in-out infinite;
      }
      .premium-emoji-shake {
        display: inline-block;
        animation: premiumShake 1.5s ease-in-out infinite;
      }
      .premium-text-glow {
        animation: premiumPulse 2s ease-in-out infinite;
        font-weight: 700;
      }
      .premium-post-border {
        border: 2px solid transparent;
        background: linear-gradient(#0f172a, #0f172a) padding-box,
                    linear-gradient(135deg, #fbbf24, #ec4899, #06b6d4) border-box;
        box-shadow: 0 0 15px rgba(251,191,36,0.2);
      }
    `;
    document.head.appendChild(style);
  }

  // Apply premium animations to premium users' posts
  function applyPremiumAnimations() {
    // Feed posts
    document.querySelectorAll('#posts-container > div').forEach(card => {
      const userMatch = card.innerHTML.match(/@([a-zA-Z0-9_]+)/);
      if (!userMatch) return;
      const user = userMatch[1];
      if (!isVerified(user)) return;
      if (card.dataset.premiumStyled === '1') return;
      card.dataset.premiumStyled = '1';
      card.classList.add('premium-post-border');
      
      // Animate emojis
      const textEl = card.querySelector('p.allow-select') || card.querySelector('p');
      if (textEl && /[\u{1F300}-\u{1F9FF}]/u.test(textEl.textContent)) {
        textEl.classList.add('premium-text-glow');
      }
    });
    
    // Channel posts
    document.querySelectorAll('#dm-thread-view > div').forEach(post => {
      const userMatch = post.innerHTML.match(/@([a-zA-Z0-9_]+)/);
      if (!userMatch) return;
      const user = userMatch[1];
      if (!isVerified(user)) return;
      if (post.dataset.premiumStyled === '1') return;
      post.dataset.premiumStyled = '1';
      post.classList.add('premium-post-border');
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. VIDEO 2-SEC LONG-PRESS MENU (50 emojis + copy + report)
  // ═══════════════════════════════════════════════════════════════
  
  const EMOJI_50_PREMIUM = [
    "😉","❤️‍🩹","💔","🔥","🥳","👍","🥱","🥰","😍","🤩",
    "😱","🤯","🥶","🤮","🤑","🥸","🤡","💩","🎉","💛",
    "💚","🩵","😎","🥹","🤗","🤔","😴","🙄","😈","👽",
    "🎁","🎊","🎈","⭐","💎","👑","🏆","🚀","✈️","🌹",
    "🍕","🍔","🍟","🍩","⚽","🏀","🎮","🎵","📸","💯"
  ];

  let videoLongPressTimer = null;
  let videoLongPressTarget = null;

  function attachVideoLongPress() {
    const container = document.getElementById('video-feed-container');
    if (!container || container.dataset.lpAttached === '1') return;
    container.dataset.lpAttached = '1';
    
    // Touch events
    container.addEventListener('touchstart', (e) => {
      const video = e.target.closest('video');
      if (!video) return;
      videoLongPressTarget = video;
      const touch = e.touches[0];
      window.__longPressX = touch.clientX;
      window.__longPressY = touch.clientY;
      
      videoLongPressTimer = setTimeout(() => {
        showVideoEmojiMenu(touch.clientX, touch.clientY, video);
      }, 2000); // 2 seconds
    }, { passive: true });
    
    container.addEventListener('touchend', () => {
      if (videoLongPressTimer) { clearTimeout(videoLongPressTimer); videoLongPressTimer = null; }
    });
    container.addEventListener('touchmove', () => {
      if (videoLongPressTimer) { clearTimeout(videoLongPressTimer); videoLongPressTimer = null; }
    });
    
    // Mouse events (desktop)
    container.addEventListener('mousedown', (e) => {
      const video = e.target.closest('video');
      if (!video) return;
      videoLongPressTarget = video;
      videoLongPressTimer = setTimeout(() => {
        showVideoEmojiMenu(e.clientX, e.clientY, video);
      }, 2000);
    });
    container.addEventListener('mouseup', () => {
      if (videoLongPressTimer) { clearTimeout(videoLongPressTimer); videoLongPressTimer = null; }
    });
    container.addEventListener('mouseleave', () => {
      if (videoLongPressTimer) { clearTimeout(videoLongPressTimer); videoLongPressTimer = null; }
    });
  }

  function showVideoEmojiMenu(x, y, video) {
    if (videoLongPressTimer) { clearTimeout(videoLongPressTimer); videoLongPressTimer = null; }
    
    const videoId = video.id?.replace('video-elem-', '') || '';
    
    const existing = document.getElementById('videoEmojiMenu');
    if (existing) existing.remove();
    
    const menu = document.createElement('div');
    menu.id = 'videoEmojiMenu';
    menu.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#0f172a;border:1px solid #334155;border-radius:20px;padding:12px;z-index:9999;box-shadow:0 20px 60px rgba(0,0,0,0.8);width:min(340px,92vw);`;
    
    let emojisHtml = '';
    EMOJI_50_PREMIUM.forEach(e => {
      emojisHtml += `<button class="video-emoji-btn" style="font-size:22px;padding:4px;background:transparent;border:none;cursor:pointer;transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.4)'" onmouseout="this.style.transform='scale(1)'" data-emoji="${e}">${e}</button>`;
    });
    
    menu.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;border-bottom:1px solid #1e293b;padding-bottom:8px;">
        <p style="font-size:11px;font-weight:700;color:#22d3ee;letter-spacing:1px;">QUICK REACT</p>
        <button onclick="document.getElementById('videoEmojiMenu').remove()" style="background:transparent;border:none;color:#94a3b8;font-size:16px;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:4px;max-height:200px;overflow-y:auto;padding:4px;">${emojisHtml}</div>
      <div style="display:flex;gap:8px;margin-top:10px;border-top:1px solid #1e293b;padding-top:10px;">
        <button id="vemCopy" style="flex:1;padding:10px;background:#1e293b;border:1px solid #334155;border-radius:10px;color:#22d3ee;font-size:11px;font-weight:700;cursor:pointer;">
          <i class="fa-solid fa-copy"></i> Copy Link
        </button>
        <button id="vemReport" style="flex:1;padding:10px;background:#1e293b;border:1px solid #7f1d1d;border-radius:10px;color:#ef4444;font-size:11px;font-weight:700;cursor:pointer;">
          <i class="fa-solid fa-flag"></i> Report
        </button>
      </div>
    `;
    
    document.body.appendChild(menu);
    
    // Emoji click handlers
    menu.querySelectorAll('.video-emoji-btn').forEach(btn => {
      btn.onclick = () => {
        const emoji = btn.dataset.emoji;
        saveVideoReaction(videoId, emoji);
        menu.remove();
      };
    });
    
    // Copy handler
    document.getElementById('vemCopy').onclick = () => {
      const url = `${window.location.origin}${window.location.pathname}?post=${videoId}`;
      navigator.clipboard.writeText(url);
      toast('✅ Link copied');
      menu.remove();
    };
    
    // Report handler
    document.getElementById('vemReport').onclick = () => {
      menu.remove();
      if (typeof window.openReportModal === 'function') {
        window.currentActiveVideoId = videoId;
        window.openReportModal();
      }
    };
    
    // Close on outside click
    setTimeout(() => {
      const closeHandler = (ev) => {
        if (!menu.contains(ev.target)) {
          menu.remove();
          document.removeEventListener('click', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
    }, 100);
  }

  async function saveVideoReaction(videoId, emoji) {
    if (!videoId) return;
    const user = getUser();
    if (!user) return;
    
    try {
      await firebase.firestore()
        .collection('posts').doc(videoId)
        .collection('reactions').doc(user)
        .set({ emoji, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
      
      // Animate emoji flying
      const el = document.createElement('div');
      el.className = 'gift-fly';
      el.innerText = emoji;
      el.style.left = (30 + Math.random() * 40) + '%';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
      
      toast(`Reacted ${emoji}`);
    } catch(e) {
      toast('❌ ' + e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. CHANNEL PRIVACY (Screenshot block + copy/forward disable)
  // ═══════════════════════════════════════════════════════════════
  
  // Screenshot protection via visibility API
  function enableScreenshotProtection() {
    document.addEventListener('visibilitychange', () => {
      // When user tries to screenshot on Android/iOS, page visibility changes
      if (document.hidden) {
        document.body.style.filter = 'blur(20px)';
      } else {
        document.body.style.filter = '';
      }
    });
    
    // Android screenshot detection (limited support)
    if ('onScreenshot' in window) {
      window.addEventListener('screenshot', () => {
        toast('⚠️ Screenshot detected - Not allowed');
      });
    }
  }

  // Check if current channel has privacy
  function isChannelPrivacyOn() {
    if (!activeChannelId) return false;
    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[activeChannelId];
    return chan && chan.privacyEnabled === true;
  }

  // Override copy in channels
  function setupChannelPrivacy() {
    // Add CSS to prevent user-select on channels
    if (!document.getElementById('channel-privacy-css')) {
      const style = document.createElement('style');
      style.id = 'channel-privacy-css';
      style.textContent = `
        .channel-privacy-active * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        .channel-privacy-active img,
        .channel-privacy-active video {
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Add privacy settings UI in channel header
  function addChannelPrivacyButton() {
    if (!activeChannelId) return;
    const user = getUser();
    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[activeChannelId];
    if (!chan) return;
    
    const isOwner = chan.owner === user;
    if (!isOwner) return;
    
    const threadHeader = document.getElementById('dm-thread-header');
    if (!threadHeader || threadHeader.dataset.privacyBtnAdded === '1') return;
    threadHeader.dataset.privacyBtnAdded = '1';
    
    const btn = document.createElement('button');
    btn.className = 'w-8 h-8 rounded-full bg-black/40 text-amber-400 flex items-center justify-center border border-amber-500/30';
    btn.innerHTML = '<i class="fa-solid fa-shield-halved text-xs"></i>';
    btn.title = 'Channel Privacy Settings';
    btn.onclick = () => window.__openChannelPrivacySettings(activeChannelId);
    
    // Insert before the last div
    const lastDiv = threadHeader.querySelector('div:last-child');
    if (lastDiv) threadHeader.insertBefore(btn, lastDiv);
  }

  window.__openChannelPrivacySettings = function(channelId) {
    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[channelId];
    if (!chan) return;
    if (chan.owner !== getUser()) { toast('Sirf owner'); return; }
    
    const enabled = chan.privacyEnabled === true;
    const screenshotProtect = chan.screenshotProtect === true;
    
    if (!document.getElementById('channelPrivacyModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="channelPrivacyModal" class="fullscreen-modal hidden p-4 justify-center items-center bg-black/80 z-[85]">
          <div class="w-full max-w-sm bg-gray-900 border border-amber-500/40 rounded-2xl p-5 space-y-4">
            <div class="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 class="text-xs font-bold text-amber-400"><i class="fa-solid fa-shield-halved"></i> Channel Privacy</h3>
              <button onclick="closeModal('channelPrivacyModal')" class="text-gray-400"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="space-y-3">
              <label class="flex items-center justify-between p-3 bg-gray-800 rounded-xl cursor-pointer">
                <div>
                  <p class="text-xs font-bold text-white">Disable Copy & Forward</p>
                  <p class="text-[10px] text-gray-400">Log content copy nahi kar payenge</p>
                </div>
                <input type="checkbox" id="ch-priv-copy" ${enabled ? 'checked' : ''} class="w-4 h-4 accent-amber-500">
              </label>
              <label class="flex items-center justify-between p-3 bg-gray-800 rounded-xl cursor-pointer">
                <div>
                  <p class="text-xs font-bold text-white">Screenshot Protection</p>
                  <p class="text-[10px] text-gray-400">Screenshot pe black screen</p>
                </div>
                <input type="checkbox" id="ch-priv-screenshot" ${screenshotProtect ? 'checked' : ''} class="w-4 h-4 accent-amber-500">
              </label>
            </div>
            <button onclick="window.__saveChannelPrivacy('${channelId}')" class="w-full py-3 btn-gradient text-white font-bold text-xs rounded-xl">
              Save Settings
            </button>
          </div>
        </div>
      `);
    }
    
    openModal('channelPrivacyModal');
  };

  window.__saveChannelPrivacy = async function(channelId) {
    const copy = document.getElementById('ch-priv-copy')?.checked;
    const shot = document.getElementById('ch-priv-screenshot')?.checked;
    
    let channels = JSON.parse(localStorage.getItem('SUPER_APP_CHANNELS') || '{}');
    const chan = channels[channelId];
    if (!chan) return;
    
    chan.privacyEnabled = copy;
    chan.screenshotProtect = shot;
    channels[channelId] = chan;
    localStorage.setItem('SUPER_APP_CHANNELS', JSON.stringify(channels));
    
    try {
      await firebase.firestore().collection('channels').doc(channelId).set({
        privacyEnabled: copy,
        screenshotProtect: shot
      }, { merge: true });
    } catch(e) {}
    
    // Apply CSS if enabled
    const threadView = document.getElementById('dm-thread-view');
    if (threadView) {
      if (copy) threadView.classList.add('channel-privacy-active');
      else threadView.classList.remove('channel-privacy-active');
    }
    
    toast('✅ Privacy settings saved');
    closeModal('channelPrivacyModal');
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO-INIT
  // ═══════════════════════════════════════════════════════════════
  
  function init() {
    injectPremiumCSS();
    setupChannelPrivacy();
    enableScreenshotProtection();
    
    // Start observer
    tickObserver.observe(document.body, { childList: true, subtree: true });
    
    // Periodic tasks
    setInterval(() => {
      applyTicksToDOM();
      applyPremiumAnimations();
      attachVideoLongPress();
      attachForwardListeners();
      addChannelPrivacyButton();
      enhanceChannelSubscriberDisplay();
    }, 2000);
    
    // Load verified users after Firebase ready
    setTimeout(loadVerifiedUsers, 3000);
    
    console.log('✅ premium.js loaded - 6 features active');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
