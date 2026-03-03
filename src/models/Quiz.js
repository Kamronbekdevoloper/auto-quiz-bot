import mongoose from "mongoose";

// === QUIZ MODEL ===

const quizSchema = new mongoose.Schema(
  {
    quizId:      { type: String, required: true, unique: true },
    creatorId:   { type: Number, required: true },
    creatorName: { type: String, default: "User" },
    title:       { type: String, default: "Test" },

    questions: [
      {
        question:     String,
        options:      [String],
        correctIndex: Number,
      },
    ],

    totalPlays: { type: Number, default: 0 },

    // 24 soatdan keyin avtomatik o'chiriladi
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// TTL index — expiresAt vaqti o'tgach MongoDB o'zi o'chiradi
quizSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Quiz", quizSchema);