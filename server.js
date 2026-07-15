import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = "UMAR_SUPER_SECRET_KEY_2026";

// Aapki Atlas connection string (Local running ke liye <password> ko apne asli password se badal dein)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://muhammadumar45212h_db_user:umar1234h@cluster0.fadfgxt.mongodb.net/umar-forex?retryWrites=true&w=majority&appName=Cluster0";

const app = express();
app.use(express.json());
app.use(cors());

// --- MongoDB Database Connection ---
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully to Cloud/Local!"))
  .catch(err => console.error("❌ Database Connection Error:", err));

// --- Schemas & Models ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 10000.00 }
});

const TradeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symbol: { type: String, enum: ['XAUUSDm', 'BTCUSDm', 'UMARUSDm'], required: true },
    type: { type: String, enum: ['BUY', 'SELL'], required: true },
    lotSize: { type: Number, required: true, default: 0.01 },
    openPrice: { type: Number, required: true },
    closePrice: { type: Number, default: null },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    pnl: { type: Number, default: 0.00 },
    openedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Trade = mongoose.model('Trade', TradeSchema);

// --- REST API: Auth Endpoints ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, password: hashedPassword, balance: 10000.00 });
        res.status(201).json({ status: 'success', userId: newUser._id });
    } catch (e) {
        res.status(400).json({ error: "Username already exists!" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Incorrect credentials" });
        }
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, balance: user.balance, username: user.username });
    } catch (e) {
        res.status(500).json({ error: "Server error during login" });
    }
});

// --- HTTP & WebSocket Server Configuration ---
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Live Pricing Database/Cache
let prices = {
    BTCUSDm: { bid: 65420.00, ask: 65421.00 },
    XAUUSDm: { bid: 2320.10, ask: 2320.60 },
    UMARUSDm: { bid: 101.92, ask: 101.97 }
};

// Stream Live BTCUSD from Binance WS
const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@aggTrade');
binanceWs.on('message', (data) => {
    const trade = JSON.parse(data);
    const p = parseFloat(trade.p);
    prices.BTCUSDm = { bid: +(p - 0.50).toFixed(2), ask: +(p + 0.50).toFixed(2) };
});

// Custom Ticker Simulation: UMARUSDm
let umarBasePrice = 101.92;
function updateUmarPrice() {
    const volatility = 0.0015;
    const drift = 0.00002;
    const randomShift = Math.random();
    const change = 2 * volatility * randomShift - volatility + drift;
    
    if (umarBasePrice > 115) umarBasePrice -= 0.50;
    else if (umarBasePrice < 90) umarBasePrice += 0.50;
    else umarBasePrice = +(umarBasePrice * (1 + change)).toFixed(2);

    return {
        bid: +(umarBasePrice - 0.05).toFixed(2),
        ask: +(umarBasePrice + 0.05).toFixed(2)
    };
}

// Global Ticker Loop (Runs every 1000ms)
setInterval(() => {
    prices.UMARUSDm = updateUmarPrice();
    
    // Simulate Gold
    const goldChg = (Math.random() - 0.5) * 0.12;
    prices.XAUUSDm.bid = +(prices.XAUUSDm.bid + goldChg).toFixed(2);
    prices.XAUUSDm.ask = +(prices.XAUUSDm.bid + 0.50).toFixed(2);

    // Broadcast updated prices to clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'TICKER_UPDATE', data: prices }));
        }
    });
}, 1000);

// --- Secure Socket Router (Auth & Orders) ---
wss.on('connection', (ws) => {
    console.log("Client connected via socket");

    ws.on('message', async (message) => {
        try {
            const payload = JSON.parse(message);

            if (payload.type === 'WS_AUTH') {
                const decoded = jwt.verify(payload.token, JWT_SECRET);
                ws.userId = decoded.id;
                const dbUser = await User.findById(decoded.id);
                ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', balance: dbUser.balance }));
            }

            if (payload.type === 'OPEN_POSITION' && ws.userId) {
                const { symbol, tradeType, lot } = payload;
                const entryPrice = tradeType === 'BUY' ? prices[symbol].ask : prices[symbol].bid;

                const dbUser = await User.findById(ws.userId);
                if (dbUser.balance < (lot * entryPrice * 0.05)) {
                    return ws.send(JSON.stringify({ type: 'ORDER_ERROR', message: "Insufficient Margin!" }));
                }

                const newTrade = await Trade.create({
                    userId: ws.userId, symbol, type: tradeType, lotSize: lot, openPrice: entryPrice
                });

                ws.send(JSON.stringify({ type: 'ORDER_OPENED', trade: newTrade }));
            }
        } catch (e) {
            ws.send(JSON.stringify({ type: 'ERROR', message: "Process failed" }));
        }
    });
});

server.listen(3000, () => console.log("🚀 Umar Super App Engine running on port 3000"));
