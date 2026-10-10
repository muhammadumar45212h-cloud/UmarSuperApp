/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - MP4X.JS
   Real MP4 video export (universal format)
   Add: <script src="mp4x.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  function toast(msg) {
    if (typeof window.showToast === 'function') return window.showToast(msg);
    const t = document.getElementById('toast-notification');
    if (!t) { console.log(msg); return; }
    document.getElementById('toast-message').innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // ═══════════════════════════════════════════════════════════════
  // LOAD MP4-MUXER (Real MP4 encoder)
  // ═══════════════════════════════════════════════════════════════
  if (!window.Mp4Muxer) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mp4-muxer@2.4.2/build/mp4-muxer.min.js';
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════════
  // WEBCODECS CHECK
  // ═══════════════════════════════════════════════════════════════
  function isCodecSupported(codec, width, height, bitrate) {
    if (typeof VideoEncoder === 'undefined') return Promise.resolve(false);
    return VideoEncoder.isConfigSupported({
      codec: codec,
      width: width,
      height: height,
      bitrate: bitrate
    }).then(res => res.supported).catch(() => false);
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORT VIDEO AS MP4 (Real, universal)
  // ═══════════════════════════════════════════════════════════════
  window.__exportMp4 = async function(options) {
    const opts = options || {};
    const videoEl = opts.video || document.getElementById('editor-video');
    if (!videoEl) {
      toast('❌ Video source nahi mila');
      return null;
    }

    const startTime = opts.startTime || 0;
    const endTime = opts.endTime || videoEl.duration;
    const stickers = opts.stickers || (window.Editor?.stickers || []);
    const texts = opts.texts || (window.Editor?.texts || []);
    const filter = opts.filter || (window.Editor?.filter || 'none');
    const rotation = opts.rotation || (window.Editor?.rotation || 0);
    const speed = opts.speed || (window.Editor?.speed || 1);
    const quality = opts.quality || 'medium'; // 'low' | 'medium' | 'high'

    const qualitySettings = {
      low: { bitrate: 1000000, fps: 24, scale: 0.5 },
      medium: { bitrate: 2500000, fps: 30, scale: 0.75 },
      high: { bitrate: 5000000, fps: 30, scale: 1 }
    };

    const q = qualitySettings[quality];

    // Show progress
    showExportProgress(0, 'Initializing...');

    try {
      // Wait for mp4-muxer to load
      if (!window.Mp4Muxer) {
        await new Promise(r => setTimeout(r, 2000));
      }

      if (!window.Mp4Muxer) {
        throw new Error('MP4 encoder load nahi hua');
      }

      // ═══ 1. Setup canvas ═══
      const width = Math.floor((videoEl.videoWidth || 720) * q.scale);
      const height = Math.floor((videoEl.videoHeight || 1280) * q.scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      // ═══ 2. Setup MP4 muxer ═══
      const muxer = new window.Mp4Muxer.Muxer({
        target: new window.Mp4Muxer.ArrayBufferTarget(),
        video: {
          codec: 'avc', // H.264 (universal MP4 codec)
          width: width,
          height: height
        },
        audio: opts.includeAudio !== false ? {
          codec: 'aac',
          numberOfChannels: 2,
          sampleRate: 44100
        } : undefined,
        fastStart: 'in-memory'
      });

      // ═══ 3. Setup video encoder ═══
      const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error('Video encoder error:', e)
      });

      videoEncoder.configure({
        codec: 'avc1.640028', // H.264 High Profile Level 4.0
        width: width,
        height: height,
        bitrate: q.bitrate,
        framerate: q.fps
      });

      // ═══ 4. Setup audio encoder (optional) ═══
      let audioEncoder = null;
      if (opts.includeAudio !== false) {
        try {
          // Get audio from video
          if (videoEl.captureStream) {
            const videoStream = videoEl.captureStream();
            const audioTracks = videoStream.getAudioTracks();
            
            if (audioTracks.length > 0) {
              // Use MediaRecorder for audio only
              // Note: WebCodecs audio encoding needs specific setup
              // For simplicity, we'll note audio is skipped in WebCodecs fallback
            }
          }
        } catch(e) {}
      }

      // ═══ 5. Draw frame function ═══
      let frameCount = 0;
      const totalFrames = Math.floor((endTime - startTime) * q.fps);

      function drawFrame() {
        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Apply rotation
        if (rotation !== 0) {
          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-width / 2, -height / 2);
        }

        // Apply filter
        const filterMap = {
          'grayscale': 'grayscale(100%)',
          'sepia': 'sepia(100%)',
          'vivid': 'saturate(150%) contrast(110%)',
          'cool': 'hue-rotate(180deg)',
          'warm': 'sepia(40%) saturate(140%)',
          'vintage': 'sepia(60%) contrast(120%) brightness(90%)',
          'dramatic': 'contrast(150%) brightness(80%)',
          'fade': 'opacity(0.85) contrast(80%)',
          'neon': 'saturate(200%) hue-rotate(45deg) contrast(120%)',
          'invert': 'invert(100%)',
          'blur': 'blur(3px)'
        };

        ctx.filter = filterMap[filter] || 'none';

        // Draw video
        try {
          ctx.drawImage(videoEl, 0, 0, width, height);
        } catch(e) {
          console.warn('Draw error:', e);
        }

        ctx.filter = 'none';

        // Draw stickers
        stickers.forEach(s => {
          ctx.save();
          const px = (s.x / 100) * width;
          const py = (s.y / 100) * height;
          ctx.translate(px, py);
          ctx.rotate((s.rotation || 0) * Math.PI / 180);
          ctx.font = `${s.size * q.scale}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(s.emoji, 0, 0);
          ctx.restore();
        });

        // Draw texts
        texts.forEach(t => {
          ctx.save();
          const px = (t.x / 100) * width;
          const py = (t.y / 100) * height;
          ctx.font = `bold ${t.size * q.scale}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = t.color;
          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.lineWidth = 4;
          ctx.strokeText(t.text, px, py);
          ctx.fillText(t.text, px, py);
          ctx.restore();
        });

        if (rotation !== 0) ctx.restore();
      }

      // ═══ 6. Encode frames ═══
      videoEl.currentTime = startTime;
      videoEl.muted = true;
      await new Promise(r => videoEl.onseeked = r);

      let currentTime = startTime;
      const frameInterval = 1 / q.fps;

      while (currentTime < endTime) {
        // Seek
        videoEl.currentTime = currentTime;
        await new Promise(r => videoEl.onseeked = r);

        // Draw
        drawFrame();

        // Create VideoFrame
        const timestamp = Math.floor((currentTime - startTime) * 1000000); // microseconds
        const frame = new VideoFrame(canvas, {
          timestamp: timestamp,
          duration: Math.floor(frameInterval * 1000000)
        });

        // Encode
        videoEncoder.encode(frame, { keyFrame: frameCount % (q.fps * 2) === 0 });
        frame.close();

        frameCount++;
        currentTime += frameInterval;

        // Progress
        if (frameCount % 5 === 0) {
          const pct = Math.min(95, Math.floor((frameCount / totalFrames) * 95));
          showExportProgress(pct, `Encoding frame ${frameCount}/${totalFrames}`);
        }
      }

      // ═══ 7. Finalize ═══
      showExportProgress(96, 'Finalizing...');
      await videoEncoder.flush();
      videoEncoder.close();
      
      muxer.finalize();

      // ═══ 8. Get file ═══
      const { buffer } = muxer.target;
      const blob = new Blob([buffer], { type: 'video/mp4' });
      
      showExportProgress(100, '✅ Done!');
      
      setTimeout(() => {
        hideExportProgress();
        
        // Auto-download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `super_sphere_${Date.now()}.mp4`;
        a.click();
        
        // Store for upload
        window.__exportedMp4Blob = blob;
        
        toast('✅ MP4 export complete!');
      }, 800);

      return blob;

    } catch(e) {
      console.error('MP4 export error:', e);
      hideExportProgress();
      toast('❌ MP4 export fail: ' + e.message);
      
      // Fallback to WebM
      toast('⚠️ Trying WebM fallback...');
      return await fallbackWebM(opts);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FALLBACK: WebM (Agar MP4 fail ho)
  // ═══════════════════════════════════════════════════════════════
  async function fallbackWebM(options) {
    const opts = options || {};
    const videoEl = opts.video || document.getElementById('editor-video');
    if (!videoEl) return null;

    const startTime = opts.startTime || 0;
    const endTime = opts.endTime || videoEl.duration;
    const stickers = opts.stickers || (window.Editor?.stickers || []);
    const texts = opts.texts || (window.Editor?.texts || []);
    const filter = opts.filter || (window.Editor?.filter || 'none');
    const rotation = opts.rotation || (window.Editor?.rotation || 0);
    const speed = opts.speed || 1;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 720;
      canvas.height = videoEl.videoHeight || 1280;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(30);
      
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm;codecs=vp8';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000
      });

      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);

      return new Promise((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          window.__exportedMp4Blob = blob;
          toast('✅ WebM export complete');
          resolve(blob);
        };

        recorder.start();
        videoEl.currentTime = startTime;
        videoEl.muted = true;
        videoEl.play();

        const draw = () => {
          if (videoEl.currentTime >= endTime || videoEl.ended) {
            videoEl.pause();
            recorder.stop();
            return;
          }

          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (rotation !== 0) {
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
          }

          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

          if (rotation !== 0) ctx.restore();

          // Stickers
          stickers.forEach(s => {
            const px = (s.x / 100) * canvas.width;
            const py = (s.y / 100) * canvas.height;
            ctx.font = `${s.size}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(s.emoji, px, py);
          });

          // Texts
          texts.forEach(t => {
            const px = (t.x / 100) * canvas.width;
            const py = (t.y / 100) * canvas.height;
            ctx.font = `bold ${t.size}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = t.color;
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = 4;
            ctx.strokeText(t.text, px, py);
            ctx.fillText(t.text, px, py);
          });

          requestAnimationFrame(draw);
        };

        draw();
      });
    } catch(e) {
      toast('❌ Export fail');
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PROGRESS UI
  // ═══════════════════════════════════════════════════════════════
  function showExportProgress(pct, status) {
    if (!document.getElementById('mp4-export-progress')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="mp4-export-progress" class="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-6">
          <div class="w-full max-w-md bg-gray-900 border-2 border-cyan-500/40 rounded-2xl p-6 space-y-4">
            <div class="text-center">
              <div class="text-5xl mb-3">🎬</div>
              <h2 class="text-base font-bold text-cyan-400">Exporting MP4 Video</h2>
              <p class="text-xs text-gray-400 mt-1" id="mp4-status">Please wait...</p>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-5 overflow-hidden">
              <div id="mp4-fill" class="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-200" style="width:0%"></div>
            </div>
            <p class="text-3xl font-extrabold text-cyan-400 text-center" id="mp4-pct">0%</p>
            <p class="text-[10px] text-center text-gray-500">Don't close the app</p>
          </div>
        </div>
      `);
    }

    const fill = document.getElementById('mp4-fill');
    const pctEl = document.getElementById('mp4-pct');
    const statusEl = document.getElementById('mp4-status');

    if (fill) fill.style.width = pct + '%';
    if (pctEl) pctEl.innerText = pct + '%';
    if (statusEl && status) statusEl.innerText = status;
  }

  function hideExportProgress() {
    setTimeout(() => {
      document.getElementById('mp4-export-progress')?.remove();
    }, 1500);
  }

  // ═══════════════════════════════════════════════════════════════
  // HOOK INTO EXISTING EXPORT (Override)
  // ═══════════════════════════════════════════════════════════════
  const originalExport = window.exportVideo;
  window.exportVideo = async function() {
    const video = document.getElementById('editor-video');
    if (!video) return;

    const result = await window.__exportMp4({
      video: video,
      startTime: window.Editor?.trimStart || 0,
      endTime: window.Editor?.trimEnd || video.duration,
      stickers: window.Editor?.stickers || [],
      texts: window.Editor?.texts || [],
      filter: window.Editor?.filter || 'none',
      rotation: window.Editor?.rotation || 0,
      speed: window.Editor?.speed || 1,
      quality: 'medium',
      includeAudio: true
    });

    if (result) {
      // Close editor
      if (typeof closeModal === 'function') closeModal('videoEditorModal');
      
      // Open hashtag/post modal
      if (typeof window.openHashtagModal === 'function') {
        window.openHashtagModal(result);
      }
    }

    return result;
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  console.log('✅ mp4x.js loaded — Real MP4 export active');

  window.__MP4X__ = {
    exportMp4: window.__exportMp4,
    fallbackWebM,
    isCodecSupported
  };
})();
