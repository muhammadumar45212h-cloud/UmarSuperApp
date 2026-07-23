/* ==========================================================
   UMAR SUPER APP - FULLSCREEN ROUTING & CORE ENGINE
   ========================================================== */

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
let virtualFileSystem = { "app.js": "console.log('Umar Super App Compiler Active');" };

document.addEventListener("DOMContentLoaded", () => {
    initAuth();
    initCleanNavigation();
    initTradingView("OANDA:XAUUSD");
    initMarketSwitchers();
    initWeatherSearch();
    initVirtualCompiler();
});

/* 1. STRICT PAGE ISOLATION ROUTING */
function initCleanNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".app-section");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetId = item.getAttribute("data-target");

            // Auth Protection Check
            if ((targetId === "section-profile" || targetId === "section-chat") && !currentUser) {
                alert("Login Required!");
                document.getElementById("auth-modal").classList.remove("hidden");
                return;
            }

            // Hide ALL sections completely
            sections.forEach(sec => {
                sec.classList.remove("active-section");
            });

            // Remove Active from ALL nav items
            navItems.forEach(nav => {
                nav.classList.remove("active");
            });

            // Activate Target Section Only
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add("active-section");
            }
            item.classList.add("active");
        });
    });
}

/* 2. AUTHENTICATION & MODALS */
function initAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            const doc = await db.collection("users").doc(user.uid).get();
            if (doc.exists) currentProfile = doc.data();
            document.getElementById("auth-modal").classList.add("hidden");
        } else {
            currentUser = null;
            currentProfile = null;
        }
    });

    const closeAuth = document.getElementById("btn-close-auth");
    if (closeAuth) {
        closeAuth.onclick = () => {
            document.getElementById("auth-modal").classList.add("hidden");
        };
    }
}

/* 3. TRADINGVIEW MULTI-ASSET CHARTS */
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

/* 4. GLOBAL WEATHER SEARCH ENGINE */
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
                alert("City not found!");
                return;
            }

            document.getElementById("weather-city-name").innerText = `${data.name}, ${data.sys.country}`;
            document.getElementById("weather-temp").innerText = `${Math.round(data.main.temp)}°C`;
            document.getElementById("weather-condition").innerText = data.weather[0].description;
        } catch (e) {
            alert("Weather search failed!");
        }
    };
}

/* 5. VIRTUAL FILE COMPILER (LS, ST, DT COMMANDS) */
function initVirtualCompiler() {
    const runBtn = document.getElementById("btn-run-code");
    if (!runBtn) return;

    runBtn.onclick = () => {
        const input = document.getElementById("code-editor-input").value.trim();
        const out = document.getElementById("terminal-console-out");
        out.innerText = "";

        // List Files Command
        if (input === "ls") {
            const files = Object.keys(virtualFileSystem);
            out.innerText = files.length ? files.join("\n") : "[Empty Directory]";
            return;
        }

        // Create File Command (st filename)
        if (input.startsWith("st ")) {
            const fileName = input.split(" ")[1];
            if (!fileName) { out.innerText = "Error: File name required!"; return; }
            virtualFileSystem[fileName] = "// Created file";
            out.innerText = `[Success]: File '${fileName}' created. Type 'ls' to view.`;
            return;
        }

        // Delete File Command (dt filename)
        if (input.startsWith("dt ")) {
            const fileName = input.split(" ")[1];
            if (virtualFileSystem[fileName]) {
                delete virtualFileSystem[fileName];
                out.innerText = `[Success]: File '${fileName}' deleted.`;
            } else {
                out.innerText = `[Error]: File '${fileName}' not found.`;
            }
            return;
        }

        // Regular JS Execution
        try {
            let logs = [];
            const oldLog = console.log;
            console.log = (...args) => logs.push(args.join(" "));
            
            const result = eval(input);
            console.log = oldLog;

            out.innerText = logs.join("\n") + (result !== undefined ? `\n> Output: ${result}` : "");
        } catch (err) {
            out.innerText = `[Runtime Error]: ${err.message}`;
        }
    };
}
