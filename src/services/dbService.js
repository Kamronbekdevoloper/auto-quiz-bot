import User from "../models/User.js";
import Quiz from "../models/Quiz.js";
import Result from "../models/Result.js";
import { isDBConnected } from "../config/database.js";

// === DATABASE SERVICE ===
// Barcha DB operatsiyalari shu yerda

// ─────────────────────────────────────────
//  USER
// ─────────────────────────────────────────

// Foydalanuvchini saqlash yoki yangilash
export async function saveUser(telegramUser) {
  if (!isDBConnected()) return null;

  try {
    const user = await User.findOneAndUpdate(
      { telegramId: telegramUser.id },
      {
        username:     telegramUser.username || null,
        firstName:    telegramUser.first_name || "",
        lastName:     telegramUser.last_name || null,
        languageCode: telegramUser.language_code || "uz",
        lastActive:   new Date(),
      },
      { upsert: true, new: true }
    );
    return user;
  } catch (err) {
    console.error("❌ saveUser xatosi:", err.message);
    return null;
  }
}

// User statistikasini yangilash
export async function updateUserStats(telegramId, {
  correct  = 0,
  wrong    = 0,
  newTest  = false,
  newQuiz  = false,
} = {}) {
  if (!isDBConnected()) return null;

  try {
    return await User.findOneAndUpdate(
      { telegramId },
      {
        $inc: {
          totalCorrect:  correct,
          totalWrong:    wrong,
          ...(newTest  && { totalTests:   1 }),
          ...(newQuiz  && { totalQuizzes: 1 }),
        },
        $set: { lastActive: new Date() },
      },
      { new: true }
    );
  } catch (err) {
    console.error("❌ updateUserStats xatosi:", err.message);
    return null;
  }
}

// User statistikasini olish
export async function getUserStats(telegramId) {
  if (!isDBConnected()) return null;

  try {
    return await User.findOne({ telegramId });
  } catch (err) {
    console.error("❌ getUserStats xatosi:", err.message);
    return null;
  }
}

// ─────────────────────────────────────────
//  QUIZ
// ─────────────────────────────────────────

// Quizni DB ga saqlash
export async function saveQuizToDB(quizId, questions, creatorId, creatorName, title) {
  if (!isDBConnected()) return null;

  try {
    const quiz = await Quiz.create({
      quizId,
      questions,
      creatorId,
      creatorName,
      title,
    });

    // User "test yaratdi" statistikasi
    await updateUserStats(creatorId, { newTest: true });

    console.log(`💾 Quiz DB ga saqlandi: ${quizId}`);
    return quiz;
  } catch (err) {
    console.error("❌ saveQuizToDB xatosi:", err.message);
    return null;
  }
}

// Quizni DB dan olish
export async function getQuizFromDB(quizId) {
  if (!isDBConnected()) return null;

  try {
    const quiz = await Quiz.findOne({ quizId });

    if (quiz) {
      // O'yin sonini oshirish
      await Quiz.updateOne({ quizId }, { $inc: { totalPlays: 1 } });
    }

    return quiz;
  } catch (err) {
    console.error("❌ getQuizFromDB xatosi:", err.message);
    return null;
  }
}

// ─────────────────────────────────────────
//  RESULT
// ─────────────────────────────────────────

// Test natijasini saqlash
export async function saveResult({
  userId,
  userName,
  quizId,
  chatId,
  chatType,
  totalQuestions,
  correctAnswers,
  wrongAnswers,
  durationSeconds,
}) {
  if (!isDBConnected()) return null;

  try {
    const missed     = totalQuestions - correctAnswers - wrongAnswers;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    const result = await Result.create({
      userId,
      userName,
      quizId,
      chatId,
      chatType,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      missedAnswers:  missed,
      percentage,
      durationSeconds,
    });

    // User "quiz topshirdi" statistikasi
    await updateUserStats(userId, {
      correct: correctAnswers,
      wrong:   wrongAnswers,
      newQuiz: true,
    });

    console.log(`💾 Natija saqlandi: User ${userId} | Quiz ${quizId} | ${percentage}%`);
    return result;
  } catch (err) {
    console.error("❌ saveResult xatosi:", err.message);
    return null;
  }
}

// User ning oxirgi natijalari
export async function getUserResults(userId, limit = 10) {
  if (!isDBConnected()) return [];

  try {
    return await Result.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (err) {
    console.error("❌ getUserResults xatosi:", err.message);
    return [];
  }
}