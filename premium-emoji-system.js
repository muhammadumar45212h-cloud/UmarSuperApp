// ==========================================
// ⚡ SUPER APP - PREMIUM EMOJI SYSTEM
// File: premium-emoji-system.js
// ==========================================

(function() {
  'use strict';

  // 1. Premium Emojis List (Telegram Style Theme)
  const PREMIUM_EMOJIS = [
    { char: '🆘', name: 'SOS', class: 'glow-red' },
    { char: '🆕', name: 'NEW', class: 'pop-blue' },
    { char: '🔞', name: '18+', class: 'glow-red' },
    { char: '💯', name: '100', class: 'bounce-yellow' },
    { char: '🚨', name: 'ALERT', class: 'flash-red' },
    { char: '💎', name: 'VIP', class: 'glow-cyan' },
    { char: '👑', name: 'KING', class: 'glow-gold' },
    { char: '🔥', name: 'FIRE', class: 'shake-orange' },
    { char: '💥', name: 'BOOM', class: 'bounce-red' },
    { char: '🎁', name: 'GIFT', class: 'glow-pink' },
    { char: '💰', name: 'MONEY', class: 'glow-green' },
    { char: '🛑', name: 'STOP', class: 'shake-red' },
    { char: '⚠️', name: 'WARN', class: 'flash-yellow' },
    { char: '✅', name: 'VERIFY', class: 'glow-green' },
    { char: '❌', name: 'REJECT', class: 'glow-red' },
    { char: '🚀', name: 'ROCKET', class: 'bounce-cyan' },
    { char: '⚡', name: 'BOOST', class: 'flash-yellow' },
    { char: '📢', name: 'PROMO', class: 'pulse-orange' }
  ];

  // 2. CSS Styles (Telegram Premium Look)
  function injectEmojiCSS() {
    if (document.getElementById('premium-emoji-css')) return;
    const style = document.createElement('style');
    style.id = 'premium-emoji-css';
    style.innerHTML = `
      /* Emoji Picker Container */
      .tg-emoji-picker {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        padding: 10px;
        background: rgba(20, 20, 25, 0.95);
        border-radius: 15px;
      }
      
      /* Base Premium Emoji Style */
      .tg-premium-emoji {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        width: 45px;
        height: 45px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
      }
      .tg-premium-emoji:hover { transform: scale(1.15); }
      .tg-premium-emoji.locked { filter: grayscale(100%) opacity(0.5); }
      .tg-premium-emoji.locked::after {
        content: '🔒';
        position: absolute;
        font-size: 12px;
        bottom: -2px;
        right: -2px;
      }

      /* Animations & Glows */
      .glow-red { animation: glowRed 1.5s infinite alternate; }
      .glow-cyan { animation: glowCyan 1.5s infinite alternate; }
      .glow-gold { animation: glowGold 1.5s infinite alternate; }
      .glow-pink { animation: glowPink 1.5s infinite alternate; }
      .glow-green { animation: glowGreen 1.5s infinite alternate; }
      .pop-blue { animation: popBlue 1s infinite alternate; }
      .bounce-yellow { animation: bounceY 1s infinite alternate; }
      .flash-red { animation: flashRed 0.8s infinite alternate; }
      .shake-orange { animation: shakeO 1s infinite alternate; }
      .shake-red { animation: shakeR 1s infinite alternate; }
      .flash-yellow { animation: flashY 0.8s infinite alternate; }
      .bounce-cyan { animation: bounceC 1s infinite alternate; }
      .pulse-orange { animation: pulseO 1.5s infinite alternate; }

      @keyframes glowRed { from { filter: drop-shadow(0 0 2px red); } to { filter: drop-shadow(0 0 10px red); } }
      @keyframes glowCyan { from { filter: drop-shadow(0 0 2px cyan); } to { filter: drop-shadow(0 0 10px cyan); } }
      @keyframes glowGold { from { filter: drop-shadow(0 0 2px gold); } to { filter: drop-shadow(0 0 10px gold); } }
      @keyframes glowPink { from { filter: drop-shadow(0 0 2px pink); } to { filter: drop-shadow(0 0 10px pink); } }
      @keyframes glowGreen { from { filter: drop-shadow(0 0 2px lime); } to { filter: drop-shadow(0 0 10px lime); } }
      @keyframes popBlue { from { transform: scale(1); } to { transform: scale(1.2); } }
      @keyframes bounceY { from { transform: translateY(0); } to { transform: translateY(-5px); } }
      @keyframes flashRed { from { opacity: 0.5; } to { opacity: 1; } }
      @keyframes shakeO { from { transform: rotate(-10deg); } to { transform: rotate(10deg); } }
      @keyframes shakeR { from { transform: rotate(-15deg); } to { transform: rotate(15deg); } }
      @keyframes flashY { from { opacity: 0.6; } to { opacity: 1; } }
      @keyframes bounceC { from { transform: translateY(0) scale(1); } to { transform: translateY(-8px) scale(1.1); } }
      @keyframes pulseO { from { transform: scale(1); opacity: 0.8; } to { transform: scale(1.2); opacity: 1; } }
      
      /* Chat/Post mein dikhne wala style */
      .chat-premium-emoji {
        display: inline-block;
        font-size: 1.3em;
        vertical-align: middle;
        margin: 0 2px;
      }
    `;
    document.head.appendChild(style);
  }

  // 3. Premium Check Function
  function isPremiumUser() {
    if (!currentUser) return false;
    // Hamare purane PremiumState ko use karein
    if (window.PremiumState && typeof window.PremiumState.isActive === 'function') {
      return window.PremiumState.isActive(currentUser);
    }
    // Fallback check
    const cleanUser = formatHandle(currentUser);
    const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const u = users[cleanUser] || {};
    return u.isPremium === true;
  }

  // 4. Open Emoji Picker (Override purana function)
  window.openPremiumEmojiPicker = function(targetInputId) {
    if (!currentUser) { showToast("Pehle login karein!"); return; }
    
    const isPremium = isPremiumUser();
    const existing = document.getElementById('tgEmojiPicker');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'tgEmojiPicker';
    modal.className = 'fixed inset-0 z-[99999] bg-black/90 flex items-end';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    // Generate emojis HTML
    let emojiHtml = '';
    PREMIUM_EMOJIS.forEach(e => {
      const lockedClass = isPremium ? '' : 'locked';
      emojiHtml += `
        <div class="tg-premium-emoji ${e.class} ${lockedClass}" onclick="handleEmojiClick('${e.char}', '${targetInputId}', ${isPremium})">
          ${e.char}
        </div>
      `;
    });

    modal.innerHTML = `
      <div class="w-full bg-gray-900 rounded-t-3xl max-h-[70vh] overflow-hidden border-t-2 border-amber-500 pb-6">
        <div class="p-4 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-gray-900 to-gray-800">
          <div>
            <h3 class="text-sm font-bold text-amber-400 flex items-center gap-2">
              <i class="fa-solid fa-crown"></i> Premium Emojis
            </h3>
            <p class="text-[9px] text-gray-400 mt-0.5">${isPremium ? '✅ All emojis unlocked' : '🔒 Premium required to use'}</p>
          </div>
          <button onclick="document.getElementById('tgEmojiPicker').remove()" class="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div class="p-4 overflow-y-auto max-h-[50vh]">
          <div class="tg-emoji-picker">${emojiHtml}</div>
          
          ${!isPremium ? `
            <button onclick="document.getElementById('tgEmojiPicker').remove(); openPremiumStore();" 
              class="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-xl shadow-lg">
              👑 Unlock All Premium Emojis - Get Premium
            </button>
          ` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  };

  // 5. Handle Emoji Click
  window.handleEmojiClick = function(emoji, targetInputId, isPremium) {
    if (!isPremium) {
      showToast("🔒 Ye emoji sirf Premium walo ke liye hai!");
      document.getElementById('tgEmojiPicker').remove();
      openPremiumStore(); // Premium store kholo
      return;
    }
    
    const input = document.getElementById(targetInputId);
    if (input) {
      input.value += emoji;
      input.focus();
    }
    document.getElementById('tgEmojiPicker').remove();
  };

  // 6. Format Emojis in Chat/Render (Jab doosra user dekhe toh bhi colorful ho)
  // Ye function text mein se premium emojis ko dhoond kar unhe CSS class deta hai
  window.formatPremiumEmojisInText = function(text) {
    if (!text) return text;
    let formattedText = text;
    PREMIUM_EMOJIS.forEach(e => {
      // Agar text mein wo emoji hai, toh usko span mein wrap karo
      // Note: Regex ki zaroorat nahi, simple replace kaam karega
      const regex = new RegExp(e.char, 'g');
      formattedText = formattedText.replace(regex, `<span class="chat-premium-emoji ${e.class}">${e.char}</span>`);
    });
    return formattedText;
  };

  // 7. Patch Chat Rendering (DM)
  const originalRenderDM = window.renderDmMessagesFromCloud;
  if (originalRenderDM) {
    window.renderDmMessagesFromCloud = function(messages) {
      // Pehle original function ko chalne dein (jo purana HTML banata hai)
      originalRenderDM(messages);
      
      // Phir DOM mein text replace karein (Ye zyada safe hai)
      setTimeout(() => {
        const threadView = document.getElementById('dm-thread-view');
        if (threadView) {
          threadView.querySelectorAll('.allow-select').forEach(p => {
             // Sirf text replace karo, HTML ko chhedo
             let html = p.innerHTML;
             PREMIUM_EMOJIS.forEach(e => {
                const regex = new RegExp(e.char, 'g');
                html = html.replace(regex, `<span class="chat-premium-emoji ${e.class}">${e.char}</span>`);
             });
             p.innerHTML = html;
          });
        }
      }, 100);
    };
  }

  // 8. Patch Comments Rendering
  const originalRenderComments = window.renderCommentsList;
  if (originalRenderComments) {
    window.renderCommentsList = function() {
      originalRenderComments();
      setTimeout(() => {
        const area = document.getElementById('drawer-content-area');
        if (area) {
          area.querySelectorAll('p').forEach(p => {
             let html = p.innerHTML;
             PREMIUM_EMOJIS.forEach(e => {
                const regex = new RegExp(e.char, 'g');
                html = html.replace(regex, `<span class="chat-premium-emoji ${e.class}">${e.char}</span>`);
             });
             p.innerHTML = html;
          });
        }
      }, 100);
    };
  }

  // Init
  window.addEventListener('load', () => {
    setTimeout(injectEmojiCSS, 1000);
  });

  console.log("👑 Premium Emoji System Ready!");
})();
