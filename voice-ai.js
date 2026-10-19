// ==========================================
// ⚡ SUPER APP - VOICE AI & iOS PANEL
// File: voice-ai.js
// ==========================================

(function() {
  'use strict';

  let recognition = null;
  let isListening = false;

  // 1. Voice Command Setup
  function initVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log("Voice not supported");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // English commands

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      console.log("🎤 Voice Command:", transcript);
      processVoiceCommand(transcript);
    };

    recognition.onerror = (e) => {
      console.log("Voice Error:", e.error);
      if (e.error === 'not-allowed') {
        showToast("🎤 Microphone permission denied!");
        stopVoice();
      }
    };
  }

  // 2. Voice Commands Logic
  function processVoiceCommand(cmd) {
    showToast(`🗣️ "${cmd}"`);

    // Tab Switching
    if (cmd.includes("open market") || cmd.includes("open trading")) {
      switchTab('trading'); showToast("📈 Trading Opened");
    } 
    else if (cmd.includes("open feed") || cmd.includes("show posts")) {
      switchTab('feed'); showToast("📰 Feed Opened");
    }
    else if (cmd.includes("open video") || cmd.includes("watch videos")) {
      switchTab('videos'); showToast("🎬 Videos Opened");
    }
    else if (cmd.includes("open profile") || cmd.includes("my profile")) {
      switchTab('profile'); showToast("👤 Profile Opened");
    }
    // Typing Commands
    else if (cmd.startsWith("type ")) {
      const textToType = cmd.replace("type ", "");
      const active = document.activeElement;
      if (active && active.tagName === 'INPUT') {
        active.value += " " + textToType;
        showToast(`⌨️ Typed: ${textToType}`);
      } else {
        showToast("❌ Koi input box open nahi hai!");
      }
    }
    // Send Command
    else if (cmd === "send" || cmd === "send it") {
      if (typeof sendDmMessageSubmit === 'function' && document.getElementById('dm-message-input').value) {
        sendDmMessageSubmit(); showToast("✅ Message Sent");
      } else if (typeof addCommentSubmit === 'function' && document.getElementById('new-comment-input').value) {
        addCommentSubmit(); showToast("✅ Comment Sent");
      }
    }
    // Open Comments
    else if (cmd.includes("open comment") || cmd.includes("show comments")) {
      // Find first video and open comments
      const video = document.querySelector('.reel-item video');
      if (video) {
        const id = video.id.replace('video-elem-', '');
        openCommentsDrawer(id);
        showToast("💬 Comments Opened");
      }
    }
  }

  window.startVoice = function() {
    if (!recognition) initVoice();
    if (!recognition) { showToast("❌ Voice not supported on this device"); return; }
    
    try {
      recognition.start();
      isListening = true;
      updateVoiceUI(true);
      showToast("🎤 Listening... Boliye!");
    } catch(e) {
      showToast("Already listening...");
    }
  };

  window.stopVoice = function() {
    if (recognition) {
      recognition.stop();
      isListening = false;
      updateVoiceUI(false);
      showToast("🛑 Voice Stopped");
    }
  };

  function updateVoiceUI(active) {
    const btn = document.getElementById('voice-toggle-btn');
    if (btn) {
      if (active) {
        btn.className = 'w-full py-3 bg-red-600 text-white rounded-xl text-xs font-bold animate-pulse';
        btn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i> Stop Voice Assistant';
      } else {
        btn.className = 'w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl text-xs font-bold';
        btn.innerHTML = '<i class="fa-solid fa-microphone"></i> Start Voice Assistant';
      }
    }
  }

  // 3. iOS Style Notification Panel (Control Center)
  function injectIOSPanel() {
    if (document.getElementById('ios-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'ios-panel';
    panel.className = 'fixed inset-x-0 top-0 z-[99998] transform -translate-y-full transition-transform duration-300';
    
    // Panel HTML
    panel.innerHTML = `
      <div class="bg-gray-900/90 backdrop-blur-xl border-b border-gray-700 rounded-b-3xl p-4 shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-sm font-bold text-white">Control Center</h2>
          <button onclick="document.getElementById('ios-panel').classList.add('-translate-y-full')" class="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center">
            <i class="fa-solid fa-chevron-up"></i>
          </button>
        </div>
        
        <div class="grid grid-cols-2 gap-3 mb-4">
          <!-- Toggle 1: Custom Keyboard -->
          <div class="bg-gray-800 p-3 rounded-2xl flex flex-col items-center justify-center space-y-2">
            <i class="fa-solid fa-keyboard text-cyan-400 text-xl"></i>
            <span class="text-[10px] text-white font-bold">Color Keyboard</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="ios-kb-toggle" class="sr-only peer" onchange="toggleCustomKeyboard(this.checked)">
              <div class="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          <!-- Toggle 2: Voice Assistant -->
          <div class="bg-gray-800 p-3 rounded-2xl flex flex-col items-center justify-center space-y-2">
            <i class="fa-solid fa-microphone text-purple-400 text-xl"></i>
            <span class="text-[10px] text-white font-bold">Voice Control</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="ios-voice-toggle" class="sr-only peer" onchange="this.checked ? startVoice() : stopVoice()">
              <div class="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>
        </div>
        
        <button id="voice-toggle-btn" onclick="toggleVoice()" class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl text-xs font-bold">
          <i class="fa-solid fa-microphone"></i> Start Voice Assistant
        </button>
      </div>
    `;
    
    document.body.appendChild(panel);

    // Set initial toggle states
    document.getElementById('ios-kb-toggle').checked = localStorage.getItem('CUSTOM_KEYBOARD') === 'true';

    // Swipe down gesture to open panel (Simulate)
    let touchStart = 0;
    document.addEventListener('touchstart', e => {
      if (e.touches[0].clientY < 50) touchStart = e.touches[0].clientY; // Top screen touch
    });
    document.addEventListener('touchmove', e => {
      if (touchStart && e.touches[0].clientY - touchStart > 100) {
        document.getElementById('ios-panel').classList.remove('-translate-y-full');
        touchStart = 0;
      }
    });

    // Add a small visual trigger in the header
    setTimeout(() => {
      const header = document.querySelector('header .flex.gap-2');
      if (header && !document.getElementById('cc-trigger')) {
        const btn = document.createElement('button');
        btn.id = 'cc-trigger';
        btn.onclick = () => document.getElementById('ios-panel').classList.toggle('-translate-y-full');
        btn.className = 'w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center border border-gray-600';
        btn.innerHTML = '<i class="fa-solid fa-sliders text-xs"></i>';
        header.insertBefore(btn, header.firstChild);
      }
    }, 1000);
  }

  window.toggleVoice = function() {
    if (isListening) stopVoice(); else startVoice();
  };

  // Init
  window.addEventListener('load', () => {
    setTimeout(() => {
      injectIOSPanel();
      initVoice();
    }, 2000);
  });

  console.log("🎤 Voice AI Loaded");
})();
