import { saveQuizToDB, getQuizFromDB } from "../services/dbService.js";
import { isDBConnected } from "../config/database.js";

// === QUIZ STORAGE ===
// DB ulangan bo'lsa — MongoDB da saqlaydi
// Ulangan bo'lmasa — RAM da saqlaydi (fallback)

class QuizStorage {
  constructor() {
    this.quizzes = new Map(); // RAM fallback
  }

  generateQuizId() {
    return Math.random().toString(36).substring(2, 10);
  }

  async saveQuiz(questions, creatorId, creatorName = "User", title = "Test") {
    const quizId = this.generateQuizId();

    // RAM ga har doim saqlaymiz (tezlik uchun)
    this.quizzes.set(quizId, {
      quizId,
      questions,
      creatorId,
      creatorName,
      title,
      createdAt: Date.now(),
    });

    // DB ga ham saqlaymiz (agar ulangan bo'lsa)
    if (isDBConnected()) {
      await saveQuizToDB(quizId, questions, creatorId, creatorName, title);
    }

    console.log(`💾 Quiz saqlandi: ${quizId} (${questions.length} ta savol)`);
    return quizId;
  }

  async getQuiz(quizId) {
    // Avval RAM dan qidiramiz (tez)
    if (this.quizzes.has(quizId)) {
      return this.quizzes.get(quizId);
    }

    // RAM da yo'q — DB dan qidiramiz (bot restart bo'lgan bo'lishi mumkin)
    if (isDBConnected()) {
      const dbQuiz = await getQuizFromDB(quizId);
      if (dbQuiz) {
        // RAM ga ham yuklaymiz keyingi so'rovlar uchun
        this.quizzes.set(quizId, {
          quizId: dbQuiz.quizId,
          questions: dbQuiz.questions,
          creatorId: dbQuiz.creatorId,
          creatorName: dbQuiz.creatorName,
          title: dbQuiz.title,
          createdAt: dbQuiz.createdAt,
        });
        return this.quizzes.get(quizId);
      }
    }

    return null;
  }

  hasQuiz(quizId) {
    return this.quizzes.has(quizId);
  }

  deleteQuiz(quizId) {
    this.quizzes.delete(quizId);
  }

  cleanOldQuizzes() {
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    let count = 0;

    for (const [quizId, quiz] of this.quizzes.entries()) {
      if (now - quiz.createdAt > oneDayInMs) {
        this.quizzes.delete(quizId);
        count++;
      }
    }

    if (count > 0) console.log(`🗑️ ${count} ta eski quiz (RAM) tozalandi`);
  }
}

export default new QuizStorage();