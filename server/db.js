
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined");
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDB;
