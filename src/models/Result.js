import mongoose from "mongoose";

// === RESULT MODEL ===

const resultSchema = new mongoose.Schema(
  {
    userId:   { type: Number, required: true },
    userName: { type: String, default: "User" },
    quizId:   { type: String, required: true },
    chatId:   { type: Number, required: true },
    chatType: {
      type: String,
      enum: ["private", "group", "supergroup"],
      default: "private",
    },

    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers:   { type: Number, default: 0 },
    missedAnswers:  { type: Number, default: 0 },
    percentage:     { type: Number, default: 0 },

    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Tez qidirish uchun indexlar
resultSchema.index({ userId: 1 });
resultSchema.index({ quizId: 1 });

export default mongoose.model("Result", resultSchema);