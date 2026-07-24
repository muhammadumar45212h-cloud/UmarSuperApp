document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initDropdown();
  initTradingViewWidget('FX:XAUUSD');
  initWeatherSearch();
  initIDE();
  initChat();
  initVideoUpload();
});

// Tab Switcher
function initTabs() {
  const navBtns = document.querySelectorAll('.bottom-nav .nav-btn');
  const pages = document.querySelectorAll('.tab-page');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      navBtns.forEach(b => b.classList.remove('active'));
      pages.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
}

// 3-Dot Menu Toggle
function initDropdown() {
  const btn = document.getElementById('threeDotMenuBtn');
  const menu = document.getElementById('threeDotMenu');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('active');
  });

  document.addEventListener('click', () => menu.classList.remove('active'));
}

// Real Live TradingView Widget
function initTradingViewWidget(symbol) {
  const container = document.getElementById('tradingViewWidget');
  container.innerHTML = '';

  new TradingView.widget({
    "autosize": true,
    "symbol": symbol,
    "interval": "D",
    "timezone": "Etc/UTC",
    "theme": "dark",
    "style": "1",
    "locale": "en",
    "toolbar_bg": "#f1f3f6",
    "enable_publishing": false,
    "allow_symbol_change": true,
    "container_id": "tradingViewWidget"
  });

  // Market Selector Buttons
  document.querySelectorAll('.market-pair-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.market-pair-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      initTradingViewWidget(this.getAttribute('data-symbol'));
    });
  });
}

// Weather Engine
function initWeatherSearch() {
  const btn = document.getElementById('searchWeatherBtn');
  const input = document.getElementById('weatherCityInput');

  btn.addEventListener('click', () => {
    const city = input.value.trim();
    if(city) {
      document.getElementById('weatherCity').innerText = city;
      document.getElementById('weatherTemp').innerText = Math.floor(25 + Math.random() * 10) + "°C";
    }
  });
}

// Code IDE Runner
function initIDE() {
  const runBtn = document.getElementById('runIdeBtn');
  const codeInput = document.getElementById('ideCodeInput');
  const consoleBox = document.getElementById('ideConsole');

  runBtn.addEventListener('click', () => {
    try {
      let logs = [];
      const customConsole = {
        log: (...args) => logs.push(args.join(' '))
      };
      const runFn = new Function('console', codeInput.value);
      runFn(customConsole);
      consoleBox.innerText = logs.length ? logs.join('\n') : 'Code executed successfully (no logs).';
    } catch (err) {
      consoleBox.innerText = "Error: " + err.message;
    }
  });
}

// Chat Send & Voice Recording
function initChat() {
  const sendBtn = document.getElementById('sendChatMsgBtn');
  const input = document.getElementById('chatMessageInput');
  const chatBody = document.getElementById('chatBoxBody');

  sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if(text) {
      const msg = document.createElement('div');
      msg.className = 'msg-bubble sent';
      msg.innerText = text;
      chatBody.appendChild(msg);
      input.value = '';
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  });
}

// Post Modal Trigger
function initVideoUpload() {
  const trigger = document.getElementById('uploadTriggerBtn');
  trigger.addEventListener('click', () => {
    document.getElementById('uploadModal').classList.add('active');
  });

  document.getElementById('finalPostVideoBtn').addEventListener('click', () => {
    alert("Video posted successfully!");
    closeModal('uploadModal');
  });
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function openCommentModal() { openModal('commentModal'); }
function openShareModal() { openModal('shareModal'); }

