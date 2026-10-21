// ==========================================
// ⚡ SUPER APP - IN-APP BROWSER SYSTEM
// File: in-app-browser.js
// Opens links inside the app (Telegram Style)
// ==========================================

(function() {
  'use strict';

  // 1. Browser Ka UI Banayein
  function injectBrowserUI() {
    if (document.getElementById('inAppBrowserModal')) return;

    const modal = document.createElement('div');
    modal.id = 'inAppBrowserModal';
    modal.className = 'fixed inset-0 bg-gray-950 z-[99999] hidden flex-col';
    
    modal.innerHTML = `
      <!-- Top Bar (Search/URL) -->
      <div class="bg-gray-900 border-b border-gray-800 p-2 flex items-center gap-2">
        <button onclick="closeInAppBrowser()" class="w-8 h-8 rounded-full bg-gray-800 text-gray-300 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
        
        <div class="flex-1 flex items-center bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5">
          <i class="fa-solid fa-lock text-green-500 text-[10px] mr-2" id="browser-lock-icon"></i>
          <input type="text" id="browser-url-input" class="bg-transparent text-xs text-white w-full focus:outline-none" placeholder="https://..." onkeydown="handleBrowserUrlEnter(event)">
        </div>
        
        <button onclick="reloadInAppBrowser()" class="w-8 h-8 rounded-full bg-gray-800 text-cyan-400 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-rotate-right text-xs"></i>
        </button>
      </div>

      <!-- Progress Bar -->
      <div id="browser-progress-bar" class="h-0.5 bg-cyan-500 w-0 transition-all duration-300"></div>

      <!-- The Webview / Iframe -->
      <div class="flex-1 w-full h-full relative bg-white">
        <!-- Note: In APK, we use Capacitor Webview instead of iframe for full support -->
        <iframe id="browser-iframe" class="w-full h-full border-0 bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
        
        <!-- Loading Spinner -->
        <div id="browser-loading" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 text-white">
          <i class="fa-solid fa-spinner fa-spin text-3xl text-cyan-400 mb-3"></i>
          <p class="text-xs text-gray-400">Loading...</p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // 2. Browser Kholne Ka Function
  window.openInAppBrowser = function(url) {
    if (!url) return;

    // Agar URL mein http/https nahi hai, toh add karein
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const modal = document.getElementById('inAppBrowserModal');
    const iframe = document.getElementById('browser-iframe');
    const urlInput = document.getElementById('browser-url-input');
    const loading = document.getElementById('browser-loading');
    const progress = document.getElementById('browser-progress-bar');

    // UI Reset
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    urlInput.value = url;
    loading.classList.remove('hidden');
    progress.style.width = '30%';

    // Load URL
    iframe.src = url;

    // Fake Progress Bar Animation
    setTimeout(() => progress.style.width = '70%', 500);
    
    // Iframe Load Hone Par
    iframe.onload = function() {
      loading.classList.add('hidden');
      progress.style.width = '100%';
      setTimeout(() => progress.style.width = '0%', 500);
    };
  };

  // 3. Browser Band Karne Ka Function
  window.closeInAppBrowser = function() {
    const modal = document.getElementById('inAppBrowserModal');
    const iframe = document.getElementById('browser-iframe');
    
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    iframe.src = 'about:blank'; // Stop audio/video in background
  };

  // 4. URL Change Karne Par Enter Dabaane Se Naya Page Khule
  window.handleBrowserUrlEnter = function(event) {
    if (event.key === 'Enter') {
      const url = event.target.value.trim();
      if (url) openInAppBrowser(url);
    }
  };

  // 5. Reload Button
  window.reloadInAppBrowser = function() {
    const iframe = document.getElementById('browser-iframe');
    if (iframe.src) {
      const currentUrl = iframe.src;
      iframe.src = 'about:blank';
      setTimeout(() => iframe.src = currentUrl, 100);
    }
  };

  // 6. App Load Hone Par UI Inject Karein
  window.addEventListener('load', () => {
    setTimeout(injectBrowserUI, 1500);
  });

  // 7. GLOBAL LINK INTERCEPTOR
  // Jab bhi koi post ya chat mein link ho, wo modal mein khule
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a');
    if (target && target.href && target.href.startsWith('http')) {
      // Agar wo internal app link nahi hai (jaise firebase ya gstatic), toh browser mein kholo
      if (!target.href.includes('firebase') && !target.href.includes('gstatic') && !target.href.includes('whatsapp://')) {
        e.preventDefault();
        window.openInAppBrowser(target.href);
      }
    }
  });

})();
