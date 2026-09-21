const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Initialize Firebase Admin SDK
// Put your official Firebase Service Account key JSON file or env credentials here
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    if (serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      admin.initializeApp({
        projectId: "super-app-omega"
      });
    }
  } catch (err) {
    admin.initializeApp({
      projectId: "super-app-omega"
    });
  }
}

const db = admin.firestore();

// CONFIGURABLE SYSTEM CONSTANTS
const PLATFORM_COMMISSION_RATE = 0.30; // 30% App Owner Share
const CREATOR_COMMISSION_RATE = 0.70;  // 70% Creator Share

// =========================================================================
// 1. MESSAGING & USER CONNECTIONS API
// =========================================================================

// Search Users
app.get('/api/users/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json({ success: true, users: [] });

    const snapshot = await db.collection('users')
      .where('username', '>=', query.toLowerCase())
      .where('username', '<=', query.toLowerCase() + '\uf8ff')
      .limit(10)
      .get();

    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Follow / Connect User
app.post('/api/users/follow', async (req, res) => {
  try {
    const { followerUid, targetUid } = req.body;
    if (!followerUid || !targetUid) return res.status(400).json({ success: false, error: 'Missing parameters' });

    const batch = db.batch();
    const followerRef = db.collection('users').doc(followerUid);
    const targetRef = db.collection('users').doc(targetUid);

    batch.update(followerRef, {
      following: admin.firestore.FieldValue.arrayUnion(targetUid)
    });
    batch.update(targetRef, {
      subscribersList: admin.firestore.FieldValue.arrayUnion(followerUid)
    });

    await batch.commit();
    res.json({ success: true, message: 'Followed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send Direct Message
app.post('/api/messages/send', async (req, res) => {
  try {
    const { senderUid, receiverUid, text } = req.body;
    if (!senderUid || !receiverUid || !text) {
      return res.status(400).json({ success: false, error: 'Sender, Receiver, and Text required' });
    }

    const conversationId = [senderUid, receiverUid].sort().join('_');
    const convRef = db.collection('conversations').doc(conversationId);

    const messageData = {
      senderUid,
      receiverUid,
      text,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    };

    await db.runTransaction(async (transaction) => {
      const convDoc = await transaction.get(convRef);
      if (!convDoc.exists) {
        transaction.set(convRef, {
          participants: [senderUid, receiverUid],
          lastMessage: text,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        transaction.update(convRef, {
          lastMessage: text,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      const msgRef = convRef.collection('messages').doc();
      transaction.set(msgRef, messageData);

      // Create Notification record for receiver
      const notifRef = db.collection('notifications').doc();
      transaction.set(notifRef, {
        userUid: receiverUid,
        senderUid,
        type: 'NEW_MESSAGE',
        text: `New message from ${senderUid}: ${text.substring(0, 30)}...`,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({ success: true, message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 2. POSTS / VIDEOS & INTERACTION METRICS
// =========================================================================

// Create Post (Server Record)
app.post('/api/posts/create', async (req, res) => {
  try {
    const { userUid, username, caption, url, type, link } = req.body;
    if (!userUid || !username) return res.status(400).json({ success: false, error: 'Missing author details' });

    const postData = {
      userUid,
      user: username,
      caption: caption || '',
      url: url || '',
      type: type || 'text',
      link: link || '',
      likes: [],
      comments: [],
      views: 0,
      shares: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('posts').add(postData);
    res.json({ success: true, postId: docRef.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle Post Like
app.post('/api/posts/like', async (req, res) => {
  try {
    const { postId, userUid } = req.body;
    const postRef = db.collection('posts').doc(postId);

    await db.runTransaction(async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists) throw new Error('Post not found');

      const likes = postDoc.data().likes || [];
      const hasLiked = likes.includes(userUid);

      if (hasLiked) {
        transaction.update(postRef, {
          likes: admin.firestore.FieldValue.arrayRemove(userUid)
        });
      } else {
        transaction.update(postRef, {
          likes: admin.firestore.FieldValue.arrayUnion(userUid)
        });
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add View Count
app.post('/api/posts/view', async (req, res) => {
  try {
    const { postId } = req.body;
    const postRef = db.collection('posts').doc(postId);
    await postRef.update({
      views: admin.firestore.FieldValue.increment(1)
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 3. DIAMOND CURRENCY & GIFT TRANSACTIONS (70/30 SPLIT)
// =========================================================================

// Purchase Diamonds (Verified Server Flow)
app.post('/api/diamonds/purchase', async (req, res) => {
  try {
    const { userUid, diamondAmount, paymentTransactionId, provider } = req.body;
    if (!userUid || !diamondAmount || diamondAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    // Verify Payment Transaction ID uniqueness
    const txnRef = db.collection('payment_transactions').doc(paymentTransactionId);
    const walletRef = db.collection('diamond_wallets').doc(userUid);

    await db.runTransaction(async (transaction) => {
      const txnDoc = await transaction.get(txnRef);
      if (txnDoc.exists) throw new Error('Transaction ID already processed');

      // Record verified payment
      transaction.set(txnRef, {
        userUid,
        provider: provider || 'BINANCE',
        amountDiamonds: diamondAmount,
        status: 'VERIFIED',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update User Wallet
      const walletDoc = await transaction.get(walletRef);
      if (!walletDoc.exists) {
        transaction.set(walletRef, { balance: diamondAmount });
      } else {
        transaction.update(walletRef, {
          balance: admin.firestore.FieldValue.increment(diamondAmount)
        });
      }

      // Record Diamond Ledger
      const dTxnRef = db.collection('diamond_transactions').doc();
      transaction.set(dTxnRef, {
        userUid,
        type: 'PURCHASE',
        amount: diamondAmount,
        paymentTransactionId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({ success: true, message: 'Diamonds credited successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Send Virtual Gift (Server-Side Calculation: 70% Recipient / 30% Platform)
app.post('/api/gifts/send', async (req, res) => {
  try {
    const { senderUid, recipientUid, giftId, diamondCost } = req.body;

    if (!senderUid || !recipientUid || !diamondCost || diamondCost <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid gift parameters' });
    }

    if (senderUid === recipientUid) {
      return res.status(400).json({ success: false, error: 'Cannot send gifts to yourself' });
    }

    const senderWalletRef = db.collection('diamond_wallets').doc(senderUid);
    const recipientEarningsRef = db.collection('creator_earnings').doc(recipientUid);
    const platformEarningsRef = db.collection('platform_revenue').doc('summary');

    // Integer-Safe Share Calculations
    const platformShare = Math.floor(diamondCost * PLATFORM_COMMISSION_RATE); // 30%
    const creatorShare = diamondCost - platformShare;                       // 70%

    await db.runTransaction(async (transaction) => {
      const senderWalletDoc = await transaction.get(senderWalletRef);
      if (!senderWalletDoc.exists || senderWalletDoc.data().balance < diamondCost) {
        throw new Error('Insufficient Diamond Balance');
      }

      // 1. Deduct Diamonds from Sender
      transaction.update(senderWalletRef, {
        balance: admin.firestore.FieldValue.increment(-diamondCost)
      });

      // 2. Credit 70% Earning Balance to Recipient Creator
      const recipientDoc = await transaction.get(recipientEarningsRef);
      if (!recipientDoc.exists) {
        transaction.set(recipientEarningsRef, {
          availableBalance: creatorShare,
          pendingBalance: 0,
          totalEarned: creatorShare
        });
      } else {
        transaction.update(recipientEarningsRef, {
          availableBalance: admin.firestore.FieldValue.increment(creatorShare),
          totalEarned: admin.firestore.FieldValue.increment(creatorShare)
        });
      }

      // 3. Record 30% Share to Platform Owner
      transaction.set(platformEarningsRef, {
        totalPlatformCommission: admin.firestore.FieldValue.increment(platformShare)
      }, { merge: true });

      // 4. Log Gift Transaction Audit
      const giftTxnRef = db.collection('gift_transactions').doc();
      transaction.set(giftTxnRef, {
        senderUid,
        recipientUid,
        giftId: giftId || 'GENERIC_GIFT',
        totalDiamonds: diamondCost,
        platformShare,
        creatorShare,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({
      success: true,
      message: 'Gift sent successfully',
      sentAmount: diamondCost,
      creatorEarned: creatorShare,
      platformCommission: platformShare
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 4. PREMIUM SUBSCRIPTION SERVICE
// =========================================================================

app.post('/api/premium/activate', async (req, res) => {
  try {
    const { userUid, planType, paymentTransactionId } = req.body;
    // Plans: '1_YEAR' (PKR 1,000) or 'LIFETIME' (PKR 10,000)
    if (!['1_YEAR', 'LIFETIME'].includes(planType)) {
      return res.status(400).json({ success: false, error: 'Invalid premium plan type' });
    }

    const userRef = db.collection('users').doc(userUid);
    const subRef = db.collection('premium_subscriptions').doc();

    const purchaseDate = new Date();
    let expiryDate = null;

    if (planType === '1_YEAR') {
      expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    await db.runTransaction(async (transaction) => {
      transaction.update(userRef, {
        isPremium: true,
        premiumPlan: planType,
        premiumExpiry: expiryDate
      });

      transaction.set(subRef, {
        userUid,
        planType,
        paymentTransactionId,
        purchaseDate,
        expiryDate
      });
    });

    res.json({ success: true, message: 'Premium subscription activated server-side' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 5. WITHDRAWALS & ADMIN CONTROLS
// =========================================================================

app.post('/api/withdrawals/request', async (req, res) => {
  try {
    const { userUid, amount, paymentMethod, paymentDetails } = req.body;
    if (!userUid || !amount || amount <= 0) return res.status(400).json({ success: false, error: 'Invalid withdrawal amount' });

    const earningsRef = db.collection('creator_earnings').doc(userUid);

    await db.runTransaction(async (transaction) => {
      const earningsDoc = await transaction.get(earningsRef);
      if (!earningsDoc.exists || earningsDoc.data().availableBalance < amount) {
        throw new Error('Insufficient available balance for withdrawal');
      }

      // Move from Available to Pending
      transaction.update(earningsRef, {
        availableBalance: admin.firestore.FieldValue.increment(-amount),
        pendingBalance: admin.firestore.FieldValue.increment(amount)
      });

      // Record Request
      const reqRef = db.collection('withdrawal_requests').doc();
      transaction.set(reqRef, {
        userUid,
        amount,
        paymentMethod,
        paymentDetails,
        status: 'PENDING',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({ success: true, message: 'Withdrawal request submitted for admin review' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Super App Server running on port ${PORT}`));
