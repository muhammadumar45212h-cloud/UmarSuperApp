// ==========================================
// ⚡ SUPER APP - CLEAN SETTINGS (Remove Fake UI)
// File: clean-settings.js
// ==========================================

(function() {
  'use strict';

  window.addEventListener('load', () => {
    setTimeout(() => {
      const settingsModal = document.getElementById('settingsModal');
      if (!settingsModal) return;

      // 1. "Admin Wallet" button hatayein (agar user admin nahi hai)
      const allButtons = settingsModal.querySelectorAll('button');
      allButtons.forEach(btn => {
        const text = btn.innerText.toLowerCase();
        if (text.includes('admin wallet')) {
          // Sirf tab dikhayein jab user 'muhammadumar45212h' ho
          if (!currentUser || formatHandle(currentUser).toLowerCase() !== 'muhammadumar45212h') {
            btn.remove();
          }
        }
      });

      // 2. Duplicate "Payment History" hatayein
      let paymentHistoryCount = 0;
      settingsModal.querySelectorAll('button').forEach(btn => {
        if (btn.innerText.toLowerCase().includes('payment history')) {
          paymentHistoryCount++;
          if (paymentHistoryCount > 1) btn.remove(); // Pehla rakhna hai, baaki hatane hain
        }
      });

      console.log("✅ Settings cleaned: Fake buttons removed");
    }, 3000);
  });
})();
