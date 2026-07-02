import express from 'express';
import { connectDB } from './db.js'; // Ensure karo ki db.js mein 'export const connectDB' ho

const app = express();

// Middleware: JSON aur Form data handle karne ke liye (Scaling ke liye zaroori)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
try {
    await connectDB();
    console.log("Database connected successfully!");
} catch (error) {
    console.error("Database connection failed:", error);
}

// Health Check API (Server monitor karne ke liye)
app.get('/health', (req, res) => {
    res.status(200).send("Server is healthy and running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Super App Server running on port ${PORT}`);
});
