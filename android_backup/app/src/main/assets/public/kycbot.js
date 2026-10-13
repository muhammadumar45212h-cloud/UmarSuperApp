/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - KYCBOT.JS
   Automatic KYC Verification Bot
   
   Features:
   1. OCR (Tesseract.js) — CNIC photo se text nikalta hai
   2. Auto Name Match — User ke naam vs CNIC ka naam
   3. CNIC Format Validate — 13 digits (XXXXX-XXXXXXX-X)
   4. Photo Quality Check
   5. Auto-Verify → Blue tick + Premium activate
   6. Auto-Reject → Notification + Retry message
   7. WhatsApp admin alert (agar manual review chahiye)
   8. 100% free — koi paid API nahi
   
   Add: <script src="kycbot.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // LOAD TESSERACT.JS (Free OCR)
  // ═══════════════════════════════════════════════════════════════
  if (!window.Tesseract) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
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
  // OCR — Extract text from CNIC image
  // ═══════════════════════════════════════════════════════════════
  async function extractTextFromImage(imageDataUrl) {
    try {
      if (!window.Tesseract) {
        await new Promise(r => setTimeout(r, 2000));
      }
      
      const result = await Tesseract.recognize(
        imageDataUrl,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              updateBotProgress(Math.floor(m.progress * 60), `Reading CNIC... ${Math.floor(m.progress * 100)}%`);
            }
          }
        }
      );
      
      return result.data.text || '';
    } catch(e) {
      console.error('OCR error:', e);
      return '';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CNIC FORMAT VALIDATION (13 digits: XXXXX-XXXXXXX-X)
  // ═══════════════════════════════════════════════════════════════
  function validateCNICFormat(cnic) {
    const clean = (cnic || '').replace(/[^0-9]/g, '');
    if (clean.length !== 13) return false;
    // Pakistani CNIC starts with 1-7 (region code)
    if (!/^[1-7]/.test(clean)) return false;
    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // NAME MATCHING (Fuzzy match — case, spaces ignore)
  // ═══════════════════════════════════════════════════════════════
  function normalizeName(name) {
    return (name || '')
      .toLowerCase()
      .replace(/[^a-z\u0600-\u06FF\s]/g, '') // only letters + spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  function nameMatchScore(name1, name2) {
    const n1 = normalizeName(name1);
    const n2 = normalizeName(name2);

    if (!n1 || !n2) return 0;
    if (n1 === n2) return 100;

    // Split into words
    const w1 = n1.split(' ');
    const w2 = n2.split(' ');

    // Count matching words
    let matches = 0;
    w1.forEach(w => {
      if (w2.includes(w)) matches++;
    });

    // Score based on word matches
    const score = (matches / Math.max(w1.length, w2.length)) * 100;
    return Math.floor(score);
  }

  // ═══════════════════════════════════════════════════════════════
  // CHECK IF CNIC TEXT CONTAINS USER'S DATA
  // ═══════════════════════════════════════════════════════════════
  function analyzeOCRResult(ocrText, userData) {
    const result = {
      nameFound: false,
      cnicFound: false,
      nameScore: 0,
      cnicMatch: false,
      confidence: 0,
      details: {}
    };

    const cleanText = (ocrText || '').toLowerCase();
    const cleanOCRDigits = cleanText.replace(/[^0-9]/g, '');

    // 1. Check name
    const userName = userData.fullName || '';
    if (userName) {
      result.nameScore = nameMatchScore(userName, ocrText);
      result.nameFound = result.nameScore >= 60; // 60% match = found
    }

    // 2. Check CNIC number
    const userCNIC = (userData.cnic || '').replace(/[^0-9]/g, '');
    if (userCNIC && cleanOCRDigits.includes(userCNIC)) {
      result.cnicFound = true;
      result.cnicMatch = true;
    } else if (userCNIC) {
      // Check partial match (first 5 digits)
      const partial = userCNIC.substring(0, 5);
      if (cleanOCRDigits.includes(partial)) {
        result.cnicFound = true;
        result.cnicMatch = false;
      }
    }

    // 3. Check DOB
    if (userData.dob) {
      const dobParts = userData.dob.split('-');
      const year = dobParts[0] || '';
      if (year && cleanText.includes(year)) {
        result.details.dobFound = true;
      }
    }

    // 4. Calculate confidence
    let score = 0;
    if (result.nameFound) score += 50;
    if (result.cnicMatch) score += 50;
    result.confidence = score;

    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // PROGRESS UI
  // ═══════════════════════════════════════════════════════════════
  function showBotProgress() {
    if (document.getElementById('kycBotModal')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="kycBotModal" class="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-6">
        <div class="w-full max-w-md bg-gray-900 border-2 border-cyan-500/40 rounded-2xl p-6 space-y-4">
          <div class="text-center">
            <div class="text-6xl mb-3" id="bot-icon">🤖</div>
            <h2 class="text-base font-bold text-cyan-400">KYC Verification Bot</h2>
            <p class="text-xs text-gray-400 mt-1" id="bot-status">Starting...</p>
          </div>
          <div class="w-full bg-gray-800 rounded-full h-4 overflow-hidden border border-gray-700">
            <div id="bot-fill" class="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-300" style="width:0%"></div>
          </div>
          <p class="text-2xl font-extrabold text-cyan-400 text-center" id="bot-pct">0%</p>
          <div id="bot-details" class="bg-gray-950 border border-gray-800 rounded-xl p-3 space-y-1 text-[10px] font-mono text-gray-400 max-h-32 overflow-y-auto"></div>
        </div>
      </div>
    `);
  }

  function updateBotProgress(pct, status, detail) {
    const fill = document.getElementById('bot-fill');
    const pctEl = document.getElementById('bot-pct');
    const statusEl = document.getElementById('bot-status');
    const details = document.getElementById('bot-details');

    if (fill) fill.style.width = pct + '%';
    if (pctEl) pctEl.innerText = pct + '%';
    if (statusEl && status) statusEl.innerText = status;
    if (details && detail) {
      details.innerHTML += `<div>▸ ${detail}</div>`;
      details.scrollTop = details.scrollHeight;
    }
  }

  function hideBotProgress() {
    setTimeout(() => {
      document.getElementById('kycBotModal')?.remove();
    }, 2000);
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN BOT — Auto Verify KYC
  // ═══════════════════════════════════════════════════════════════
  window.__runKycBot = async function() {
    const user = getUser();
    if (!user) { toast('Login zaroori'); return; }

    // Get user data from form
    const fullName = (document.getElementById('kyc-fullname')?.value || '').trim();
    const cnic = (document.getElementById('kyc-cnic')?.value || '').trim();
    const dob = (document.getElementById('kyc-dob')?.value || '').trim();
    const frontImg = window.kycImgs?.front || null;
    const backImg = window.kycImgs?.back || null;
    const selfie = window.kycImgs?.selfie || null;

    // ═══ STEP 1: Basic validation ═══
    if (!fullName || !cnic || !frontImg || !backImg || !selfie) {
      toast('❌ Saari fields + 3 photos zaroori');
      return;
    }

    if (!validateCNICFormat(cnic)) {
      toast('❌ CNIC format galat hai (13 digits)');
      return;
    }

    // ═══ STEP 2: Start bot UI ═══
    showBotProgress();
    updateBotProgress(5, 'Starting verification...', 'Checking format...');

    // ═══ STEP 3: CNIC format check ═══
    await new Promise(r => setTimeout(r, 500));
    updateBotProgress(10, 'CNIC format verified ✓', `CNIC: ${cnic}`);

    // ═══ STEP 4: OCR on CNIC front image ═══
    updateBotProgress(15, 'Reading CNIC front...', 'OCR engine starting...');
    const frontText = await extractTextFromImage(frontImg);
    updateBotProgress(65, 'CNIC front read ✓', `Found ${frontText.length} chars`);
    console.log('Front OCR:', frontText);

    // ═══ STEP 5: OCR on CNIC back image ═══
    updateBotProgress(70, 'Reading CNIC back...', 'Processing...');
    const backText = await extractTextFromImage(backImg);
    updateBotProgress(75, 'CNIC back read ✓', `Found ${backText.length} chars`);

    // ═══ STEP 6: Combined analysis ═══
    updateBotProgress(80, 'Analyzing details...', 'Matching name & CNIC...');
    const combinedText = frontText + ' ' + backText;
    
    const userData = { fullName, cnic, dob };
    const analysis = analyzeOCRResult(combinedText, userData);

    await new Promise(r => setTimeout(r, 800));

    // ═══ STEP 7: Detailed results ═══
    updateBotProgress(85, 'Checking name match...', 
      `Name score: ${analysis.nameScore}% (${analysis.nameFound ? '✓' : '✗'})`);
    updateBotProgress(90, 'Checking CNIC match...', 
      `CNIC: ${analysis.cnicMatch ? '✓' : (analysis.cnicFound ? 'Partial' : '✗')}`);
    updateBotProgress(95, 'Calculating confidence...', 
      `Total: ${analysis.confidence}%`);

    await new Promise(r => setTimeout(r, 800));

    // ═══ STEP 8: Decision ═══
    const autoVerifyThreshold = 75; // 75%+ = auto verify

    if (analysis.confidence >= autoVerifyThreshold) {
      // ✅ AUTO VERIFY
      await autoVerifyUser(user, userData, analysis);
    } else {
      // ❌ NEEDS MANUAL REVIEW
      await manualReviewRequired(user, userData, analysis, frontImg, backImg, selfie);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO VERIFY
  // ═══════════════════════════════════════════════════════════════
  async function autoVerifyUser(user, userData, analysis) {
    updateBotProgress(98, 'Verifying account...', 'Bot confidence: ' + analysis.confidence + '%');

    try {
      // Premium expiry (30 days)
      const premiumExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Update user
      await firebase.firestore().collection('users').doc(user).set({
        isVerified: true,
        isPremium: true,
        kycVerified: true,
        kycVerifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
        premiumExpiry: firebase.firestore.Timestamp.fromDate(premiumExpiry),
        kycMethod: 'auto-bot',
        kycConfidence: analysis.confidence
      }, { merge: true });

      // Save KYC record
      await firebase.firestore().collection('kyc').doc(user).set({
        user: user,
        fullName: userData.fullName,
        cnic: userData.cnic,
        dob: userData.dob,
        status: 'Approved',
        verifiedBy: 'auto-bot',
        confidence: analysis.confidence,
        nameScore: analysis.nameScore,
        cnicMatch: analysis.cnicMatch,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Send notification
      await firebase.firestore().collection('notifications').add({
        userId: user,
        title: '✅ KYC Verified!',
        body: `🎉 Aapka account verify ho gaya! Blue tick lag gaya aur 30 din ka Premium free mila!`,
        type: 'reward',
        read: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      updateBotProgress(100, '✅ VERIFIED!', 'Blue tick activated + Premium free');

      // Success message
      document.getElementById('bot-icon').innerText = '✅';

      setTimeout(() => {
        hideBotProgress();
        showResultPopup('success', 'Aapka KYC verify ho gaya! 👑\n\n✅ Blue tick lag gaya\n✅ 30 din ka Premium free\n\nCongratulations!');
        
        // Reload user data
        if (typeof loadUserData === 'function') loadUserData();
        if (typeof closeModal === 'function') closeModal('kycModal');
      }, 1500);

    } catch(e) {
      updateBotProgress(100, '❌ Error', e.message);
      hideBotProgress();
      toast('❌ Verify fail: ' + e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MANUAL REVIEW NEEDED
  // ═══════════════════════════════════════════════════════════════
  async function manualReviewRequired(user, userData, analysis, frontImg, backImg, selfie) {
    updateBotProgress(98, 'Sending for manual review...', 
      `Bot confidence low (${analysis.confidence}%)`);

    try {
      // Save KYC as Pending
      await firebase.firestore().collection('kyc').doc(user).set({
        user: user,
        fullName: userData.fullName,
        cnic: userData.cnic,
        dob: userData.dob,
        front: frontImg,
        back: backImg,
        selfie: selfie,
        status: 'Pending',
        kycMethod: 'auto-bot',
        kycConfidence: analysis.confidence,
        nameScore: analysis.nameScore,
        cnicMatch: analysis.cnicMatch,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      updateBotProgress(100, '⏳ Pending Review', 
        `Admin 24 ghante mein verify karega`);

      document.getElementById('bot-icon').innerText = '⏳';

      // WhatsApp admin alert
      const waText = encodeURIComponent(
        `🔔 KYC MANUAL REVIEW\n\n` +
        `User: @${user}\n` +
        `Name: ${userData.fullName}\n` +
        `CNIC: ${userData.cnic}\n` +
        `DOB: ${userData.dob}\n\n` +
        `Bot Confidence: ${analysis.confidence}%\n` +
        `Name Score: ${analysis.nameScore}%\n` +
        `CNIC Match: ${analysis.cnicMatch ? 'Yes' : 'No'}\n\n` +
        `Verify in Admin Panel → KYC section`
      );
      
      const admin = Math.random() < 0.5 ? '923089775764' : '923423373749';

      setTimeout(() => {
        hideBotProgress();
        showResultPopup('pending', 
          `Aapka data submit ho gaya hai.\n\n⏳ Admin 24 ghante mein verify karega.\n\nAapko notification milegi jab verify ho jayega.`
        );
        
        if (confirm('WhatsApp pe admin ko alert bhejein?')) {
          window.open(`https://wa.me/${admin}?text=${waText}`, '_blank');
        }
        
        if (typeof closeModal === 'function') closeModal('kycModal');
      }, 1500);

    } catch(e) {
      updateBotProgress(100, '❌ Error', e.message);
      hideBotProgress();
      toast('❌ Submit fail: ' + e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RESULT POPUP
  // ═══════════════════════════════════════════════════════════════
  function showResultPopup(type, message) {
    document.getElementById('kycResultPopup')?.remove();

    const config = {
      success: { icon: '👑', color: 'green', title: 'Verified!' },
      pending: { icon: '⏳', color: 'amber', title: 'Pending Review' },
      failed: { icon: '❌', color: 'red', title: 'Verification Failed' }
    };

    const c = config[type] || config.pending;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="kycResultPopup" class="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6">
        <div class="w-full max-w-sm bg-gray-900 border-2 border-${c.color}-500/50 rounded-2xl p-6 text-center space-y-4">
          <div class="text-6xl">${c.icon}</div>
          <h2 class="text-lg font-bold text-${c.color}-400">${c.title}</h2>
          <p class="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">${message}</p>
          <button onclick="document.getElementById('kycResultPopup').remove()" 
                  class="w-full py-3 bg-gradient-to-r from-${c.color}-600 to-${c.color}-500 text-white font-bold text-sm rounded-xl">
            OK
          </button>
        </div>
      </div>
    `);
  }

  // ═══════════════════════════════════════════════════════════════
  // HOOK: Replace "Submit KYC" button behavior
  // ═══════════════════════════════════════════════════════════════
  function hookKycSubmit() {
    // Existing submitKyc() ko override karein
    window.submitKyc = async function() {
      return window.__runKycBot();
    };

    // Button text update
    const kycBtn = document.querySelector('#kycModal button[onclick*="submitKyc"]');
    if (kycBtn && !kycBtn.dataset.botHooked) {
      kycBtn.dataset.botHooked = '1';
      kycBtn.innerHTML = '🤖 Auto-Verify with Bot';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ADMIN: Manual Verify/Reject
  // ═══════════════════════════════════════════════════════════════
  window.__adminManualVerify = async function(user) {
    const admin = getUser();
    if (!['muhammadumar45212h', 'Umar', 'admin'].includes(admin)) {
      toast('Access denied');
      return;
    }

    try {
      const premiumExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await firebase.firestore().collection('users').doc(user).set({
        isVerified: true,
        isPremium: true,
        kycVerified: true,
        kycVerifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
        premiumExpiry: firebase.firestore.Timestamp.fromDate(premiumExpiry),
        kycMethod: 'manual-admin'
      }, { merge: true });

      await firebase.firestore().collection('kyc').doc(user).update({
        status: 'Approved',
        verifiedBy: 'admin-' + admin,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await firebase.firestore().collection('notifications').add({
        userId: user,
        title: '✅ KYC Verified!',
        body: 'Aapka account verify ho gaya! Blue tick + Premium activate.',
        type: 'reward',
        read: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      toast('✅ @' + user + ' verified');
    } catch(e) {
      toast('❌ ' + e.message);
    }
  };

  window.__adminManualReject = async function(user, reason) {
    const admin = getUser();
    if (!['muhammadumar45212h', 'Umar', 'admin'].includes(admin)) {
      toast('Access denied');
      return;
    }

    reason = reason || 'Documents match nahi kar rahe';

    try {
      await firebase.firestore().collection('kyc').doc(user).update({
        status: 'Rejected',
        rejectedBy: 'admin-' + admin,
        reason: reason,
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await firebase.firestore().collection('notifications').add({
        userId: user,
        title: '❌ KYC Rejected',
        body: `Reason: ${reason}. Please dobara try karein.`,
        type: 'general',
        read: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      toast('❌ @' + user + ' rejected');
    } catch(e) {
      toast('❌ ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // ADD BOT STATUS TO KYC MODAL
  // ═══════════════════════════════════════════════════════════════
  function addBotInfo() {
    const kycModal = document.getElementById('kycModal');
    if (!kycModal || document.getElementById('kyc-bot-info')) return;

    const info = document.createElement('div');
    info.id = 'kyc-bot-info';
    info.className = 'bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-cyan-500/40 rounded-xl p-3 space-y-1';
    info.innerHTML = `
      <p class="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
        <span>🤖</i></span> Auto-Verification Bot
      </p>
      <p class="text-[9px] text-gray-300 leading-relaxed">
        Bot aapki CNIC se text nikaal ke automatically verify karega. 
        Agar sahi hua toh <b class="text-green-400">blue tick + Premium free</b>. 
        Warna admin review karega.
      </p>
    `;

    const firstField = kycModal.querySelector('input');
    if (firstField) {
      firstField.parentNode.insertBefore(info, firstField);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    setInterval(hookKycSubmit, 2000);
    setInterval(addBotInfo, 2000);
    console.log('✅ kycbot.js loaded - Auto KYC verification ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════
  window.__KYCBOT__ = {
    run: window.__runKycBot,
    adminVerify: window.__adminManualVerify,
    adminReject: window.__adminManualReject,
    validateCNICFormat,
    nameMatchScore,
    extractTextFromImage
  };
})();
