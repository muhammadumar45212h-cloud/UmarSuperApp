// ==========================================
// ⚡ SUPER APP - BACKEND PAYMENT VERIFICATION
// File: ~/SuperSphere-New/functions/index.js
// ==========================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");

admin.initializeApp();
const db = admin.firestore();

// ⚠️ service-account.json file isi functions folder mein honi chahiye
const serviceAccount = require("./service-account.json");

const androidPublisher = google.androidpublisher({
  version: "v3",
  auth: new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  }),
});

// ==========================================
// MAIN VERIFICATION FUNCTION
// ==========================================
exports.verifyPlayStorePurchase = functions.https.onCall(async (data, context) => {
  const { 
    productId, 
    purchaseToken, 
    packageName, 
    diamondAmount, 
    isPremium, 
    username 
  } = data;

  if (!username) {
    throw new functions.https.HttpsError("unauthenticated", "User not logged in");
  }

  try {
    // Google Play API se purchase verify karein
    const response = await androidPublisher.purchases.products.get({
      packageName: packageName,
      productId: productId,
      token: purchaseToken,
    });

    const purchase = response.data;

    // Check karein purchase valid hai ya nahi
    if (purchase.purchaseState !== 0) {
      throw new Error("Purchase not completed");
    }

    // Agar consumable (diamonds) hai toh consume karna hoga
    if (purchase.consumptionState !== 1 && !isPremium) {
      await androidPublisher.purchases.products.consume({
        packageName: packageName,
        productId: productId,
        token: purchaseToken,
      });
    }

    // Firestore mein user update karein
    const userRef = db.collection("users").doc(username);
    
    if (isPremium) {
      await userRef.set({
        isPremium: true,
        premiumStartDate: new Date(),
        premiumProductId: productId,
      }, { merge: true });
    } else {
      await userRef.set({
        diamonds: admin.firestore.FieldValue.increment(diamondAmount || 0),
      }, { merge: true });
    }

    // Transaction log save karein
    await db.collection("transactions").add({
      username: username,
      productId: productId,
      purchaseToken: purchaseToken,
      amount: diamondAmount || 0,
      isPremium: isPremium || false,
      status: "completed",
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: "Payment verified!" };

  } catch (error) {
    console.error("Verification Error:", error);
    
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
