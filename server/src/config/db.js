const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️  MongoDB unavailable: ${error.message}`);
    console.warn('   Server will run without history persistence.');
    console.warn('   → Fix: Go to Atlas → Network Access → Add your IP (or 0.0.0.0/0 for dev)');
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
