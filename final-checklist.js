/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - FINAL-CHECKLIST.JS
   Play Store launch se pehle saara check
   Add: <script src="final-checklist.js" defer></script>
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
  function isAdmin() { return ['muhammadumar45212h', 'Umar', 'admin'].includes((localStorage.getItem('SUPER_APP_CURRENT_USER') || '').replace(/^@+/, '').split('@')[0]); }

  // ═══════════════════════════════════════════════════════════════
  // PLAY STORE METADATA (Copy-Paste Ready)
  // ═══════════════════════════════════════════════════════════════
  const STORE_DATA = {
    title: 'Super Sphere - Live, Trade & Earn',
    shortDescription: 'Video reels, live streaming, gifts, trading charts, DM, and real earning — all in one app.',
    fullDescription: `Super Sphere is a complete social + earning platform with everything you need in one app.

🎥 VIDEO REELS
• TikTok-style vertical scroll feed
• Like, comment, share videos
• Upload your own videos with progress
• Real-time sync — sab users ko turant dikhta hai

🔴 LIVE STREAMING
• Solo live stream
• 2-Player PK Match live (WebRTC)
• Real-time comments during live
• Gift sending with flying animations
• Live viewer count

🎁 REAL GIFT STORE
• 25+ gifts (Flower, Rose, Lion, Rocket, Diamond)
• Diamonds-based gift sending
• 70% earnings to receivers
• Received gifts history

📈 TRADING CHARTS
• Live XAUUSD, BTCUSD, EURUSD charts
• Real-time market data
• Educational analysis only (no real trading)

💬 SOCIAL FEATURES
• Direct Messages (real-time)
• Telegram-style Channels (public/private)
• Comments (real-time)
• Follow / Subscribe system
• Search users, videos, hashtags

💰 EARNING SYSTEM
• Diamonds from gifts
• 30% revenue share on 5,000+ views
• Referral program (40% commission)
• Real withdrawal via Easypaisa/JazzCash/SadaPay
• KYC verification for security

👑 PREMIUM
• Blue tick verification (TikTok-style)
• 7 exclusive themes (Cyberpunk, Sunset, Ocean, Galaxy)
• Animated premium emojis
• Ad-free experience
• Priority support

🔧 EXTRA FEATURES
• Termux Code Runner (Python + JavaScript)
• Real-time notifications
• Custom themes & colors
• Screenshot protection
• Private profile mode

⚠️ IMPORTANT
• Trading charts are for educational analysis only
• No financial advice provided
• Age 18+ recommended for earning features
• KYC required for withdrawals

📞 Support: 03089775764
🌐 Website: umar-super-app.vercel.app

Super Sphere — Sab kuch ek app mein! 🚀`,
    category: 'Social',
    contentRating: '18+',
    tags: ['social', 'video', 'live streaming', 'trading', 'earning', 'chat', 'gifts']
  };

  // ═══════════════════════════════════════════════════════════════
  // PRIVACY POLICY (Full Text)
  // ═══════════════════════════════════════════════════════════════
  const PRIVACY_POLICY = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Privacy Policy - Super Sphere</title>
