const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing. Add it to server/.env before starting the server.");
  }

  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully");
    console.log("Database Name:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);    console.log("Database Name:", mongoose.connection.name);
    
  } catch (err) {
    console.error("MongoDB connection error:");
    console.error(err);
    throw err;
  }
};

module.exports = connectDB;
