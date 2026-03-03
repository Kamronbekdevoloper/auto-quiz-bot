import mongoose from "mongoose";
import { config } from "../config.js";

// === MONGODB CONNECTION ===

export async function connectDB() {
  if (!config.MONGO_URI) {
    console.warn("⚠️ MONGO_URI sozlanmagan! Database ishlamaydi.");
    return false;
  }

  try {
    await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB ulandi!");
    return true;
  } catch (err) {
    console.error("❌ MongoDB ulanish xatosi:", err.message);
    console.warn("⚠️ Bot MongoDB siz davom etadi (RAM rejimi)");
    return false;
  }
}

export function isDBConnected() {
  return mongoose.connection.readyState === 1;
}