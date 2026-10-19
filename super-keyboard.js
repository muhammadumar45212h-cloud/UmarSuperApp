// ==========================================
// ⚡ SUPER APP - CUSTOM COLORFUL KEYBOARD
// File: super-keyboard.js
// ==========================================

(function() {
  'use strict';

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71', '#F1C40F', '#E74C3C'];
  let activeInput = null;
  let isKeyboardEnabled = localStorage.getItem('CUSTOM_KEYBOARD') === 'true';

  // 1. Keyboard UI Banayein
  function createKeyboard() {
    if (document.getElementById('custom-kb-container')) return;

    const kb = document.createElement('div');
    kb.id = 'custom-kb-container';
    kb.className = 'fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md z-[99999] transition-transform transform translate-y-full border-t border-gray-700 rounded-t-2xl shadow-2xl';
    
    const rows = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫', '↵']
    ];

    let html = `<div class="p-2 space-y-2">`;
    
    // Top bar (Close button & Emoji hint)
    html += `
      <div class="flex justify-between items-center px-2 mb-2">
        <span class="text-xs text-cyan-400 font-bold"><i class="fa-solid fa-wand-magic-sparkles"></i> Super Keyboard</span>
        <button onclick="window.closeCustomKeyboard()" class="text-gray-400 bg-gray-800 px-3 py-1 rounded-full text-xs font-bold"><i class="fa-solid fa-keyboard"></i> Close</button>
      </div>
    `;

    rows.forEach((row, rIndex) => {
      html += `<div class="flex justify-center gap-1">`;
      row.forEach(key => {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        if (key === '⌫') {
          html += `<button onclick="window.kbBackspace()" class="flex-1 max-w-[60px] h-12 bg-gray-700 text-white rounded-lg shadow-md font-bold active:scale-90 transition-all flex items-center justify-center"><i class="fa-solid fa-delete-left"></i></button>`;
        } else if (key === '↵') {
          html += `<button onclick="window.kbEnter()" class="flex-1 max-w-[60px] h-12 bg-cyan-500 text-white rounded-lg shadow-md font-bold active:scale-90 transition-all flex items-center justify-center"><i class="fa-solid fa-arrow-turn-down"></i></button>`;
        } else {
          // Water bubble effect CSS inline
          html += `<button onclick="window.kbType('${key}')" class="flex-1 h-12 rounded-xl text-white font-bold text-lg shadow-lg active:scale-90 transition-all relative overflow-hidden" style="background: linear-gradient(135deg, ${color}, ${color}99);">
            <span class="relative z-10">${key.toUpperCase()}</span>
            <div class="absolute inset-0 bg-white opacity-20 rounded-full blur-md transform scale-0 transition-transform" style="animation: bubble 2s infinite;"></div>
          </button>`;
        }
      });
      html += `</div>`;
    });

    // Spacebar
    html += `
      <div class="flex justify-center gap-1 mt-2">
        <button onclick="window.kbType(' ')" class="w-2/3 h-12 bg-gradient-to-r from-cyan-600 to-blue-500 text-white rounded-xl shadow-md font-bold active:scale-95 transition-all">Space</button>
      </div>
    </div>`;

    kb.innerHTML = html;
    document.body.appendChild(kb);

    // Animation CSS inject
    if(!document.getElementById('kb-anim')) {
      const style = document.createElement('style');
      style.id = 'kb-anim';
      style.innerHTML = `@keyframes bubble { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(2); opacity: 0.1; } 100% { transform: scale(3); opacity: 0; } }`;
      document.head.appendChild(style);
    }
  }

  // 2. Input Functions
  window.kbType = function(char) {
    if (!activeInput) return;
    activeInput.value += char;
    activeInput.dispatchEvent(new Event('input', { bubbles: true }));
  };

  window.kbBackspace = function() {
    if (!activeInput) return;
    activeInput.value = activeInput.value.slice(0, -1);
    activeInput.dispatchEvent(new Event('input', { bubbles: true }));
  };

  window.kbEnter = function() {
    // Agar chat input hai toh send karein, warna close karein
    if (activeInput && activeInput.id === 'dm-message-input') {
      if (typeof sendDmMessageSubmit === 'function') sendDmMessageSubmit();
    } else if (activeInput && activeInput.id === 'new-comment-input') {
      if (typeof addCommentSubmit === 'function') addCommentSubmit();
    }
    window.closeCustomKeyboard();
  };

  window.openCustomKeyboard = function(inputElement) {
    if (!isKeyboardEnabled) return; // Agar setting off hai toh native keyboard chalega
    activeInput = inputElement;
    createKeyboard();
    const kb = document.getElementById('custom-kb-container');
    kb.classList.remove('translate-y-full');
    inputElement.setAttribute('readonly', 'readonly'); // Native keyboard roko
    setTimeout(() => inputElement.focus(), 100);
  };

  window.closeCustomKeyboard = function() {
    const kb = document.getElementById('custom-kb-container');
    if (kb) kb.classList.add('translate-y-full');
    if (activeInput) {
      activeInput.removeAttribute('readonly');
      activeInput.blur();
    }
    activeInput = null;
  };

  // 3. Trigger on Input Focus
  document.addEventListener('focusin', function(e) {
    if (e.target.tagName === 'INPUT' && e.target.type === 'text') {
      if (isKeyboardEnabled) {
        setTimeout(() => window.openCustomKeyboard(e.target), 50);
      }
    }
  });

  // 4. Toggle Function
  window.toggleCustomKeyboard = function(state) {
    isKeyboardEnabled = state;
    localStorage.setItem('CUSTOM_KEYBOARD', state);
    if (!state) window.closeCustomKeyboard();
  };

  console.log("⌨️ Custom Keyboard Loaded");
})();
