// ==========================================
// ⚡ SUPER APP - PREMIUM iOS CONTROL CENTER
// File: ios-panel.js
// Features: Real toggles, Sliders, Glass UI
// ==========================================

(function() {
  'use strict';

  function injectIOSPanel() {
    if (document.getElementById('ios-control-center')) return;

    // CSS Inject karein
    const style = document.createElement('style');
    style.innerHTML = `
      .ios-glass {
        background: rgba(20, 20, 25, 0.75);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .ios-btn {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        transition: all 0.2s ease;
      }
      .ios-btn:active { transform: scale(0.95); }
      .ios-btn.active { background: #0A84FF; color: white; }
      
      .ios-slider {
        -webkit-appearance: none;
        width: 100%;
        height: 30px;
        border-radius: 15px;
        outline: none;
        opacity: 0.9;
        transition: opacity .2s;
        background: rgba(255,255,255,0.2);
      }
      .ios-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      }
    `;
    document.head.appendChild(style);

    // Panel HTML
    const panel = document.createElement('div');
    panel.id = 'ios-control-center';
    panel.className = 'fixed inset-x-0 top-0 z-[99999] transform -translate-y-full transition-transform duration-300 ease-out ios-glass rounded-b-3xl pb-6 px-4';
    
    panel.innerHTML = `
      <!-- Header -->
      <div class="flex justify-between items-center py-4 mb-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs">SU</div>
          <span class="text-white font-semibold text-sm">Control Center</span>
        </div>
        <button onclick="closeIOSPanel()" class="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center">
          <i class="fa-solid fa-chevron-up"></i>
        </button>
      </div>

      <!-- Connectivity Toggles (Dummy for UI look, but feel real) -->
      <div class="grid grid-cols-4 gap-3 mb-4">
        <button class="ios-btn p-3 flex flex-col items-center justify-center h-20" onclick="toggleIOSBtn(this)">
          <i class="fa-solid fa-wifi text-xl mb-1"></i>
          <span class="text-[9px]">Wi-Fi</span>
        </button>
        <button class="ios-btn p-3 flex flex-col items-center justify-center h-20" onclick="toggleIOSBtn(this)">
          <i class="fa-brands fa-bluetooth-b text-xl mb-1"></i>
          <span class="text-[9px]">Bluetooth</span>
        </button>
        <button class="ios-btn p-3 flex flex-col items-center justify-center h-20" onclick="toggleIOSBtn(this)">
          <i class="fa-solid fa-plane text-xl mb-1"></i>
          <span class="text-[9px]">Airplane</span>
        </button>
        <button class="ios-btn p-3 flex flex-col items-center justify-center h-20" onclick="toggleIOSBtn(this)">
          <i class="fa-solid fa-moon text-xl mb-1"></i>
          <span class="text-[9px]">Focus</span>
        </button>
      </div>

      <!-- App Toggles (Real Functions) -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <button id="ios-kb-btn" class="ios-btn p-3 flex items-center justify-between" onclick="toggleKeyboardFromPanel()">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-keyboard text-cyan-400"></i>
            <span class="text-[10px] text-white font-bold">Keyboard</span>
          </div>
          <div class="w-8 h-4 bg-gray-600 rounded-full relative transition-colors" id="kb-toggle-bg">
            <div class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform" id="kb-toggle-dot"></div>
          </div>
        </button>
        
        <button id="ios-voice-btn" class="ios-btn p-3 flex items-center justify-between" onclick="toggleVoiceFromPanel()">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-microphone text-purple-400"></i>
            <span class="text-[10px] text-white font-bold">Voice AI</span>
          </div>
          <div class="w-8 h-4 bg-gray-600 rounded-full relative transition-colors" id="voice-toggle-bg">
            <div class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform" id="voice-toggle-dot"></div>
          </div>
        </button>
      </div>

      <!-- Sliders (Brightness & Volume) -->
      <div class="grid grid-cols-2 gap-3">
        <div class="relative rounded-2xl overflow-hidden h-32 bg-gray-800 flex items-end p-2 ios-btn">
          <div class="absolute inset-0 bg-yellow-400 opacity-20" id="brightness-fill" style="height: 50%; bottom: 0; transition: height 0.2s;"></div>
          <div class="relative z-10 w-full">
            <i class="fa-solid fa-sun text-yellow-400 mb-1 block"></i>
            <input type="range" min="20" max="100" value="100" class="ios-slider" oninput="changeBrightness(this.value)">
          </div>
        </div>
        
        <div class="relative rounded-2xl overflow-hidden h-32 bg-gray-800 flex items-end p-2 ios-btn">
          <div class="absolute inset-0 bg-pink-500 opacity-20" id="volume-fill" style="height: 50%; bottom: 0; transition: height 0.2s;"></div>
          <div class="relative z-10 w-full">
            <i class="fa-solid fa-volume-high text-pink-500 mb-1 block"></i>
            <input type="range" min="0" max="100" value="50" class="ios-slider" oninput="changeVolume(this.value)">
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Trigger Button in Header
    setTimeout(() => {
      const header = document.querySelector('header .flex.gap-2');
      if (header && !document.getElementById('ios-trigger-btn')) {
        const btn = document.createElement('button');
        btn.id = 'ios-trigger-btn';
        btn.onclick = openIOSPanel;
        btn.className = 'w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center border border-gray-600 active:scale-90';
        btn.innerHTML = '<i class="fa-solid fa-sliders text-xs"></i>';
        header.insertBefore(btn, header.firstChild);
      }
    }, 1000);
  }

  // Global Functions for Panel
  window.openIOSPanel = function() {
    const p = document.getElementById('ios-control-center');
    p.classList.remove('-translate-y-full');
    
    // Update toggle states based on current settings
    const kbOn = localStorage.getItem('CUSTOM_KEYBOARD') === 'true';
    updateToggleUI('kb', kbOn);
    const voiceOn = window.isVoiceListening || false;
    updateToggleUI('voice', voiceOn);
  };

  window.closeIOSPanel = function() {
    const p = document.getElementById('ios-control-center');
    p.classList.add('-translate-y-full');
  };

  window.toggleIOSBtn = function(btn) {
    btn.classList.toggle('active');
  };

  window.changeBrightness = function(val) {
    document.getElementById('app-viewport').style.filter = `brightness(${val}%)`;
    document.getElementById('brightness-fill').style.height = val + '%';
  };

  window.changeVolume = function(val) {
    document.getElementById('volume-fill').style.height = val + '%';
    // Agar koi video chal rahi hai toh volume set karein
    const videos = document.querySelectorAll('video');
    videos.forEach(v => v.volume = val / 100);
  };

  window.toggleKeyboardFromPanel = function() {
    const current = localStorage.getItem('CUSTOM_KEYBOARD') === 'true';
    const newState = !current;
    localStorage.setItem('CUSTOM_KEYBOARD', newState);
    if (typeof toggleCustomKeyboard === 'function') toggleCustomKeyboard(newState);
    updateToggleUI('kb', newState);
  };

  window.toggleVoiceFromPanel = function() {
    const newState = !window.isVoiceListening;
    if (newState) {
      if (typeof startVoice === 'function') startVoice();
      updateToggleUI('voice', true);
    } else {
      if (typeof stopVoice === 'function') stopVoice();
      updateToggleUI('voice', false);
    }
  };

  function updateToggleUI(type, isActive) {
    const bg = document.getElementById(type + '-toggle-bg');
    const dot = document.getElementById(type + '-toggle-dot');
    if (!bg || !dot) return;
    
    if (isActive) {
      bg.style.background = type === 'kb' ? '#0A84FF' : '#9B59B6';
      dot.style.transform = 'translateX(16px)';
    } else {
      bg.style.background = '#4B5563';
      dot.style.transform = 'translateX(0)';
    }
  }

  // Swipe down from top to open
  let touchStart = 0;
  document.addEventListener('touchstart', e => {
    if (e.touches[0].clientY < 50) touchStart = e.touches[0].clientY;
  });
  document.addEventListener('touchmove', e => {
    if (touchStart && e.touches[0].clientY - touchStart > 80) {
      openIOSPanel();
      touchStart = 0;
    }
  });

  window.addEventListener('load', () => {
    setTimeout(injectIOSPanel, 2000);
  });

})();
