// ==========================================
// ⚡ SUPER APP - REAL PUSH NOTIFICATIONS
// File: push-notifications.js
// ==========================================

(function() {
  'use strict';

  window.PushManager = {
    init: async function() {
      if (!currentUser) return;
      if (!window.Capacitor || !window.Capacitor.Plugins.PushNotifications) {
        console.log("⚠️ Push Notifications sirf Android App mein kaam karte hain.");
        return;
      }

      const { PushNotifications } = window.Capacitor.Plugins;

      try {
        // 1. Permission maangein
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === 'prompt') {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== 'granted') {
          console.log("❌ Notification permission denied.");
          return;
        }

        // 2. Register karein (FCM Token generate hoga)
        await PushNotifications.register();

        // 3. Token save karein (Taaki backend notification bhej sake)
        PushNotifications.addListener('registration', async (token) => {
          console.log("✅ FCM Token:", token.value);
          const cleanUser = formatHandle(currentUser);
          try {
            await db.collection("users").doc(cleanUser).set({
              fcmToken: token.value,
              lastTokenUpdate: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          } catch(e) { console.error("Token save error:", e); }
        });

        // 4. Notification receive hone par
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          showToast(`🔔 ${notification.title}: ${notification.body}`);
        });

        // 5. Notification par tap karne par
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          // Agar DM ki notification hai, toh DM modal kholo
          if (action.notification.data.type === 'dm') {
            openChatConversation(action.notification.data.sender);
          }
        });

      } catch (e) {
        console.error("Push Init Error:", e);
      }
    }
  };

  // Jab user login ho jaye tab init karein
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (currentUser) PushManager.init();
    }, 3000);
    
    // Baar baar check karein jab user change ho
    setInterval(() => {
      if (currentUser && !window.__pushInitialized) {
        window.__pushInitialized = true;
        PushManager.init();
      }
    }, 5000);
  });

})();
