const express = require('express');
const connectDB = require('./db');
const app = express();

app.use(express.json());

// Database connect karein
connectDB();

app.listen(3000, () => console.log("Super App Server Running on port 3000"));