<style>body{font-family:Arial;max-width:800px;margin:40px auto;padding:20px;line-height:1.6;color:#333}h1{color:#00f2fe}h2{color:#111;margin-top:30px}</style></head>
<body>
<h1>Privacy Policy</h1>
<p><b>Last Updated:</b> ${new Date().toLocaleDateString()}</p>
<p>Super Sphere ("we", "our", "us") respects your privacy. This policy explains how we collect, use, and protect your information.</p>

<h2>1. Information We Collect</h2>
<ul>
<li>Username, password (encrypted)</li>
<li>Phone number, email (optional)</li>
<li>Profile photo, bio</li>
<li>Posts, videos, messages</li>
<li>Device info, IP address</li>
<li>KYC documents (CNIC, selfie) for withdrawals</li>
</ul>

<h2>2. How We Use Your Data</h2>
<ul>
<li>Provide app services</li>
<li>Process payments and withdrawals</li>
<li>Show relevant ads (AdMob)</li>
<li>Prevent fraud and abuse</li>
<li>Improve app features</li>
</ul>

<h2>3. Data Sharing</h2>
<p>We do not sell your data. We share only with:</p>
<ul>
<li>Firebase (database) — Google</li>
<li>AdMob (advertising) — Google</li>
<li>Payment processors (Easypaisa, JazzCash, SadaPay)</li>
<li>Legal authorities (when required by law)</li>
</ul>

<h2>4. Data Security</h2>
<p>Your data is stored on Firebase (Google Cloud) with encryption. We use HTTPS for all connections. Passwords are hashed and never stored in plain text.</p>

<h2>5. Children's Privacy</h2>
<p>This app is not for users under 13. Earning features require users to be 18+.</p>

<h2>6. Your Rights</h2>
<ul>
<li>Access your data anytime</li>
<li>Delete your account (30 days processing)</li>
<li>Opt out of marketing emails</li>
<li>Request data export</li>
</ul>

<h2>7. Cookies</h2>
<p>We use cookies for login sessions and analytics. You can disable cookies in browser settings.</p>

<h2>8. Third-Party Services</h2>
<ul>
<li>Google Firebase — firebase.google.com/privacy</li>
<li>Google AdMob — policies.google.com/privacy</li>
</ul>

<h2>9. Contact</h2>
<p>Email: support@supersphere.app<br>WhatsApp: 03089775764</p>

<h2>10. Changes</h2>
<p>We may update this policy. Continued use = acceptance of new terms.</p>

<p style="margin-top:40px;color:#666;font-size:12px">© ${new Date().getFullYear()} Super Sphere. All rights reserved.</p>
</body></html>`;

  // ═══════════════════════════════════════════════════════════════
  // TERMS OF SERVICE
  // ═══════════════════════════════════════════════════════════════
  const TERMS = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Terms of Service - Super Sphere</title>
<style>body{font-family:Arial;max-width:800px;margin:40px auto;padding:20px;line-height:1.6;color:#333}h1{color:#00f2fe}h2{color:#111;margin-top:30px}</style></head>
<body>
<h1>Terms of Service</h1>
<p><b>Last Updated:</b> ${new Date().toLocaleDateString()}</p>

<h2>1. Acceptance</h2>
<p>By using Super Sphere, you agree to these terms. If you disagree, please don't use the app.</p>

<h2>2. Account</h2>
<ul>
<li>You must be 13+ to use this app</li>
<li>Earning features require 18+</li>
<li>One account per person</li>
<li>You are responsible for your password</li>
</ul>

<h2>3. Content Rules</h2>
<p>Do NOT post:</p>
<ul>
<li>Illegal content</li>
<li>Nudity or sexual content</li>
<li>Violence or hate speech</li>
<li>Spam or misleading info</li>
<li>Copyrighted material without permission</li>
<li>Fake news or misinformation</li>
</ul>

<h2>4. Reporting & Bans</h2>
<ul>
<li>Users can report content</li>
<li>5 reports = automatic ban</li>
<li>False reports = your account may be banned</li>
<li>Banned users cannot create new accounts</li>
</ul>

<h2>5. Earning & Payments</h2>
<ul>
<li>Diamonds earned from gifts</li>
<li>30% revenue share at 5,000+ views</li>
<li>Withdrawals require KYC (CNIC)</li>
<li>Minimum withdrawal: Rs 500</li>
<li>Processing time: 24-48 hours</li>
<li>We reserve right to reject suspicious transactions</li>
</ul>

<h2>6. Premium Subscription</h2>
<ul>
<li>Rs 500/month or $5 USD</li>
<li>Auto-renews monthly</li>
<li>Cancel anytime</li>
<li>No refunds after activation</li>
</ul>

<h2>7. Trading Charts Disclaimer</h2>
<p>Trading charts are for EDUCATIONAL purposes only. We do NOT provide financial advice. Any trading decisions are your own responsibility. We are not liable for any losses.</p>

<h2>8. Termination</h2>
<p>We may terminate accounts that violate these terms without warning.</p>

<h2>9. Limitation of Liability</h2>
<p>Super Sphere is provided "as is". We are not liable for service interruptions, data loss, or third-party actions.</p>

<h2>10. Changes</h2>
<p>We may update these terms. Continued use = acceptance.</p>

<h2>11. Governing Law</h2>
<p>These terms are governed by the laws of Pakistan.</p>

<h2>12. Contact</h2>
<p>Email: support@supersphere.app<br>WhatsApp: 03089775764</p>

<p style="margin-top:40px;color:#666;font-size:12px">© ${new Date().getFullYear()} Super Sphere. All rights reserved.</p>
</body></html>`;

  // ═══════════════════════════════════════════════════════════════
  // OPEN CHECKLIST MODAL
  // ═══════════════════════════════════════════════════════════════
  window.openFinalChecklist = function() {
    if (!isAdmin()) { toast('Admin access only'); return; }

    if (!document.getElementById('finalChecklistModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="finalChecklistModal" class="fullscreen-modal hidden p-4 overflow-y-auto no-scrollbar z-[95] space-y-4">
          <div class="flex justify-between items-center border-b border-green-500/40 pb-3 sticky top-0 bg-gray-950 z-10">
            <h2 class="text-base font-bold text-green-400"><i class="fa-solid fa-rocket"></i> Launch Checklist</h2>
            <button onclick="closeModal('finalChecklistModal')" class="text-gray-400 text-xl"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div id="cl-progress" class="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-2 border-green-500/50 rounded-2xl p-4 text-center">
            <p class="text-[10px] text-green-300 uppercase font-bold">Launch Progress</p>
            <p class="text-3xl font-extrabold text-green-400" id="cl-percent">0%</p>
            <div class="w-full bg-gray-800 rounded-full h-2 mt-2 overflow-hidden">
              <div id="cl-bar" class="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all" style="width:0%"></div>
            </div>
          </div>

          <div class="flex gap-2 text-[10px]">
            <button onclick="window.__clTab('checklist')" id="cl-tab-checklist" class="flex-1 py-2 rounded-lg bg-green-600 text-white font-bold">✅ Checklist</button>
            <button onclick="window.__clTab('store')" id="cl-tab-store" class="flex-1 py-2 rounded-lg text-gray-400 font-bold">📱 Store Data</button>
            <button onclick="window.__clTab('legal')" id="cl-tab-legal" class="flex-1 py-2 rounded-lg text-gray-400 font-bold">⚖️ Legal</button>
            <button onclick="window.__clTab('icon')" id="cl-tab-icon" class="flex-1 py-2 rounded-lg text-gray-400 font-bold">🎨 Icon</button>
          </div>

          <div id="cl-content" class="space-y-3"></div>
        </div>
      `);
    }
    if (typeof openModal === 'function') openModal('finalChecklistModal');
    window.__clTab('checklist');
  };

  window.__clTab = function(tab) {
    ['checklist', 'store', 'legal', 'icon'].forEach(t => {
      const btn = document.getElementById('cl-tab-' + t);
      if (btn) btn.className = `flex-1 py-2 rounded-lg ${t === tab ? 'bg-green-600 text-white' : 'text-gray-400'} font-bold`;
    });

    const content = document.getElementById('cl-content');
    content.innerHTML = '';

    if (tab === 'checklist') renderChecklist(content);
    if (tab === 'store') renderStoreData(content);
    if (tab === 'legal') renderLegal(content);
    if (tab === 'icon') renderIconHelper(content);
  };

  // ═══════════════════════════════════════════════════════════════
  // CHECKLIST
  // ═══════════════════════════════════════════════════════════════
  function renderChecklist(container) {
    const items = [
      { id: 'files', text: 'Saari JS files index.html mein add', done: true },
      { id: 'storage', text: 'Firebase Storage Rules update', done: false },
      { id: 'index', text: 'Firebase Indexes (5) create', done: false },
      { id: 'apk', text: 'APK build (GitHub Actions)', done: false },
      { id: 'test', text: '2-phone test passed', done: false },
      { id: 'playacc', text: 'Play Store Developer Account ($25)', done: false },
      { id: 'listing', text: 'Store listing (title + description)', done: false },
      { id: 'icon', text: 'App Icon 512x512 upload', done: false },
      { id: 'graphic', text: 'Feature Graphic 1024x500', done: false },
      { id: 'screens', text: 'Screenshots (5-8) upload', done: false },
      { id: 'privacy', text: 'Privacy Policy URL live', done: false },
      { id: 'rating', text: 'Content Rating form filled', done: false },
      { id: 'admob', text: 'AdMob IDs in admob.js', done: false },
      { id: 'submit', text: 'Submit for review', done: false }
    ];

    let completed = items.filter(i => i.done).length;
    const pct = Math.round((completed / items.length) * 100);
    document.getElementById('cl-percent').innerText = pct + '%';
    document.getElementById('cl-bar').style.width = pct + '%';

    items.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = `p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer ${item.done ? 'bg-green-900/20 border-green-500/40' : 'bg-gray-900 border-gray-800'}`;
      div.onclick = () => toggleItem(item.id);
      div.innerHTML = `
        <div class="w-6 h-6 rounded-full ${item.done ? 'bg-green-500 text-white' : 'bg-gray-800 border border-gray-600'} flex items-center justify-center text-xs">
          ${item.done ? '✓' : (idx + 1)}
        </div>
        <p class="text-xs ${item.done ? 'text-green-400 line-through' : 'text-white'} font-semibold flex-1">${item.text}</p>
      `;
      container.appendChild(div);
    });

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'w-full py-2 bg-gray-800 text-gray-400 text-xs font-bold rounded-xl mt-2';
    resetBtn.innerText = '🔄 Reset Checklist';
    resetBtn.onclick = () => {
      localStorage.removeItem('SPHERE_CHECKLIST');
      renderChecklist(container);
    };
    container.appendChild(resetBtn);
  }

  function toggleItem(id) {
    let saved = JSON.parse(localStorage.getItem('SPHERE_CHECKLIST') || '{}');
    saved[id] = !saved[id];
    localStorage.setItem('SPHERE_CHECKLIST', JSON.stringify(saved));
    window.__clTab('checklist');
  }

  // ═══════════════════════════════════════════════════════════════
  // STORE DATA (Copy buttons)
  // ═══════════════════════════════════════════════════════════════
  function renderStoreData(container) {
    const fields = [
      { label: 'App Title', value: STORE_DATA.title },
      { label: 'Short Description', value: STORE_DATA.shortDescription },
      { label: 'Full Description', value: STORE_DATA.fullDescription },
      { label: 'Category', value: STORE_DATA.category },
      { label: 'Content Rating', value: STORE_DATA.contentRating },
      { label: 'Tags', value: STORE_DATA.tags.join(', ') }
    ];

    fields.forEach(f => {
      const div = document.createElement('div');
      div.className = 'bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2';
      div.innerHTML = `
        <div class="flex justify-between items-center">
          <p class="text-[10px] text-cyan-400 uppercase font-bold">${f.label}</p>
          <button class="text-cyan-400 text-xs copy-btn"><i class="fa-solid fa-copy"></i> Copy</button>
        </div>
        <p class="text-xs text-gray-200 whitespace-pre-wrap">${f.value}</p>
      `;
      div.querySelector('.copy-btn').onclick = () => {
        navigator.clipboard.writeText(f.value);
        toast('✅ Copied: ' + f.label);
      };
      container.appendChild(div);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // LEGAL (Download privacy.html + terms.html)
  // ═══════════════════════════════════════════════════════════════
  function renderLegal(container) {
    const info = document.createElement('div');
    info.className = 'bg-amber-900/20 border border-amber-500/40 rounded-xl p-3';
    info.innerHTML = `
      <p class="text-[11px] text-amber-300 font-bold mb-1">📌 Play Store ke liye zaroori</p>
      <p class="text-[10px] text-gray-300">Privacy Policy URL chahiye. Ye 2 files download karein aur Vercel pe upload karein.</p>
    `;
    container.appendChild(info);

    // Privacy download
    const btn1 = document.createElement('button');
    btn1.className = 'w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs rounded-xl';
    btn1.innerHTML = '<i class="fa-solid fa-download"></i> Download privacy.html';
    btn1.onclick = () => downloadHTML(PRIVACY_POLICY, 'privacy.html');
    container.appendChild(btn1);

    // Terms download
    const btn2 = document.createElement('button');
    btn2.className = 'w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs rounded-xl';
    btn2.innerHTML = '<i class="fa-solid fa-download"></i> Download terms.html';
    btn2.onclick = () => downloadHTML(TERMS, 'terms.html');
    container.appendChild(btn2);

    // Instructions
    const inst = document.createElement('div');
    inst.className = 'bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-1 text-[11px] text-gray-300';
    inst.innerHTML = `
      <p class="font-bold text-cyan-400 mb-1">Kaise use karein:</p>
      <p>1. Dono files download karein</p>
      <p>2. Apne project folder mein rakhein</p>
      <p>3. git add . && git commit && git push</p>
      <p>4. Vercel URLs:</p>
      <p class="text-cyan-400">umar-super-app.vercel.app/privacy.html</p>
      <p class="text-cyan-400">umar-super-app.vercel.app/terms.html</p>
      <p class="mt-2 text-amber-400">Ye URLs Play Console mein daalein</p>
    `;
    container.appendChild(inst);
  }

  function downloadHTML(html, filename) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast('✅ ' + filename + ' downloaded');
  }

  // ═══════════════════════════════════════════════════════════════
  // ICON HELPER
  // ═══════════════════════════════════════════════════════════════
  function renderIconHelper(container) {
    const info = document.createElement('div');
    info.className = 'bg-purple-900/20 border border-purple-500/40 rounded-xl p-3 space-y-1';
    info.innerHTML = `
      <p class="text-[11px] text-purple-300 font-bold">🎨 Play Store Sizes</p>
      <p class="text-[10px] text-gray-300">• App Icon: 512x512 PNG</p>
      <p class="text-[10px] text-gray-300">• Feature Graphic: 1024x500 PNG</p>
      <p class="text-[10px] text-gray-300">• Screenshots: 1080x1920 (5-8 pics)</p>
      <p class="text-[10px] text-gray-300 mt-2">Pehle "Launch Kit" kholein Settings se — wahan generator hai</p>
    `;
    container.appendChild(info);

    const btn = document.createElement('button');
    btn.className = 'w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs rounded-xl';
    btn.innerHTML = '<i class="fa-solid fa-image"></i> Open Launch Kit (Icon Generator)';
    btn.onclick = () => {
      if (typeof window.openIconGeneratorModal === 'function') {
        closeModal('finalChecklistModal');
        window.openIconGeneratorModal();
      } else {
        toast('Launch Kit missing — check launch-kit.js');
      }
    };
    container.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // ADD ADMIN BUTTON
  // ═══════════════════════════════════════════════════════════════
  function addLaunchBtn() {
    if (!isAdmin()) return;
    if (document.getElementById('launch-check-btn')) return;
    const header = document.querySelector('header');
    if (!header) return;
    const btn = document.createElement('button');
    btn.id = 'launch-check-btn';
    btn.onclick = window.openFinalChecklist;
    btn.className = 'px-2 py-1 bg-green-600 text-white rounded-full text-[10px] font-bold';
    btn.innerHTML = '<i class="fa-solid fa-rocket"></i>';
    btn.title = 'Launch Checklist';
    header.querySelector('div')?.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    setInterval(addLaunchBtn, 2000);
    setTimeout(addLaunchBtn, 3000);
    console.log('✅ final-checklist.js loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
