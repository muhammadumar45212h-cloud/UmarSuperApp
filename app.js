const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Real Login API Endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Email aur password dono zaroori hain!" 
    });
  }

  return res.json({ 
    success: true, 
    user: {
      username: email.split('@')[0],
      email: email
    }
  });
});

// Front-end Server Delivery
app.get('*', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Umar Super App</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: sans-serif; background-color: #0b0f19; color: white; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-[#05070c]">
    <div id="app" class="relative w-full h-screen max-w-md mx-auto flex flex-col overflow-hidden bg-[#0b0f19] border-x border-gray-900 shadow-2xl">
        
        <!-- 1. LOGIN SCREEN -->
        <div id="login-screen" class="absolute inset-0 bg-[#0b0f19] z-50 flex flex-col justify-center px-6 transition-all duration-500">
            <div class="text-center mb-8">
                <span class="text-6xl animate-bounce inline-block">👑</span>
                <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mt-2 tracking-wider">UMAR SUPER APP</h1>
                <p class="text-slate-400 text-sm mt-1">Next-Gen Crypto, Media & Social Space</p>
            </div>

            <div class="space-y-4">
                <div class="relative">
                    <i class="fa-regular fa-envelope absolute left-4 top-4.5 text-gray-500"></i>
                    <input type="email" id="login-email" placeholder="Email" class="w-full bg-[#161b26] border border-gray-800 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-purple-500 transition-all">
                </div>
                <div class="relative">
                    <i class="fa-solid fa-lock absolute left-4 top-4.5 text-gray-500"></i>
                    <input type="password" id="login-password" placeholder="Password" class="w-full bg-[#161b26] border border-gray-800 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-purple-500 transition-all">
                </div>

                <div id="login-error-msg" class="text-red-500 text-xs text-center hidden"></div>

                <button onclick="performLogin()" class="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold p-4 rounded-2xl shadow-lg transition active:scale-95">
                    🚀 Launch Super App
                </button>

                <div class="relative flex py-2 items-center">
                    <div class="flex-grow border-t border-gray-800"></div>
                    <span class="flex-shrink mx-4 text-gray-600 text-xs">OR QUICK TEST</span>
                    <div class="flex-grow border-t border-gray-800"></div>
                </div>

                <button onclick="bypassLogin()" class="w-full bg-[#161b26] border border-gray-800 text-gray-300 font-semibold p-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 transition active:scale-95">
                    ⚡ Fast Guest Entrance
                </button>
            </div>
            <div class="text-center text-xs text-gray-600 mt-12">Proudly Powered by Termux & Vercel</div>
        </div>

        <!-- 2. MAIN APP DASHBOARD -->
        <div id="dashboard-screen" class="hidden flex-col h-full w-full">
            
            <!-- Dynamic Main Content Window -->
            <div id="tab-content-area" class="flex-1 overflow-y-auto hide-scrollbar pb-20">
                
                <!-- TAB 1: VIDEOS FEED (TikTok Style) -->
                <div id="tab-videos" class="h-full flex flex-col justify-center items-center p-4">
                    <div class="w-full max-w-sm aspect-[9/16] bg-gradient-to-b from-gray-900 to-black rounded-3xl border border-gray-800 relative overflow-hidden flex flex-col justify-end p-4">
                        <div class="absolute inset-0 flex items-center justify-center">
                            <i class="fa-solid fa-circle-play text-6xl text-purple-500/70 animate-pulse"></i>
                        </div>
                        <!-- Video Info Overlay -->
                        <div class="z-10 space-y-2">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs">U</div>
                                <span class="font-semibold text-sm">@umar_creator</span>
                            </div>
                            <p class="text-xs text-gray-300">My first video uploaded directly from Termux test link! Let's go mates! 🚀</p>
                            <span class="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full">#SuperApp #Fintech</span>
                        </div>
                        <!-- Sidebar Buttons -->
                        <div class="absolute right-4 bottom-20 flex flex-col items-center gap-4 text-white z-10">
                            <button class="flex flex-col items-center gap-1 group active:scale-90 transition"><i class="fa-solid fa-heart text-red-500 text-2xl"></i><span class="text-xs">1.2k</span></button>
                            <button class="flex flex-col items-center gap-1 active:scale-90 transition"><i class="fa-solid fa-comment text-2xl text-gray-300"></i><span class="text-xs">84</span></button>
                            <button class="flex flex-col items-center gap-1 active:scale-90 transition"><i class="fa-solid fa-share text-2xl text-gray-300"></i><span class="text-xs">Share</span></button>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: TRADING PORTAL (XAUUSD, BTCUSD, UMARUSD) -->
                <div id="tab-trading" class="hidden p-4 space-y-4">
                    <div class="flex justify-between items-center bg-[#111322] p-3 rounded-2xl border border-gray-800">
                        <div>
                            <span class="text-xs text-gray-400">Trading Pair</span>
                            <h2 class="text-xl font-bold text-purple-400" id="current-asset">UMARUSD</h2>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="switchAsset('UMARUSD')" class="bg-purple-900/40 text-purple-300 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-purple-900/80">UMARUSD</button>
                            <button onclick="switchAsset('XAUUSD')" class="bg-[#161b26] text-gray-400 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-gray-800">XAUUSD</button>
                            <button onclick="switchAsset('BTCUSD')" class="bg-[#161b26] text-gray-400 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-gray-800">BTCUSD</button>
                        </div>
                    </div>

                    <!-- Live Market Flow Graphic -->
                    <div class="bg-[#111322] border border-gray-800 p-4 rounded-2xl h-48 flex flex-col justify-between">
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>Interactive Market Trend</span>
                            <span class="text-green-400 font-mono"><i class="fa-solid fa-circle text-[8px] animate-pulse mr-1"></i> Live feed online</span>
                        </div>
                        <div class="flex items-end justify-between h-28 px-4">
                            <div class="w-4 bg-red-500 rounded-t-sm" style="height: 40%"></div>
                            <div class="w-4 bg-red-500 rounded-t-sm" style="height: 30%"></div>
                            <div class="w-4 bg-green-500 rounded-t-sm" style="height: 60%"></div>
                            <div class="w-4 bg-green-500 rounded-t-sm" style="height: 75%"></div>
                            <div class="w-4 bg-red-500 rounded-t-sm" style="height: 50%"></div>
                            <div class="w-4 bg-green-500 rounded-t-sm animate-bounce" style="height: 85%"></div>
                        </div>
                        <div class="flex justify-between text-[10px] text-gray-600">
                            <span>12:40 PM</span>
                            <span>12:42 PM</span>
                            <span>12:44 PM (Now)</span>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="bg-[#111322] border border-gray-800 p-4 rounded-2xl space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-gray-400">Position Lot Size:</span>
                            <input type="number" id="lot-size" value="0.50" step="0.05" class="w-20 bg-[#161b26] border border-gray-700 rounded-lg p-1.5 text-center font-mono text-sm text-white">
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <button onclick="execOrder('SELL')" class="bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition active:scale-95 shadow-lg shadow-red-950/20">SELL</button>
                            <button onclick="execOrder('BUY')" class="bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl transition active:scale-95 shadow-lg shadow-green-950/20">BUY</button>
                        </div>
                    </div>
                </div>

                <!-- TAB 3: CHAT ROOM -->
                <div id="tab-chat" class="hidden p-4 flex flex-col h-full">
                    <div class="bg-[#111322] border border-gray-800 p-3 rounded-2xl flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center font-bold">G</div>
                        <div>
                            <h3 class="font-bold text-sm">Super App Chat Room</h3>
                            <p class="text-[10px] text-green-400">Active users testing live</p>
                        </div>
                    </div>
                    
                    <div class="flex-1 space-y-3 overflow-y-auto pr-1">
                        <div class="flex gap-2 items-start">
                            <div class="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold">D</div>
                            <div class="bg-[#161b26] border border-gray-800 p-2.5 rounded-2xl rounded-tl-none max-w-[75%]">
                                <span class="text-[10px] text-purple-400 font-bold block">Dost 1</span>
                                <p class="text-xs text-gray-300">Bro app tou bilkul solid chal rahi hai! Fast load ho gayi.</p>
                            </div>
                        </div>
                        <div class="flex gap-2 items-start justify-end">
                            <div class="bg-purple-600 p-2.5 rounded-2xl rounded-tr-none max-w-[75%] text-right">
                                <span class="text-[10px] text-purple-200 font-bold block">You (Umar)</span>
                                <p class="text-xs text-white">Shukriya bro! Direct Termux se live build kiya hai.</p>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 flex gap-2">
                        <input type="text" placeholder="Write something..." class="flex-1 bg-[#161b26] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none">
                        <button class="bg-purple-600 p-3 rounded-xl hover:bg-purple-500 transition active:scale-95"><i class="fa-regular fa-paper-plane"></i></button>
                    </div>
                </div>

                <!-- TAB 4: WALLET HUB (TRC20, JazzCash, EasyPaisa) -->
                <div id="tab-wallet" class="hidden p-4 space-y-4">
                    <div class="bg-gradient-to-br from-purple-900 to-indigo-950 p-6 rounded-3xl border border-purple-800 shadow-xl">
                        <span class="text-xs text-purple-300">Available Balance</span>
                        <h1 class="text-3xl font-mono font-black text-white mt-1">$2,450.00</h1>
                        <p class="text-[10px] text-purple-400 mt-2">Active Wallet Address: TRC20_UmarSuper99x</p>
                    </div>

                    <!-- Integrated Payment Channels -->
                    <div class="space-y-2">
                        <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Withdrawal & Deposit Gateways</h3>
                        
                        <div class="flex items-center justify-between bg-[#111322] border border-gray-800 p-3.5 rounded-2xl hover:border-purple-900/50 transition">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-red-600/10 text-red-500 rounded-xl flex items-center justify-center font-bold text-xs">JC</div>
                                <div>
                                    <h4 class="text-xs font-bold">JazzCash Wallet</h4>
                                    <p class="text-[10px] text-gray-500">PKR Instant Transfer</p>
                                </div>
                            </div>
                            <span class="text-xs text-green-400 font-semibold bg-green-500/10 px-2.5 py-1 rounded-full">Active</span>
                        </div>

                        <div class="flex items-center justify-between bg-[#111322] border border-gray-800 p-3.5 rounded-2xl hover:border-purple-900/50 transition">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-green-600/10 text-green-500 rounded-xl flex items-center justify-center font-bold text-xs">EP</div>
                                <div>
                                    <h4 class="text-xs font-bold">EasyPaisa Gateway</h4>
                                    <p class="text-[10px] text-gray-500">PKR Transfer System</p>
                                </div>
                            </div>
                            <span class="text-xs text-green-400 font-semibold bg-green-500/10 px-2.5 py-1 rounded-full">Active</span>
                        </div>

                        <div class="flex items-center justify-between bg-[#111322] border border-gray-800 p-3.5 rounded-2xl hover:border-purple-900/50 transition">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-blue-600/10 text-blue-400 rounded-xl flex items-center justify-center"><i class="fa-solid fa-coins"></i></div>
                                <div>
                                    <h4 class="text-xs font-bold">USDT (TRC20 / ERC20)</h4>
                                    <p class="text-[10px] text-gray-500">Secure Blockchain Deposit</p>
                                </div>
                            </div>
                            <span class="text-xs text-green-400 font-semibold bg-green-500/10 px-2.5 py-1 rounded-full">Active</span>
                        </div>
                    </div>
                </div>

            </div>

            <!-- BOTTOM TAB NAVIGATION BAR -->
            <div class="absolute bottom-0 left-0 right-0 bg-[#0b0f19]/90 backdrop-blur-md border-t border-gray-800 h-16 flex justify-around items-center px-2 z-40">
                <button onclick="switchTab('tab-videos')" class="flex flex-col items-center gap-1 text-purple-500" id="nav-tab-videos">
                    <i class="fa-solid fa-film text-lg"></i>
                    <span class="text-[10px]">Feed</span>
                </button>
                <button onclick="switchTab('tab-trading')" class="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition" id="nav-tab-trading">
                    <i class="fa-solid fa-chart-simple text-lg"></i>
                    <span class="text-[10px]">Trade</span>
                </button>
                <button onclick="switchTab('tab-chat')" class="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition" id="nav-tab-chat">
                    <i class="fa-solid fa-comments text-lg"></i>
                    <span class="text-[10px]">Chat</span>
                </button>
                <button onclick="switchTab('tab-wallet')" class="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition" id="nav-tab-wallet">
                    <i class="fa-solid fa-wallet text-lg"></i>
                    <span class="text-[10px]">Wallet</span>
                </button>
                <button onclick="logoutApp()" class="flex flex-col items-center gap-1 text-red-500">
                    <i class="fa-solid fa-right-from-bracket text-lg"></i>
                    <span class="text-[10px]">Exit</span>
                </button>
            </div>

        </div>

    </div>

    <!-- MAIN CLIENT LOGIC -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const activeSession = localStorage.getItem("umar_app_session");
            if (activeSession === "verified") {
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('login-screen').classList.remove('flex');
                document.getElementById('dashboard-screen').classList.add('flex');
            }
        });

        async function performLogin() {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            const errMsg = document.getElementById('login-error-msg');
            
            if(!email || !pass) {
                errMsg.innerText = "Email and Password are required!";
                errMsg.classList.remove('hidden');
                return;
            }

            try {
                const response = await fetch(\`\${window.location.origin}/api/login\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: pass })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem("umar_app_session", "verified");
                    
                    // Direct switch without popups
                    document.getElementById('login-screen').classList.add('hidden');
                    document.getElementById('login-screen').classList.remove('flex');
                    document.getElementById('dashboard-screen').classList.add('flex');
                } else {
                    errMsg.innerText = data.message || "Invalid Login Details";
                    errMsg.classList.remove('hidden');
                }
            } catch (error) {
                console.error("Login Error:", error);
                errMsg.innerText = "Network Error. Please check connection.";
                errMsg.classList.remove('hidden');
            }
        }

        function bypassLogin() {
            // Instant Guest Access without popup
            localStorage.setItem("umar_app_session", "verified");
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('login-screen').classList.remove('flex');
            document.getElementById('dashboard-screen').classList.add('flex');
        }

        // Beautiful Tab Switching Engine
        function switchTab(tabId) {
            // Hide all tabs
            document.getElementById('tab-videos').classList.add('hidden');
            document.getElementById('tab-trading').classList.add('hidden');
            document.getElementById('tab-chat').classList.add('hidden');
            document.getElementById('tab-wallet').classList.add('hidden');

            // Show target tab
            document.getElementById(tabId).classList.remove('hidden');

            // Reset all navigation text colors
            const tabs = ['tab-videos', 'tab-trading', 'tab-chat', 'tab-wallet'];
            tabs.forEach(item => {
                const btn = document.getElementById('nav-' + item);
                btn.className = "flex flex-col items-center gap-1 text-gray-400 hover:text-white transition";
            });

            // Highlight selected tab icon
            document.getElementById('nav-' + tabId).className = "flex flex-col items-center gap-1 text-purple-500 font-bold";
        }

        function switchAsset(assetName) {
            document.getElementById('current-asset').innerText = assetName;
        }

        function execOrder(type) {
            const lot = document.getElementById('lot-size').value;
            // Simulated trade log feedback inside the UI instead of global alerts
            console.log(\`Executed \${type} order for \${lot} lots successfully!\`);
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

module.exports = app;
