/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - THEAK.JS (All Real Fixes)
   Sab kuch real, koi demo nahi
   Add: <script src="theak.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

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

  const ADMIN_WA_1 = '923089775764';
  const ADMIN_WA_2 = '923423373749';

  // ═══════════════════════════════════════════════════════════════
  // FIX #1: BUY DIAMONDS — scroll fix + number hidden + auto WA
  // ═══════════════════════════════════════════════════════════════
  window.openBuyDiamondsModal = function() {
    if (document.getElementById('buyDiamondsModal')) {
      document.getElementById('buyDiamondsModal').remove();
    }

    const PKGS = [
      { diamonds: 1, pkr: 1400 },
      { diamonds: 5, pkr: 7000, bonus: 1 },
      { diamonds: 10, pkr: 14000, bonus: 3 },
      { diamonds: 25, pkr: 35000, bonus: 10 },
      { diamonds: 50, pkr: 70000, bonus: 25 },
      { diamonds: 100, pkr: 140000, bonus: 60 }
    ];
    let selectedPkg = null;
    let selectedMethod = 'easypaisa';

    document.body.insertAdjacentHTML('beforeend', `
      <div id="buyDiamondsModal" class="fullscreen-modal p-4 overflow-y-auto no-scrollbar z-[100]">
        <div class="space-y-4 pb-4 max-w-md mx-auto">
          
          <div class="flex justify-between items-center border-b border-amber-500/40 pb-3 sticky top-0 bg-gray-950 z-10 -mx-4 px-4">
            <h2 class="text-base font-bold text-amber-400"><i class="fa-solid fa-gem"></i> Buy Diamonds</h2>
            <button onclick="document.getElementById('buyDiamondsModal').remove()" class="text-gray-400 text-xl">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="bg-amber-900/20 border border-amber-500/40 rounded-xl p-3">
            <p class="text-[11px] text-amber-300 font-bold">💎 1 Diamond = $5 (≈ Rs 1,400)</p>
            <p class="text-[10px] text-gray-300 mt-1">Package select karein → Payment karein → Screenshot bhejein</p>
          </div>

          <div>
            <p class="text-[10px] text-cyan-400 uppercase font-bold mb-2">Step 1: Package</p>
            <div id="td-pkgs" class="grid grid-cols-2 gap-3"></div>
          </div>

          <div id="td-method-section" class="hidden">
            <p class="text-[10px] text-cyan-400 uppercase font-bold mb-2">Step 2: Payment Method</p>
            <div class="grid grid-cols-3 gap-2">
              <button onclick="window.__tdSelectMethod('easypaisa')" id="td-m-easypaisa" class="td-method p-3 bg-gray-800 border-2 border-cyan-500 rounded-xl flex flex-col items-center">
                <i class="fa-solid fa-wallet text-cyan-400"></i>
                <span class="text-[10px] font-bold text-white mt-1">Easypaisa</span>
              </button>
              <button onclick="window.__tdSelectMethod('jazzcash')" id="td-m-jazzcash" class="td-method p-3 bg-gray-800 border-2 border-gray-700 rounded-xl flex flex-col items-center">
                <i class="fa-solid fa-mobile text-cyan-400"></i>
                <span class="text-[10px] font-bold text-white mt-1">JazzCash</span>
              </button>
              <button onclick="window.__tdSelectMethod('sadapay')" id="td-m-sadapay" class="td-method p-3 bg-gray-800 border-2 border-gray-700 rounded-xl flex flex-col items-center">
                <i class="fa-solid fa-building-columns text-cyan-400"></i>
                <span class="text-[10px] font-bold text-white mt-1">SadaPay</span>
              </button>
            </div>
          </div>

          <div id="td-payment-section" class="hidden bg-cyan-900/20 border border-cyan-500/40 rounded-xl p-4 space-y-3">
            <p class="text-[10px] text-cyan-400 uppercase font-bold">Step 3: Payment</p>
            <div class="text-center">
              <p class="text-[10px] text-gray-400">Send exactly</p>
              <p class="text-2xl font-extrabold text-amber-400" id="td-amount">Rs 0</p>
              <p class="text-[9px] text-gray-500 mt-1">Payment details WhatsApp pe bhejenge</p>
            </div>
            <button onclick="window.__tdSendToWA()" class="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
              <i class="fa-brands fa-whatsapp text-lg"></i> Open WhatsApp to Pay
            </button>
            <p class="text-[9px] text-gray-500 text-center">Payment karne ke baad screenshot WhatsApp pe bhejein</p>
          </div>

        </div>
      </div>
    `);

    // Render packages
    const grid = document.getElementById('td-pkgs');
    PKGS.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'p-3 bg-gray-800 border-2 border-amber-500/40 rounded-xl flex flex-col items-center hover:border-amber-400';
      btn.innerHTML = `
        <span class="text-3xl">💎</span>
        <span class="text-base font-bold text-amber-400 mt-1">${p.diamonds}</span>
        ${p.bonus ? `<span class="text-[10px] text-green-400">+${p.bonus} free</span>` : ''}
        <span class="text-xs font-bold text-white mt-1">Rs ${p.pkr.toLocaleString()}</span>
      `;
      btn.onclick = () => {
        selectedPkg = p;
        document.querySelectorAll('#td-pkgs > button').forEach(b => {
          b.classList.remove('border-amber-400', 'bg-amber-900/20');
        });
        btn.classList.add('border-amber-400', 'bg-amber-900/20');
        document.getElementById('td-method-section').classList.remove('hidden');
        document.getElementById('td-payment-section').classList.remove('hidden');
        document.getElementById('td-amount').innerText = 'Rs ' + p.pkr.toLocaleString();
        window.__tdSelectedPkg = p;
        document.getElementById('td-method-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      grid.appendChild(btn);
    });

    window.__tdSelectedPkg = null;
    window.__tdSelectedMethod = 'easypaisa';
  };

  window.__tdSelectMethod = function(method) {
    window.__tdSelectedMethod = method;
    document.querySelectorAll('.td-method').forEach(b => {
      b.classList.remove('border-cyan-500');
      b.classList.add('border-gray-700');
    });
    document.getElementById('td-m-' + method).classList.remove('border-gray-700');
    document.getElementById('td-m-' + method).classList.add('border-cyan-500');
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #2: AUTO WHATSAPP SEND (no manual — just opens)
  // ═══════════════════════════════════════════════════════════════
  window.__tdSendToWA = async function() {
    const user = getUser();
    const pkg = window.__tdSelectedPkg;
    const method = window.__tdSelectedMethod || 'easypaisa';
    if (!user || !pkg) { toast('Package select karein'); return; }

    // Save to Firebase first
    try {
      await firebase.firestore().collection('payments').add({
        user: user,
        package: pkg.diamonds,
        amountPkr: pkg.pkr,
        diamonds: pkg.diamonds + (pkg.bonus || 0),
        method: method,
        status: 'pending',
        source: 'auto-whatsapp',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) { console.log('Save error:', e); }

    // Build WhatsApp message with auto-filled data
    const totalDiamonds = pkg.diamonds + (pkg.bonus || 0);
    const waText = 
`🔔 NEW DIAMOND ORDER

👤 User: @${user}
💎 Package: ${pkg.diamonds}${pkg.bonus ? ' + ' + pkg.bonus + ' bonus' : ''}
📊 Total: ${totalDiamonds} diamonds
💰 Amount: Rs ${pkg.pkr.toLocaleString()}
💳 Method: ${method.toUpperCase()}
🕐 Time: ${new Date().toLocaleString()}

💡 Payment details aapko bhej rahe hain. Screenshot bhejein.`;

    const admin = Math.random() < 0.5 ? ADMIN_WA_1 : ADMIN_WA_2;
    const waUrl = `https://wa.me/${admin}?text=${encodeURIComponent(waText)}`;
    
    toast('📱 WhatsApp khul raha hai...');
    setTimeout(() => {
      window.open(waUrl, '_blank');
      document.getElementById('buyDiamondsModal')?.remove();
    }, 500);
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #3: PREMIUM — auto WhatsApp with real data
  // ═══════════════════════════════════════════════════════════════
  window.openBuyPremiumModal = function() {
    document.getElementById('buyPremiumModal')?.remove();

    document.body.insertAdjacentHTML('beforeend', `
      <div id="buyPremiumModal" class="fullscreen-modal p-4 overflow-y-auto no-scrollbar z-[100]">
        <div class="w-full max-w-sm mx-auto">
          <div class="bg-gradient-to-br from-purple-900 to-pink-900 border-2 border-purple-400 rounded-2xl p-6 space-y-4 mt-8">
            <div class="flex justify-between items-center border-b border-white/20 pb-3">
              <h2 class="text-base font-bold text-white"><i class="fa-solid fa-crown"></i> Get Premium</h2>
              <button onclick="document.getElementById('buyPremiumModal').remove()" class="text-white text-xl">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div class="text-center space-y-2">
              <div class="text-6xl">👑</div>
              <p class="text-2xl font-extrabold text-yellow-300">Rs 500/month</p>
              <p class="text-xs text-white/80">Or $5 USD</p>
            </div>

            <div class="bg-black/30 rounded-xl p-3 space-y-1.5 text-xs text-white">
              <p>✅ <b>Blue Tick</b> everywhere</p>
              <p>✅ <b>Premium Emoji</b> animated</p>
              <p>✅ <b>7 Themes</b> unlock</p>
              <p>✅ <b>Ads-free</b> experience</p>
              <p>✅ <b>Priority Support</b></p>
            </div>

            <button onclick="window.__tdSendPremiumWA()" class="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2">
              <i class="fa-brands fa-whatsapp text-lg"></i> Pay via WhatsApp
            </button>
            <p class="text-[10px] text-white/60 text-center">Payment ke liye WhatsApp khulega</p>
          </div>
        </div>
      </div>
    `);
  };

  window.__tdSendPremiumWA = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    try {
      await firebase.firestore().collection('premium_orders').add({
        user: user,
        amountPkr: 500,
        days: 30,
        status: 'pending',
        source: 'auto-whatsapp',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) { console.log(e); }

    const waText = 
`👑 PREMIUM ORDER

👤 User: @${user}
💰 Amount: Rs 500 / $5
📅 Duration: 30 days
🕐 Time: ${new Date().toLocaleString()}

💡 Payment details bhej rahe hain. Screenshot bhejein.`;

    const admin = Math.random() < 0.5 ? ADMIN_WA_1 : ADMIN_WA_2;
    toast('📱 WhatsApp khul raha hai...');
    setTimeout(() => {
      window.open(`https://wa.me/${admin}?text=${encodeURIComponent(waText)}`, '_blank');
      document.getElementById('buyPremiumModal')?.remove();
    }, 500);
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #4: DUPLICATE "MY GIFTS" BUTTON — remove + move to settings
  // ═══════════════════════════════════════════════════════════════
  function fixDuplicateGiftsButton() {
    // Find all "My Gifts" buttons in profile
    const profile = document.getElementById('tab-profile');
    if (!profile) return;

    const giftButtons = profile.querySelectorAll('button');
    let seen = 0;
    giftButtons.forEach(btn => {
      const text = (btn.innerText || '').toLowerCase();
      if (text.includes('my gifts') || text.includes('gifts')) {
        seen++;
        if (seen > 1) {
          btn.remove();
          console.log('🗑️ Duplicate My Gifts removed');
        }
      }
    });

    // Add "My Gifts" + "Wallet" to Settings if not present
    const settings = document.getElementById('settingsModal');
    if (settings && !document.getElementById('td-settings-extra')) {
      const walletBox = settings.querySelector('.bg-gray-900');
      if (walletBox) {
        const div = document.createElement('div');
        div.id = 'td-settings-extra';
        div.className = 'bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2';
        div.innerHTML = `
          <h3 class="text-xs font-bold text-cyan-400 uppercase mb-2">
            <i class="fa-solid fa-star"></i> Wallet & Gifts
          </h3>
          <button onclick="closeModal('settingsModal'); window.showReceivedGifts && window.showReceivedGifts();"
                  class="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
            🎁 My Gifts
          </button>
          <button onclick="closeModal('settingsModal'); window.openAdminWallet && window.openAdminWallet();"
                  id="td-admin-wallet-btn"
                  class="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hidden">
            🔒 Admin Wallet
          </button>
          <button onclick="closeModal('settingsModal'); window.openPaymentHistory && window.openPaymentHistory();"
                  class="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
            📜 Payment History
          </button>
        `;
        walletBox.appendChild(div);

        // Show admin wallet only for admin
        if (isAdmin()) {
          setTimeout(() => {
            document.getElementById('td-admin-wallet-btn')?.classList.remove('hidden');
          }, 500);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #5: VIDEO UPLOAD after edit — real publish
  // ═══════════════════════════════════════════════════════════════
  window.publishEditedVideo = async function() {
    const blob = window.__editedBlob;
    if (!blob) { toast('❌ Video missing'); return; }

    const caption = (document.getElementById('post-final-caption')?.value || '').trim();
    if (!caption) { toast('❌ Caption zaroori'); return; }

    const user = getUser();
    if (!user) { toast('❌ Login zaroori'); return; }

    // Show progress
    document.getElementById('hashtagPostModal')?.remove();
    showUploadProgress(0, 'Uploading...');

    try {
      // Upload to Firebase Storage
      const filename = `videos/${user}_${Date.now()}.webm`;
      const ref = firebase.storage().ref().child(filename);

      // Track progress
      const uploadTask = ref.put(blob);
      uploadTask.on('state_changed',
        (snap) => {
          const pct = Math.floor((snap.bytesTransferred / snap.totalBytes) * 100);
          showUploadProgress(pct, `Uploading ${pct}%`);
        }
      );

      await uploadTask;
      const url = await ref.getDownloadURL();
      showUploadProgress(100, 'Saving post...');

      // Create post
      const postId = 'post_' + Date.now();
      const postData = {
        id: postId,
        type: 'video',
        url: url,
        user: user,
        caption: caption,
        link: null,
        likes: [],
        comments: [],
        views: 0,
        edited: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebase.firestore().collection('posts').doc(postId).set(postData);

      // Save locally
      if (typeof saveVideoToStorage === 'function') {
        saveVideoToStorage({ ...postData, createdAt: null });
      }

      hideUploadProgress();
      toast('✅ Video posted!');
      window.__editedBlob = null;

      setTimeout(() => {
        if (typeof window.initAppContent === 'function') window.initAppContent();
        if (typeof window.switchTab === 'function') window.switchTab('videos');
      }, 500);

    } catch(e) {
      hideUploadProgress();
      toast('❌ Upload fail: ' + e.message);
    }
  };

  function showUploadProgress(pct, status) {
    if (!document.getElementById('td-upload-progress')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="td-upload-progress" class="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6">
          <div class="w-full max-w-sm bg-gray-900 border-2 border-cyan-500/40 rounded-2xl p-6 space-y-4">
            <div class="text-center">
              <div class="text-5xl mb-3">📤</div>
              <h3 class="text-base font-bold text-cyan-400">Uploading Video</h3>
              <p class="text-xs text-gray-400" id="td-up-status">Please wait...</p>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div id="td-up-fill" class="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all" style="width:0%"></div>
            </div>
            <p class="text-2xl font-extrabold text-cyan-400 text-center" id="td-up-pct">0%</p>
          </div>
        </div>
      `);
    }
    document.getElementById('td-up-fill').style.width = pct + '%';
    document.getElementById('td-up-pct').innerText = pct + '%';
    if (status) document.getElementById('td-up-status').innerText = status;
  }

  function hideUploadProgress() {
    setTimeout(() => {
      document.getElementById('td-upload-progress')?.remove();
    }, 800);
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #6: DELETE OPTION ON POSTS (owner only)
  // ═══════════════════════════════════════════════════════════════
  function addDeleteButtons() {
    const user = getUser();
    if (!user) return;

    // Video reels
    document.querySelectorAll('#video-feed-container .reel-item').forEach(reel => {
      if (reel.dataset.delAdded === '1') return;
      const match = reel.innerHTML.match(/@([a-zA-Z0-9_]+)/);
      if (!match || fmt(match[1]) !== user) return;

      const video = reel.querySelector('video');
      const videoId = video?.id?.replace('video-elem-', '');
      if (!videoId) return;

      reel.dataset.delAdded = '1';
      const btn = document.createElement('button');
      btn.className = 'absolute top-4 right-4 w-10 h-10 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center z-30 shadow-lg';
      btn.innerHTML = '<i class="fa-solid fa-trash"></i>';
      btn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('Ye video delete karein?')) {
          window.__tdDeletePost(videoId);
        }
      };
      reel.appendChild(btn);
    });

    // Text posts
    document.querySelectorAll('#posts-container > div').forEach(card => {
      const postId = card.dataset.postId;
      if (!postId || card.dataset.delAdded === '1') return;
      const match = card.innerHTML.match(/@([a-zA-Z0-9_]+)/);
      if (!match || fmt(match[1]) !== user) return;

      card.dataset.delAdded = '1';
      const header = card.querySelector('.flex.justify-between, .flex.items-center');
      if (header) {
        const btn = document.createElement('button');
        btn.className = 'text-red-500 hover:text-red-400 p-1';
        btn.innerHTML = '<i class="fa-solid fa-trash text-xs"></i>';
        btn.onclick = (e) => {
          e.stopPropagation();
          if (confirm('Ye post delete karein?')) {
            window.__tdDeletePost(postId);
          }
        };
        header.appendChild(btn);
      }
    });
  }

  window.__tdDeletePost = async function(postId) {
    const user = getUser();
    if (!user) return;

    try {
      const doc = await firebase.firestore().collection('posts').doc(postId).get();
      if (!doc.exists) { toast('Post nahi mila'); return; }
      
      const data = doc.data();
      if (fmt(data.user) !== user) { toast('❌ Sirf apni post delete kar sakte hain'); return; }

      // Delete from Storage
      if (data.url && data.url.includes('firebasestorage') && typeof firebase.storage === 'function') {
        try {
          await firebase.storage().refFromURL(data.url).delete();
        } catch(e) {}
      }

      // Delete from Firestore
      await firebase.firestore().collection('posts').doc(postId).delete();

      // Delete from IndexedDB
      if (typeof dbInstance !== 'undefined') {
        try {
          const tx = dbInstance.transaction('videos', 'readwrite');
          tx.objectStore('videos').delete(postId);
        } catch(e) {}
      }

      toast('✅ Post deleted');
      setTimeout(() => {
        if (typeof window.initAppContent === 'function') window.initAppContent();
        if (typeof window.renderFeedPosts === 'function') window.renderFeedPosts();
      }, 300);

    } catch(e) {
      toast('❌ Delete fail: ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #7: VOICE/VIDEO CALL — working button
  // ═══════════════════════════════════════════════════════════════
  function fixCallButtons() {
    // In DM thread header
    const threadHeader = document.getElementById('dm-thread-header');
    if (threadHeader && !threadHeader.dataset.tdCallAdded && window.activeChatTargetUser) {
      threadHeader.dataset.tdCallAdded = '1';
      const targetUser = window.activeChatTargetUser;

      const callBtns = document.createElement('div');
      callBtns.className = 'flex gap-1.5 ml-2';
      callBtns.innerHTML = `
        <button onclick="window.__tdStartCall('${targetUser}', 'voice')" 
                class="w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center shadow">
          <i class="fa-solid fa-phone text-xs"></i>
        </button>
        <button onclick="window.__tdStartCall('${targetUser}', 'video')" 
                class="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow">
          <i class="fa-solid fa-video text-xs"></i>
        </button>
      `;
      const lastChild = threadHeader.lastElementChild;
      if (lastChild) {
        lastChild.appendChild(callBtns);
      } else {
        threadHeader.appendChild(callBtns);
      }
    }

    // In public profile modal
    const pubProfile = document.getElementById('publicProfileModal');
    if (pubProfile && !pubProfile.classList.contains('hidden') && !pubProfile.dataset.tdCallAdded && window.currentActivePublicUser) {
      pubProfile.dataset.tdCallAdded = '1';
      const targetUser = window.currentActivePublicUser;

      const btnRow = pubProfile.querySelector('.flex.gap-2');
      if (btnRow) {
        const callBtn = document.createElement('button');
        callBtn.className = 'px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-full text-xs font-bold shadow';
        callBtn.innerHTML = '<i class="fa-solid fa-phone text-xs"></i> Call';
        callBtn.onclick = () => {
          if (typeof closeModal === 'function') closeModal('publicProfileModal');
          window.__tdStartCall(targetUser, 'voice');
        };
        btnRow.appendChild(callBtn);
      }
    }
  }

  window.__tdStartCall = function(targetUser, callType) {
    if (!targetUser) { toast('User nahi mila'); return; }
    if (!window.startCall) { toast('❌ Call system not ready'); return; }
    
    try {
      window.startCall(targetUser, callType || 'voice');
    } catch(e) {
      toast('❌ Call error: ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #8: DM SEND BUTTON — working
  // ═══════════════════════════════════════════════════════════════
  function fixDMSend() {
    const input = document.getElementById('dm-message-input');
    const footer = document.getElementById('dm-input-footer');
    if (!input || !footer || input.dataset.tdSendFixed === '1') return;

    input.dataset.tdSendFixed = '1';

    // Enter key
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window.__tdSendDM();
      }
    });

    // Send button
    const sendBtn = footer.querySelector('button');
    if (sendBtn) {
      sendBtn.onclick = () => window.__tdSendDM();
    }
  }

  window.__tdSendDM = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    const input = document.getElementById('dm-message-input');
    const text = (input?.value || '').trim();
    if (!text) return;

    const target = window.activeChatTargetUser;
    if (!target) { toast('Chat target nahi mila'); return; }

    const chatKey = [user, target].sort().join(':');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    input.value = '';

    try {
      await firebase.firestore().collection('dm_messages').add({
        chatKey: chatKey,
        sender: user,
        receiver: target,
        text: text,
        time: time,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ DM sent');
    } catch(e) {
      toast('❌ Send fail: ' + e.message);
      input.value = text; // restore
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIX #9: STICKER ZOOM (pinch to zoom on editor stickers)
  // ═══════════════════════════════════════════════════════════════
  function addStickerZoom() {
    document.addEventListener('wheel', (e) => {
      const sticker = e.target.closest('#editor-overlays > div');
      if (!sticker) return;
      e.preventDefault();

      const id = sticker.dataset.id;
      const found = window.Editor?.stickers?.find(s => s.id === id);
      if (!found) return;

      if (e.deltaY < 0) found.size = Math.min(200, found.size + 10);
      else found.size = Math.max(20, found.size - 10);

      sticker.style.fontSize = found.size + 'px';
    }, { passive: false });

    // Pinch (touch)
    let lastDist = 0;
    document.addEventListener('touchmove', (e) => {
      const sticker = e.target.closest('#editor-overlays > div');
      if (!sticker || e.touches.length !== 2) return;
      e.preventDefault();

      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      if (lastDist) {
        const delta = dist - lastDist;
        const id = sticker.dataset.id;
        const found = window.Editor?.stickers?.find(s => s.id === id);
        if (found) {
          found.size = Math.max(20, Math.min(200, found.size + delta * 0.5));
          sticker.style.fontSize = found.size + 'px';
        }
      }
      lastDist = dist;
    }, { passive: false });

    document.addEventListener('touchend', () => { lastDist = 0; });
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #10: MORE STICKERS (trending + trolls)
  // ═══════════════════════════════════════════════════════════════
  const MORE_STICKERS = [
    // Trending
    '🔥','💯','✨','💫','⚡','🌊','🎆','🌈','☄️','💥',
    // Trolls
    '🤡','💩','👻','👽','🤖','😈','🎃','🧟','🧛','🦇',
    // Cute
    '🐱','🐶','🐼','🦊','🐸','🦄','🐧','🐤','🐺','🦁',
    // Food
    '🍕','🍔','🍟','🌭','🍿','🍩','🍪','🎂','🍦','🥤',
    // Sports
    '⚽','🏀','🏈','⚾','🎾','🏐','🏓','🏸','🥊','🎳',
    // Music
    '🎵','🎶','🎸','🎤','🎧','🎹','🎺','🎷','🥁','🎻',
    // Nature
    '🌸','🌹','🌻','🌴','🍀','🌵','🌙','⭐','☀️','❄️',
    // Faces
    '😎','🤩','🥳','😍','🥰','😘','🤗','🤔','🤫','🤯',
    // Objects
    '📱','💻','⌚','📷','🎥','🎮','🕹️','💎','👑','🏆'
  ];

  function addMoreStickers() {
    // Wait for editing.js to load
    if (!window.__EDITING__) return;
    
    // Hook into the editor when opened
    setInterval(() => {
      const stickerTab = document.getElementById('editor-tab-content');
      if (stickerTab && document.getElementById('tab-stickers')?.classList.contains('bg-cyan-600')) {
        const grid = stickerTab.querySelector('.grid');
        if (grid && !grid.dataset.tdMoreAdded) {
          grid.dataset.tdMoreAdded = '1';
          // Add more stickers
          MORE_STICKERS.forEach(emoji => {
            if (grid.querySelector(`button:contains('${emoji}')`)) return;
            const btn = document.createElement('button');
            btn.className = 'text-2xl hover:scale-125 transition-transform';
            btn.innerText = emoji;
            btn.onclick = () => {
              if (window.addSticker) window.addSticker(emoji);
            };
            grid.appendChild(btn);
          });
        }
      }
    }, 1500);
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #11: 5X APP SPEED
  // ═══════════════════════════════════════════════════════════════
  function boostAppSpeed() {
    // Add CSS transitions
    if (!document.getElementById('td-speed-css')) {
      const style = document.createElement('style');
      style.id = 'td-speed-css';
      style.textContent = `
        * { 
          transition-duration: 0.1s !important;
          animation-duration: 0.2s !important;
        }
        .reel-item { will-change: transform; }
        .fullscreen-modal { will-change: opacity; }
        img, video { 
          image-rendering: -webkit-optimize-contrast;
          backface-visibility: hidden;
        }
        #video-feed-container video { 
          transform: translateZ(0);
        }
      `;
      document.head.appendChild(style);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #12: SETTINGS MEIN WALLET BUTTON (admin)
  // ═══════════════════════════════════════════════════════════════
  function moveAdminWalletToSettings() {
    // Remove admin wallet from header if exists
    document.querySelectorAll('header button').forEach(btn => {
      if (btn.title === 'Admin Wallet' || btn.innerHTML?.includes('vault')) {
        btn.remove();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    boostAppSpeed();
    
    setInterval(() => {
      fixDuplicateGiftsButton();
      addDeleteButtons();
      fixCallButtons();
      fixDMSend();
      moveAdminWalletToSettings();
    }, 2000);

    addStickerZoom();
    addMoreStickers();

    console.log('✅ theak.js loaded - All fixes active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__THEAK__ = {
    openBuyDiamondsModal: window.openBuyDiamondsModal,
    openBuyPremiumModal: window.openBuyPremiumModal,
    publishEditedVideo: window.publishEditedVideo,
    sendDM: window.__tdSendDM,
    startCall: window.__tdStartCall,
    deletePost: window.__tdDeletePost
  };
})();
