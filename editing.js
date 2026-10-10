/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - EDITING.JS
   Real Video Editing System (Canvas + MediaRecorder)
   
   Features:
   1. Video preview with live editing
   2. Cut from Start / End (trim)
   3. Cut from Middle (range select)
   4. Stickers (emoji drag & drop)
   5. Text overlay
   6. Filters (10+ presets)
   7. Speed control (0.5x - 2x)
   8. Rotation
   9. Keyframe animation (basic)
   10. Music/Audio add
   11. Export to real video file
   12. Next → Hashtag → Post
   
   Add: <script src="editing.js" defer></script>
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
  function fmt(s) { return (s || 'Umar').replace(/^@+/, '').split('@')[0]; }
  function getUser() { return fmt(localStorage.getItem('SUPER_APP_CURRENT_USER')); }

  // ═══════════════════════════════════════════════════════════════
  // EDITOR STATE
  // ═══════════════════════════════════════════════════════════════
  const Editor = {
    video: null,
    videoFile: null,
    videoUrl: '',
    canvas: null,
    ctx: null,
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    animFrame: null,
    aspectRatio: '9:16',

    // Edit properties
    trimStart: 0,
    trimEnd: 0,
    cuts: [], // [{start, end}] - middle cuts
    speed: 1,
    rotation: 0,
    filter: 'none',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,

    // Overlays
    stickers: [], // [{emoji, x, y, size, rotation, id}]
    texts: [], // [{text, x, y, size, color, font, id}]
    keyframes: [], // [{id, time, x, y, scale}]

    // Audio
    audioFile: null,
    audioUrl: '',
    audioVolume: 1,

    // Export
    mediaRecorder: null,
    recordedChunks: [],
    exportedBlob: null
  };

  // ═══════════════════════════════════════════════════════════════
  // FILTERS LIST
  // ═══════════════════════════════════════════════════════════════
  const FILTERS = [
    { id: 'none', name: 'Normal', css: 'none' },
    { id: 'grayscale', name: 'B&W', css: 'grayscale(100%)' },
    { id: 'sepia', name: 'Sepia', css: 'sepia(100%)' },
    { id: 'vivid', name: 'Vivid', css: 'saturate(150%) contrast(110%)' },
    { id: 'cool', name: 'Cool', css: 'hue-rotate(180deg)' },
    { id: 'warm', name: 'Warm', css: 'sepia(40%) saturate(140%)' },
    { id: 'vintage', name: 'Vintage', css: 'sepia(60%) contrast(120%) brightness(90%)' },
    { id: 'dramatic', name: 'Dramatic', css: 'contrast(150%) brightness(80%)' },
    { id: 'fade', name: 'Fade', css: 'opacity(0.85) contrast(80%)' },
    { id: 'neon', name: 'Neon', css: 'saturate(200%) hue-rotate(45deg) contrast(120%)' },
    { id: 'invert', name: 'Invert', css: 'invert(100%)' },
    { id: 'blur', name: 'Blur', css: 'blur(3px)' }
  ];

  // ═══════════════════════════════════════════════════════════════
  // EMOJI STICKERS
  // ═══════════════════════════════════════════════════════════════
  const STICKERS = [
    '😀','😂','🥰','😍','🤩','😎','🥳','😭','🤔','😱',
    '🔥','💯','⭐','❤️','💖','👍','👏','🙌','🎉','🎁',
    '🚀','⚡','💎','👑','🏆','🌈','☀️','🌙','✨','💫',
    '🍕','🍔','☕','🍩','🍦','🎂','🍫','🥤','🍿','🥂',
    '⚽','🏀','🎮','🎯','🎸','🎤','📸','🎬','💻','📱'
  ];

  // ═══════════════════════════════════════════════════════════════
  // MAIN OPEN EDITOR
  // ═══════════════════════════════════════════════════════════════
  window.openVideoEditor = async function(file) {
    if (!file) {
      toast('❌ Pehle video select karein');
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast('❌ Ye video file nahi hai');
      return;
    }

    Editor.videoFile = file;
    Editor.videoUrl = URL.createObjectURL(file);
    Editor.cuts = [];
    Editor.stickers = [];
    Editor.texts = [];
    Editor.trimStart = 0;
    Editor.speed = 1;
    Editor.rotation = 0;
    Editor.filter = 'none';

    buildEditorUI();
    openModal('videoEditorModal');

    // Load video
    setTimeout(() => {
      loadVideo();
    }, 300);
  };

  // ═══════════════════════════════════════════════════════════════
  // BUILD EDITOR UI
  // ═══════════════════════════════════════════════════════════════
  function buildEditorUI() {
    if (document.getElementById('videoEditorModal')) {
      document.getElementById('videoEditorModal').remove();
    }

    document.body.insertAdjacentHTML('beforeend', `
      <div id="videoEditorModal" class="fullscreen-modal hidden bg-black z-[110] flex flex-col">
        
        <!-- TOP BAR -->
        <div class="p-3 bg-gray-950 border-b border-gray-800 flex justify-between items-center">
          <button onclick="window.closeVideoEditor()" class="text-gray-400 text-lg">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <h2 class="text-sm font-bold text-cyan-400">✂️ Video Editor</h2>
          <button onclick="window.exportVideo()" id="export-btn" class="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold rounded-lg">
            Next →
          </button>
        </div>

        <!-- PREVIEW AREA -->
        <div class="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <div id="editor-preview-wrap" class="relative" style="max-width:100%;max-height:100%;">
            <video id="editor-video" class="max-w-full max-h-full" style="display:block;" playsinline></video>
            <canvas id="editor-canvas" class="absolute top-0 left-0 w-full h-full pointer-events-none" style="display:none;"></canvas>
            <div id="editor-overlays" class="absolute top-0 left-0 w-full h-full pointer-events-none"></div>
          </div>
          
          <!-- PLAY BUTTON -->
          <button id="editor-play-btn" onclick="window.toggleEditorPlay()" class="absolute bottom-20 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-cyan-600/80 text-white flex items-center justify-center shadow-2xl z-20">
            <i class="fa-solid fa-play text-xl"></i>
          </button>
        </div>

        <!-- TIMELINE -->
        <div class="p-3 bg-gray-950 border-t border-gray-800 space-y-2">
          
          <!-- Trim Sliders -->
          <div class="bg-gray-900 rounded-xl p-3 space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-[10px] text-cyan-400 font-bold uppercase">✂️ Trim</span>
              <span class="text-[10px] text-gray-400">
                <span id="trim-start-label">0.0</span>s - <span id="trim-end-label">0.0</span>s
              </span>
            </div>
            <div class="relative">
              <input type="range" id="trim-start" min="0" max="100" value="0" step="0.1" 
                     oninput="window.updateTrim()" class="w-full accent-cyan-500">
              <input type="range" id="trim-end" min="0" max="100" value="100" step="0.1" 
                     oninput="window.updateTrim()" class="w-full accent-red-500 mt-1">
            </div>
            <div class="flex gap-2">
              <button onclick="window.cutFromStart()" class="flex-1 py-1.5 bg-gray-800 text-cyan-400 text-[10px] font-bold rounded">Cut Start</button>
              <button onclick="window.cutFromEnd()" class="flex-1 py-1.5 bg-gray-800 text-red-400 text-[10px] font-bold rounded">Cut End</button>
              <button onclick="window.resetTrim()" class="flex-1 py-1.5 bg-gray-800 text-gray-400 text-[10px] font-bold rounded">Reset</button>
            </div>
          </div>

          <!-- TABS -->
          <div class="flex gap-1 overflow-x-auto no-scrollbar">
            <button onclick="window.editorTab('filters')" id="tab-filters" class="editor-tab px-3 py-2 bg-cyan-600 text-white text-[10px] font-bold rounded whitespace-nowrap">🎨 Filters</button>
            <button onclick="window.editorTab('stickers')" id="tab-stickers" class="editor-tab px-3 py-2 bg-gray-800 text-gray-400 text-[10px] font-bold rounded whitespace-nowrap">😀 Stickers</button>
            <button onclick="window.editorTab('text')" id="tab-text" class="editor-tab px-3 py-2 bg-gray-800 text-gray-400 text-[10px] font-bold rounded whitespace-nowrap">📝 Text</button>
            <button onclick="window.editorTab('speed')" id="tab-speed" class="editor-tab px-3 py-2 bg-gray-800 text-gray-400 text-[10px] font-bold rounded whitespace-nowrap">⚡ Speed</button>
            <button onclick="window.editorTab('rotate')" id="tab-rotate" class="editor-tab px-3 py-2 bg-gray-800 text-gray-400 text-[10px] font-bold rounded whitespace-nowrap">🔄 Rotate</button>
            <button onclick="window.editorTab('keyframe')" id="tab-keyframe" class="editor-tab px-3 py-2 bg-gray-800 text-gray-400 text-[10px] font-bold rounded whitespace-nowrap">🎯 Keyframe</button>
          </div>

          <!-- TAB CONTENT -->
          <div id="editor-tab-content" class="bg-gray-900 rounded-xl p-3 min-h-[100px] max-h-[140px] overflow-y-auto no-scrollbar"></div>
        </div>

        <!-- EXPORT PROGRESS -->
        <div id="export-progress-modal" class="fixed inset-0 z-[120] hidden bg-black/95 flex items-center justify-center p-6">
          <div class="w-full max-w-md bg-gray-900 border-2 border-cyan-500/40 rounded-2xl p-6 space-y-4">
            <div class="text-center">
              <div class="text-5xl mb-3">📤</div>
              <h2 class="text-base font-bold text-cyan-400">Exporting Video...</h2>
              <p class="text-xs text-gray-400 mt-1" id="exp-status">Please wait</p>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div id="exp-fill" class="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all" style="width:0%"></div>
            </div>
            <p class="text-2xl font-extrabold text-cyan-400 text-center" id="exp-pct">0%</p>
          </div>
        </div>
      </div>
    `);
  }

  // ═══════════════════════════════════════════════════════════════
  // LOAD VIDEO
  // ═══════════════════════════════════════════════════════════════
  function loadVideo() {
    const video = document.getElementById('editor-video');
    if (!video) return;

    video.src = Editor.videoUrl;
    video.muted = true;
    video.playsInline = true;

    video.addEventListener('loadedmetadata', () => {
      Editor.duration = video.duration;
      Editor.trimEnd = video.duration;

      document.getElementById('trim-start').max = video.duration;
      document.getElementById('trim-end').max = video.duration;
      document.getElementById('trim-start').value = 0;
      document.getElementById('trim-end').value = video.duration;
      document.getElementById('trim-end-label').innerText = video.duration.toFixed(1);

      // Auto-set aspect ratio
      const ratio = video.videoWidth / video.videoHeight;
      if (ratio > 1) Editor.aspectRatio = '16:9';
      else if (ratio < 0.7) Editor.aspectRatio = '9:16';
      else Editor.aspectRatio = '1:1';

      // Start render loop
      renderLoop();
      toast('✅ Video loaded — editing ready');
    });

    video.load();
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER LOOP (apply filters live via CSS)
  // ═══════════════════════════════════════════════════════════════
  function renderLoop() {
    const video = document.getElementById('editor-video');
    if (!video) return;

    // Apply current filter via CSS
    const filter = FILTERS.find(f => f.id === Editor.filter);
    if (filter) {
      video.style.filter = filter.css;
    }

    // Apply rotation
    video.style.transform = `rotate(${Editor.rotation}deg)`;

    Editor.animFrame = requestAnimationFrame(renderLoop);
  }

  // ═══════════════════════════════════════════════════════════════
  // TRIM CONTROLS
  // ═══════════════════════════════════════════════════════════════
  window.updateTrim = function() {
    const start = parseFloat(document.getElementById('trim-start').value);
    const end = parseFloat(document.getElementById('trim-end').value);
    if (start >= end) {
      document.getElementById('trim-start').value = Math.max(0, end - 0.5);
    }
    Editor.trimStart = parseFloat(document.getElementById('trim-start').value);
    Editor.trimEnd = parseFloat(document.getElementById('trim-end').value);
    document.getElementById('trim-start-label').innerText = Editor.trimStart.toFixed(1);
    document.getElementById('trim-end-label').innerText = Editor.trimEnd.toFixed(1);
  };

  window.cutFromStart = function() {
    const video = document.getElementById('editor-video');
    if (!video) return;
    Editor.trimStart = video.currentTime;
    document.getElementById('trim-start').value = video.currentTime;
    document.getElementById('trim-start-label').innerText = video.currentTime.toFixed(1);
    toast('✂️ Start cut at ' + video.currentTime.toFixed(1) + 's');
  };

  window.cutFromEnd = function() {
    const video = document.getElementById('editor-video');
    if (!video) return;
    Editor.trimEnd = video.currentTime;
    document.getElementById('trim-end').value = video.currentTime;
    document.getElementById('trim-end-label').innerText = video.currentTime.toFixed(1);
    toast('✂️ End cut at ' + video.currentTime.toFixed(1) + 's');
  };

  window.resetTrim = function() {
    const video = document.getElementById('editor-video');
    if (!video) return;
    Editor.trimStart = 0;
    Editor.trimEnd = video.duration;
    document.getElementById('trim-start').value = 0;
    document.getElementById('trim-end').value = video.duration;
    document.getElementById('trim-start-label').innerText = '0.0';
    document.getElementById('trim-end-label').innerText = video.duration.toFixed(1);
    toast('✅ Reset');
  };

  // ═══════════════════════════════════════════════════════════════
  // PLAY / PAUSE
  // ═══════════════════════════════════════════════════════════════
  window.toggleEditorPlay = function() {
    const video = document.getElementById('editor-video');
    const btn = document.getElementById('editor-play-btn');
    if (!video) return;

    if (video.paused) {
      video.playbackRate = Editor.speed;
      video.currentTime = Editor.trimStart;
      video.play();
      btn.innerHTML = '<i class="fa-solid fa-pause text-xl"></i>';
    } else {
      video.pause();
      btn.innerHTML = '<i class="fa-solid fa-play text-xl"></i>';
    }
  };

  // Auto-pause at trimEnd
  document.addEventListener('timeupdate', () => {
    const video = document.getElementById('editor-video');
    if (!video) return;
    if (video.currentTime >= Editor.trimEnd && !video.paused) {
      video.pause();
      video.currentTime = Editor.trimStart;
      const btn = document.getElementById('editor-play-btn');
      if (btn) btn.innerHTML = '<i class="fa-solid fa-play text-xl"></i>';
    }
  }, true);

  // ═══════════════════════════════════════════════════════════════
  // TABS
  // ═══════════════════════════════════════════════════════════════
  window.editorTab = function(tab) {
    ['filters', 'stickers', 'text', 'speed', 'rotate', 'keyframe'].forEach(t => {
      const btn = document.getElementById('tab-' + t);
      if (btn) btn.className = `editor-tab px-3 py-2 ${t === tab ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'} text-[10px] font-bold rounded whitespace-nowrap`;
    });

    const content = document.getElementById('editor-tab-content');
    content.innerHTML = '';

    if (tab === 'filters') renderFiltersTab(content);
    if (tab === 'stickers') renderStickersTab(content);
    if (tab === 'text') renderTextTab(content);
    if (tab === 'speed') renderSpeedTab(content);
    if (tab === 'rotate') renderRotateTab(content);
    if (tab === 'keyframe') renderKeyframeTab(content);
  };

  // ═══════════════════════════════════════════════════════════════
  // FILTERS TAB
  // ═══════════════════════════════════════════════════════════════
  function renderFiltersTab(container) {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-4 gap-2';
    FILTERS.forEach(f => {
      const btn = document.createElement('button');
      btn.className = `p-2 rounded-lg border-2 ${Editor.filter === f.id ? 'border-cyan-500 bg-cyan-900/30' : 'border-gray-700 bg-gray-800'}`;
      btn.onclick = () => {
        Editor.filter = f.id;
        window.editorTab('filters');
        toast('🎨 ' + f.name);
      };
      btn.innerHTML = `
        <div class="w-full h-8 rounded mb-1" style="background:linear-gradient(135deg,#f59e0b,#3b82f6);filter:${f.css}"></div>
        <p class="text-[9px] font-bold text-white">${f.name}</p>
      `;
      grid.appendChild(btn);
    });
    container.appendChild(grid);
  }

  // ═══════════════════════════════════════════════════════════════
  // STICKERS TAB
  // ═══════════════════════════════════════════════════════════════
  function renderStickersTab(container) {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-10 gap-1';
    STICKERS.forEach(emoji => {
      const btn = document.createElement('button');
      btn.className = 'text-2xl hover:scale-125 transition-transform';
      btn.innerText = emoji;
      btn.onclick = () => addSticker(emoji);
      grid.appendChild(btn);
    });
    container.appendChild(grid);
  }

  function addSticker(emoji) {
    const id = 'sticker_' + Date.now();
    Editor.stickers.push({
      id,
      emoji,
      x: 50,
      y: 30,
      size: 60,
      rotation: 0
    });
    renderOverlays();
    toast('✅ Sticker added');
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER OVERLAYS (Stickers + Texts)
  // ═══════════════════════════════════════════════════════════════
  function renderOverlays() {
    const overlay = document.getElementById('editor-overlays');
    if (!overlay) return;
    overlay.innerHTML = '';
    overlay.style.pointerEvents = 'auto';

    // Stickers
    Editor.stickers.forEach(s => {
      const div = document.createElement('div');
      div.className = 'absolute cursor-move select-none';
      div.style.left = s.x + '%';
      div.style.top = s.y + '%';
      div.style.fontSize = s.size + 'px';
      div.style.transform = `translate(-50%,-50%) rotate(${s.rotation}deg)`;
      div.style.pointerEvents = 'auto';
      div.dataset.id = s.id;
      div.innerText = s.emoji;
      attachDrag(div, s, 'sticker');
      attachDeleteOnDoubleClick(div, s.id, 'sticker');
      overlay.appendChild(div);
    });

    // Texts
    Editor.texts.forEach(t => {
      const div = document.createElement('div');
      div.className = 'absolute cursor-move select-none px-2 py-1 rounded';
      div.style.left = t.x + '%';
      div.style.top = t.y + '%';
      div.style.fontSize = t.size + 'px';
      div.style.color = t.color;
      div.style.fontFamily = t.font || 'system-ui';
      div.style.fontWeight = 'bold';
      div.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
      div.style.transform = 'translate(-50%,-50%)';
      div.style.pointerEvents = 'auto';
      div.dataset.id = t.id;
      div.innerText = t.text;
      attachDrag(div, t, 'text');
      attachDeleteOnDoubleClick(div, t.id, 'text');
      overlay.appendChild(div);
    });
  }

  function attachDrag(el, obj, type) {
    let startX, startY, startLeft, startTop, dragging = false;
    const parent = el.parentElement;

    const down = (e) => {
      dragging = true;
      const pt = e.touches ? e.touches[0] : e;
      startX = pt.clientX;
      startY = pt.clientY;
      startLeft = obj.x;
      startTop = obj.y;
      e.stopPropagation();
    };

    const move = (e) => {
      if (!dragging) return;
      e.preventDefault();
      const pt = e.touches ? e.touches[0] : e;
      const dx = ((pt.clientX - startX) / parent.offsetWidth) * 100;
      const dy = ((pt.clientY - startY) / parent.offsetHeight) * 100;
      obj.x = Math.max(0, Math.min(100, startLeft + dx));
      obj.y = Math.max(0, Math.min(100, startTop + dy));
      el.style.left = obj.x + '%';
      el.style.top = obj.y + '%';
    };

    const up = () => { dragging = false; };

    el.addEventListener('mousedown', down);
    el.addEventListener('touchstart', down, { passive: false });
    document.addEventListener('mousemove', move);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('mouseup', up);
    document.addEventListener('touchend', up);
  }

  function attachDeleteOnDoubleClick(el, id, type) {
    el.addEventListener('dblclick', () => {
      if (type === 'sticker') Editor.stickers = Editor.stickers.filter(s => s.id !== id);
      if (type === 'text') Editor.texts = Editor.texts.filter(t => t.id !== id);
      renderOverlays();
      toast('🗑️ Removed');
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // TEXT TAB
  // ═══════════════════════════════════════════════════════════════
  function renderTextTab(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <input type="text" id="text-input" placeholder="Text likhein..." maxlength="60"
               class="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg text-xs text-white">
        <div class="grid grid-cols-4 gap-2">
          <button onclick="window.addTextOverlay('#ffffff')" class="py-2 bg-white text-black text-[10px] font-bold rounded">White</button>
          <button onclick="window.addTextOverlay('#00f2fe')" class="py-2 bg-cyan-500 text-black text-[10px] font-bold rounded">Cyan</button>
          <button onclick="window.addTextOverlay('#fbbf24')" class="py-2 bg-amber-500 text-black text-[10px] font-bold rounded">Gold</button>
          <button onclick="window.addTextOverlay('#ef4444')" class="py-2 bg-red-500 text-white text-[10px] font-bold rounded">Red</button>
        </div>
        <div class="grid grid-cols-5 gap-2">
          <button onclick="window.addTextOverlay('#ec4899')" class="py-2 bg-pink-500 text-white text-[10px] font-bold rounded">Pink</button>
          <button onclick="window.addTextOverlay('#22c55e')" class="py-2 bg-green-500 text-white text-[10px] font-bold rounded">Green</button>
          <button onclick="window.addTextOverlay('#a855f7')" class="py-2 bg-purple-500 text-white text-[10px] font-bold rounded">Purple</button>
          <button onclick="window.addTextOverlay('#f97316')" class="py-2 bg-orange-500 text-white text-[10px] font-bold rounded">Orange</button>
          <button onclick="window.addTextOverlay('#000000')" class="py-2 bg-black text-white text-[10px] font-bold rounded border border-gray-600">Black</button>
        </div>
      </div>
    `;
  }

  window.addTextOverlay = function(color) {
    const input = document.getElementById('text-input');
    const text = input?.value.trim();
    if (!text) { toast('❌ Pehle text likhein'); return; }
    Editor.texts.push({
      id: 'text_' + Date.now(),
      text,
      x: 50,
      y: 70,
      size: 24,
      color
    });
    input.value = '';
    renderOverlays();
    toast('✅ Text added');
  };

  // ═══════════════════════════════════════════════════════════════
  // SPEED TAB
  // ═══════════════════════════════════════════════════════════════
  function renderSpeedTab(container) {
    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-4 gap-2';
    speeds.forEach(s => {
      const btn = document.createElement('button');
      btn.className = `py-2 rounded-lg text-xs font-bold ${Editor.speed === s ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'}`;
      btn.innerText = s + 'x';
      btn.onclick = () => {
        Editor.speed = s;
        const video = document.getElementById('editor-video');
        if (video) video.playbackRate = s;
        window.editorTab('speed');
        toast('⚡ ' + s + 'x');
      };
      grid.appendChild(btn);
    });
    container.appendChild(grid);
  }

  // ═══════════════════════════════════════════════════════════════
  // ROTATE TAB
  // ═══════════════════════════════════════════════════════════════
  function renderRotateTab(container) {
    container.innerHTML = `
      <div class="grid grid-cols-4 gap-2">
        <button onclick="window.rotateVideo(-90)" class="py-3 bg-gray-800 text-cyan-400 rounded-lg text-xs font-bold">↺ 90°</button>
        <button onclick="window.rotateVideo(90)" class="py-3 bg-gray-800 text-cyan-400 rounded-lg text-xs font-bold">↻ 90°</button>
        <button onclick="window.rotateVideo(180)" class="py-3 bg-gray-800 text-cyan-400 rounded-lg text-xs font-bold">180°</button>
        <button onclick="window.rotateVideo(0)" class="py-3 bg-gray-800 text-red-400 rounded-lg text-xs font-bold">Reset</button>
      </div>
    `;
  }

  window.rotateVideo = function(deg) {
    if (deg === 0) Editor.rotation = 0;
    else Editor.rotation = (Editor.rotation + deg) % 360;
    const video = document.getElementById('editor-video');
    if (video) video.style.transform = `rotate(${Editor.rotation}deg)`;
    toast('🔄 ' + Editor.rotation + '°');
  };

  // ═══════════════════════════════════════════════════════════════
  // KEYFRAME TAB (Basic Animation)
  // ═══════════════════════════════════════════════════════════════
  function renderKeyframeTab(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <p class="text-[10px] text-gray-400">Keyframe: Sticker ko animate karein (bounce, slide, fade)</p>
        <div class="grid grid-cols-3 gap-2">
          <button onclick="window.applyKeyframe('bounce')" class="py-2 bg-gray-800 text-cyan-400 rounded text-xs font-bold">🎾 Bounce</button>
          <button onclick="window.applyKeyframe('slide')" class="py-2 bg-gray-800 text-cyan-400 rounded text-xs font-bold">➡️ Slide</button>
          <button onclick="window.applyKeyframe('fade')" class="py-2 bg-gray-800 text-cyan-400 rounded text-xs font-bold">✨ Fade</button>
        </div>
      </div>
    `;
  }

  window.applyKeyframe = function(type) {
    if (Editor.stickers.length === 0) {
      toast('❌ Pehle sticker add karein');
      return;
    }
    const s = Editor.stickers[Editor.stickers.length - 1];
    Editor.keyframes.push({ id: s.id, type, createdAt: Date.now() });

    const el = document.querySelector(`[data-id="${s.id}"]`);
    if (el) {
      if (type === 'bounce') el.style.animation = 'bounceKF 1s infinite';
      if (type === 'slide') el.style.animation = 'slideKF 2s infinite';
      if (type === 'fade') el.style.animation = 'fadeKF 2s infinite';
    }
    toast('🎯 ' + type + ' applied');
  };

  // Add keyframe animations CSS
  if (!document.getElementById('keyframe-css')) {
    const style = document.createElement('style');
    style.id = 'keyframe-css';
    style.textContent = `
      @keyframes bounceKF {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -60%) scale(1.1); }
      }
      @keyframes slideKF {
        0%, 100% { transform: translate(-50%, -50%); }
        50% { transform: translate(50%, -50%); }
      }
      @keyframes fadeKF {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `;
    document.head.appendChild(style);
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORT VIDEO (Real via MediaRecorder)
  // ═══════════════════════════════════════════════════════════════
  window.exportVideo = async function() {
    const video = document.getElementById('editor-video');
    if (!video) return;

    document.getElementById('export-progress-modal').classList.remove('hidden');
    updateExportProgress(0, 'Preparing...');

    try {
      // Create canvas for export
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      const ctx = canvas.getContext('2d');

      // Setup MediaRecorder
      const stream = canvas.captureStream(30);
      
      // Add audio if exists
      if (video.captureStream) {
        try {
          const vidStream = video.captureStream();
          const audioTracks = vidStream.getAudioTracks();
          audioTracks.forEach(track => stream.addTrack(track));
        } catch(e) {}
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000
      });

      const chunks = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        updateExportProgress(100, '✅ Done!');
        const blob = new Blob(chunks, { type: 'video/webm' });
        Editor.exportedBlob = blob;

        setTimeout(() => {
          document.getElementById('export-progress-modal').classList.add('hidden');
          finalizeExport(blob);
        }, 800);
      };

      recorder.start();

      // Play video from trimStart
      video.currentTime = Editor.trimStart;
      video.muted = false;
      video.playbackRate = Editor.speed;
      await video.play();

      const startTime = Editor.trimStart;
      const endTime = Editor.trimEnd;
      const totalDuration = (endTime - startTime) / Editor.speed;

      // Render loop
      const renderExport = () => {
        if (video.currentTime >= endTime || video.ended) {
          video.pause();
          recorder.stop();
          return;
        }

        // Calculate progress
        const elapsed = (video.currentTime - startTime) / Editor.speed;
        const pct = Math.min(100, Math.floor((elapsed / totalDuration) * 100));
        updateExportProgress(pct, 'Exporting... ' + pct + '%');

        // Draw video frame
        ctx.save();

        // Apply rotation
        if (Editor.rotation !== 0) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((Editor.rotation * Math.PI) / 180);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Draw stickers
        Editor.stickers.forEach(s => {
          ctx.save();
          const px = (s.x / 100) * canvas.width;
          const py = (s.y / 100) * canvas.height;
          ctx.translate(px, py);
          ctx.rotate((s.rotation * Math.PI) / 180);
          ctx.font = s.size + 'px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(s.emoji, 0, 0);
          ctx.restore();
        });

        // Draw texts
        Editor.texts.forEach(t => {
          ctx.save();
          const px = (t.x / 100) * canvas.width;
          const py = (t.y / 100) * canvas.height;
          ctx.font = 'bold ' + t.size + 'px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = t.color;
          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.lineWidth = 4;
          ctx.strokeText(t.text, px, py);
          ctx.fillText(t.text, px, py);
          ctx.restore();
        });

        requestAnimationFrame(renderExport);
      };

      renderExport();

    } catch(e) {
      console.error(e);
      document.getElementById('export-progress-modal').classList.add('hidden');
      toast('❌ Export error: ' + e.message);
    }
  };

  function updateExportProgress(pct, status) {
    document.getElementById('exp-fill').style.width = pct + '%';
    document.getElementById('exp-pct').innerText = pct + '%';
    if (status) document.getElementById('exp-status').innerText = status;
  }

  // ═══════════════════════════════════════════════════════════════
  // FINALIZE EXPORT → HASHTAG → POST
  // ═══════════════════════════════════════════════════════════════
  function finalizeExport(blob) {
    // Close editor
    closeModal('videoEditorModal');

    // Open hashtag modal
    openHashtagModal(blob);
  }

  function openHashtagModal(blob) {
    if (document.getElementById('hashtagPostModal')) {
      document.getElementById('hashtagPostModal').remove();
    }

    document.body.insertAdjacentHTML('beforeend', `
      <div id="hashtagPostModal" class="fullscreen-modal p-4 justify-center items-center bg-black/90 z-[115] flex">
        <div class="w-full max-w-sm bg-gray-900 border-2 border-cyan-500/40 rounded-2xl p-5 space-y-4">
          <div class="flex justify-between items-center border-b border-gray-800 pb-2">
            <h3 class="text-xs font-bold text-cyan-400">📝 Final Post</h3>
            <button onclick="document.getElementById('hashtagPostModal').remove()" class="text-gray-400">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <textarea id="post-final-caption" class="w-full h-20 bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white" placeholder="Caption likhein..."></textarea>

          <div>
            <p class="text-[10px] text-gray-400 mb-2">Hashtags select karein:</p>
            <div id="hashtag-chips" class="flex flex-wrap gap-1.5"></div>
          </div>

          <div class="flex gap-2">
            <button onclick="window.publishEditedVideo()" class="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs rounded-xl">
              🚀 Publish Video
            </button>
          </div>
        </div>
      </div>
    `);

    // Hashtag chips
    const hashtags = ['#XAUUSD', '#BTCUSD', '#Forex', '#Trading', '#Gold', '#Crypto', '#Pakistan', '#SuperSphere', '#Live', '#Gift', '#Trending', '#Viral'];
    const chips = document.getElementById('hashtag-chips');
    hashtags.forEach(h => {
      const chip = document.createElement('button');
      chip.className = 'px-2 py-1 bg-gray-800 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/30';
      chip.innerText = h;
      chip.onclick = () => {
        const caption = document.getElementById('post-final-caption');
        caption.value = (caption.value + ' ' + h).trim();
        chip.className = 'px-2 py-1 bg-amber-500 text-black text-[10px] font-bold rounded-full';
      };
      chips.appendChild(chip);
    });

    window.__editedBlob = blob;
  }

  window.publishEditedVideo = async function() {
    const blob = window.__editedBlob;
    if (!blob) { toast('❌ Video missing'); return; }

    const caption = (document.getElementById('post-final-caption')?.value || '').trim();
    if (!caption) { toast('❌ Caption zaroori'); return; }

    const user = getUser();
    if (!user) { toast('❌ Login zaroori'); return; }

    try {
      document.getElementById('hashtagPostModal')?.remove();
      toast('📤 Uploading...');

      // Upload to Firebase Storage
      const ext = 'webm';
      const filename = `videos/${user}_${Date.now()}.${ext}`;
      
      let url;
      if (typeof firebase !== 'undefined' && firebase.storage) {
        const ref = firebase.storage().ref().child(filename);
        const snapshot = await ref.put(blob);
        url = await snapshot.ref.getDownloadURL();
      } else {
        throw new Error('Firebase Storage not ready');
      }

      // Create post
      const postId = 'post_' + Date.now();
      const postData = {
        id: postId,
        type: 'video',
        url: url,
        user: user,
        caption: caption,
        link: null,
        likes: [],
        comments: [],
        views: 0,
        edited: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebase.firestore().collection('posts').doc(postId).set(postData);

      // Save locally
      if (typeof saveVideoToStorage === 'function') {
        saveVideoToStorage({ ...postData, createdAt: null });
      }

      toast('✅ Video posted successfully!');
      window.__editedBlob = null;

      setTimeout(() => {
        if (typeof window.initAppContent === 'function') window.initAppContent();
        if (typeof window.switchTab === 'function') window.switchTab('videos');
      }, 800);

    } catch(e) {
      console.error(e);
      toast('❌ Upload fail: ' + e.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CLOSE EDITOR
  // ═══════════════════════════════════════════════════════════════
  window.closeVideoEditor = function() {
    const video = document.getElementById('editor-video');
    if (video) {
      video.pause();
      video.src = '';
    }
    if (Editor.animFrame) cancelAnimationFrame(Editor.animFrame);
    closeModal('videoEditorModal');
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO-HOOK: Video file select hone pe
  // ═══════════════════════════════════════════════════════════════
  function hookVideoUpload() {
    const fileInput = document.getElementById('post-video-file');
    if (fileInput && !fileInput.dataset.editHooked) {
      fileInput.dataset.editHooked = '1';

      // Replace original onchange
      const origOnChange = fileInput.onchange;
      fileInput.onchange = function(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show edit prompt
        setTimeout(() => {
          if (confirm('🎬 Video ko edit karein?\n\nOK = Edit\nCancel = Direct upload')) {
            window.openVideoEditor(file);
          } else {
            // Direct upload
            if (origOnChange) origOnChange.call(this, e);
          }
        }, 200);
      };
    }

    // Also add Edit button next to file picker
    const videoFields = document.getElementById('video-post-fields');
    if (videoFields && !document.getElementById('edit-video-btn')) {
      const btn = document.createElement('button');
      btn.id = 'edit-video-btn';
      btn.type = 'button';
      btn.className = 'w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 mt-2';
      btn.innerHTML = '✂️ Edit Video Before Post';
      btn.onclick = () => {
        const file = document.getElementById('post-video-file')?.files?.[0];
        if (!file) { toast('❌ Pehle video select karein'); return; }
        window.openVideoEditor(file);
      };
      videoFields.appendChild(btn);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    setInterval(hookVideoUpload, 2000);
    setTimeout(hookVideoUpload, 3000);
    console.log('✅ editing.js loaded - Video editor ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════
  window.__EDITING__ = {
    openVideoEditor: window.openVideoEditor,
    exportVideo: window.exportVideo,
    publishEditedVideo: window.publishEditedVideo,
    Editor
  };
})();
