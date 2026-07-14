import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google-generative-ai';

const app = express();
app.use(cors());
app.use(express.json());

// Dummy API Endpoint for Login Testing
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
        return res.json({ success: true, message: "Login Successful!" });
    }
    res.status(401).json({ success: false, error: "Galat credentials!" });
});

// Gemini AI Endpoint
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    try {
        // Umar bhai, yahan humne key variable ko bina kisi string ke process env par chhor diya hai taake GitHub block na kare
        const apiKey = process.env.GEMINI_API_KEY || "key-placeholder";
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ text: response.text() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ text: "Sorry, AI response me error aya." });
    }
});

// Serving the Premium Frontend Interface directly
app.get('*', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Umar Super App</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body { font-family: sans-serif; background-color: #0b0f19; color: white; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body>
    <div id="app" class="relative w-full h-screen max-w-md mx-auto flex flex-col overflow-hidden bg-[#0b0f19]">
        
        <!-- 1. LOGIN SCREEN -->
        <div id="login-screen" class="absolute inset-0 bg-[#0b0f19] z-50 flex flex-col justify-center px-6 transition-all duration-300">
            <div class="text-center mb-8">
                <span class="text-5xl">👑</span>
                <h1 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mt-2">UMAR SUPER APP</h1>
                <p class="text-slate-400 text-sm mt-1">Welcome to the Super App</p>
            </div>
            
            <div class="space-y-4">
                <input type="email" id="login-email" placeholder="Email" class="w-full bg-[#161b26] border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500">
                <input type="password" id="login-password" placeholder="Password" class="w-full bg-[#161b26] border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500">
                <input type="tel" id="login-phone" placeholder="Phone Number" class="w-full bg-[#161b26] border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500">
                
                <button onclick="performLogin()" class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                    🚀 Launch App
                </button>
                
                <button onclick="oauthLogin('Google')" class="w-full bg-white text-black font-semibold p-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    📧 Continue with Google
                </button>
                
                <button onclick="oauthLogin('Phone')" class="w-full bg-[#22c55e] text-white font-semibold p-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    📱 Login with Phone
                </button>
            </div>
            <div class="text-center text-xs text-gray-500 mt-8">Made with ❤️ by super app</div>
        </div>

        <!-- 2. MAIN DASHBOARD / TRADING PLATFORM -->
        <div id="dashboard-screen" class="hidden flex-col h-full w-full">
            <!-- Header Asset Info Bar -->
            <div class="p-4 border-b border-gray-800 flex justify-between items-center bg-[#111622]">
                <div class="flex items-center gap-2">
                    <span class="text-xl font-bold text-purple-400" id="current-asset-title">UMARUSDm</span>
                    <div class="flex gap-1 text-xs">
                        <span class="bg-gray-800 px-2 py-0.5 rounded cursor-pointer text-gray-300">M1</span>
                        <span class="bg-gray-800 px-2 py-0.5 rounded cursor-pointer text-gray-300">M5</span>
                        <span class="bg-purple-600 px-2 py-0.5 rounded cursor-pointer text-white">H1</span>
                    </div>
                </div>
                <button onclick="logoutApp()" class="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">Logout</button>
            </div>

            <!-- Asset Selectors Quick Chips -->
            <div class="p-2 flex gap-2 bg-[#161b26] justify-center overflow-x-auto hide-scrollbar">
                <button onclick="switchAsset('UMARUSDm')" class="bg-purple-900/40 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/30">UMARUSDm</button>
                <button onclick="switchAsset('XAUUSD')" class="bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-xs font-semibold">XAUUSD</button>
                <button onclick="switchAsset('BTCUSD')" class="bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-xs font-semibold">BTCUSD</button>
            </div>

            <!-- Balance Area -->
            <div class="m-4 bg-[#161b26] p-4 rounded-xl border border-gray-800">
                <div class="text-xs text-gray-400">Account Balance</div>
                <div class="text-2xl font-mono font-bold text-green-400" id="balance-display">$10000.00</div>
            </div>

            <!-- Core Trading View Mock Area -->
            <div class="flex-1 px-4 flex flex-col justify-center items-center text-center text-gray-500">
                <i class="fa-solid fa-chart-line text-4xl mb-2 text-purple-500/50"></i>
                <p class="text-sm">Interactive Candlestick Stream Active</p>
                <span class="text-xs text-gray-600 mt-1">Trading Framework Live On Vercel</span>
            </div>

            <!-- Trade Form Actions footer -->
            <div class="p-4 bg-[#111622] border-t border-gray-800 space-y-3">
                <div class="flex items-center justify-center gap-2">
                    <span class="text-sm text-gray-400">Lot:</span>
                    <input type="number" id="lot-input" value="0.22" step="0.01" min="0.01" class="w-24 text-center bg-[#161b26] border border-gray-700 rounded p-1 text-white text-sm font-mono focus:outline-none">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <button onclick="placeOrder('SELL')" class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all">SELL</button>
                    <button onclick="placeOrder('BUY')" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all">BUY</button>
                </div>
            </div>
        </div>

    </div>

    <!-- CLIENT INTERACTIVE ENGINE -->
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const activeSession = localStorage.getItem("umar_app_session");
            if (activeSession === "verified") {
                document.getElementById("login-screen").classList.add("hidden");
                document.getElementById("dashboard-screen").classList.remove("hidden");
                document.getElementById("dashboard-screen").classList.add("flex");
            }
        });

        function performLogin() {
            const email = document.getElementById("login-email").value;
            const pass = document.getElementById("login-password").value;

            if(email && pass) {
                localStorage.setItem("umar_app_session", "verified");
                document.getElementById("login-screen").classList.add("hidden");
                document.getElementById("dashboard-screen").classList.remove("hidden");
                document.getElementById("dashboard-screen").classList.add("flex");
            } else {
                alert("Please fill necessary email and password fields.");
            }
        }

        function oauthLogin(provider) {
            alert(provider + " gateway integration framework initialized!");
            localStorage.setItem("umar_app_session", "verified");
            document.getElementById("login-screen").classList.add("hidden");
            document.getElementById("dashboard-screen").classList.remove("hidden");
            document.getElementById("dashboard-screen").classList.add("flex");
        }

        function switchAsset(assetName) {
            document.getElementById("current-asset-title").innerText = assetName;
            alert("Switched Trading Channel to " + assetName);
        }

        function placeOrder(type) {
            const lot = document.getElementById("lot-input").value;
            alert(type + " Order executed successfully for " + lot + " Lots!");
        }

        function logoutApp() {
            localStorage.removeItem("umar_app_session");
            window.location.reload();
        }
    </script>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
