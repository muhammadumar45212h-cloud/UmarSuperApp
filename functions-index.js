// ==========================================
// ⚡ SUPER APP - BACKEND VERIFICATION (functions/index.js)
// ==========================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");

admin.initializeApp();
const db = admin.firestore();

// Google Play Service Account JSON file ka path
// (Ye file aapko Play Console -> Setup -> API Access se download karni hai)
const serviceAccount = require("./service-account.json");

// Android Publisher API initialize karein
const androidPublisher = google.androidpublisher({
  version: "v3",
  auth: new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  }),
});

// 1. REAL PAYMENT VERIFICATION FUNCTION
exports.verifyPlayStorePurchase = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const { productId, purchaseToken, packageName, diamondAmount, isPremium } = data;
  const userId = context.auth.uid; // Firebase Auth UID
  const userEmail = context.auth.token.email;

  try {
    // 1. Google Play API se purchase verify karein
    const response = await androidPublisher.purchases.products.get({
      packageName: packageName,
      productId: productId,
      token: purchaseToken,
    });

    const purchase = response.data;

    // 2. Check karein ki purchase valid hai ya nahi
    if (purchase.purchaseState !== 0) {
      throw new Error("Purchase is not completed.");
    }
    if (purchase.consumptionState !== 1 && !isPremium) {
      // Agar consumable product hai (diamonds) toh consume karna hoga
      await androidPublisher.purchases.products.consume({
        packageName: packageName,
        productId: productId,
        token: purchaseToken,
      });
    }

    // 3. Firestore mein user ka balance update karein
    const userRef = db.collection("users").doc(userEmail || userId);
    
    if (isPremium) {
      await userRef.set({
        isPremium: true,
        premiumStartDate: new Date(),
        premiumProductId: productId,
      }, { merge: true });
    } else {
      // Diamonds add karein
      await userRef.set({
        diamonds: admin.firestore.FieldValue.increment(diamondAmount || 0),
      }, { merge: true });
    }

    // 4. Transaction log save karein
    await db.collection("transactions").add({
      userId: userId,
      userEmail: userEmail,
      productId: productId,
      purchaseToken: purchaseToken,
      amount: diamondAmount || 0,
      isPremium: isPremium || false,
      status: "completed",
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: "Payment verified and diamonds added!" };

  } catch (error) {
    console.error("Verification Error:", error);
    
    // Log failed attempt
    await db.collection("transactions").add({
      userId: userId,
      productId: productId,
      purchaseToken: purchaseToken,
      status: "failed",
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    throw new functions.https.HttpsError("internal", "Payment verification failed.");
  }
});
