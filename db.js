import mongoose from 'mongoose';

const dbURI = "mongodb+srv://muhammadumar45212h_db_user:umar1234h@cluster0.fadfgxt.mongodb.net/?appName=Cluster0";

export const connectDB = async () => {
    try {
        await mongoose.connect(dbURI, { family: 4 });
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("Database connection error: ", err);
    }
};
