// ==========================================
// UMAR SUPER APP - CORE ENGINE (script.js)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. SESSION MANAGEMENT (One-time Login Check)
    const isUserLoggedIn = localStorage.getItem("umar_super_app_session");
    const loginPage = document.getElementById("login-page") || document.querySelector(".login-container");
    const appDashboard = document.getElementById("dashboard-page") || document.querySelector(".app-dashboard");

    // Agar pehle se logged in hai to direct main app par le jao
    if (isUserLoggedIn && isUserLoggedIn === "active") {
        if (loginPage) loginPage.style.display = "none";
        if (appDashboard) appDashboard.style.display = "block";
    } else {
        if (loginPage) loginPage.style.display = "block";
        if (appDashboard) appDashboard.style.display = "none";
    }

    // 2. LOGIN & REGISTRATION HANDLER
    const launchBtn = document.getElementById("launch-btn") || document.querySelector(".launch-btn") || document.querySelector("button");
    if (launchBtn) {
        launchBtn.addEventListener("click", (e) => {
            e.preventDefault();
            
            const emailInput = document.querySelector('input[type="email"]')?.value;
            const passwordInput = document.querySelector('input[type="password"]')?.value;
            const phoneInput = document.querySelector('input[type="tel"]') || document.querySelector('input[placeholder*="Phone"]');

            // Form validation aur authentication layer
            if (emailInput && passwordInput) {
                // Session ko lock kar diya taake close hone ke baad dubara login na mangay
                localStorage.setItem("umar_super_app_session", "active");
                
                // VIP Redirection transition smoothly run karne ke liye
                if (loginPage) loginPage.style.opacity = "0";
                setTimeout(() => {
                    if (loginPage) loginPage.style.display = "none";
                    if (appDashboard) {
                        appDashboard.style.display = "block";
                        appDashboard.style.opacity = "1";
                    }
                    // Agar files alag hain to use redirect kar sakte hain:
                    // window.location.href = "dashboard.html";
                }, 400);
            } else {
                alert("Kindly fill out all details with valid credentials!");
            }
        });
    }

    // 3. TRADING PLATFORM SYSTEM (Assets & Calculations)
    let currentAsset = "UMARUSDm";
    let walletBalance = 10000.00;
    let openPositions = [];

    // Assets setup mappings
    const assetConfigs = {
        "UMARUSDm": { basePrice: 100.68, pipValue: 10, decimalPlaces: 2 },
        "XAUUSD": { basePrice: 2345.50, pipValue: 100, decimalPlaces: 2 },
        "BTCUSD": { basePrice: 67250.00, pipValue: 1, decimalPlaces: 2 }
    };

    // Asset changer trigger logic
    const assetSelectorButtons = document.querySelectorAll(".asset-chip, .pair-selector");
    assetSelectorButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const selected = e.target.innerText.trim();
            if (assetConfigs[selected]) {
                currentAsset = selected;
                updateChartAssetDetails();
            }
        });
    });

    function updateChartAssetDetails() {
        const titleEl = document.querySelector(".asset-title") || document.getElementById("current-pair-display");
        if (titleEl) {
            titleEl.innerText = currentAsset;
        }
        // Chart ticks reload updates call here...
    }

    // 4. BUY / SELL AND LOT CALCULATION
    const buyButton = document.querySelector(".buy-btn") || document.getElementById("buy-action");
    const sellButton = document.querySelector(".sell-btn") || document.getElementById("sell-action");
    const lotInput = document.getElementById("lot-input") || document.querySelector('input[placeholder*="0."]');

    if (buyButton && sellButton) {
        buyButton.addEventListener("click", () => executeOrder("BUY"));
        sellButton.addEventListener("click", () => executeOrder("SELL"));
    }

    function executeOrder(type) {
        const lotSize = parseFloat(lotInput?.value || "0.01");
        if (isNaN(lotSize) || lotSize <= 0) {
            alert("Invalid Lot Size selection!");
            return;
        }

        const config = assetConfigs[currentAsset];
        const entryPrice = config.basePrice; // Yeh live price engine se connect ho jayega

        const newTrade = {
            id: Date.now(),
            asset: currentAsset,
            type: type,
            lot: lotSize,
            entryPrice: entryPrice,
            pnl: 0.00
        };

        openPositions.push(newTrade);
        renderPositionsModal();
    }

    // 5. MODAL & POSITION RENDERING ENGINE
    function renderPositionsModal() {
        const container = document.getElementById("positions-list-container");
        if (!container) return;

        container.innerHTML = ""; // Container flush
        openPositions.forEach(trade => {
            const row = document.createElement("div");
            row.className = "position-row-item";
            row.style.cssText = "display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #333;";
            
            const pnlColor = trade.pnl >= 0 ? "#4caf50" : "#f44336";

            row.innerHTML = `
                <div><strong>${trade.type} ${trade.lot}</strong> <span style="color:#aaa;">${trade.asset}</span></div>
                <div>Entry: ${trade.entryPrice.toFixed(2)}</div>
                <div style="color: ${pnlColor}; font-weight: bold;">${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}$</div>
            `;
            container.appendChild(row);
        });
    }

    // Logout option agar developer reset chahe (Testing purposes)
    window.resetAppSession = () => {
        localStorage.removeItem("umar_super_app_session");
        window.location.reload();
    };
});
