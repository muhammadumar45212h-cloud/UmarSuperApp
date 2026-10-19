// ==========================================
// ⚡ SUPER APP - REAL AI KYC (Face + OCR)
// File: auto-kyc.js
// ==========================================

(function() {
  'use strict';

  // 1. AI Libraries Load Karein (CDN se)
  async function loadAIModels() {
    showToast("⏳ AI Models load ho rahe hain...");
    
    // Face API
    if (!window.faceapi) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
      document.head.appendChild(script);
      await new Promise(r => script.onload = r);
    }

    // Tesseract OCR
    if (!window.Tesseract) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
      document.head.appendChild(script);
      await new Promise(r => script.onload = r);
    }

    // Models load karein
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    if (window.faceapi) {
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    }
  }

  // 2. Face Match Function
  async function compareFaces(selfieUrl, idCardUrl) {
    try {
      const selfieImg = await faceapi.fetchImage(selfieUrl);
      const idImg = await faceapi.fetchImage(idCardUrl);

      const selfieDesc = await faceapi.detectSingleFace(selfieImg).withFaceLandmarks().withFaceDescriptor();
      const idDesc = await faceapi.detectSingleFace(idImg).withFaceLandmarks().withFaceDescriptor();

      if (!selfieDesc || !idDesc) return false; // Face detect nahi hua

      const distance = faceapi.euclideanDistance(selfieDesc.descriptor, idDesc.descriptor);
      return distance < 0.6; // 0.6 se kam matlab face match hai
    } catch (e) {
      console.error("Face Match Error:", e);
      return false;
    }
  }

  // 3. Name (OCR) Match Function
  async function extractNameFromID(idCardUrl) {
    try {
      const { data: { text } } = await Tesseract.recognize(idCardUrl, 'eng');
      return text.toLowerCase();
    } catch (e) {
      return "";
    }
  }

  // 4. MAIN VERIFICATION LOGIC
  window.submitAutoKYC = async function() {
    if (!currentUser) { showToast("Pehle login karein!"); return; }

    const fullName = document.getElementById('kyc-fullname').value.trim();
    const frontImg = document.getElementById('kyc-front-preview').src;
    const selfieImg = document.getElementById('kyc-selfie-preview').src;

    if (!fullName || !frontImg || !selfieImg || frontImg.includes('hidden') || selfieImg.includes('hidden')) {
      showToast("❌ Sabhi photos aur details bharein!");
      return;
    }

    // Button ko loading state mein dalein
    const submitBtn = document.querySelector('button[onclick="submitKYC()"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> AI Checking...';
    }

    try {
      await loadAIModels();
      
      showToast("⏳ Chehra match ho raha hai...");
      const isFaceMatch = await compareFaces(selfieImg, frontImg);

      showToast("⏳ ID Card se naam padha ja raha hai...");
      const idText = await extractNameFromID(frontImg);
      
      // Naam check (Flexible: Agar naam ka koi bhi word match ho jaye)
      const nameParts = fullName.toLowerCase().split(' ');
      const nameFound = nameParts.some(part => part.length > 3 && idText.includes(part));

      let status = "Rejected";
      let message = "❌ KYC Failed: ";

      if (isFaceMatch && nameFound) {
        status = "Approved";
        message = "✅ KYC Approved! Aap verify ho gaye hain.";
      } else if (!isFaceMatch && !nameFound) {
        message += "Chehra aur Naam dono match nahi hue.";
      } else if (!isFaceMatch) {
        message += "Selfie aur ID card ka chehra match nahi hua.";
      } else {
        message += "ID card par aapka naam nahi mila.";
      }

      // Database mein save karein
      const cleanUser = formatHandle(currentUser);
      await db.collection("kyc").doc(cleanUser).set({
        username: cleanUser,
        fullName: fullName,
        front: frontImg,
        selfie: selfieImg,
        status: status,
        aiVerified: true,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await db.collection("users").doc(cleanUser).set({ kycVerified: status === "Approved" }, { merge: true });

      // Notification bhejein
      await db.collection("dm_messages").add({
        chatKey: [cleanUser, 'Super App Official'].sort().join(':'),
        sender: 'Super App Official',
        receiver: cleanUser,
        text: message,
        time: new Date().toLocaleTimeString(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert(message);
      closeModal('kycModal');
      loadUserData(); // Profile update karne ke liye

    } catch (e) {
      console.error("KYC Error:", e);
      showToast("❌ Error: " + e.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit KYC';
      }
    }
  };

  // Purane submitKYC function ko override karein
  window.submitKYC = window.submitAutoKYC;

  console.log("🤖 Real AI KYC System Ready.");
})();
