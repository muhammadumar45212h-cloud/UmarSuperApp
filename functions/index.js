const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");

admin.initializeApp();
const db = admin.firestore();

// ⚠️ Ye file Play Console/Google Cloud se download karni hoti hai
const serviceAccount = require("./service-account.json");

const androidPublisher = google.androidpublisher({
  version: "v3",
  auth: new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  }),
});

exports.verifyPlayStorePurchase = functions.https.onCall(async (data, context) => {
  const { productId, purchaseToken, packageName, diamondAmount, isPremium, username } = data;

  if (!username) throw new functions.https.HttpsError("unauthenticated", "User not logged in");

  try {
    // 1. Google Play se purchase verify karein
    const response = await androidPublisher.purchases.products.get({
      packageName: packageName,
      productId: productId,
      token: purchaseToken,
    });

    const purchase = response.data;

    if (purchase.purchaseState !== 0) throw new Error("Purchase not completed");

    // Agar diamonds hain toh consume karein
    if (purchase.consumptionState !== 1 && !isPremium) {
      await androidPublisher.purchases.products.consume({
        packageName: packageName,
        productId: productId,
        token: purchaseToken,
      });
    }

    // 2. Database mein balance update karein
    const userRef = db.collection("users").doc(username);
    
    if (isPremium) {
      await userRef.set({ isPremium: true, premiumStartDate: new Date(), premiumProductId: productId }, { merge: true });
    } else {
      await userRef.set({ diamonds: admin.firestore.FieldValue.increment(diamondAmount || 0) }, { merge: true });
    }

    // 3. Transaction log save karein
    await db.collection("transactions").add({
      username: username, productId: productId, purchaseToken: purchaseToken,
      amount: diamondAmount || 0, isPremium: isPremium || false, status: "completed",
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: "Payment verified!" };

  } catch (error) {
    console.error("Verification Error:", error);
    await db.collection("transactions").add({
      username: username, productId: productId, purchaseToken: purchaseToken,
      status: "failed", error: error.message, timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    throw new functions.https.HttpsError("internal", "Verification failed: " + error.message);
  }
});
