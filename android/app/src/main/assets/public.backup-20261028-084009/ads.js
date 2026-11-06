/* ═══════════════════════════════════════════════════════════════
   SUPER APP - SELF-SERVE AD SYSTEM (TikTok/FB style)
   Users diamonds se apni video/channel promote karein
   
   Add to index.html: <script src="ads.js" defer></script>
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
  function openM(id) { document.getElementById(id)?.classList.remove('hidden'); }
  function closeM(id) { document.getElementById(id)?.classList.add('hidden'); }

  // ═══════════════════════════════════════════════════════════════
  // AD PACKAGES (diamonds-based)
  // ═══════════════════════════════════════════════════════════════
  const AD_PACKAGES = [
    { id: 'bronze', name: '🥉 Bronze', diamonds: 100, views: 500, days: 1, color: 'amber' },
    { id: 'silver', name: '🥈 Silver', diamonds: 500, views: 3000, days: 3, color: 'gray' },
    { id: 'gold',   name: '🥇 Gold',   diamonds: 1500, views: 10000, days: 7, color: 'yellow' },
    { id: 'platinum', name: '💎 Platinum', diamonds: 3000, views: 25000, days: 14, color: 'cyan' },
    { id: 'diamond', name: '👑 Diamond', diamonds: 7000, views: 75000, days: 30, color: 'purple' }
  ];

  // ═══════════════════════════════════════════════════════════════
  // OPEN PROMOTE MODAL
  // ═══════════════════════════════════════════════════════════════
  window.openPromoteModal = function(prefillType, prefillId) {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    injectPromoteModalUI();

    // Reset
    document.getElementById('promote-content-type').value = prefillType || 'video';
    document.getElementById('promote-content-id').value = prefillId || '';
    document.getElementById('promote-title').value = '';
    document.getElementById('promote-desc').value = '';
    window.__selectedAdPkg = null;
    renderAdPackages();
    updatePromoteSubmitBtn();
    
    // Load user content for dropdown
    loadUserContentForPromote(prefillType || 'video');

    // Update diamonds display
    const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const userDiamonds = (users[user] || {}).diamonds || 0;
    const dEl = document.getElementById('promote-my-diamonds');
    if (dEl) dEl.innerText = userDiamonds;

    openM('promoteModal');
  };

  function injectPromoteModalUI() {
    if (document.getElementById('promoteModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="promoteModal" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[85] space-y-4">
        <div class="flex justify-between items-center border-b border-cyan-500/40 pb-3">
          <h2 class="text-base font-bold text-cyan-400 flex items-center gap-2">
            <i class="fa-solid fa-bullhorn"></i> Promote Content
          </h2>
          <button onclick="closeModal('promoteModal')" class="text-gray-400 text-xl">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Diamonds Balance -->
        <div class="bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p class="text-[10px] text-amber-300 uppercase font-bold">Your Balance</p>
            <p class="text-lg font-extrabold text-amber-400">💎 <span id="promote-my-diamonds">0</span></p>
          </div>
          <button onclick="closeModal('promoteModal'); typeof openBuyDiamondsModal === 'function' && openBuyDiamondsModal();" 
                  class="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold rounded-lg">
            <i class="fa-solid fa-plus"></i> Buy More
          </button>
        </div>

        <!-- Content Type -->
        <div>
          <label class="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">What to Promote?</label>
          <select id="promote-content-type" onchange="window.__onPromoteTypeChange()" 
                  class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white focus:outline-none">
            <option value="video">📹 My Video</option>
            <option value="channel">📢 My Channel</option>
            <option value="profile">👤 My Profile</option>
          </select>
        </div>

        <!-- Content ID Dropdown -->
        <div id="promote-content-picker">
          <label class="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Select Content</label>
          <select id="promote-content-id" 
                  class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white focus:outline-none">
            <option value="">-- Loading... --</option>
          </select>
        </div>

        <!-- Ad Title -->
        <div>
          <label class="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Ad Headline *</label>
          <input type="text" id="promote-title" maxlength="60" 
                 class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white focus:outline-none" 
                 placeholder="e.g. Best Forex Signals - Join Now!">
          <p class="text-[9px] text-gray-500 mt-1">Max 60 characters</p>
        </div>

        <!-- Ad Description -->
        <div>
          <label class="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Short Description</label>
          <textarea id="promote-desc" maxlength="120" rows="2"
                    class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white focus:outline-none" 
                    placeholder="Description (max 120 chars)"></textarea>
        </div>

        <!-- Package Selection -->
        <div>
          <label class="text-[10px] text-gray-400 uppercase tracking-wider block mb-2">Choose Package</label>
          <div id="ad-packages-grid" class="grid grid-cols-1 gap-2"></div>
        </div>

        <!-- Submit -->
        <button id="promote-submit-btn" onclick="window.__submitPromoteAd()" disabled
                class="w-full py-3 bg-gray-700 text-gray-500 font-bold text-xs rounded-xl cursor-not-allowed">
          <i class="fa-solid fa-bullhorn"></i> Select a package first
        </button>

        <!-- My Active Ads -->
        <div class="border-t border-gray-800 pt-3">
          <h3 class="text-xs font-bold text-cyan-400 uppercase mb-2 flex items-center gap-1.5">
            <i class="fa-solid fa-chart-line"></i> My Active Ads
          </h3>
          <div id="my-active-ads" class="space-y-2"></div>
        </div>
      </div>
    `);
  }

  function renderAdPackages() {
    const grid = document.getElementById('ad-packages-grid');
    if (!grid) return;
    grid.innerHTML = '';
    AD_PACKAGES.forEach(pkg => {
      const card = document.createElement('div');
      card.className = 'p-3 bg-gray-900 border-2 border-gray-800 rounded-xl cursor-pointer hover:border-cyan-500 transition-all';
      card.dataset.pkgId = pkg.id;
      card.onclick = () => selectAdPackage(pkg);
      card.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <p class="text-sm font-bold text-white">${pkg.name}</p>
            <p class="text-[10px] text-gray-400">${pkg.views.toLocaleString()} views • ${pkg.days} day${pkg.days > 1 ? 's' : ''}</p>
          </div>
          <div class="text-right">
            <p class="text-base font-extrabold text-amber-400">💎 ${pkg.diamonds.toLocaleString()}</p>
            <p class="text-[9px] text-gray-500">≈ Rs ${(pkg.diamonds * 28).toLocaleString()}</p>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function selectAdPackage(pkg) {
    window.__selectedAdPkg = pkg;
    document.querySelectorAll('#ad-packages-grid > div').forEach(el => {
      el.classList.remove('border-cyan-500', 'bg-cyan-900/20');
      el.classList.add('border-gray-800');
      if (el.dataset.pkgId === pkg.id) {
        el.classList.remove('border-gray-800');
        el.classList.add('border-cyan-500', 'bg-cyan-900/20');
      }
    });
    updatePromoteSubmitBtn();
  }

  function updatePromoteSubmitBtn() {
    const btn = document.getElementById('promote-submit-btn');
    if (!btn) return;
    const pkg = window.__selectedAdPkg;
    const title = document.getElementById('promote-title')?.value.trim();
    const contentId = document.getElementById('promote-content-id')?.value;
    
    if (pkg && title && contentId) {
      btn.disabled = false;
      btn.className = 'w-full py-3 btn-gradient text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg';
      btn.innerHTML = `<i class="fa-solid fa-bullhorn"></i> Pay 💎 ${pkg.diamonds} & Launch Ad`;
    } else {
      btn.disabled = true;
      btn.className = 'w-full py-3 bg-gray-700 text-gray-500 font-bold text-xs rounded-xl cursor-not-allowed';
      btn.innerHTML = '<i class="fa-solid fa-bullhorn"></i> Select package & fill title';
    }
  }

  // Track input changes
  document.addEventListener('input', (e) => {
    if (e.target && ['promote-title', 'promote-content-id'].includes(e.target.id)) {
      updatePromoteSubmitBtn();
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target && ['promote-title', 'promote-content-id'].includes(e.target.id)) {
      updatePromoteSubmitBtn();
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // LOAD USER CONTENT
  // ═══════════════════════════════════════════════════════════════
  async function loadUserContentForPromote(type) {
    const picker = document.getElementById('promote-content-id');
    if (!picker) return;
    picker.innerHTML = '<option value="">-- Loading... --</option>';
    const user = getUser();
    
    try {
      if (type === 'video') {
        const snap = await firebase.firestore().collection('posts')
          .where('user', '==', user).limit(50).get();
        picker.innerHTML = '<option value="">-- Select Video --</option>';
        let count = 0;
        snap.forEach(d => {
          const data = d.data();
          if (data.type === 'video' || data.url) {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.innerText = (data.caption || 'Video').substring(0, 40);
            picker.appendChild(opt);
            count++;
          }
        });
        if (count === 0) picker.innerHTML = '<option value="">No videos found</option>';
      } else if (type === 'channel') {
        const snap = await firebase.firestore().collection('channels')
          .where('owner', '==', user).limit(20).get();
        picker.innerHTML = '<option value="">-- Select Channel --</option>';
        let count = 0;
        snap.forEach(d => {
          const data = d.data();
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.innerText = data.name || d.id;
          picker.appendChild(opt);
          count++;
        });
        if (count === 0) picker.innerHTML = '<option value="">No channels found</option>';
      } else if (type === 'profile') {
        picker.innerHTML = `<option value="${user}">@${user} (Your Profile)</option>`;
      }
    } catch(e) {
      picker.innerHTML = '<option value="">Error loading</option>';
    }
  }

  window.__onPromoteTypeChange = function() {
    const type = document.getElementById('promote-content-type').value;
    loadUserContentForPromote(type);
  };

  // ═══════════════════════════════════════════════════════════════
  // SUBMIT AD
  // ═══════════════════════════════════════════════════════════════
  window.__submitPromoteAd = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }
    
    const pkg = window.__selectedAdPkg;
    const type = document.getElementById('promote-content-type').value;
    const contentId = document.getElementById('promote-content-id').value;
    const title = document.getElementById('promote-title').value.trim();
    const desc = document.getElementById('promote-desc').value.trim();
    
    if (!pkg) { toast('Package select karein'); return; }
    if (!title) { toast('Ad title likhein'); return; }
    if (!contentId) { toast('Content select karein'); return; }
    
    // Check diamonds
    const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
    const userData = users[user] || {};
    const diamonds = userData.diamonds || 0;
    
    if (diamonds < pkg.diamonds) {
      toast(`💎 Aapke paas ${diamonds} diamonds hain. ${pkg.diamonds} chahiye.`);
      return;
    }
    
    // Deduct diamonds
    users[user].diamonds = diamonds - pkg.diamonds;
    localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
    
    const adId = 'ad_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const expiresAt = new Date(Date.now() + pkg.days * 24 * 60 * 60 * 1000);
    
    const adData = {
      adId: adId,
      userId: user,
      type: type,         // video | channel | profile
      contentId: contentId,
      title: title,
      desc: desc,
      package: pkg.id,
      packageName: pkg.name,
      diamondsSpent: pkg.diamonds,
      viewsPurchased: pkg.views,
      viewsServed: 0,
      clicks: 0,
      days: pkg.days,
      active: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt)
    };
    
    try {
      await firebase.firestore().collection('user_ads').doc(adId).set(adData);
      await firebase.firestore().collection('users').doc(user).set({
        diamonds: users[user].diamonds
      }, { merge: true });
      
      // Update local wallet
      if (typeof window.updateWalletUI === 'function') window.updateWalletUI();
      
      toast(`✅ Ad launched! ${pkg.views.toLocaleString()} views ${pkg.days} din mein.`);
      closeModal('promoteModal');
      
      // Refresh feed to show new ad
      if (typeof window.renderVideoReels === 'function') {
        window.__reloadAdsIntoFeed();
      }
    } catch(e) {
      // Refund on error
      users[user].diamonds = diamonds;
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(users));
      toast('❌ Error: ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // DISPLAY ADS IN FEED (TikTok style - har 3-4 video ke baad)
  // ═══════════════════════════════════════════════════════════════
  
  let activeAds = [];
  
  async function loadActiveAds() {
    try {
      const now = new Date();
      const snap = await firebase.firestore().collection('user_ads')
        .where('active', '==', true)
        .limit(20).get();
      
      activeAds = [];
      snap.forEach(d => {
        const data = d.data();
        // Check expiry
        let expired = false;
        if (data.expiresAt && data.expiresAt.toDate) {
          if (data.expiresAt.toDate() < now) expired = true;
        }
        // Check views
        if (data.viewsServed >= data.viewsPurchased) expired = true;
        
        if (!expired) {
          activeAds.push({ id: d.id, ...data });
        }
      });
      
      // Sort by package priority (higher package = more likely to show)
      activeAds.sort((a, b) => {
        const pA = AD_PACKAGES.findIndex(p => p.id === a.package);
        const pB = AD_PACKAGES.findIndex(p => p.id === b.package);
        return pB - pA; // Higher package first
      });
      
      console.log('✅ Loaded', activeAds.length, 'active ads');
    } catch(e) {
      console.log('Ads load error:', e.message);
    }
  }
  
  // Reload ads into feed
  window.__reloadAdsIntoFeed = async function() {
    await loadActiveAds();
    injectAdsIntoFeed();
    injectAdsIntoChannelList();
  };

  // Inject ads into video feed
  function injectAdsIntoFeed() {
    const container = document.getElementById('video-feed-container');
    if (!container) return;
    
    // Remove existing ad reels
    container.querySelectorAll('[data-is-ad="1"]').forEach(el => el.remove());
    
    if (activeAds.length === 0) return;
    
    // Get all current reels (non-ad)
    const reels = Array.from(container.children).filter(el => el.dataset.isAd !== '1');
    if (reels.length < 2) return;
    
    // Insert ads every 3-4 reels
    let adIndex = 0;
    const interval = 3;
    
    for (let i = interval; i < reels.length + (adIndex * 0); i += interval + 1) {
      if (adIndex >= activeAds.length) break;
      
      const ad = activeAds[adIndex];
      const adReel = createAdReel(ad);
      
      const targetReel = reels[i];
      if (targetReel && targetReel.parentNode) {
        targetReel.parentNode.insertBefore(adReel, targetReel);
        adIndex++;
      }
    }
  }

  function createAdReel(ad) {
    const div = document.createElement('div');
    div.className = 'w-full h-full reel-item relative bg-black flex items-center justify-center overflow-hidden';
    div.dataset.isAd = '1';
    div.dataset.adId = ad.adId;
    
    // Track impression
    try {
      firebase.firestore().collection('user_ads').doc(ad.adId).update({
        viewsServed: firebase.firestore.FieldValue.increment(1)
      });
    } catch(e) {}
    
    // Determine content link
    let contentUrl = '#';
    let contentType = 'video';
    let mediaHtml = '';
    let linkHtml = '';
    
    if (ad.type === 'video') {
      // Load video post
      getVideosFromStorageLocal((vids) => {
        const v = vids.find(x => x.id === ad.contentId);
        if (v && v.url) {
          div.innerHTML = `
            <video src="${v.url}" class="w-full h-full object-cover" loop playsinline muted autoplay preload="metadata"></video>
            ${generateAdOverlayHTML(ad, 'video')}
          `;
        } else {
          div.innerHTML = generateFallbackAdHTML(ad);
        }
      });
      return div;
    } else if (ad.type === 'channel') {
      // Show channel ad
      div.innerHTML = generateChannelAdHTML(ad);
      return div;
    } else if (ad.type === 'profile') {
      div.innerHTML = generateProfileAdHTML(ad);
      return div;
    }
    
    return div;
  }

  function generateAdOverlayHTML(ad, kind) {
    const user = fmt(ad.userId);
    return `
      <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none"></div>
      
      <!-- AD LABEL TOP LEFT -->
      <div class="absolute top-3 left-3 flex items-center gap-2 z-30">
        <span class="bg-yellow-500 text-black text-[9px] font-extrabold px-2 py-1 rounded uppercase tracking-wider">Ad</span>
        <span class="bg-black/50 text-white text-[9px] font-semibold px-2 py-1 rounded">Sponsored</span>
      </div>
      
      <!-- CTA -->
      <div class="absolute bottom-24 left-3 right-3 z-30 text-center">
        <p class="text-white text-sm font-bold mb-1">${ad.title}</p>
        ${ad.desc ? `<p class="text-gray-300 text-[11px] mb-3">${ad.desc}</p>` : ''}
        <button onclick="window.__clickAd('${ad.adId}')" 
                class="px-6 py-2.5 btn-gradient text-white font-bold text-xs rounded-full shadow-2xl">
          Learn More →
        </button>
      </div>
      
      <!-- Brand -->
      <div class="absolute bottom-6 left-3 flex items-center gap-2 z-30">
        <img src="${getUserAvatar(user)}" class="w-8 h-8 rounded-full border-2 border-yellow-400">
        <div>
          <p class="text-white text-xs font-bold">@${user} ${tickHTML(user)}</p>
          <p class="text-yellow-300 text-[9px] font-bold">📢 Sponsored Content</p>
        </div>
      </div>
    `;
  }

  function generateChannelAdHTML(ad) {
    const user = fmt(ad.userId);
    return `
      <div class="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 flex flex-col items-center justify-center p-6 text-center">
        <span class="bg-yellow-500 text-black text-[9px] font-extrabold px-2 py-1 rounded uppercase absolute top-4 left-4">Ad</span>
        <div class="text-6xl mb-4">📢</div>
        <h2 class="text-2xl font-extrabold text-white mb-2">${ad.title}</h2>
        <p class="text-sm text-gray-200 mb-6 max-w-xs">${ad.desc || 'Join this channel now!'}</p>
        <button onclick="window.__clickAd('${ad.adId}', '${ad.contentId}')" 
                class="px-8 py-3 btn-gradient text-white font-bold text-sm rounded-full shadow-2xl">
          Join Channel →
        </button>
        <p class="text-yellow-300 text-[10px] font-bold mt-4">Sponsored by @${user}</p>
      </div>
    `;
  }

  function generateProfileAdHTML(ad) {
    const user = fmt(ad.userId);
    return `
      <div class="absolute inset-0 bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-6 text-center">
        <span class="bg-yellow-500 text-black text-[9px] font-extrabold px-2 py-1 rounded uppercase absolute top-4 left-4">Ad</span>
        <img src="${getUserAvatar(user)}" class="w-24 h-24 rounded-full border-4 border-cyan-400 mb-4">
        <h2 class="text-xl font-extrabold text-white">${ad.title}</h2>
        <p class="text-sm text-gray-200 mt-2 mb-6">${ad.desc || ''}</p>
        <button onclick="window.__clickAd('${ad.adId}', '@${user}')" 
                class="px-6 py-3 btn-gradient text-white font-bold text-sm rounded-full shadow-2xl">
          View Profile →
        </button>
        <p class="text-yellow-300 text-[10px] font-bold mt-4">Sponsored</p>
      </div>
    `;
  }

  function generateFallbackAdHTML(ad) {
    return `
      <div class="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <span class="bg-yellow-500 text-black text-[9px] font-extrabold px-2 py-1 rounded uppercase absolute top-4 left-4">Ad</span>
        <div class="text-5xl mb-4">📢</div>
        <h2 class="text-xl font-extrabold text-white mb-2">${ad.title}</h2>
        <p class="text-sm text-gray-300 mb-4">${ad.desc || ''}</p>
      </div>
    `;
  }

  function getUserAvatar(user) {
    try {
      const users = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      return (users[user] || {}).avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user}`;
    } catch(e) {
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${user}`;
    }
  }

  function getVideosFromStorageLocal(cb) {
    if (typeof window.getVideosFromStorage === 'function') {
      window.getVideosFromStorage(cb);
    } else {
      cb([]);
    }
  }

  // Click handler - opens content
  window.__clickAd = function(adId, contentTarget) {
    // Track click
    try {
      firebase.firestore().collection('user_ads').doc(adId).update({
        clicks: firebase.firestore.FieldValue.increment(1)
      });
    } catch(e) {}
    
    // Navigate
    if (contentTarget && contentTarget.startsWith('@')) {
      const user = contentTarget.substring(1);
      if (typeof window.openPublicUserProfileModal === 'function') {
        window.openPublicUserProfileModal(user);
      }
    } else if (contentTarget) {
      // Channel or video
      if (typeof window.openChannelConversation === 'function' && contentTarget.startsWith('chan_')) {
        window.openChannelConversation(contentTarget);
      }
    }
    toast('🔗 Ad clicked');
  };

  // ═══════════════════════════════════════════════════════════════
  // INJECT ADS IN CHANNEL LIST
  // ═══════════════════════════════════════════════════════════════
  function injectAdsIntoChannelList() {
    const inbox = document.getElementById('dm-inbox-view');
    if (!inbox) return;
    
    // Remove existing ad items
    inbox.querySelectorAll('[data-is-ad="1"]').forEach(el => el.remove());
    
    if (activeAds.length === 0) return;
    
    // Filter channel ads
    const channelAds = activeAds.filter(ad => ad.type === 'channel' || ad.type === 'profile').slice(0, 2);
    
    channelAds.forEach((ad, idx) => {
      const div = document.createElement('div');
      div.dataset.isAd = '1';
      div.className = 'p-3 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-2 border-yellow-500/50 rounded-xl flex items-center gap-3 cursor-pointer relative';
      div.onclick = () => window.__clickAd(ad.adId, ad.type === 'profile' ? '@' + ad.userId : ad.contentId);
      
      div.innerHTML = `
        <span class="absolute -top-2 right-2 bg-yellow-500 text-black text-[8px] font-extrabold px-2 py-0.5 rounded uppercase">Ad</span>
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-bullhorn text-white"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-yellow-300 truncate">${ad.title}</p>
          <p class="text-[10px] text-gray-400 truncate">${ad.desc || 'Sponsored'}</p>
        </div>
        <i class="fa-solid fa-chevron-right text-yellow-400 text-xs"></i>
      `;
      
      if (idx === 0) inbox.insertBefore(div, inbox.firstChild);
      else {
        const children = inbox.children;
        if (children.length > 2) inbox.insertBefore(div, children[2]);
        else inbox.appendChild(div);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // INJECT "PROMOTE" BUTTON IN SETTINGS
  // ═══════════════════════════════════════════════════════════════
  function injectPromoteButtonInSettings() {
    const settingsModal = document.getElementById('settingsModal');
    if (!settingsModal || document.getElementById('settings-promote-section')) return;
    
    const walletBox = settingsModal.querySelector('.bg-gray-900');
    if (!walletBox) return;
    
    const div = document.createElement('div');
    div.id = 'settings-promote-section';
    div.className = 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-2 border-yellow-500/40 rounded-xl p-4 space-y-2';
    div.innerHTML = `
      <h3 class="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1.5 mb-2">
        <i class="fa-solid fa-bullhorn"></i> Promote Your Content
      </h3>
      <p class="text-[10px] text-gray-300 mb-3">Diamonds se apni videos, channels, ya profile ko sabke pas dikhayein — TikTok/FB jaisa ad system!</p>
      <button onclick="closeModal('settingsModal'); window.openPromoteModal();" 
              class="w-full py-2.5 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
        <i class="fa-solid fa-rocket"></i> Launch Ad Now
      </button>
      <button onclick="closeModal('settingsModal'); window.openMyAdsModal();" 
              class="w-full py-2 bg-gray-800 border border-yellow-500/40 text-yellow-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
        <i class="fa-solid fa-chart-line"></i> My Ads & Analytics
      </button>
    `;
    walletBox.parentNode.insertBefore(div, walletBox.nextSibling);
  }

  // ═══════════════════════════════════════════════════════════════
  // MY ADS ANALYTICS MODAL
  // ═══════════════════════════════════════════════════════════════
  window.openMyAdsModal = async function() {
    if (!document.getElementById('myAdsModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="myAdsModal" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[85] space-y-4">
          <div class="flex justify-between items-center border-b border-yellow-500/40 pb-3">
            <h2 class="text-base font-bold text-yellow-400"><i class="fa-solid fa-chart-line"></i> My Ads</h2>
            <button onclick="closeModal('myAdsModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="my-ads-list" class="space-y-3"></div>
        </div>
      `);
    }
    openM('myAdsModal');
    await loadMyAds();
  };

  async function loadMyAds() {
    const list = document.getElementById('my-ads-list');
    if (!list) return;
    list.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Loading...</p>';
    
    const user = getUser();
    if (!user) return;
    
    try {
      const snap = await firebase.firestore().collection('user_ads')
        .where('userId', '==', user)
        .limit(50).get();
      
      list.innerHTML = '';
      if (snap.empty) {
        list.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">Aapne abhi tak koi ad nahi banaya</p>';
        return;
      }
      
      const ads = [];
      snap.forEach(d => ads.push({ id: d.id, ...d.data() }));
      ads.sort((a, b) => {
        const ta = a.createdAt ? a.createdAt.toMillis() : 0;
        const tb = b.createdAt ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });
      
      ads.forEach(ad => {
        const card = document.createElement('div');
        const progress = ad.viewsPurchased > 0 ? Math.min(100, Math.round((ad.viewsServed / ad.viewsPurchased) * 100)) : 0;
        const isActive = ad.active && progress < 100;
        
        card.className = `bg-gray-900 border-2 ${isActive ? 'border-green-500/40' : 'border-gray-800'} rounded-xl p-4 space-y-2`;
        card.innerHTML = `
          <div class="flex justify-between items-start">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold text-white truncate">${ad.title}</p>
              <p class="text-[10px] text-gray-400">${ad.packageName || ad.package} • ${ad.type}</p>
            </div>
            <span class="text-[9px] px-2 py-1 rounded-full font-bold ${isActive ? 'bg-green-600/20 text-green-400 border border-green-500/40' : 'bg-gray-700 text-gray-400'}">
              ${isActive ? '● ACTIVE' : '○ ENDED'}
            </span>
          </div>
          
          <div class="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div class="bg-gray-800 rounded-lg p-2">
              <p class="text-gray-400">Views</p>
              <p class="text-cyan-400 font-bold">${(ad.viewsServed || 0).toLocaleString()}</p>
            </div>
            <div class="bg-gray-800 rounded-lg p-2">
              <p class="text-gray-400">Clicks</p>
              <p class="text-amber-400 font-bold">${(ad.clicks || 0).toLocaleString()}</p>
            </div>
            <div class="bg-gray-800 rounded-lg p-2">
              <p class="text-gray-400">Spent</p>
              <p class="text-amber-400 font-bold">💎 ${ad.diamondsSpent}</p>
            </div>
          </div>
          
          <div class="space-y-1">
            <div class="flex justify-between text-[9px] text-gray-400">
              <span>Progress</span>
              <span>${progress}%</span>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div class="bg-gradient-to-r from-cyan-500 to-green-500 h-full transition-all" style="width:${progress}%"></div>
            </div>
          </div>
          
          ${isActive ? `
            <button onclick="window.__stopAd('${ad.id}')" 
                    class="w-full py-2 bg-red-950/80 border border-red-500/40 text-red-400 rounded-lg text-[10px] font-bold">
              <i class="fa-solid fa-stop"></i> Stop Ad
            </button>
          ` : ''}
        `;
        list.appendChild(card);
      });
    } catch(e) {
      list.innerHTML = `<p class="text-xs text-red-400 text-center py-4">Error: ${e.message}</p>`;
    }
  }

  window.__stopAd = async function(adId) {
    if (!confirm('Ad band karein? Remaining views refund nahi honge.')) return;
    try {
      await firebase.firestore().collection('user_ads').doc(adId).update({ active: false });
      toast('✅ Ad stopped');
      loadMyAds();
    } catch(e) { toast('Error: ' + e.message); }
  };

  // ═══════════════════════════════════════════════════════════════
  // REAL WITHDRAWAL/DEPOSIT WITH RECAPTCHA
  // ═══════════════════════════════════════════════════════════════
  
  function enhancePaymentWithRecaptcha() {
    const withdrawBtn = document.querySelector('#paymentModal button[onclick*="processWithdrawalSubmit"]');
    if (!withdrawBtn || withdrawBtn.dataset.recaptchaEnhanced === '1') return;
    withdrawBtn.dataset.recaptchaEnhanced = '1';
    
    // Wrap submit function to check recaptcha
    const original = window.processWithdrawalSubmit;
    if (typeof original === 'function' && !original.__recaptchaWrapped) {
      window.processWithdrawalSubmit = function(...args) {
        // Check recaptcha
        const recaptchaResponse = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : null;
        
        if (!recaptchaResponse) {
          toast('⚠️ Please complete reCAPTCHA first');
          // Highlight recaptcha
          const rc = document.querySelector('.g-recaptcha');
          if (rc) {
            rc.scrollIntoView({ behavior: 'smooth', block: 'center' });
            rc.style.animation = 'pulse 1s 3';
          }
          return;
        }
        
        // Call original
        original.apply(this, args);
        
        // Reset recaptcha after 1s
        setTimeout(() => {
          if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
        }, 1500);
      };
      window.processWithdrawalSubmit.__recaptchaWrapped = true;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO-INIT
  // ═══════════════════════════════════════════════════════════════
  
  function init() {
    // Load ads after Firebase ready
    setTimeout(async () => {
      await loadActiveAds();
      injectAdsIntoFeed();
      injectAdsIntoChannelList();
    }, 4000);
    
    // Refresh ads every 30 seconds
    setInterval(async () => {
      await loadActiveAds();
    }, 30000);
    
    // Re-inject on tab change
    setInterval(() => {
      if (!document.getElementById('tab-videos').classList.contains('hidden')) {
        injectAdsIntoFeed();
      }
      if (!document.getElementById('dmModal').classList.contains('hidden')) {
        injectAdsIntoChannelList();
      }
    }, 5000);
    
    // Inject promote button
    setInterval(() => {
      injectPromoteButtonInSettings();
      enhancePaymentWithRecaptcha();
    }, 2000);
    
    console.log('✅ ads.js loaded - Self-serve ad system active');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export to window
  window.__ADS_SYSTEM__ = {
    loadActiveAds,
    AD_PACKAGES
  };
})();
