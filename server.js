import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database connection
await connectDB();

// Static files ke liye direct access
app.use(express.static(__dirname)); 

// Route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

