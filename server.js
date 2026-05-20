const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('.'));

// Fake Database jo text, video, aur live stream teeno ko handle karega
let posts = [
    { username: "Umar (Admin)", content: "Welcome to the Grand Launch! Watch Live Streams here.", type: "text", isPremium: true },
    { username: "CryptoKing", content: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", isPremium: true },
    { username: "Trader_Ali", content: "Bitcoin is pumping today!", type: "text", isPremium: false }
];

// Posts load karne ka API (Premium posts sab se upar (Top) aayengi)
app.get('/api/posts', (req, res) => {
    let sortedPosts = [...posts].sort((a, b) => b.isPremium - a.isPremium);
    res.json(sortedPosts);
});

// Nayi post, video ya live stream add karne ka API
app.post('/api/posts', (req, res) => {
    const { username, content, type, isPremium } = req.body;
    if (username && content && type) {
        posts.push({ username, content, type, isPremium: isPremium || false });
        return res.json({ success: true, message: "Published successfully!" });
    }
    res.status(400).json({ success: false, message: "Missing data" });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
