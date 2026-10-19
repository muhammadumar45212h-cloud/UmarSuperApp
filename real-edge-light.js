// ==========================================
// ⚡ SUPER APP - REAL EDGE LIGHT & PREMIUM PANEL
// File: real-edge-light.js
// ==========================================

(function() {
  'use strict';

  let isEdgeOn = localStorage.getItem('EDGE_LIGHT_ON') === 'true';
  let edgeColor = localStorage.getItem('EDGE_LIGHT_COLOR') || '#00f2fe';
  let edgeSpeed = localStorage.getItem('EDGE_LIGHT_SPEED') || '2';

  function injectUI() {
    if (document.getElementById('real-edge-panel')) return;

    // 1. REAL EDGE LIGHT (Hardware Style Glow)
    const edgeDiv = document.createElement('div');
    edgeDiv.id = 'real-edge-glow';
    edgeDiv.style.cssText = `
      position: fixed; inset: 0; pointer-events: none; z-index: 99999;
      border-radius: 20px;
      /* Multiple box-shadows for realistic bezel glow */
      box-shadow: 
        inset 0 0 15px 2px ${edgeColor}, 
        inset 0 0 40px 5px ${edgeColor}, 
        inset 0 0 80px 10px ${edgeColor};
      opacity: ${isEdgeOn ? '1' : '0'};
      transition: opacity 0.5s ease;
      animation: realGlow ${edgeSpeed}s infinite alternate;
    `;
    document.body.appendChild(edgeDiv);

    // 2. CSS Animations & Panel Style
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes realGlow { 0% { opacity: 0.3; filter: blur(2px); } 100% { opacity: 1; filter: blur(0px); } }
      .cc-panel { background: #1c1c1e; border-bottom: 2px solid #333; }
      .cc-btn { transition: all 0.2s; }
      .cc-btn:active { transform: scale(0.9); }
      
      /* Sliders */
      input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
      input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 24px; width: 24px; border-radius: 50%; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.5); margin-top: -8px; }
      input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 8px; cursor: pointer; background: #3a3a3c; border-radius: 4px; }
    `;
    document.head.appendChild(style);

    // 3. Control Center Panel (Exact Screenshot Style)
    const panel = document.createElement('div');
    panel.id = 'real-edge-panel';
    panel.className = 'fixed inset-x-0 top-0 z-[99998] transform -translate-y-full transition-transform duration-300 ease-out cc-panel rounded-b-3xl pt-12 pb-6 px-4 shadow-2xl';
    
    panel.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-gray-300 font-semibold text-sm">Control Center</h2>
        <button onclick="closeRealPanel()" class="text-gray-400 p-2 bg-gray-800 rounded-full"><i class="fa-solid fa-chevron-up"></i></button>
      </div>

      <!-- Big Toggles (Like Screenshot) -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-orange-500 rounded-2xl p-4 flex flex-col items-center justify-center h-28 shadow-lg" onclick="showToast('System control not available in web.')">
          <i class="fa-solid fa-plane text-white text-3xl mb-2"></i>
          <span class="text-white font-semibold text-sm">Airplane</span>
        </div>
        <div class="bg-green-500 rounded-2xl p-4 flex flex-col items-center justify-center h-28 shadow-lg" onclick="showToast('System control not available in web.')">
          <i class="fa-solid fa-signal text-white text-3xl mb-2"></i>
          <span class="text-white font-semibold text-sm">Mobile Data</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-blue-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-lg" onclick="showToast('System control not available.')">
          <i class="fa-solid fa-wifi text-white text-2xl"></i>
        </div>
        <div class="bg-blue-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-lg" onclick="showToast('System control not available.')">
          <i class="fa-brands fa-bluetooth-b text-white text-2xl"></i>
        </div>
      </div>

      <!-- Brightness & Volume (Horizontal) -->
      <div class="space-y-4 mb-6 px-2">
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-sun text-gray-400"></i>
          <input type="range" min="10" max="100" value="100" oninput="realBrightness(this.value)">
        </div>
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-volume-high text-gray-400"></i>
          <input type="range" min="0" max="100" value="50" oninput="realVolume(this.value)">
        </div>
      </div>

      <!-- Edge Light Settings (Real) -->
      <div class="bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-700">
        <div class="flex justify-between items-center mb-3">
          <span class="text-white font-bold text-xs"><i class="fa-solid fa-border-all text-cyan-400"></i> Edge Lighting</span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="edge-check" class="sr-only peer" ${isEdgeOn ? 'checked' : ''} onchange="toggleRealEdge(this.checked)">
            <div class="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
          </label>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-[9px] text-gray-400 block mb-1">Color</label>
            <input type="color" id="edge-color" value="${edgeColor}" onchange="setEdgeColor(this.value)" class="w-full h-8 rounded bg-transparent border-0 cursor-pointer">
          </div>
          <div>
            <label class="text-[9px] text-gray-400 block mb-1">Speed</label>
            <input type="range" min="1" max="5" value="${edgeSpeed}" oninput="setEdgeSpeed(this.value)" class="w-full accent-cyan-500">
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Trigger Button in Header
    setTimeout(() => {
      const header = document.querySelector('header .flex.gap-2');
      if (header && !document.getElementById('cc-trigger')) {
        const btn = document.createElement('button');
        btn.id = 'cc-trigger';
        btn.onclick = openRealPanel;
        btn.className = 'w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center border border-gray-600 active:scale-90';
        btn.innerHTML = '<i class="fa-solid fa-sliders text-xs"></i>';
        header.insertBefore(btn, header.firstChild);
      }
    }, 1500);
  }

  // --- PANEL CONTROLS ---
  window.openRealPanel = () => document.getElementById('real-edge-panel').classList.remove('-translate-y-full');
  window.closeRealPanel = () => document.getElementById('real-edge-panel').classList.add('-translate-y-full');

  // --- REAL HARDWARE (Capacitor) ---
  window.realBrightness = async (val) => {
    document.getElementById('app-viewport').style.filter = `brightness(${val}%)`;
    if (window.Capacitor && window.Capacitor.Plugins.Brightness) {
      await window.Capacitor.Plugins.Brightness.setBrightness({ brightness: val / 100 });
    }
  };

  window.realVolume = async (val) => {
    document.querySelectorAll('video, audio').forEach(v => v.volume = val / 100);
    if (window.Capacitor && window.Capacitor.Plugins.Volume) {
      await window.Capacitor.Plugins.Volume.setVolume({ volume: val / 100 });
    }
  };

  // --- REAL EDGE LIGHT LOGIC ---
  window.toggleRealEdge = (state) => {
    isEdgeOn = state;
    localStorage.setItem('EDGE_LIGHT_ON', state);
    document.getElementById('real-edge-glow').style.opacity = state ? '1' : '0';
  };

  window.setEdgeColor = (color) => {
    edgeColor = color;
    localStorage.setItem('EDGE_LIGHT_COLOR', color);
    const el = document.getElementById('real-edge-glow');
    el.style.boxShadow = `inset 0 0 15px 2px ${color}, inset 0 0 40px 5px ${color}, inset 0 0 80px 10px ${color}`;
    // Update color picker border
    document.getElementById('edge-color').value = color;
  };

  window.setEdgeSpeed = (speed) => {
    edgeSpeed = speed;
    localStorage.setItem('EDGE_LIGHT_SPEED', speed);
    document.getElementById('real-edge-glow').style.animation = `realGlow ${speed}s infinite alternate`;
  };

  window.addEventListener('load', () => { setTimeout(injectUI, 2000); });

})();
