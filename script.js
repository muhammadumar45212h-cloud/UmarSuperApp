/* ==========================================================
   UMAR SUPER APP - CORE CONTROLLER & TIKTOK/PROFILE ENGINE
   ========================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyB9ACAxelcW-esJWUDrD5lhL_7svxlyGxc",
  authDomain: "umarsuperapp.firebaseapp.com",
  projectId: "umarsuperapp",
  storageBucket: "umarsuperapp.firebasestorage.app",
  messagingSenderId: "812034119197",
  appId: "1:812034119197:web:60dc07304f30f29f6058f4"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;
let virtualFileSystem = {};

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initThreeDotMenu();
    initUploadModal();
    initCompilerEngine();
    initTradingView("OANDA:XAUUSD");
    initMarketSwitchers();
    initProfileEngine();
    initSettingsAndSessions();
    initOfflineDownloader();
});

/* 1. CLEAN ROUTING ENGINE */
function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".app-section");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetId = item.getAttribute("data-target");

            sections.forEach(sec => sec.classList.remove("active-section"));
            navItems.forEach(nav => nav.classList.remove("active"));

            const targetSec = document.getElementById(targetId);
            if (targetSec) targetSec.classList.add("active-section");
            item.classList.add("active");
        });
    });
}

/* 2. THREE-DOT MENU TOGGLE */
function initThreeDotMenu() {
    const btnToggle = document.getElementById("btn-toggle-menu");
    const dropdown = document.getElementById("top-dropdown-menu");
    const optSettings = document.getElementById("menu-opt-settings");

    if (btnToggle && dropdown) {
        btnToggle.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("hidden");
        };

        document.addEventListener("click", () => dropdown.classList.add("hidden"));
    }

    if (optSettings) {
        optSettings.onclick = () => {
            document.querySelectorAll(".app-section").forEach(s => s.classList.remove("active-section"));
            document.getElementById("section-settings").classList.add("active-section");
        };
    }
}

/* 3. UPLOAD (+) MODAL CONTROLLER */
function initUploadModal() {
    const plusBtn = document.getElementById("btn-open-upload-modal");
    const modal = document.getElementById("upload-modal");
    const closeBtn = document.getElementById("btn-close-upload");
    const submitBtn = document.getElementById("btn-submit-post");

    if (plusBtn && modal) plusBtn.onclick = () => modal.classList.remove("hidden");
    if (closeBtn && modal) closeBtn.onclick = () => modal.classList.add("hidden");

    if (submitBtn) {
        submitBtn.onclick = async () => {
            const fileInput = document.getElementById("input-video-file");
            const descInput = document.getElementById("input-video-desc");

            if (!fileInput.files.length) {
                alert("Please select a video file!");
                return;
            }

            alert("Video Uploading Started...");
            modal.classList.add("hidden");
        };
    }
}

/* 4. COMPILER ENGINE (RUN, LS, ST, DT COMMANDS) */
function initCompilerEngine() {
    const runBtn = document.getElementById("btn-run-code");
    if (!runBtn) return;

    runBtn.onclick = () => {
        const input = document.getElementById("code-editor-input").value.trim();
        const out = document.getElementById("terminal-console-out");

        if (input === "ls") {
            const files = Object.keys(virtualFileSystem);
            out.innerText = files.length ? files.join("\n") : "[Empty Directory]";
            return;
        }

        if (input.startsWith("st ")) {
            const fileName = input.split(" ")[1];
            if (!fileName) { out.innerText = "Error: File name missing!"; return; }
            virtualFileSystem[fileName] = "// File Created";
            out.innerText = `[Success]: File '${fileName}' created. Type 'ls' to list files.`;
            return;
        }

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

        try {
            let logs = [];
            const oldLog = console.log;
            console.log = (...args) => logs.push(args.join(" "));
            const res = eval(input);
            console.log = oldLog;
            out.innerText = logs.join("\n") + (res !== undefined ? `\n> Result: ${res}` : "");
        } catch (err) {
            out.innerText = `[Runtime Error]: ${err.message}`;
        }
    };
}

/* 5. TRADINGVIEW CHARTS */
function initTradingView(symbol) {
    const container = document.getElementById("tradingview-widget-container");
    if (!container) return;
    container.innerHTML = "";
    if (typeof TradingView !== "undefined") {
        new TradingView.widget({
            "autosize": true,
            "symbol": symbol,
            "interval": "D",
            "theme": "dark",
            "style": "1",
            "container_id": "tradingview-widget-container"
        });
    }
}

function initMarketSwitchers() {
    document.getElementById("btn-market-xau").onclick = () => initTradingView("OANDA:XAUUSD");
    document.getElementById("btn-market-btc").onclick = () => initTradingView("BITSTAMP:BTCUSD");
    document.getElementById("btn-market-eur").onclick = () => initTradingView("FX:EURUSD");
}

/* 6. PROFILE & 7-WEEK REVIEW SYSTEM */
function initProfileEngine() {
    const editBtn = document.getElementById("btn-open-edit-profile");
    const editModal = document.getElementById("edit-profile-modal");
    const closeBtn = document.getElementById("btn-close-edit-profile");
    const submitUpdate = document.getElementById("btn-submit-profile-update");

    if (editBtn) editBtn.onclick = () => editModal.classList.remove("hidden");
    if (closeBtn) closeBtn.onclick = () => editModal.classList.add("hidden");

    if (submitUpdate) {
        submitUpdate.onclick = () => {
            const name = document.getElementById("edit-input-name").value;
            const bio = document.getElementById("edit-input-bio").value;

            if (name) document.getElementById("my-profile-name").innerText = name;
            if (bio) document.getElementById("my-profile-bio").innerText = bio;

            document.getElementById("review-timer-badge").classList.remove("hidden");
            editModal.classList.add("hidden");
            alert("Profile submitted! 7-Week review timer activated.");
        };
    }
}

/* 7. SETTINGS & SESSIONS CONTROLLER */
function initSettingsAndSessions() {
    const sessionBox = document.getElementById("active-sessions-list");
    if (!sessionBox) return;

    sessionBox.innerHTML = `
        <div style="background:#060911; padding:10px; border-radius:8px; margin-top:8px;">
            <p style="color:#00f2fe; font-size:12px;">Active: Android Mobile Device (Current Session)</p>
            <p style="color:#f59e0b; font-size:11px;">Status: Primary Admin</p>
        </div>
    `;
}

/* 8. OFFLINE VIDEO DOWNLOADER ENGINE */
function initOfflineDownloader() {
    const btn100 = document.getElementById("btn-download-100");
    const btn200 = document.getElementById("btn-download-200");
    const container = document.getElementById("offline-videos-container");

    if (btn100) {
        btn100.onclick = () => {
            alert("Downloading 100 videos offline into App Storage...");
            container.innerHTML = `<p style="color:#10b981; font-weight:bold;">100 Videos Saved Offline!</p>`;
        };
    }

    if (btn200) {
        btn200.onclick = () => {
            alert("Downloading 200 videos offline into App Storage...");
            container.innerHTML = `<p style="color:#10b981; font-weight:bold;">200 Videos Saved Offline!</p>`;
        };
    }
}
