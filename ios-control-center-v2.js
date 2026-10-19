// ==========================================
// ⚡ SUPER APP - REAL HARDWARE CONTROL CENTER
// File: ios-control-center-v2.js
// ==========================================

(function() {
  'use strict';

  let isEdgeLightOn = localStorage.getItem('EDGE_LIGHT_ON') === 'true';
  let edgeColor = localStorage.getItem('EDGE_LIGHT_COLOR') || '#00f2fe';
  let edgeSpeed = localStorage.getItem('EDGE_LIGHT_SPEED') || '3';

  // Capacitor Plugins Check
  const isNative = window.Capacitor !== undefined;
  const Brightness = isNative ? window.Capacitor.Plugins.Brightness : null;
  const Volume = isNative ? window.Capacitor.Plugins.Volume : null;

  function injectControlCenter() {
    if (document.getElementById('ios-cc-panel')) return;

    // 1. Edge Light Element (Real UI Glow)
    const edgeLight = document.createElement('div');
    edgeLight.id = 'app-edge-light';
    edgeLight.style.cssText = `
      position: fixed; inset: 0; pointer-events: none; z-index: 99997;
      box-shadow: inset 0 0 20px ${edgeColor}, inset 0 0 60px ${edgeColor}, inset 0 0 120px ${edgeColor};
      border-radius: 15px; display: ${isEdgeLightOn ? 'block' : 'none'};
      animation: edgePulse ${edgeSpeed}s infinite alternate;
    `;
    document.body.appendChild(edgeLight);

    // 2. CSS Animations
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes edgePulse { 0% { opacity: 0.3; } 100% { opacity: 1; } }
      .ios-cc-glass {
        background: rgba(30, 30, 35, 0.6);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
      }
      .ios-slider { -webkit-appearance: none; width: 100%; height: 30px; border-radius: 15px; background: rgba(255,255,255,0.2); outline: none; }
      .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 25px; height: 25px; border-radius: 50%; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.5); }
      .ios-tile { background: rgba(255,255,255,0.1); border-radius: 20px; transition: 0.2s; }
      .ios-tile.active { background: #0A84FF; color: white; }
    `;
    document.head.appendChild(style);

    // 3. Panel HTML (Same Apple Style)
    const panel = document.createElement('div');
    panel.id = 'ios-cc-panel';
    panel.className = 'fixed inset-x-0 top-0 z-[99998] transform -translate-y-full transition-transform duration-300 ease-out ios-cc-glass rounded-b-3xl p-4 pb-8';
    
    panel.innerHTML = `
      <div class="flex justify-between items-center mb-4 px-2">
        <h2 class="text-white font-semibold text-base">Control Center</h2>
        <button onclick="closeIOSCenter()" class="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center"><i class="fa-solid fa-chevron-up"></i></button>
      </div>

      <!-- Top Grid (Visual Only) -->
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="ios-tile p-4 flex flex-col items-center justify-center h-28" onclick="showToast('Wi-Fi control browser mein possible nahi hai.')">
          <i class="fa-solid fa-plane text-3xl mb-2"></i><span class="text-xs font-semibold">Airplane</span>
        </div>
        <div class="ios-tile p-4 flex flex-col items-center justify-center h-28 bg-green-500 text-white" onclick="showToast('Data control browser mein possible nahi hai.')">
          <i class="fa-solid fa-signal text-3xl mb-2"></i><span class="text-xs font-semibold">Data</span>
        </div>
      </div>

      <!-- REAL Brightness & Volume -->
      <div class="space-y-4 mb-4 px-2">
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-sun text-gray-300"></i>
          <input type="range" min="10" max="100" value="100" class="ios-slider" oninput="realChangeBrightness(this.value)">
        </div>
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-volume-high text-gray-300"></i>
          <input type="range" min="0" max="100" value="50" class="ios-slider" oninput="realChangeVolume(this.value)">
        </div>
      </div>

      <!-- Edge Light Controls -->
      <div class="bg-gray-800/80 p-3 rounded-2xl mb-4 border border-gray-700">
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs text-white font-bold"><i class="fa-solid fa-border-all text-cyan-400"></i> Edge Lighting</span>
          <input type="checkbox" id="edge-toggle" ${isEdgeLightOn ? 'checked' : ''} onchange="toggleEdgeLight(this.checked)" class="w-4 h-4 accent-cyan-500">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-[9px] text-gray-400 block mb-1">Color</label>
            <input type="color" id="edge-color-picker" value="${edgeColor}" onchange="updateEdgeColor(this.value)" class="w-full h-8 rounded cursor-pointer bg-transparent border-0">
          </div>
          <div>
            <label class="text-[9px] text-gray-400 block mb-1">Speed (<span id="speed-val">${edgeSpeed}</span>s)</label>
            <input type="range" min="1" max="10" value="${edgeSpeed}" oninput="updateEdgeSpeed(this.value)" class="w-full accent-cyan-500">
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Trigger Button
    setTimeout(() => {
      const header = document.querySelector('header .flex.gap-2');
      if (header && !document.getElementById('ios-trigger-btn')) {
        const btn = document.createElement('button');
        btn.id = 'ios-trigger-btn';
        btn.onclick = openIOSCenter;
        btn.className = 'w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center border border-gray-600 active:scale-90';
        btn.innerHTML = '<i class="fa-solid fa-sliders text-xs"></i>';
        header.insertBefore(btn, header.firstChild);
      }
    }, 1500);
  }

  // --- REAL HARDWARE FUNCTIONS ---
  
  window.realChangeBrightness = async function(val) {
    // Web fallback
    document.getElementById('app-viewport').style.filter = `brightness(${val}%)`;
    
    // REAL Native Android Control
    if (Brightness) {
      try {
        await Brightness.setBrightness({ brightness: val / 100 });
      } catch(e) { console.log("Native brightness error:", e); }
    }
  };

  window.realChangeVolume = async function(val) {
    // Web fallback (Video/Audio)
    document.querySelectorAll('video, audio').forEach(media => media.volume = val / 100);
    
    // REAL Native Android Control
    if (Volume) {
      try {
        // Set system media volume
        await Volume.setVolume({ volume: val / 100 });
      } catch(e) { console.log("Native volume error:", e); }
    }
  };

  // --- UI FUNCTIONS ---
  window.openIOSCenter = function() { document.getElementById('ios-cc-panel').classList.remove('-translate-y-full'); };
  window.closeIOSCenter = function() { document.getElementById('ios-cc-panel').classList.add('-translate-y-full'); };
  
  window.toggleEdgeLight = function(state) {
    isEdgeLightOn = state;
    localStorage.setItem('EDGE_LIGHT_ON', state);
    document.getElementById('app-edge-light').style.display = state ? 'block' : 'none';
  };

  window.updateEdgeColor = function(color) {
    edgeColor = color;
    localStorage.setItem('EDGE_LIGHT_COLOR', color);
    const el = document.getElementById('app-edge-light');
    el.style.boxShadow = `inset 0 0 20px ${color}, inset 0 0 60px ${color}, inset 0 0 120px ${color}`;
  };

  window.updateEdgeSpeed = function(speed) {
    edgeSpeed = speed;
    document.getElementById('speed-val').innerText = speed;
    localStorage.setItem('EDGE_LIGHT_SPEED', speed);
    document.getElementById('app-edge-light').style.animation = `edgePulse ${speed}s infinite alternate`;
  };

  window.addEventListener('load', () => { setTimeout(injectControlCenter, 2000); });

})();
