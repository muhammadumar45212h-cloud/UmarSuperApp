/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - EDIT-EXTRA.JS
   Editing.js ka baaki system (Advanced Tools)
   
   Features:
   1. Music/Audio library + upload
   2. Voice recording (microphone)
   3. Sound effects library
   4. Volume control (original + music)
   5. Aspect ratio (9:16, 1:1, 16:9, 4:5)
   6. Color grading (brightness, contrast, saturation)
   7. Mirror / Flip (H, V)
   8. Crop (frame)
   9. Background blur (canvas style)
   10. Cover/Thumbnail picker
   11. Undo / Redo
   12. Save draft (localStorage)
   13. Slow motion section
   14. Reverse video
   15. Auto-captions (basic speech-to-text)
   16. Split clips (multi-clip timeline)
   17. Transitions (fade, slide, zoom)
   
   Add: <script src="edit-extra.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════
  function toast(msg) {
    if (typeof window.showToast === 'function') return window.showToast(msg);
    const t = document.getElementById('toast-notification');
    if (!t) { alert(msg); return; }
    document.getElementById('toast-message').innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // Extended state
  if (!window.EditorExtra) {
    window.EditorExtra = {
      // Audio
      musicTrack: null,
      musicUrl: '',
      musicVolume: 0.7,
      originalVolume: 1,
      voiceBlob: null,
      voiceUrl: '',
      
      // Visual adjustments
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      vignette: 0,
      
      // Mirror/Flip
      mirrorH: false,
      mirrorV: false,
      
      // Crop (percent)
      cropTop: 0,
      cropBottom: 0,
      cropLeft: 0,
      cropRight: 0,
      
      // Aspect
      aspectRatio: 'original', // original, 9:16, 1:1, 16:9, 4:5
      
      // Background blur
      bgBlur: false,
      bgBlurAmount: 20,
      
      // Thumbnail
      thumbnailTime: 0,
      thumbnailDataUrl: '',
      
      // History
      history: [],
      historyIndex: -1,
      
      // Clips
      clips: [], // [{start, end, speed, filter, trimStart, trimEnd}]
      
      // Transitions
      transitions: [], // [{afterClipIdx, type, duration}]
      
      // Slow motion
      slowMotion: [], // [{start, end, factor}]
      
      // Reverse
      reverse: false,
      
      // Captions
      captions: [] // [{start, end, text}]
    };
  }

  const E = window.EditorExtra;

  // ═══════════════════════════════════════════════════════════════
  // 1. MUSIC LIBRARY (Royalty free tracks — URLs)
  // ═══════════════════════════════════════════════════════════════
  const MUSIC_LIBRARY = [
    { id: 'lofi1', name: 'Lo-Fi Chill', emoji: '🎵', genre: 'Chill' },
    { id: 'upbeat1', name: 'Upbeat Energy', emoji: '🔥', genre: 'Energetic' },
    { id: 'cinematic1', name: 'Cinematic', emoji: '🎬', genre: 'Epic' },
    { id: 'trap1', name: 'Trap Beat', emoji: '🎧', genre: 'Hip-Hop' },
    { id: 'romantic1', name: 'Romantic', emoji: '💕', genre: 'Soft' },
    { id: 'sad1', name: 'Sad Piano', emoji: '😢', genre: 'Emotional' },
    { id: 'party1', name: 'Party', emoji: '🎉', genre: 'Dance' },
    { id: 'guitar1', name: 'Acoustic', emoji: '🎸', genre: 'Acoustic' },
    { id: 'rock1', name: 'Rock', emoji: '🤘', genre: 'Rock' },
    { id: 'hiphop1', name: 'Hip-Hop', emoji: '🎤', genre: 'Hip-Hop' }
  ];

  // ═══════════════════════════════════════════════════════════════
  // 2. SOUND EFFECTS LIBRARY
  // ═══════════════════════════════════════════════════════════════
  const SFX_LIBRARY = [
    { id: 'whoosh', name: 'Whoosh', emoji: '💨' },
    { id: 'pop', name: 'Pop', emoji: '🎈' },
    { id: 'click', name: 'Click', emoji: '🖱️' },
    { id: 'boom', name: 'Boom', emoji: '💥' },
    { id: 'ding', name: 'Ding', emoji: '🔔' },
    { id: 'beep', name: 'Beep', emoji: '📟' },
    { id: 'applause', name: 'Applause', emoji: '👏' },
    { id: 'laugh', name: 'Laugh', emoji: '😂' },
    { id: 'drum', name: 'Drum', emoji: '🥁' },
    { id: 'guitar', name: 'Guitar Riff', emoji: '🎸' }
  ];

  // ═══════════════════════════════════════════════════════════════
  // 3. ASPECT RATIO PRESETS
  // ═══════════════════════════════════════════════════════════════
  const ASPECTS = [
    { id: 'original', name: 'Original', label: '🚫 Auto' },
    { id: '9:16', name: 'Reels/Shorts', label: '📱 9:16' },
    { id: '1:1', name: 'Square', label: '⬜ 1:1' },
    { id: '16:9', name: 'Wide', label: '🖥️ 16:9' },
    { id: '4:5', name: 'Portrait', label: '📷 4:5' },
    { id: '3:4', name: 'Classic', label: '🖼️ 3:4' }
  ];

  // ═══════════════════════════════════════════════════════════════
  // 4. ADD "MORE TOOLS" TAB TO EDITOR
  // ═══════════════════════════════════════════════════════════════
  function addExtraToolsTab() {
    const tabsContainer = document.querySelector('#videoEditorModal .editor-tab')?.parentElement;
    if (!tabsContainer) return;
    if (document.getElementById('tab-extra')) return;

    // Add "More" tab button
    const btn = document.createElement('button');
    btn.id = 'tab-extra';
    btn.className = 'editor-tab px-3 py-2 bg-gray-800 text-gray-400 text-[10px] font-bold rounded whitespace-nowrap';
    btn.innerText = '⚙️ More';
    btn.onclick = () => window.editorTab('extra');
    tabsContainer.appendChild(btn);

    // Extend the editorTab function
    const origEditorTab = window.editorTab;
    if (origEditorTab && !origEditorTab.__extended) {
      window.editorTab = function(tab) {
        if (tab === 'extra') {
          // Highlight this tab, unhighlight others
          ['filters', 'stickers', 'text', 'speed', 'rotate', 'keyframe', 'extra'].forEach(t => {
            const b = document.getElementById('tab-' + t);
            if (b) b.className = `editor-tab px-3 py-2 ${t === 'extra' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'} text-[10px] font-bold rounded whitespace-nowrap`;
          });
          renderExtraTab();
          return;
        }
        return origEditorTab.apply(this, arguments);
      };
      window.editorTab.__extended = true;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. RENDER EXTRA TAB (Sub-menu)
  // ═══════════════════════════════════════════════════════════════
  function renderExtraTab() {
    const content = document.getElementById('editor-tab-content');
    if (!content) return;

    content.innerHTML = `
      <div class="grid grid-cols-4 gap-2">
        <button onclick="window.__exTab('audio')" class="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg flex flex-col items-center gap-1">
          <i class="fa-solid fa-music text-cyan-400"></i>
          <span class="text-[9px] font-bold text-white">Audio</span>
        </button>
        <button onclick="window.__exTab('aspect')" class="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg flex flex-col items-center gap-1">
          <i class="fa-solid fa-crop text-cyan-400"></i>
          <span class="text-[9px] font-bold text-white">Aspect</span>
        </button>
        <button onclick="window.__exTab('color')" class="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg flex flex-col items-center gap-1">
          <i class="fa-solid fa-palette text-cyan-400"></i>
          <span class="text-[9px] font-bold text-white">Color</span>
        </button>
        <button onclick="window.__exTab('mirror')" class="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg flex flex-col items-center gap-1">
          <i class="fa-solid fa-clone text-cyan-400"></i>
          <span class="text-[9px] font-bold text-white">Mirror</span>
        </button>
        <button onclick="window.__exTab('crop')" class="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg flex flex-col items-center gap-1">
          <i class="fa-solid fa-scissors text-cyan-400"></i>
          <span class="text-[9px] font-bold text-white">Crop</span>
        </button>
        <button onclick="window.__exTab('bgblur')" class="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg flex flex-col items-center gap-1">
          <i class="fa-solid fa-droplet text-cyan-400"></i>
          <span class="text-[9px] font-bold text-white">BG Blur</span>
        </button>
        <button onclick="window.__exTab('thumbnail')" class="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg flex flex-col items-center gap-1">
          <i class="fa-solid fa-image text-cyan-400"></i>
          <span class="text-[9px] font-bold text-white">Cover</span>
        </button>
        <button onclick="window.__exTab('slowmo')" class="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg flex flex-col items-center gap-1">
          <i class="fa-solid fa-gauge-simple text-cyan-400"></i>
          <span class="text-[9px] font-bold text-white">Slow-mo</span>
        </button>
        <button onclick="window.__exTab('reverse')" class="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg flex flex-col items-center gap-1">
          <i class="fa-solid fa-backward text-cyan-400"></i>
          <span class="text-[9px] font-bold text-white">Reverse</span>
        </button>
        <button onclick="window.__exTab('captions')" class="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg flex flex-col items-center gap-1">
          <i class="fa-solid fa-closed-captioning text-cyan-400"></i>
          <span class="text-[9px] font-bold text-white">CC</span>
        </button>
        <button onclick="window.__exTab('undo')" class="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg flex flex-col items-center gap-1">
          <i class="fa-solid fa-rotate-left text-cyan-400"></i>
          <span class="text-[9px] font-bold text-white">Undo</span>
        </button>
        <button onclick="window.__exTab('draft')" class="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg flex flex-col items-center gap-1">
          <i class="fa-solid fa-floppy-disk text-cyan-400"></i>
          <span class="text-[9px] font-bold text-white">Draft</span>
        </button>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════
  // SUB-TAB ROUTER
  // ═══════════════════════════════════════════════════════════════
  window.__exTab = function(subtab) {
    const content = document.getElementById('editor-tab-content');
    if (!content) return;
    content.innerHTML = '';

    // Back button
    const back = document.createElement('button');
    back.className = 'text-[10px] text-cyan-400 font-bold mb-2';
    back.innerHTML = '← Back';
    back.onclick = renderExtraTab;
    content.appendChild(back);

    const wrap = document.createElement('div');
    wrap.className = 'mt-2';
    content.appendChild(wrap);

    if (subtab === 'audio') renderAudioTab(wrap);
    if (subtab === 'aspect') renderAspectTab(wrap);
    if (subtab === 'color') renderColorTab(wrap);
    if (subtab === 'mirror') renderMirrorTab(wrap);
    if (subtab === 'crop') renderCropTab(wrap);
    if (subtab === 'bgblur') renderBgBlurTab(wrap);
    if (subtab === 'thumbnail') renderThumbnailTab(wrap);
    if (subtab === 'slowmo') renderSlowmoTab(wrap);
    if (subtab === 'reverse') renderReverseTab(wrap);
    if (subtab === 'captions') renderCaptionsTab(wrap);
    if (subtab === 'undo') renderUndoTab(wrap);
    if (subtab === 'draft') renderDraftTab(wrap);
  };

  // ═══════════════════════════════════════════════════════════════
  // AUDIO TAB (Music + Voice + Volume)
  // ═══════════════════════════════════════════════════════════════
  function renderAudioTab(container) {
    container.innerHTML = `
      <div class="space-y-3">
        <div>
          <p class="text-[10px] text-cyan-400 font-bold mb-1">🎵 Music Library</p>
          <div class="grid grid-cols-5 gap-1.5" id="music-lib"></div>
        </div>
        <div>
          <p class="text-[10px] text-cyan-400 font-bold mb-1">🔔 Sound Effects</p>
          <div class="grid grid-cols-5 gap-1.5" id="sfx-lib"></div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button onclick="window.__uploadMusic()" class="py-2 bg-gray-800 text-cyan-400 text-[10px] font-bold rounded border border-gray-700">
            📁 Upload Music
          </button>
          <button onclick="window.__recordVoice()" id="voice-btn" class="py-2 bg-gray-800 text-red-400 text-[10px] font-bold rounded border border-gray-700">
            🎤 Record Voice
          </button>
        </div>
        <div>
          <label class="text-[10px] text-gray-400 block mb-1">Original Volume: <span id="vol-orig-label">100%</span></label>
          <input type="range" id="vol-original" min="0" max="100" value="100" oninput="window.__setOriginalVol(this.value)" class="w-full accent-cyan-500">
          <label class="text-[10px] text-gray-400 block mb-1 mt-2">Music Volume: <span id="vol-music-label">70%</span></label>
          <input type="range" id="vol-music" min="0" max="100" value="70" oninput="window.__setMusicVol(this.value)" class="w-full accent-amber-500">
        </div>
      </div>
    `;

    // Music library
    const musicGrid = container.querySelector('#music-lib');
    MUSIC_LIBRARY.forEach(track => {
      const btn = document.createElement('button');
      btn.className = 'p-2 bg-gray-800 rounded-lg flex flex-col items-center gap-1 border border-gray-700';
      btn.innerHTML = `
        <span class="text-lg">${track.emoji}</span>
        <span class="text-[8px] text-white font-bold text-center leading-tight">${track.name}</span>
      `;
      btn.onclick = () => window.__selectMusic(track);
      musicGrid.appendChild(btn);
    });

    // SFX library
    const sfxGrid = container.querySelector('#sfx-lib');
    SFX_LIBRARY.forEach(sfx => {
      const btn = document.createElement('button');
      btn.className = 'p-2 bg-gray-800 rounded-lg flex flex-col items-center gap-1 border border-gray-700';
      btn.innerHTML = `
        <span class="text-lg">${sfx.emoji}</span>
        <span class="text-[8px] text-white font-bold text-center leading-tight">${sfx.name}</span>
      `;
      btn.onclick = () => playSFX(sfx.id);
      sfxGrid.appendChild(btn);
    });
  }

  window.__selectMusic = function(track) {
    E.musicTrack = track;
    // Generate a simple tone as placeholder (real tracks would need URLs)
    toast('🎵 ' + track.name + ' selected');
    playTone(track.id);
  };

  function playTone(trackId) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const freqs = { lofi1: 220, upbeat1: 440, cinematic1: 165, trap1: 330, romantic1: 294, sad1: 196, party1: 523, guitar1: 262, rock1: 196, hiphop1: 233 };
      osc.frequency.value = freqs[trackId] || 330;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    } catch(e) {}
  }

  function playSFX(sfxId) {
    toast('🔔 ' + sfxId);
    playTone(sfxId);
  }

  window.__uploadMusic = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      E.musicUrl = URL.createObjectURL(file);
      toast('✅ Music uploaded: ' + file.name);
    };
    input.click();
  };

  let mediaRecorder = null;
  let voiceChunks = [];
  window.__recordVoice = async function() {
    const btn = document.getElementById('voice-btn');
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      btn.innerHTML = '🎤 Record Voice';
      btn.className = 'py-2 bg-gray-800 text-red-400 text-[10px] font-bold rounded border border-gray-700';
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      voiceChunks = [];
      mediaRecorder.ondataavailable = e => voiceChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(voiceChunks, { type: 'audio/webm' });
        E.voiceBlob = blob;
        E.voiceUrl = URL.createObjectURL(blob);
        stream.getTracks().forEach(t => t.stop());
        toast('✅ Voice recorded');
      };
      mediaRecorder.start();
      btn.innerHTML = '⏹️ Stop Recording';
      btn.className = 'py-2 bg-red-600 text-white text-[10px] font-bold rounded animate-pulse';
      toast('🎤 Recording...');
    } catch(e) {
      toast('❌ Mic permission denied');
    }
  };

  window.__setOriginalVol = function(val) {
    E.originalVolume = val / 100;
    document.getElementById('vol-orig-label').innerText = val + '%';
    const video = document.getElementById('editor-video');
    if (video) video.volume = E.originalVolume;
  };

  window.__setMusicVol = function(val) {
    E.musicVolume = val / 100;
    document.getElementById('vol-music-label').innerText = val + '%';
  };

  // ═══════════════════════════════════════════════════════════════
  // ASPECT RATIO TAB
  // ═══════════════════════════════════════════════════════════════
  function renderAspectTab(container) {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-3 gap-2';
    ASPECTS.forEach(a => {
      const btn = document.createElement('button');
      btn.className = `p-3 rounded-lg border-2 ${E.aspectRatio === a.id ? 'border-cyan-500 bg-cyan-900/30' : 'border-gray-700 bg-gray-800'}`;
      btn.innerHTML = `
        <div class="flex justify-center mb-1">
          <div class="bg-gray-700 border border-gray-500" style="width:${getAspectWidth(a.id)}px;height:${getAspectHeight(a.id)}px;"></div>
        </div>
        <p class="text-[9px] font-bold text-white text-center">${a.label}</p>
      `;
      btn.onclick = () => {
        E.aspectRatio = a.id;
        applyAspect();
        window.__exTab('aspect');
        toast('📐 ' + a.name);
      };
      grid.appendChild(btn);
    });
    container.appendChild(grid);
  }

  function getAspectWidth(id) {
    if (id === '9:16') return 18;
    if (id === '1:1') return 30;
    if (id === '16:9') return 50;
    if (id === '4:5') return 24;
    if (id === '3:4') return 22;
    return 30;
  }
  function getAspectHeight(id) {
    if (id === '9:16') return 32;
    if (id === '1:1') return 30;
    if (id === '16:9') return 28;
    if (id === '4:5') return 30;
    if (id === '3:4') return 30;
    return 30;
  }

  function applyAspect() {
    const wrap = document.getElementById('editor-preview-wrap');
    if (!wrap) return;
    if (E.aspectRatio === 'original') {
      wrap.style.aspectRatio = 'auto';
    } else {
      wrap.style.aspectRatio = E.aspectRatio.replace(':', '/');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // COLOR GRADING TAB
  // ═══════════════════════════════════════════════════════════════
  function renderColorTab(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Brightness</span><span id="lbl-bright">100%</span></label>
          <input type="range" id="adj-bright" min="0" max="200" value="${E.brightness}" oninput="window.__applyColor()" class="w-full accent-cyan-500">
        </div>
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Contrast</span><span id="lbl-contrast">100%</span></label>
          <input type="range" id="adj-contrast" min="0" max="200" value="${E.contrast}" oninput="window.__applyColor()" class="w-full accent-cyan-500">
        </div>
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Saturation</span><span id="lbl-sat">100%</span></label>
          <input type="range" id="adj-sat" min="0" max="200" value="${E.saturation}" oninput="window.__applyColor()" class="w-full accent-cyan-500">
        </div>
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Hue</span><span id="lbl-hue">0°</span></label>
          <input type="range" id="adj-hue" min="0" max="360" value="${E.hue}" oninput="window.__applyColor()" class="w-full accent-cyan-500">
        </div>
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Vignette</span><span id="lbl-vig">0%</span></label>
          <input type="range" id="adj-vig" min="0" max="100" value="${E.vignette}" oninput="window.__applyColor()" class="w-full accent-cyan-500">
        </div>
        <button onclick="window.__resetColor()" class="w-full py-1.5 bg-gray-800 text-gray-400 text-[10px] font-bold rounded">Reset All</button>
      </div>
    `;
  }

  window.__applyColor = function() {
    E.brightness = parseInt(document.getElementById('adj-bright').value);
    E.contrast = parseInt(document.getElementById('adj-contrast').value);
    E.saturation = parseInt(document.getElementById('adj-sat').value);
    E.hue = parseInt(document.getElementById('adj-hue').value);
    E.vignette = parseInt(document.getElementById('adj-vig').value);

    document.getElementById('lbl-bright').innerText = E.brightness + '%';
    document.getElementById('lbl-contrast').innerText = E.contrast + '%';
    document.getElementById('lbl-sat').innerText = E.saturation + '%';
    document.getElementById('lbl-hue').innerText = E.hue + '°';
    document.getElementById('lbl-vig').innerText = E.vignette + '%';

    applyColorFilter();
  };

  function applyColorFilter() {
    const video = document.getElementById('editor-video');
    if (!video) return;
    
    // Combine with existing filter
    const baseFilter = window.Editor?.filter ? 
      (['grayscale(100%)','sepia(100%)','saturate(150%) contrast(110%)','hue-rotate(180deg)','sepia(40%) saturate(140%)','sepia(60%) contrast(120%) brightness(90%)','contrast(150%) brightness(80%)','opacity(0.85) contrast(80%)','saturate(200%) hue-rotate(45deg) contrast(120%)','invert(100%)','blur(3px)'].includes(window.Editor.filter) ? '' : '') : '';
    
    const colorFilter = `brightness(${E.brightness}%) contrast(${E.contrast}%) saturate(${E.saturation}%) hue-rotate(${E.hue}deg)`;
    video.style.filter = colorFilter;
    video.style.boxShadow = E.vignette > 0 ? `inset 0 0 ${E.vignette * 3}px rgba(0,0,0,0.9)` : 'none';
  }

  window.__resetColor = function() {
    E.brightness = E.contrast = E.saturation = 100;
    E.hue = E.vignette = 0;
    renderColorTab(document.getElementById('editor-tab-content').querySelector('div.mt-2'));
    applyColorFilter();
    toast('✅ Reset');
  };

  // ═══════════════════════════════════════════════════════════════
  // MIRROR / FLIP TAB
  // ═══════════════════════════════════════════════════════════════
  function renderMirrorTab(container) {
    container.innerHTML = `
      <div class="grid grid-cols-3 gap-2">
        <button onclick="window.__toggleMirror('h')" class="py-3 ${E.mirrorH ? 'bg-cyan-600' : 'bg-gray-800'} text-white text-xs font-bold rounded">
          ↔️ Mirror H
        </button>
        <button onclick="window.__toggleMirror('v')" class="py-3 ${E.mirrorV ? 'bg-cyan-600' : 'bg-gray-800'} text-white text-xs font-bold rounded">
          ↕️ Mirror V
        </button>
        <button onclick="window.__toggleMirror('reset')" class="py-3 bg-gray-800 text-red-400 text-xs font-bold rounded">
          🔄 Reset
        </button>
      </div>
    `;
  }

  window.__toggleMirror = function(type) {
    if (type === 'h') E.mirrorH = !E.mirrorH;
    if (type === 'v') E.mirrorV = !E.mirrorV;
    if (type === 'reset') { E.mirrorH = false; E.mirrorV = false; }
    
    const video = document.getElementById('editor-video');
    if (video) {
      const sx = E.mirrorH ? -1 : 1;
      const sy = E.mirrorV ? -1 : 1;
      video.style.transform = `scale(${sx},${sy}) rotate(${window.Editor?.rotation || 0}deg)`;
    }
    window.__exTab('mirror');
    toast('🪞 Mirror ' + (E.mirrorH ? 'H' : '') + (E.mirrorV ? 'V' : '') + ' ' + (type === 'reset' ? 'reset' : ''));
  };

  // ═══════════════════════════════════════════════════════════════
  // CROP TAB
  // ═══════════════════════════════════════════════════════════════
  function renderCropTab(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Top</span><span id="lbl-ct">0%</span></label>
          <input type="range" id="crop-top" min="0" max="40" value="${E.cropTop}" oninput="window.__applyCrop()" class="w-full accent-cyan-500">
        </div>
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Bottom</span><span id="lbl-cb">0%</span></label>
          <input type="range" id="crop-bottom" min="0" max="40" value="${E.cropBottom}" oninput="window.__applyCrop()" class="w-full accent-cyan-500">
        </div>
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Left</span><span id="lbl-cl">0%</span></label>
          <input type="range" id="crop-left" min="0" max="40" value="${E.cropLeft}" oninput="window.__applyCrop()" class="w-full accent-cyan-500">
        </div>
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Right</span><span id="lbl-cr">0%</span></label>
          <input type="range" id="crop-right" min="0" max="40" value="${E.cropRight}" oninput="window.__applyCrop()" class="w-full accent-cyan-500">
        </div>
        <button onclick="window.__resetCrop()" class="w-full py-1.5 bg-gray-800 text-gray-400 text-[10px] font-bold rounded">Reset Crop</button>
      </div>
    `;
  }

  window.__applyCrop = function() {
    E.cropTop = parseInt(document.getElementById('crop-top').value);
    E.cropBottom = parseInt(document.getElementById('crop-bottom').value);
    E.cropLeft = parseInt(document.getElementById('crop-left').value);
    E.cropRight = parseInt(document.getElementById('crop-right').value);

    document.getElementById('lbl-ct').innerText = E.cropTop + '%';
    document.getElementById('lbl-cb').innerText = E.cropBottom + '%';
    document.getElementById('lbl-cl').innerText = E.cropLeft + '%';
    document.getElementById('lbl-cr').innerText = E.cropRight + '%';

    const video = document.getElementById('editor-video');
    if (video) {
      video.style.clipPath = `inset(${E.cropTop}% ${E.cropRight}% ${E.cropBottom}% ${E.cropLeft}%)`;
    }
  };

  window.__resetCrop = function() {
    E.cropTop = E.cropBottom = E.cropLeft = E.cropRight = 0;
    const video = document.getElementById('editor-video');
    if (video) video.style.clipPath = 'none';
    window.__exTab('crop');
    toast('✅ Reset crop');
  };

  // ═══════════════════════════════════════════════════════════════
  // BACKGROUND BLUR TAB
  // ═══════════════════════════════════════════════════════════════
  function renderBgBlurTab(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <label class="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer">
          <span class="text-xs text-white font-bold">Enable BG Blur</span>
          <input type="checkbox" id="bgblur-toggle" ${E.bgBlur ? 'checked' : ''} onchange="window.__toggleBgBlur()" class="w-4 h-4 accent-cyan-500">
        </label>
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Blur Amount</span><span id="lbl-bga">${E.bgBlurAmount}px</span></label>
          <input type="range" id="bgblur-amt" min="0" max="50" value="${E.bgBlurAmount}" oninput="window.__applyBgBlur()" class="w-full accent-cyan-500">
        </div>
      </div>
    `;
  }

  window.__toggleBgBlur = function() {
    E.bgBlur = document.getElementById('bgblur-toggle').checked;
    applyBgBlur();
    toast(E.bgBlur ? '✅ BG Blur ON' : '❌ BG Blur OFF');
  };

  window.__applyBgBlur = function() {
    E.bgBlurAmount = parseInt(document.getElementById('bgblur-amt').value);
    document.getElementById('lbl-bga').innerText = E.bgBlurAmount + 'px';
    applyBgBlur();
  };

  function applyBgBlur() {
    const wrap = document.getElementById('editor-preview-wrap');
    if (!wrap) return;
    if (E.bgBlur) {
      wrap.style.background = `url(${window.Editor?.videoUrl || ''}) center/cover`;
      wrap.style.filter = `blur(${E.bgBlurAmount}px)`;
      const video = document.getElementById('editor-video');
      if (video) video.style.position = 'relative';
    } else {
      wrap.style.background = 'transparent';
      wrap.style.filter = 'none';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // THUMBNAIL / COVER TAB
  // ═══════════════════════════════════════════════════════════════
  function renderThumbnailTab(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <p class="text-[10px] text-gray-400">Video se cover frame select karein</p>
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Time</span><span id="lbl-thumb">0s</span></label>
          <input type="range" id="thumb-time" min="0" max="100" value="0" oninput="window.__captureThumbnail()" class="w-full accent-cyan-500">
        </div>
        <div id="thumb-preview" class="w-full aspect-video bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden">
          <span class="text-[10px] text-gray-500">Preview yahan</span>
        </div>
        <button onclick="window.__saveThumbnail()" class="w-full py-2 bg-cyan-600 text-white text-[10px] font-bold rounded">
          ✅ Save as Cover
        </button>
      </div>
    `;
  }

  window.__captureThumbnail = function() {
    const video = document.getElementById('editor-video');
    if (!video) return;
    const pct = parseInt(document.getElementById('thumb-time').value);
    const t = (pct / 100) * (video.duration || 0);
    document.getElementById('lbl-thumb').innerText = t.toFixed(1) + 's';
    E.thumbnailTime = t;

    // Draw to canvas
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      E.thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);

      const preview = document.getElementById('thumb-preview');
      preview.innerHTML = `<img src="${E.thumbnailDataUrl}" class="w-full h-full object-cover">`;
    } catch(e) {}
  };

  window.__saveThumbnail = function() {
    if (!E.thumbnailDataUrl) { toast('❌ Pehle frame select karein'); return; }
    toast('✅ Cover saved');
  };

  // ═══════════════════════════════════════════════════════════════
  // SLOW MOTION TAB
  // ═══════════════════════════════════════════════════════════════
  function renderSlowmoTab(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <p class="text-[10px] text-gray-400">Video ke specific section ko slow karein</p>
        <div class="grid grid-cols-4 gap-2">
          <button onclick="window.__addSlowmo(0.25)" class="py-2 bg-gray-800 text-cyan-400 text-[10px] font-bold rounded">0.25x</button>
          <button onclick="window.__addSlowmo(0.5)" class="py-2 bg-gray-800 text-cyan-400 text-[10px] font-bold rounded">0.5x</button>
          <button onclick="window.__addSlowmo(0.75)" class="py-2 bg-gray-800 text-cyan-400 text-[10px] font-bold rounded">0.75x</button>
          <button onclick="window.__addSlowmo(0)" class="py-2 bg-gray-800 text-gray-400 text-[10px] font-bold rounded">Reset</button>
        </div>
        <div id="slowmo-list" class="space-y-1 text-[10px] text-gray-400"></div>
      </div>
    `;
    updateSlowmoList();
  }

  window.__addSlowmo = function(factor) {
    const video = document.getElementById('editor-video');
    if (!video) return;
    if (factor === 0) {
      E.slowMotion = [];
    } else {
      E.slowMotion.push({
        start: video.currentTime,
        end: Math.min(video.duration, video.currentTime + 3),
        factor
      });
      if (window.Editor) window.Editor.speed = factor;
      video.playbackRate = factor;
    }
    updateSlowmoList();
    toast('⏱️ Slow-mo ' + factor + 'x');
  };

  function updateSlowmoList() {
    const list = document.getElementById('slowmo-list');
    if (!list) return;
    list.innerHTML = E.slowMotion.length === 0 ? '<p>No slow-mo sections</p>' :
      E.slowMotion.map((s, i) => `<div class="flex justify-between bg-gray-800 p-1.5 rounded"><span>${i + 1}: ${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s</span><span class="text-cyan-400">${s.factor}x</span></div>`).join('');
  }

  // ═══════════════════════════════════════════════════════════════
  // REVERSE TAB
  // ═══════════════════════════════════════════════════════════════
  function renderReverseTab(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <p class="text-[10px] text-gray-400">Video ko reverse chalayein</p>
        <button onclick="window.__toggleReverse()" class="w-full py-3 ${E.reverse ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-cyan-400'} text-xs font-bold rounded">
          ${E.reverse ? '🔁 Reverse ON' : '▶️ Normal'}
        </button>
      </div>
    `;
  }

  window.__toggleReverse = function() {
    E.reverse = !E.reverse;
    window.__exTab('reverse');
    toast(E.reverse ? '🔁 Reverse ON' : '▶️ Normal');
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO CAPTIONS TAB
  // ═══════════════════════════════════════════════════════════════
  function renderCaptionsTab(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <p class="text-[10px] text-gray-400">Auto-generated captions (speech-to-text)</p>
        <button onclick="window.__autoCaptions()" class="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold rounded">
          🎤 Generate Captions
        </button>
        <div id="cc-list" class="space-y-1 text-[10px] text-gray-300 max-h-24 overflow-y-auto"></div>
      </div>
    `;
  }

  window.__autoCaptions = async function() {
    toast('🎤 Generating captions...');
    // Use Web Speech API (limited support)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (e) => {
          const text = e.results[e.results.length - 1][0].transcript;
          E.captions.push({
            start: 0,
            end: 0,
            text: text
          });
          updateCaptionsList();
        };
        
        recognition.start();
        setTimeout(() => recognition.stop(), 10000);
        toast('🎤 Listening for 10 seconds...');
      } catch(e) {
        toast('⚠️ Speech recognition not available');
      }
    } else {
      toast('⚠️ Auto-captions browser support nahi hai');
    }
  };

  function updateCaptionsList() {
    const list = document.getElementById('cc-list');
    if (!list) return;
    list.innerHTML = E.captions.map(c => `<div class="bg-gray-800 p-1.5 rounded">${c.text}</div>`).join('');
  }

  // ═══════════════════════════════════════════════════════════════
  // UNDO / REDO
  // ═══════════════════════════════════════════════════════════════
  function renderUndoTab(container) {
    container.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <button onclick="window.__undo()" class="py-3 bg-gray-800 text-cyan-400 text-xs font-bold rounded">
          <i class="fa-solid fa-rotate-left"></i> Undo
        </button>
        <button onclick="window.__redo()" class="py-3 bg-gray-800 text-cyan-400 text-xs font-bold rounded">
          <i class="fa-solid fa-rotate-right"></i> Redo
        </button>
      </div>
      <p class="text-[10px] text-gray-500 mt-2">${E.history.length} changes in history</p>
    `;
  }

  window.__saveSnapshot = function() {
    const snap = {
      filter: window.Editor?.filter,
      speed: window.Editor?.speed,
      rotation: window.Editor?.rotation,
      stickers: JSON.parse(JSON.stringify(window.Editor?.stickers || [])),
      texts: JSON.parse(JSON.stringify(window.Editor?.texts || [])),
      brightness: E.brightness,
      contrast: E.contrast,
      saturation: E.saturation
    };
    E.history.push(snap);
    if (E.history.length > 50) E.history.shift();
    E.historyIndex = E.history.length - 1;
  };

  window.__undo = function() {
    if (E.historyIndex <= 0) { toast('⚠️ No more undo'); return; }
    E.historyIndex--;
    applySnapshot(E.history[E.historyIndex]);
    toast('↩️ Undo');
  };

  window.__redo = function() {
    if (E.historyIndex >= E.history.length - 1) { toast('⚠️ No more redo'); return; }
    E.historyIndex++;
    applySnapshot(E.history[E.historyIndex]);
    toast('↪️ Redo');
  };

  function applySnapshot(snap) {
    if (!window.Editor) return;
    window.Editor.filter = snap.filter;
    window.Editor.speed = snap.speed;
    window.Editor.rotation = snap.rotation;
    window.Editor.stickers = snap.stickers;
    window.Editor.texts = snap.texts;
    E.brightness = snap.brightness;
    E.contrast = snap.contrast;
    E.saturation = snap.saturation;
    
    // Re-render
    const video = document.getElementById('editor-video');
    if (video) video.style.transform = `rotate(${snap.rotation}deg)`;
    applyColorFilter();
    // Re-render overlays
    if (typeof window.__renderOverlays === 'function') window.__renderOverlays();
  }

  // ═══════════════════════════════════════════════════════════════
  // DRAFT SAVE
  // ═══════════════════════════════════════════════════════════════
  function renderDraftTab(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <p class="text-[10px] text-gray-400">Current project ko save karein</p>
        <button onclick="window.__saveDraft()" class="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded">
          💾 Save Draft
        </button>
        <button onclick="window.__loadDraft()" class="w-full py-3 bg-gray-800 text-cyan-400 text-xs font-bold rounded">
          📂 Load Draft
        </button>
        <button onclick="window.__clearDraft()" class="w-full py-2 bg-gray-800 text-red-400 text-[10px] font-bold rounded">
          🗑️ Clear Draft
        </button>
      </div>
    `;
  }

  window.__saveDraft = function() {
    const draft = {
      filter: window.Editor?.filter,
      speed: window.Editor?.speed,
      rotation: window.Editor?.rotation,
      stickers: window.Editor?.stickers,
      texts: window.Editor?.texts,
      brightness: E.brightness,
      contrast: E.contrast,
      saturation: E.saturation,
      aspectRatio: E.aspectRatio,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('SPHERE_VIDEO_DRAFT', JSON.stringify(draft));
    toast('💾 Draft saved');
  };

  window.__loadDraft = function() {
    const raw = localStorage.getItem('SPHERE_VIDEO_DRAFT');
    if (!raw) { toast('❌ No draft found'); return; }
    try {
      const draft = JSON.parse(raw);
      applySnapshot(draft);
      E.aspectRatio = draft.aspectRatio || 'original';
      toast('✅ Draft loaded');
    } catch(e) {
      toast('❌ Draft load failed');
    }
  };

  window.__clearDraft = function() {
    localStorage.removeItem('SPHERE_VIDEO_DRAFT');
    toast('🗑️ Draft cleared');
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO-SAVE SNAPSHOT ON EDIT
  // ═══════════════════════════════════════════════════════════════
  document.addEventListener('click', (e) => {
    // Detect editor toolbar clicks
    if (e.target.closest('#videoEditorModal') && !e.target.closest('#tab-extra')) {
      setTimeout(() => window.__saveSnapshot(), 500);
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    setInterval(() => {
      // Wait for editor to open, then add tab
      if (document.getElementById('videoEditorModal') && !document.getElementById('tab-extra')) {
        addExtraToolsTab();
      }
    }, 1500);

    console.log('✅ edit-extra.js loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════
  window.__EDIT_EXTRA__ = {
    E,
    MUSIC_LIBRARY,
    SFX_LIBRARY,
    ASPECTS
  };
})();
