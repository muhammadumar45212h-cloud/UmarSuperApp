const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());

// MongoDB Connection with your password
const dbURI = 'mongodb+srv://muhammadumar45212h_db_user:umar1234h@cluster0.fwdfgxt.mongodb.net/?appName=Cluster0';

mongoose.connect(dbURI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("Database connection error: ", err));

// User Schema
const userSchema = new mongoose.Schema({
  phone: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: String,
  profilePic: String
});
const User = mongoose.model('User', userSchema);

// Signup Logic
app.post('/signup', async (req, res) => {
  try {
    const { phone, password, name } = req.body;
    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).send("Not registered: Number already exists.");
    
    const newUser = new User({ phone, password, name });
    await newUser.save();
    res.send("Account created successfully. Please set up profile.");
  } catch (err) { res.status(500).send("Error in signup"); }
});

// Login Logic
app.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  const user = await User.findOne({ phone, password });
  if (!user) return res.status(401).send("Not registered: Please sign up first.");
  res.send("Login successful");
});

app.listen(3000, () => console.log("Super App Server Running on port 3000"));
