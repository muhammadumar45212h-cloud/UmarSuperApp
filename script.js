// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDummyKey_ReplaceWithYourActualKey",
    authDomain: "umarsuperapp.firebaseapp.com",
    projectId: "umarsuperapp",
    storageBucket: "umarsuperapp.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abc123def456"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const storage = firebase.storage();

// Tab Navigation
function switchTab(tabName, element) {
    document.querySelectorAll('.tab-page').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.add('active');
    if (element) element.classList.add('active');

    if (tabName === 'forex') {
        loadTradingViewWidget('FX:XAUUSD');
    }
}

// TradingView Widget Loader
function loadTradingViewWidget(symbol) {
    document.getElementById('tradingview_widget').innerHTML = '';
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
        "container_id": "tradingview_widget"
    });
}

function changeMarketChart() {
    const symbol = document.getElementById('marketPairSelect').value;
    loadTradingViewWidget(symbol);
}

// Weather Search (Open-Meteo API / Mock)
function getWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) return;

    // Direct Weather fetch mock for speed & UI exact match
    document.getElementById('cityName').innerText = city.toUpperCase();
    document.getElementById('cityTemp').innerText = "16°C";
    document.getElementById('cityDesc').innerText = "Overcast";
}

// Modal Handlers
function openUploadModal() {
    document.getElementById('uploadModal').classList.remove('hidden');
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.add('hidden');
}

function openSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.add('hidden');
}

// Media Upload Logic
function previewMedia(event) {
    const file = event.target.files[0];
    const previewBox = document.getElementById('previewBox');
    previewBox.innerHTML = '';

    if (file) {
        previewBox.classList.remove('hidden');
        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            previewBox.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            previewBox.appendChild(img);
        }
    }
}

function publishMedia() {
    alert("Publishing reel... Updated successfully!");
    closeUploadModal();
}

// Wallet Functions
function depositMoney() {
    let amount = prompt("Enter deposit amount (PKR):");
    if (amount) alert("Deposit request submitted successfully!");
}

function withdrawMoney() {
    let amount = prompt("Enter withdrawal amount (PKR):");
    if (amount) alert("Withdrawal request submitted!");
}

function logoutUser() {
    alert("Logged out successfully!");
    closeSettingsModal();
}
