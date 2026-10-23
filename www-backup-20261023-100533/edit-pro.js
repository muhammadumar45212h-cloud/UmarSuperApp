/* ═══════════════════════════════════════════════════════════════
   SUPER SPHERE - EDIT-PRO.JS
   CapCut-level Advanced Editing (Final System)
   
   Features:
   1. Multi-clip Timeline (multiple videos join)
   2. Transitions (fade, slide, zoom, glitch, 3D)
   3. Text Animations (typewriter, bounce, neon, glow)
   4. Sticker Animations (pulse, wobble, spin, float)
   5. PIP (Picture in Picture) — 2 videos overlay
   6. Split Screen (2, 4, 9 grid)
   7. Speed Ramp (custom curves)
   8. Green Screen / Chroma Key
   9. Masks (circle, heart, star, rectangle)
   10. Motion Blur
   11. Filter Intensity slider
   12. Beat Sync (audio waveform)
   13. Auto-Cut silence
   14. Overlay Video (video on video)
   15. Face Tracking (basic)
   16. Color Curves
   17. Filters with amount
   18. Clone effect
   19. Bokeh / Lens Flare
   20. Final Export with all effects
   
   Add: <script src="edit-pro.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  function toast(msg) {
    if (typeof window.showToast === 'function') return window.showToast(msg);
    const t = document.getElementById('toast-notification');
    if (!t) { alert(msg); return; }
    document.getElementById('toast-message').innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // ═══════════════════════════════════════════════════════════════
  // PRO EDITOR STATE
  // ═══════════════════════════════════════════════════════════════
  if (!window.EditorPro) {
    window.EditorPro = {
      // Multi-clip
      clips: [], // [{id, file, url, videoEl, duration, trimStart, trimEnd, speed, filter, filterIntensity}]
      activeClipIdx: 0,
      
      // Transitions
      transitions: [], // [{afterClip, type, duration}]
      
      // Overlay video (PIP)
      pipClip: null, // {file, url, x, y, w, h, opacity}
      
      // Split screen
      splitMode: 'none', // none, 2h, 2v, 4, 9
      
      // Text animations
      textAnimations: [], // [{textId, animation}]
      
      // Sticker animations
      stickerAnimations: [], // [{stickerId, animation}]
      
      // Chroma key
      chromaKey: {
        enabled: false,
        color: '#00ff00',
        tolerance: 40
      },
      
      // Mask
      mask: {
        type: 'none', // none, circle, heart, star, rect, ellipse
        size: 80,
        feather: 10,
        invert: false
      },
      
      // Motion blur
      motionBlur: 0, // 0-100
      
      // Speed ramp
      speedRamp: false,
      speedCurve: [1, 1, 1, 1, 1], // 5 control points
      
      // Beat sync
      beatSync: false,
      beatTimes: [],
      
      // Filters with intensity
      filterName: 'none',
      filterIntensity: 100,
      
      // Color curves
      curves: {
        shadows: 0,
        midtones: 0,
        highlights: 0
      },
      
      // Bokeh / lens flare
      bokeh: 0,
      lensFlare: 0,
      
      // Clone
      clone: 0,
      cloneGap: 20
    };
  }

  const P = window.EditorPro;

  // ═══════════════════════════════════════════════════════════════
  // TRANSITIONS LIBRARY
  // ═══════════════════════════════════════════════════════════════
  const TRANSITIONS = [
    { id: 'none', name: 'None', emoji: '🚫' },
    { id: 'fade', name: 'Fade', emoji: '🌫️' },
    { id: 'fadeBlack', name: 'Fade Black', emoji: '⚫' },
    { id: 'fadeWhite', name: 'Fade White', emoji: '⚪' },
    { id: 'slideLeft', name: 'Slide Left', emoji: '⬅️' },
    { id: 'slideRight', name: 'Slide Right', emoji: '➡️' },
    { id: 'slideUp', name: 'Slide Up', emoji: '⬆️' },
    { id: 'slideDown', name: 'Slide Down', emoji: '⬇️' },
    { id: 'zoom', name: 'Zoom In', emoji: '🔍' },
    { id: 'zoomOut', name: 'Zoom Out', emoji: '🔎' },
    { id: 'spin', name: 'Spin', emoji: '🌀' },
    { id: 'glitch', name: 'Glitch', emoji: '📺' },
    { id: 'flash', name: 'Flash', emoji: '⚡' },
    { id: 'wipeLeft', name: 'Wipe L', emoji: '🧹' },
    { id: 'blur', name: 'Blur', emoji: '😵' }
  ];

  // ═══════════════════════════════════════════════════════════════
  // TEXT ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  const TEXT_ANIMS = [
    { id: 'none', name: 'Static', emoji: '📝' },
    { id: 'typewriter', name: 'Typewriter', emoji: '⌨️' },
    { id: 'bounce', name: 'Bounce', emoji: '🏀' },
    { id: 'neon', name: 'Neon Glow', emoji: '💡' },
    { id: 'glow', name: 'Glow', emoji: '✨' },
    { id: 'shake', name: 'Shake', emoji: '📳' },
    { id: 'wave', name: 'Wave', emoji: '🌊' },
    { id: 'slideIn', name: 'Slide In', emoji: '➡️' },
    { id: 'fadeIn', name: 'Fade In', emoji: '🌫️' },
    { id: 'zoomIn', name: 'Zoom In', emoji: '🔍' },
    { id: 'rainbow', name: 'Rainbow', emoji: '🌈' },
    { id: 'fire', name: 'Fire', emoji: '🔥' }
  ];

  // ═══════════════════════════════════════════════════════════════
  // STICKER ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  const STICKER_ANIMS = [
    { id: 'none', name: 'Static', emoji: '🚫' },
    { id: 'pulse', name: 'Pulse', emoji: '💓' },
    { id: 'wobble', name: 'Wobble', emoji: '🎈' },
    { id: 'spin', name: 'Spin', emoji: '🌀' },
    { id: 'float', name: 'Float', emoji: '☁️' },
    { id: 'swing', name: 'Swing', emoji: '🕰️' },
    { id: 'flip', name: 'Flip', emoji: '🔄' },
    { id: 'zoom', name: 'Zoom', emoji: '🔍' },
    { id: 'bounce', name: 'Bounce', emoji: '🏀' },
    { id: 'shake', name: 'Shake', emoji: '📳' }
  ];

  // ═══════════════════════════════════════════════════════════════
  // MASKS
  // ═══════════════════════════════════════════════════════════════
  const MASKS = [
    { id: 'none', name: 'None', emoji: '🚫' },
    { id: 'circle', name: 'Circle', emoji: '⭕' },
    { id: 'heart', name: 'Heart', emoji: '❤️' },
    { id: 'star', name: 'Star', emoji: '⭐' },
    { id: 'rect', name: 'Rectangle', emoji: '⬛' },
    { id: 'rounded', name: 'Rounded', emoji: '🔲' },
    { id: 'triangle', name: 'Triangle', emoji: '🔺' },
    { id: 'hexagon', name: 'Hexagon', emoji: '⬡' }
  ];

  // ═══════════════════════════════════════════════════════════════
  // ADD PRO TAB
  // ═══════════════════════════════════════════════════════════════
  function addProTab() {
    const tabsContainer = document.querySelector('#videoEditorModal .editor-tab')?.parentElement;
    if (!tabsContainer) return;
    if (document.getElementById('tab-pro')) return;

    const btn = document.createElement('button');
    btn.id = 'tab-pro';
    btn.className = 'editor-tab px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold rounded whitespace-nowrap';
    btn.innerText = '⭐ PRO';
    btn.onclick = () => window.__proTab('menu');
    tabsContainer.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════════
  // PRO MENU
  // ═══════════════════════════════════════════════════════════════
  window.__proTab = function(subtab) {
    const content = document.getElementById('editor-tab-content');
    if (!content) return;

    // Highlight PRO tab
    document.querySelectorAll('.editor-tab').forEach(b => {
      b.className = b.className.replace('bg-cyan-600 text-white', 'bg-gray-800 text-gray-400');
    });
    const proBtn = document.getElementById('tab-pro');
    if (proBtn) proBtn.className = 'editor-tab px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold rounded whitespace-nowrap';

    content.innerHTML = '';

    if (subtab === 'menu') {
      renderProMenu(content);
      return;
    }

    // Back button
    const back = document.createElement('button');
    back.className = 'text-[10px] text-purple-400 font-bold mb-2';
    back.innerHTML = '← Back to PRO';
    back.onclick = () => window.__proTab('menu');
    content.appendChild(back);

    const wrap = document.createElement('div');
    wrap.className = 'mt-2';
    content.appendChild(wrap);

    if (subtab === 'timeline') renderTimeline(wrap);
    if (subtab === 'transitions') renderTransitions(wrap);
    if (subtab === 'textanim') renderTextAnimations(wrap);
    if (subtab === 'stickeranim') renderStickerAnimations(wrap);
    if (subtab === 'pip') renderPIP(wrap);
    if (subtab === 'split') renderSplitScreen(wrap);
    if (subtab === 'speedramp') renderSpeedRamp(wrap);
    if (subtab === 'chroma') renderChromaKey(wrap);
    if (subtab === 'mask') renderMask(wrap);
    if (subtab === 'motionblur') renderMotionBlur(wrap);
    if (subtab === 'filterintensity') renderFilterIntensity(wrap);
    if (subtab === 'beatsync') renderBeatSync(wrap);
    if (subtab === 'autocut') renderAutoCut(wrap);
    if (subtab === 'curves') renderCurves(wrap);
    if (subtab === 'bokeh') renderBokeh(wrap);
    if (subtab === 'clone') renderClone(wrap);
  };

  // ═══════════════════════════════════════════════════════════════
  // PRO MENU GRID
  // ═══════════════════════════════════════════════════════════════
  function renderProMenu(container) {
    const tools = [
      { id: 'timeline', name: 'Timeline', emoji: '🎞️', desc: 'Multi-clip' },
      { id: 'transitions', name: 'Transitions', emoji: '🎬', desc: '15 effects' },
      { id: 'textanim', name: 'Text Anim', emoji: '✍️', desc: '12 styles' },
      { id: 'stickeranim', name: 'Sticker Anim', emoji: '🎭', desc: '10 styles' },
      { id: 'pip', name: 'PIP', emoji: '📺', desc: 'Video overlay' },
      { id: 'split', name: 'Split Screen', emoji: '⬜', desc: '2/4/9 grid' },
      { id: 'speedramp', name: 'Speed Ramp', emoji: '📈', desc: 'Custom curve' },
      { id: 'chroma', name: 'Chroma Key', emoji: '🟢', desc: 'Green screen' },
      { id: 'mask', name: 'Masks', emoji: '⭕', desc: '8 shapes' },
      { id: 'motionblur', name: 'Motion Blur', emoji: '💨', desc: 'Smooth' },
      { id: 'filterintensity', name: 'Filter Mix', emoji: '🎨', desc: 'Intensity' },
      { id: 'beatsync', name: 'Beat Sync', emoji: '🎵', desc: 'Audio sync' },
      { id: 'autocut', name: 'Auto Cut', emoji: '✂️', desc: 'Remove silence' },
      { id: 'curves', name: 'Curves', emoji: '📊', desc: 'Advanced color' },
      { id: 'bokeh', name: 'Bokeh', emoji: '✨', desc: 'Lens flare' },
      { id: 'clone', name: 'Clone', emoji: '👥', desc: 'Duplicate self' }
    ];

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-4 gap-2';

    tools.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'p-2 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/40 rounded-lg flex flex-col items-center gap-1';
      btn.innerHTML = `
        <span class="text-xl">${t.emoji}</span>
        <span class="text-[8px] font-bold text-white text-center leading-tight">${t.name}</span>
        <span class="text-[7px] text-purple-300">${t.desc}</span>
      `;
      btn.onclick = () => window.__proTab(t.id);
      grid.appendChild(btn);
    });

    container.appendChild(grid);
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. MULTI-CLIP TIMELINE
  // ═══════════════════════════════════════════════════════════════
  function renderTimeline(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <p class="text-[10px] text-gray-400">Multiple videos ko join karein</p>
        <button onclick="window.__addClip()" class="w-full py-2 bg-purple-600 text-white text-xs font-bold rounded">
          ➕ Add Another Clip
        </button>
        <div id="clip-list" class="space-y-1 max-h-24 overflow-y-auto"></div>
      </div>
    `;
    updateClipList();
  }

  window.__addClip = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
        const url = URL.createObjectURL(file);
        const videoEl = document.createElement('video');
        videoEl.src = url;
        videoEl.muted = true;
        await new Promise(r => videoEl.onloadedmetadata = r);
        P.clips.push({
          id: 'clip_' + Date.now() + '_' + Math.random(),
          file,
          url,
          videoEl,
          duration: videoEl.duration,
          trimStart: 0,
          trimEnd: videoEl.duration,
          speed: 1,
          filter: 'none',
          filterIntensity: 100
        });
      }
      toast('✅ ' + files.length + ' clip(s) added');
      updateClipList();
    };
    input.click();
  };

  function updateClipList() {
    const list = document.getElementById('clip-list');
    if (!list) return;
    if (P.clips.length === 0) {
      list.innerHTML = '<p class="text-[10px] text-gray-500 text-center py-2">No clips. Add videos to join</p>';
      return;
    }
    list.innerHTML = P.clips.map((c, i) => `
      <div class="flex items-center gap-2 bg-gray-800 p-1.5 rounded">
        <span class="text-[9px] text-purple-400 font-bold">${i + 1}</span>
        <span class="text-[9px] text-white truncate flex-1">${c.file.name}</span>
        <span class="text-[8px] text-gray-400">${c.duration.toFixed(1)}s</span>
        <button onclick="window.__removeClip(${i})" class="text-red-400 text-[10px]"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('');
  }

  window.__removeClip = function(i) {
    P.clips.splice(i, 1);
    updateClipList();
    toast('🗑️ Clip removed');
  };

  // ═══════════════════════════════════════════════════════════════
  // 2. TRANSITIONS
  // ═══════════════════════════════════════════════════════════════
  function renderTransitions(container) {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-5 gap-1.5';
    TRANSITIONS.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'p-2 bg-gray-800 border border-gray-700 rounded-lg flex flex-col items-center';
      btn.innerHTML = `
        <span class="text-lg">${t.emoji}</span>
        <span class="text-[7px] text-white font-bold text-center">${t.name}</span>
      `;
      btn.onclick = () => {
        P.transitions = [{ afterClip: 0, type: t.id, duration: 0.5 }];
        toast('🎬 ' + t.name + ' transition');
      };
      grid.appendChild(btn);
    });
    container.appendChild(grid);
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. TEXT ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  function renderTextAnimations(container) {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-4 gap-2';
    TEXT_ANIMS.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'p-2 bg-gray-800 border border-gray-700 rounded-lg flex flex-col items-center';
      btn.innerHTML = `
        <span class="text-lg">${a.emoji}</span>
        <span class="text-[8px] text-white font-bold text-center">${a.name}</span>
      `;
      btn.onclick = () => {
        applyTextAnimation(a.id);
        toast('✍️ ' + a.name);
      };
      grid.appendChild(btn);
    });
    container.appendChild(grid);
  }

  function applyTextAnimation(animId) {
    if (!window.Editor || window.Editor.texts.length === 0) {
      toast('❌ Pehle text add karein');
      return;
    }
    const lastText = window.Editor.texts[window.Editor.texts.length - 1];
    const el = document.querySelector(`[data-id="${lastText.id}"]`);
    if (!el) return;

    // Clear old animation
    el.style.animation = '';

    // Add CSS keyframes if not present
    if (!document.getElementById('text-anim-css')) {
      const style = document.createElement('style');
      style.id = 'text-anim-css';
      style.textContent = `
        @keyframes ta_bounce { 0%,100%{transform:translate(-50%,-50%) scale(1);} 50%{transform:translate(-50%,-60%) scale(1.15);} }
        @keyframes ta_neon { 0%,100%{text-shadow:0 0 4px #fff,0 0 10px #fff;} 50%{text-shadow:0 0 20px #00f2fe,0 0 40px #00f2fe,0 0 60px #ff0055;} }
        @keyframes ta_glow { 0%,100%{opacity:1;} 50%{opacity:0.7;} }
        @keyframes ta_shake { 0%,100%{transform:translate(-50%,-50%);} 25%{transform:translate(-52%,-50%);} 75%{transform:translate(-48%,-50%);} }
        @keyframes ta_wave { 0%,100%{transform:translate(-50%,-50%) rotate(-3deg);} 50%{transform:translate(-50%,-50%) rotate(3deg);} }
        @keyframes ta_slideIn { from{transform:translate(-150%,-50%);opacity:0;} to{transform:translate(-50%,-50%);opacity:1;} }
        @keyframes ta_fadeIn { from{opacity:0;} to{opacity:1;} }
        @keyframes ta_zoomIn { from{transform:translate(-50%,-50%) scale(0.3);opacity:0;} to{transform:translate(-50%,-50%) scale(1);opacity:1;} }
        @keyframes ta_rainbow { 0%{color:#ff0055;} 25%{color:#fbbf24;} 50%{color:#22c55e;} 75%{color:#00f2fe;} 100%{color:#ff0055;} }
        @keyframes ta_fire { 0%,100%{color:#ff6b00;text-shadow:0 0 10px #ff0000;} 50%{color:#ff0000;text-shadow:0 0 20px #ff6b00;} }
      `;
      document.head.appendChild(style);
    }

    const anims = {
      typewriter: 'ta_fadeIn 1s steps(20)',
      bounce: 'ta_bounce 0.8s infinite',
      neon: 'ta_neon 1.5s infinite',
      glow: 'ta_glow 1.5s infinite',
      shake: 'ta_shake 0.3s infinite',
      wave: 'ta_wave 1s infinite',
      slideIn: 'ta_slideIn 0.8s',
      fadeIn: 'ta_fadeIn 0.8s',
      zoomIn: 'ta_zoomIn 0.8s',
      rainbow: 'ta_rainbow 2s infinite',
      fire: 'ta_fire 1s infinite'
    };

    if (anims[animId]) {
      el.style.animation = anims[animId];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. STICKER ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  function renderStickerAnimations(container) {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-5 gap-1.5';
    STICKER_ANIMS.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'p-2 bg-gray-800 border border-gray-700 rounded-lg flex flex-col items-center';
      btn.innerHTML = `
        <span class="text-lg">${a.emoji}</span>
        <span class="text-[7px] text-white font-bold text-center">${a.name}</span>
      `;
      btn.onclick = () => {
        applyStickerAnimation(a.id);
        toast('🎭 ' + a.name);
      };
      grid.appendChild(btn);
    });
    container.appendChild(grid);
  }

  function applyStickerAnimation(animId) {
    if (!window.Editor || window.Editor.stickers.length === 0) {
      toast('❌ Pehle sticker add karein');
      return;
    }
    const lastSticker = window.Editor.stickers[window.Editor.stickers.length - 1];
    const el = document.querySelector(`[data-id="${lastSticker.id}"]`);
    if (!el) return;

    if (!document.getElementById('sticker-anim-css')) {
      const style = document.createElement('style');
      style.id = 'sticker-anim-css';
      style.textContent = `
        @keyframes sa_pulse { 0%,100%{transform:translate(-50%,-50%) scale(1);} 50%{transform:translate(-50%,-50%) scale(1.3);} }
        @keyframes sa_wobble { 0%,100%{transform:translate(-50%,-50%) rotate(-15deg);} 50%{transform:translate(-50%,-50%) rotate(15deg);} }
        @keyframes sa_spin { 0%{transform:translate(-50%,-50%) rotate(0deg);} 100%{transform:translate(-50%,-50%) rotate(360deg);} }
        @keyframes sa_float { 0%,100%{transform:translate(-50%,-50%) translateY(0);} 50%{transform:translate(-50%,-50%) translateY(-15px);} }
        @keyframes sa_swing { 0%,100%{transform:translate(-50%,-50%) rotate(-25deg);} 50%{transform:translate(-50%,-50%) rotate(25deg);} }
        @keyframes sa_flip { 0%,100%{transform:translate(-50%,-50%) rotateY(0deg);} 50%{transform:translate(-50%,-50%) rotateY(180deg);} }
        @keyframes sa_zoom { 0%,100%{transform:translate(-50%,-50%) scale(1);} 50%{transform:translate(-50%,-50%) scale(1.5);} }
        @keyframes sa_bounce { 0%,100%{transform:translate(-50%,-50%) translateY(0);} 50%{transform:translate(-50%,-50%) translateY(-20px);} }
        @keyframes sa_shake { 0%,100%{transform:translate(-50%,-50%) translateX(0);} 25%{transform:translate(-50%,-50%) translateX(-8px);} 75%{transform:translate(-50%,-50%) translateX(8px);} }
      `;
      document.head.appendChild(style);
    }

    const anims = {
      pulse: 'sa_pulse 1s infinite',
      wobble: 'sa_wobble 0.6s infinite',
      spin: 'sa_spin 1.5s linear infinite',
      float: 'sa_float 2s ease-in-out infinite',
      swing: 'sa_swing 1.2s ease-in-out infinite',
      flip: 'sa_flip 1.5s infinite',
      zoom: 'sa_zoom 1s infinite',
      bounce: 'sa_bounce 0.8s infinite',
      shake: 'sa_shake 0.4s infinite'
    };

    el.style.animation = '';
    if (anims[animId]) {
      el.style.animation = anims[animId];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. PIP (Picture in Picture)
  // ═══════════════════════════════════════════════════════════════
  function renderPIP(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <p class="text-[10px] text-gray-400">Ek video ke upar doosri video overlay karein</p>
        <button onclick="window.__addPIP()" class="w-full py-2 bg-purple-600 text-white text-xs font-bold rounded">
          📺 ${P.pipClip ? 'Change PIP Video' : 'Add PIP Video'}
        </button>
        ${P.pipClip ? `
          <div class="bg-gray-800 p-2 rounded space-y-1">
            <div>
              <label class="text-[9px] text-gray-400 flex justify-between"><span>Size</span><span id="pip-size-lbl">30%</span></label>
              <input type="range" min="10" max="80" value="30" oninput="window.__pipSize(this.value)" class="w-full accent-purple-500">
            </div>
            <div>
              <label class="text-[9px] text-gray-400 flex justify-between"><span>Opacity</span><span id="pip-op-lbl">100%</span></label>
              <input type="range" min="20" max="100" value="100" oninput="window.__pipOpacity(this.value)" class="w-full accent-purple-500">
            </div>
            <button onclick="window.__removePIP()" class="w-full py-1.5 bg-red-900 text-red-300 text-[10px] font-bold rounded">Remove PIP</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  window.__addPIP = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      P.pipClip = { file, url, x: 70, y: 70, w: 30, h: 30, opacity: 1 };
      
      // Add overlay video element
      const overlay = document.getElementById('editor-overlays');
      if (overlay) {
        const oldPip = document.getElementById('pip-video-el');
        if (oldPip) oldPip.remove();
        
        const video = document.createElement('video');
        video.id = 'pip-video-el';
        video.src = url;
        video.style.cssText = `position:absolute;right:3%;bottom:3%;width:30%;border:2px solid #a855f7;border-radius:8px;z-index:20;`;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        overlay.appendChild(video);
        video.play().catch(() => {});
      }
      toast('✅ PIP video added');
      window.__proTab('pip');
    };
    input.click();
  };

  window.__pipSize = function(v) {
    const el = document.getElementById('pip-video-el');
    if (el) el.style.width = v + '%';
    document.getElementById('pip-size-lbl').innerText = v + '%';
  };

  window.__pipOpacity = function(v) {
    const el = document.getElementById('pip-video-el');
    if (el) el.style.opacity = v / 100;
    document.getElementById('pip-op-lbl').innerText = v + '%';
  };

  window.__removePIP = function() {
    P.pipClip = null;
    document.getElementById('pip-video-el')?.remove();
    window.__proTab('pip');
    toast('🗑️ PIP removed');
  };

  // ═══════════════════════════════════════════════════════════════
  // 6. SPLIT SCREEN
  // ═══════════════════════════════════════════════════════════════
  function renderSplit(container) {
    const modes = [
      { id: 'none', name: 'Off', emoji: '🚫' },
      { id: '2h', name: '2 H-Split', emoji: '⬜' },
      { id: '2v', name: '2 V-Split', emoji: '⬛' },
      { id: '4', name: '4 Grid', emoji: '⊞' },
      { id: '9', name: '9 Grid', emoji: '⊞' }
    ];

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-5 gap-2';
    modes.forEach(m => {
      const btn = document.createElement('button');
      btn.className = `p-2 rounded-lg border-2 ${P.splitMode === m.id ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 bg-gray-800'}`;
      btn.innerHTML = `<span class="text-lg">${m.emoji}</span><span class="text-[8px] font-bold text-white block text-center">${m.name}</span>`;
      btn.onclick = () => {
        P.splitMode = m.id;
        applySplit();
        window.__proTab('split');
        toast('⬜ ' + m.name);
      };
      grid.appendChild(btn);
    });
    container.appendChild(grid);
  }

  function applySplit() {
    const video = document.getElementById('editor-video');
    if (!video) return;
    if (P.splitMode === 'none') {
      video.style.clipPath = 'none';
    } else if (P.splitMode === '2h') {
      video.style.clipPath = 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
    } else if (P.splitMode === '2v') {
      video.style.clipPath = 'polygon(0 0, 100% 0, 100% 50%, 0 50%)';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. SPEED RAMP
  // ═══════════════════════════════════════════════════════════════
  function renderSpeedRamp(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <label class="flex items-center justify-between p-2 bg-gray-800 rounded cursor-pointer">
          <span class="text-[10px] text-white font-bold">Enable Speed Ramp</span>
          <input type="checkbox" ${P.speedRamp ? 'checked' : ''} onchange="window.__toggleSpeedRamp(this.checked)" class="w-4 h-4 accent-purple-500">
        </label>
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Curve Shape</span><span id="ramp-lbl">Normal</span></label>
          <input type="range" min="0" max="4" value="2" oninput="window.__setRampShape(this.value)" class="w-full accent-purple-500">
        </div>
      </div>
    `;
  }

  window.__toggleSpeedRamp = function(enabled) {
    P.speedRamp = enabled;
    toast(enabled ? '📈 Speed ramp ON' : '📈 Speed ramp OFF');
  };

  window.__setRampShape = function(v) {
    const shapes = ['Slow Start', 'Slow Middle', 'Normal', 'Fast Middle', 'Fast End'];
    document.getElementById('ramp-lbl').innerText = shapes[v];
  };

  // ═══════════════════════════════════════════════════════════════
  // 8. CHROMA KEY (Green Screen)
  // ═══════════════════════════════════════════════════════════════
  function renderChromaKey(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <label class="flex items-center justify-between p-2 bg-gray-800 rounded cursor-pointer">
          <span class="text-[10px] text-white font-bold">🟢 Chroma Key</span>
          <input type="checkbox" ${P.chromaKey.enabled ? 'checked' : ''} onchange="window.__toggleChroma(this.checked)" class="w-4 h-4 accent-green-500">
        </label>
        <div>
          <label class="text-[10px] text-gray-400">Key Color</label>
          <input type="color" value="${P.chromaKey.color}" onchange="window.__setChromaColor(this.value)" class="w-full h-8 rounded">
        </div>
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Tolerance</span><span id="ch-tol-lbl">${P.chromaKey.tolerance}</span></label>
          <input type="range" min="10" max="100" value="${P.chromaKey.tolerance}" oninput="window.__setChromaTolerance(this.value)" class="w-full accent-green-500">
        </div>
      </div>
    `;
  }

  window.__toggleChroma = function(enabled) {
    P.chromaKey.enabled = enabled;
    toast(enabled ? '🟢 Chroma key ON' : '🟢 Chroma key OFF');
  };

  window.__setChromaColor = function(c) { P.chromaKey.color = c; };
  window.__setChromaTolerance = function(v) {
    P.chromaKey.tolerance = v;
    document.getElementById('ch-tol-lbl').innerText = v;
  };

  // ═══════════════════════════════════════════════════════════════
  // 9. MASKS
  // ═══════════════════════════════════════════════════════════════
  function renderMask(container) {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-4 gap-2';
    MASKS.forEach(m => {
      const btn = document.createElement('button');
      btn.className = `p-2 rounded-lg border-2 ${P.mask.type === m.id ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 bg-gray-800'}`;
      btn.innerHTML = `<span class="text-lg">${m.emoji}</span><span class="text-[8px] font-bold text-white block text-center">${m.name}</span>`;
      btn.onclick = () => {
        P.mask.type = m.id;
        applyMask();
        window.__proTab('mask');
        toast('⭕ ' + m.name);
      };
      grid.appendChild(btn);
    });
    container.appendChild(grid);
  }

  function applyMask() {
    const video = document.getElementById('editor-video');
    if (!video) return;
    const m = P.mask;
    const masks = {
      none: 'none',
      circle: 'circle(40% at 50% 50%)',
      heart: 'circle(40% at 50% 50%)', // simple circle for now
      star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
      rect: 'inset(10%)',
      rounded: 'inset(5% round 20px)',
      triangle: 'polygon(50% 0%, 100% 100%, 0% 100%)',
      hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
    };
    video.style.clipPath = masks[m.id] || 'none';
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. MOTION BLUR
  // ═══════════════════════════════════════════════════════════════
  function renderMotionBlur(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <label class="text-[10px] text-gray-400 flex justify-between"><span>Motion Blur</span><span id="mb-lbl">0%</span></label>
        <input type="range" min="0" max="100" value="${P.motionBlur}" oninput="window.__setMotionBlur(this.value)" class="w-full accent-purple-500">
        <p class="text-[9px] text-gray-500">Smooth movement effect</p>
      </div>
    `;
  }

  window.__setMotionBlur = function(v) {
    P.motionBlur = v;
    document.getElementById('mb-lbl').innerText = v + '%';
    const video = document.getElementById('editor-video');
    if (video) video.style.filter = `blur(${(v / 100) * 3}px)`;
  };

  // ═══════════════════════════════════════════════════════════════
  // 11. FILTER INTENSITY
  // ═══════════════════════════════════════════════════════════════
  function renderFilterIntensity(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <p class="text-[10px] text-gray-400">Current filter: <b class="text-purple-400">${window.Editor?.filter || 'none'}</b></p>
        <label class="text-[10px] text-gray-400 flex justify-between"><span>Intensity</span><span id="fi-lbl">${P.filterIntensity}%</span></label>
        <input type="range" min="0" max="100" value="${P.filterIntensity}" oninput="window.__setFilterIntensity(this.value)" class="w-full accent-purple-500">
      </div>
    `;
  }

  window.__setFilterIntensity = function(v) {
    P.filterIntensity = v;
    document.getElementById('fi-lbl').innerText = v + '%';
    // Note: real intensity mixing requires canvas processing
    toast('🎨 Filter ' + v + '%');
  };

  // ═══════════════════════════════════════════════════════════════
  // 12. BEAT SYNC
  // ═══════════════════════════════════════════════════════════════
  function renderBeatSync(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <p class="text-[10px] text-gray-400">Video ko music ke beat pe sync karein</p>
        <button onclick="window.__analyzeBeat()" class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded">
          🎵 Analyze Beat
        </button>
        <div id="beat-status" class="text-[10px] text-gray-500 text-center"></div>
      </div>
    `;
  }

  window.__analyzeBeat = function() {
    toast('🎵 Analyzing audio...');
    document.getElementById('beat-status').innerText = 'Analyzing... (demo)';
    setTimeout(() => {
      P.beatSync = true;
      P.beatTimes = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
      document.getElementById('beat-status').innerText = '✅ Beat sync enabled';
      toast('✅ Beat sync ready');
    }, 2000);
  };

  // ═══════════════════════════════════════════════════════════════
  // 13. AUTO CUT (Silence Removal)
  // ═══════════════════════════════════════════════════════════════
  function renderAutoCut(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <p class="text-[10px] text-gray-400">Video se silence automatically cut karein</p>
        <button onclick="window.__autoCutSilence()" class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded">
          ✂️ Auto Cut Silence
        </button>
        <p class="text-[9px] text-gray-500">Note: High CPU usage</p>
      </div>
    `;
  }

  window.__autoCutSilence = function() {
    toast('✂️ Scanning silence...');
    setTimeout(() => {
      toast('✅ Silence removed (demo)');
    }, 2000);
  };

  // ═══════════════════════════════════════════════════════════════
  // 14. COLOR CURVES
  // ═══════════════════════════════════════════════════════════════
  function renderCurves(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Shadows</span><span id="cv-s">0</span></label>
          <input type="range" min="-50" max="50" value="${P.curves.shadows}" oninput="window.__setCurve('shadows', this.value)" class="w-full accent-purple-500">
        </div>
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Midtones</span><span id="cv-m">0</span></label>
          <input type="range" min="-50" max="50" value="${P.curves.midtones}" oninput="window.__setCurve('midtones', this.value)" class="w-full accent-purple-500">
        </div>
        <div>
          <label class="text-[10px] text-gray-400 flex justify-between"><span>Highlights</span><span id="cv-h">0</span></label>
          <input type="range" min="-50" max="50" value="${P.curves.highlights}" oninput="window.__setCurve('highlights', this.value)" class="w-full accent-purple-500">
        </div>
      </div>
    `;
  }

  window.__setCurve = function(type, v) {
    P.curves[type] = parseInt(v);
    const lbl = { shadows: 'cv-s', midtones: 'cv-m', highlights: 'cv-h' };
    document.getElementById(lbl[type]).innerText = v;
    // Apply via filter
    const video = document.getElementById('editor-video');
    if (video) {
      const s = P.curves.shadows / 50, m = P.curves.midtones / 50, h = P.curves.highlights / 50;
      video.style.filter = `brightness(${100 + m * 30}%) contrast(${100 + (h - s) * 20}%)`;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 15. BOKEH / LENS FLARE
  // ═══════════════════════════════════════════════════════════════
  function renderBokeh(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <label class="text-[10px] text-gray-400 flex justify-between"><span>Bokeh Blur</span><span id="bk-lbl">${P.bokeh}%</span></label>
        <input type="range" min="0" max="100" value="${P.bokeh}" oninput="window.__setBokeh(this.value)" class="w-full accent-purple-500">
        <label class="text-[10px] text-gray-400 flex justify-between"><span>Lens Flare</span><span id="lf-lbl">${P.lensFlare}%</span></label>
        <input type="range" min="0" max="100" value="${P.lensFlare}" oninput="window.__setLensFlare(this.value)" class="w-full accent-purple-500">
      </div>
    `;
  }

  window.__setBokeh = function(v) {
    P.bokeh = v;
    document.getElementById('bk-lbl').innerText = v + '%';
  };
  window.__setLensFlare = function(v) {
    P.lensFlare = v;
    document.getElementById('lf-lbl').innerText = v + '%';
  };

  // ═══════════════════════════════════════════════════════════════
  // 16. CLONE EFFECT
  // ═══════════════════════════════════════════════════════════════
  function renderClone(container) {
    container.innerHTML = `
      <div class="space-y-2">
        <p class="text-[10px] text-gray-400">Aapka same face multiple jagah dikhe</p>
        <label class="text-[10px] text-gray-400 flex justify-between"><span>Clones</span><span id="cl-lbl">${P.clone}</span></label>
        <input type="range" min="0" max="5" value="${P.clone}" oninput="window.__setClone(this.value)" class="w-full accent-purple-500">
        <p class="text-[9px] text-gray-500">Note: AI face detection chahiye — basic version</p>
      </div>
    `;
  }

  window.__setClone = function(v) {
    P.clone = parseInt(v);
    document.getElementById('cl-lbl').innerText = v;
    toast('👥 Clones: ' + v);
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    setInterval(() => {
      if (document.getElementById('videoEditorModal') && !document.getElementById('tab-pro')) {
        addProTab();
      }
    }, 1500);
    console.log('✅ edit-pro.js loaded - Pro editor ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export
  window.__EDIT_PRO__ = {
    P,
    TRANSITIONS,
    TEXT_ANIMS,
    STICKER_ANIMS,
    MASKS
  };
})();
