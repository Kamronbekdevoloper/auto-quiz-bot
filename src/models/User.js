import mongoose from "mongoose";

// === USER MODEL ===

const userSchema = new mongoose.Schema(
  {
    telegramId:   { type: Number, required: true, unique: true },
    username:     { type: String, default: null },
    firstName:    { type: String, default: "" },
    lastName:     { type: String, default: null },
    languageCode: { type: String, default: "uz" },

    // Statistika
    totalTests:   { type: Number, default: 0 }, // Nechta test yaratgan
    totalQuizzes: { type: Number, default: 0 }, // Nechta quiz topshirgan
    totalCorrect: { type: Number, default: 0 }, // Jami to'g'ri javoblar
    totalWrong:   { type: Number, default: 0 }, // Jami noto'g'ri javoblar

    isSubscribed: { type: Boolean, default: false },
    lastActive:   { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);