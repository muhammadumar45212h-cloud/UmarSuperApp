const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Fake Database jo text, video, aur live stream handle karega
let posts = [
  { username: "Umar (Admin)", content: "Welcome to the Grand Launch! Welcome to Umar Super App", type: "text", isPremium: true },
  { username: "CryptoKing", content: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", isPremium: false },
  { username: "Trader_Ali", content: "Bitcoin is pumping today!", type: "text", isPremium: true }
];

// Home page route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Posts load karne ka API
app.get('/api/posts', (req, res) => {
  let sortedPosts = [...posts].sort((a, b) => b.isPremium - a.isPremium);
  res.json(sortedPosts);
});

// Nayi post add karne ka API
app.post('/api/posts', (req, res) => {
  const { username, content, type, isPremium } = req.body;
  if (username && content && type) {
    posts.push({ username, content, type, isPremium: isPremium || false });
    return res.json({ success: true, message: "Published successfully" });
  }
  res.status(400).json({ success: false, message: "Missing data" });
});

module.exports = app;
