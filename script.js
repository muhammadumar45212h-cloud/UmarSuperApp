/* UMAR SUPER APP - MASTER INTEGRATION CODE */

const firebaseConfig = {
  apiKey: "AIzaSyB9ACAxelcW-esJWUDrD5lhL_7svxlyGxc",
  authDomain: "umarsuperapp.firebaseapp.com",
  projectId: "umarsuperapp",
  storageBucket: "umarsuperapp.firebasestorage.app",
  messagingSenderId: "812034119197",
  appId: "1:812034119197:web:60dc07304f30f29f6058f4"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;
let currentProfile = null;
let virtualFileSystem = { "index.js": "console.log('Welcome to Umar Compiler');" };

document.addEventListener("DOMContentLoaded", () => {
    initAuth();
    initNavigation();
    initTradingView("OANDA:XAUUSD");
    initMarketSwitchers();
    initWeatherSearch();
    initCompiler();
    initUploadEngine();
});

/* 1. AUTHENTICATION & RESTRICTIONS */
function initAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            const doc = await db.collection("users").doc(user.uid).get();
            if (doc.exists) {
                currentProfile = doc.data();
                updateProfileUI();
            }
        } else {
            currentUser = null;
            currentProfile = null;
        }
    });

    const closeBtn = document.getElementById("btn-close-auth");
    if (closeBtn) {
        closeBtn.onclick = () => {
            document.getElementById("auth-modal").classList.add("hidden");
        };
    }
}

function updateProfileUI() {
    if (!currentProfile) return;
    if (document.getElementById("my-profile-name")) document.getElementById("my-profile-name").innerText = currentProfile.fullname;
    if (document.getElementById("my-profile-username")) document.getElementById("my-profile-username").innerText = currentProfile.username;
    
    // Monetization Check
    checkCreatorMonetization(currentProfile.totalViews || 0, currentProfile.followersCount || 0);
}

function checkCreatorMonetization(views, subs) {
    let earnings = 0;
    if (views >= 1000000) earnings += 20;
    if (subs >= 10000) earnings += 20;
    
    const monTag = document.getElementById("monetization-status-tag");
    if (monTag) {
        monTag.innerText = `Monetization: $${earnings} Available`;
    }
}

/* 2. NAVIGATION & GUEST PROTECTION */
function initNavigation() {
    const items = document.querySelectorAll(".nav-item");
    items.forEach(item => {
        item.addEventListener("click", () => {
            const target = item.getAttribute("data-target");
            if ((target === "section-profile" || target === "section-chat") && !currentUser) {
                alert("Aapko is section mein jaane ke liye Login karna zaroori hai.");
                document.getElementById("auth-modal").classList.remove("hidden");
                return;
            }
            document.querySelectorAll(".app-section").forEach(s => s.classList.remove("active-section"));
            document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
            
            item.classList.add("active");
            const section = document.getElementById(target);
            if (section) section.classList.add("active-section");
        });
    });
}

/* 3. TRADINGVIEW MULTI-ASSET SWITCHER */
function initTradingView(symbol) {
    const container = document.getElementById("tradingview-widget-container");
    if (!container) return;
    container.innerHTML = "";
    if (typeof TradingView !== "undefined") {
        new TradingView.widget({
            "autosize": true,
            "symbol": symbol,
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "container_id": "tradingview-widget-container"
        });
    }
}

function initMarketSwitchers() {
    const btnGold = document.getElementById("btn-market-xau");
    const btnBtc = document.getElementById("btn-market-btc");
    const btnEur = document.getElementById("btn-market-eur");

    if (btnGold) btnGold.onclick = () => initTradingView("OANDA:XAUUSD");
    if (btnBtc) btnBtc.onclick = () => initTradingView("BITSTAMP:BTCUSD");
    if (btnEur) btnEur.onclick = () => initTradingView("FX:EURUSD");
}

/* 4. GLOBAL LIVE WEATHER ENGINE */
function initWeatherSearch() {
    const searchBtn = document.getElementById("btn-search-weather");
    if (!searchBtn) return;

    searchBtn.onclick = async () => {
        const query = document.getElementById("input-weather-city").value.trim();
        if (!query) return;

        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=metric&appid=b1b15e88fa797225412429c1c50c122a1`);
            const data = await res.json();

            if (data.cod !== 200) {
                alert("City nahi mili, sahi naam dakhil karein.");
                return;
            }

            document.getElementById("weather-city-name").innerText = `${data.name}, ${data.sys.country}`;
            document.getElementById("weather-temp").innerText = `${Math.round(data.main.temp)}°C`;
            document.getElementById("weather-condition").innerText = data.weather[0].description;
            document.getElementById("weather-humidity").innerText = `Humidity: ${data.main.humidity}%`;
            document.getElementById("weather-wind").innerText = `Wind: ${data.wind.speed} km/h`;
        } catch (e) {
            alert("Weather data fetch karne mein masla hua.");
        }
    };
}

/* 5. VIRTUAL FILE COMPILER ENGINE */
function initCompiler() {
    const runBtn = document.getElementById("btn-run-code");
    if (!runBtn) return;

    runBtn.onclick = () => {
        const input = document.getElementById("code-editor-input").value;
        const out = document.getElementById("terminal-console-out");
        out.innerText = "";

        if (input.trim() === "ls") {
            out.innerText = Object.keys(virtualFileSystem).join("\n");
            return;
        }

        if (input.startsWith("st ")) {
            const fileName = input.split(" ")[1];
            virtualFileSystem[fileName] = "// New File";
            out.innerText = `File '${fileName}' created successfully.`;
            return;
        }

        if (input.startsWith("dt ")) {
            const fileName = input.split(" ")[1];
            delete virtualFileSystem[fileName];
            out.innerText = `File '${fileName}' deleted.`;
            return;
        }

        try {
            let logs = [];
            const oldLog = console.log;
            console.log = (...args) => logs.push(args.join(" "));
            
            const result = eval(input);
            console.log = oldLog;

            out.innerText = logs.join("\n") + (result !== undefined ? `\n> Returned: ${result}` : "");
        } catch (err) {
            out.innerText = `[Execution Error]: ${err.message}`;
        }
    };
}

/* 6. UPLOAD & FLOATING BUTTON ENGINE */
function initUploadEngine() {
    const floatBtn = document.getElementById("btn-open-upload-modal");
    if (floatBtn) {
        floatBtn.onclick = () => {
            if (!currentUser) {
                alert("Upload karne ke liye pehle Login Karein!");
                document.getElementById("auth-modal").classList.remove("hidden");
                return;
            }
            document.getElementById("upload-modal").classList.remove("hidden");
        };
    }
}

/* 7. WITHDRAWAL PAYMENT SYSTEM */
function requestWithdrawal(method, amount, addressDetails) {
    if (!currentUser) return;
    db.collection("withdrawals").add({
        userId: currentUser.uid,
        amount: amount,
        method: method, // 'TRC20', 'EasyPaisa', 'JazzCash', 'P2P'
        details: addressDetails,
        status: "Pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Withdrawal request submit ho gayi hai!");
    });
}
