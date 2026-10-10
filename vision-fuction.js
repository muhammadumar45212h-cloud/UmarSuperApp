/* ═══════════════════════════════════════════════════════════════
   FIREBASE FUNCTION — Cloud Vision Proxy
   
   Firebase mein deploy karein:
   firebase deploy --only functions
   ═══════════════════════════════════════════════════════════════ */

const functions = require('firebase-functions');
const vision = require('@google-cloud/vision');

const client = new vision.ImageAnnotatorClient();

exports.moderateImage = functions.https.onRequest(async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  try {
    const base64 = req.body.image;
    if (!base64) {
      res.status(400).json({ error: 'No image' });
      return;
    }

    // Cloud Vision SafeSearch
    const [result] = await client.safeSearchDetection({
      image: { content: base64 }
    });

    const annotation = result.safeSearchAnnotation;
    const adult = annotation.adult || 'UNKNOWN';
    const violence = annotation.violence || 'UNKNOWN';
    const racy = annotation.racy || 'UNKNOWN';

    // Block if LIKELY or VERY_LIKELY
    const isAdult = ['LIKELY', 'VERY_LIKELY'].includes(adult);
    const isViolence = ['LIKELY', 'VERY_LIKELY'].includes(violence);
    const isRacy = ['VERY_LIKELY'].includes(racy);

    res.json({
      safe: !(isAdult || isViolence || isRacy),
      adult,
      violence,
      racy,
      medical: annotation.medical,
      spoof: annotation.spoof
    });
  } catch(e) {
    console.error('Moderation error:', e);
    res.status(500).json({ error: e.message, safe: true });
  }
});
