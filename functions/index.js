// ==========================================
// ⚡ SUPER APP - BACKEND (Payment + Notifications)
// File: functions/index.js
// ==========================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");

// Firebase Init
admin.initializeApp();
const db = admin.firestore();

// ⚠️ Service Account JSON load
const serviceAccount = require("./service-account.json");

// Google Play Android Publisher API Init
const androidPublisher = google.androidpublisher({
  version: "v3",
  auth: new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  }),
});

// ==========================================
// 1. VERIFY PLAY STORE PURCHASE
// ==========================================
exports.verifyPlayStorePurchase = functions.https.onCall(async (data, context) => {
  const { productId, purchaseToken, packageName, diamondAmount, isPremium, premiumTier, username } = data;

  if (!username) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  try {
    // Google Play se purchase verify karein
    const response = await androidPublisher.purchases.products.get({
      packageName: packageName,
      productId: productId,
      token: purchaseToken,
    });

    const purchase = response.data;

    // Check if valid
    if (purchase.purchaseState !== 0) {
      throw new Error("Purchase is not completed.");
    }
    
    // Consume consumable products (Diamonds)
    if (purchase.consumptionState !== 1 && !isPremium) {
      await androidPublisher.purchases.products.consume({
        packageName: packageName,
        productId: productId,
        token: purchaseToken,
      });
    }

    // Update Firestore Database
    const userRef = db.collection("users").doc(username);
    
    if (isPremium) {
      // Premium Subscription
      await userRef.set({
        isPremium: true,
        premiumTier: premiumTier,
        premiumStartDate: new Date(),
        premiumProductId: productId,
      }, { merge: true });
    } else {
      // Diamonds Add
      await userRef.set({
        diamonds: admin.firestore.FieldValue.increment(diamondAmount || 0),
      }, { merge: true });
    }

    // Save Transaction Log
    await db.collection("transactions").add({
      username: username,
      productId: productId,
      purchaseToken: purchaseToken,
      amount: diamondAmount || 0,
      isPremium: isPremium || false,
      status: "completed",
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: "Payment verified and items delivered!" };

  } catch (error) {
    console.error("Verification Error:", error);
    
    // Save Failed Log
    await db.collection("transactions").add({
      username: username,
      productId: productId,
      purchaseToken: purchaseToken,
      status: "failed",
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    throw new functions.https.HttpsError("internal", "Verification failed: " + error.message);
  }
});

// ==========================================
// 2. REAL PUSH NOTIFICATIONS (DM ALERTS)
// ==========================================
exports.sendChatNotification = functions.firestore
  .document("dm_messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    if (!message) return null;

    const receiver = message.receiver;
    const sender = message.sender;
    const text = message.text || "Sent you a message";

    try {
      // Receiver ka FCM Token nikaalein
      const userDoc = await db.collection("users").doc(receiver).get();
      
      if (!userDoc.exists) return null;
      
      const fcmToken = userDoc.data().fcmToken;
      if (!fcmToken) return null; // Agar user ne notification allow nahi ki

      // Notification Payload banayein
      const payload = {
        token: fcmToken,
        notification: {
          title: `New message from @${sender}`,
          body: text.length > 50 ? text.substring(0, 50) + "..." : text,
        },
        data: {
          type: "dm",
          sender: sender
        },
        android: {
          priority: "high",
          notification: {
            channelId: "default_channel",
            sound: "default"
          }
        }
      };

      // Send Notification
      await admin.messaging().send(payload);
      console.log(`✅ Notification sent to @${receiver}`);
      return null;

    } catch (error) {
      console.error("❌ Notification Error:", error);
      return null;
    }
  });
