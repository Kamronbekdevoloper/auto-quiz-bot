import { shuffleAnswers } from "../parsers/questionParser.js";
import sessionManager from "../managers/sessionManager.js";
import { config } from "../config.js";
import { getContinueTestKeyboard } from "../keyboards/keyboards.js";
import { saveResult } from "../services/dbService.js";

// === QUIZ LOGIC ===

export async function sendQuizQuestion(bot, chatId, session) {
  const { questions, currentIndex, timeLimit, isActive, unansweredCount, inactivityWarningShown } = session;

  if (!isActive) return;

  // AUTO-STOP
  if (unansweredCount >= config.MAX_UNANSWERED_QUESTIONS && !inactivityWarningShown) {
    session.inactivityWarningShown = true;

    await bot.sendMessage(
      chatId,
      `⚠️ <b>Siz ${config.MAX_UNANSWERED_QUESTIONS} ta savolga javob bermadingiz!</b>\n\n🤔 Testni davom ettirasizmi?`,
      { parse_mode: "HTML", reply_markup: getContinueTestKeyboard() },
    );

    setTimeout(() => {
      if (sessionManager.hasSession(chatId) && session.inactivityWarningShown) {
        sessionManager.endSession(chatId);
        bot.sendMessage(chatId, "⏹ Test faolsizlik sababli to'xtatildi.");
        showResults(bot, chatId, session);
      }
    }, 30000);

    return;
  }

  // Test tugadi
  if (currentIndex >= questions.length) {
    setTimeout(async () => {
      if (sessionManager.hasSession(chatId)) {
        await showResults(bot, chatId, session);
      }
    }, 2000);
    return;
  }

  const q = questions[currentIndex];

  if (q.options.length < 2 || q.options.length > 10) {
    session.currentIndex++;
    setTimeout(() => sendQuizQuestion(bot, chatId, session), 1000);
    return;
  }

  const shuffled = shuffleAnswers(q);
  session.currentShuffledQuestion = shuffled;

  try {
    await bot.sendMessage(chatId, `📝 Savol ${currentIndex + 1}/${questions.length}`);

    const pollMessage = await bot.sendPoll(chatId, shuffled.question, shuffled.options, {
      type: "quiz",
      correct_option_id: shuffled.correctIndex,
      is_anonymous: false,
      open_period: timeLimit,
    });

    session.currentPollId = pollMessage.poll.id;
    session.questionStartTime = Date.now();
    session.answered = false;

    // Poll → chatId mapping
    sessionManager.registerPoll(pollMessage.poll.id, chatId);

    if (session.maxTimeTimeout) clearTimeout(session.maxTimeTimeout);

    session.maxTimeTimeout = setTimeout(() => {
      if (sessionManager.hasSession(chatId) && !session.answered) {
        sessionManager.incrementUnanswered(chatId);
        session.currentIndex++;
        session.answered = true;
        sendQuizQuestion(bot, chatId, session);
      }
    }, timeLimit * 1000 + 1500);

  } catch (err) {
    console.error(`❌ Xato (Savol #${currentIndex + 1}): ${err.message}`);
    if (sessionManager.hasSession(chatId)) {
      session.currentIndex++;
      setTimeout(() => sendQuizQuestion(bot, chatId, session), 2000);
    }
  }
}

// NATIJALARNI KO'RSATISH + DB GA SAQLASH
export async function showResults(bot, chatId, session) {
  const { questions, correctAnswers, wrongAnswers, startTime, chatType, quizId, userId, userName } = session;

  const totalQuestions = questions.length;
  const missed = totalQuestions - correctAnswers - wrongAnswers;
  const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  // Guruh — leaderboard
  if (chatType !== "private") {
    const results = sessionManager.getGroupResults(chatId);

    if (results.length === 0) {
      await bot.sendMessage(chatId, "❌ Hech kim testga javob bermadi.");
      return;
    }

    // Guruh natijalarini DB ga saqlash
    for (const participant of results) {
      await saveResult({
        userId: participant.userId,
        userName: participant.userName,
        quizId: quizId || "unknown",
        chatId,
        chatType,
        totalQuestions,
        correctAnswers: participant.correctAnswers,
        wrongAnswers: participant.wrongAnswers,
        durationSeconds: participant.duration,
      });
    }

    const medals = ["🥇", "🥈", "🥉"];
    let text = `🏁 <b>Test yakunlandi!</b>\n\n📊 Jami savollar: ${totalQuestions}\n\n🏆 <b>Natijalar:</b>\n\n`;

    results.forEach((p, i) => {
      const medal = medals[i] || `${i + 1}.`;
      const name = p.userName.startsWith("@") ? p.userName : `@${p.userName}`;
      const t = `${Math.floor(p.duration / 60)}m ${p.duration % 60}s`;
      text += `${medal} ${name} – ${p.score}/${totalQuestions} (${t})\n`;
    });

    text += `\n🎉 G'oliblarga tabriklar!`;
    await bot.sendMessage(chatId, text, { parse_mode: "HTML" });
    return;
  }

  // Private — natija + DB ga saqlash
  await saveResult({
    userId: session.userId || chatId,
    userName: session.userName || "User",
    quizId: session.quizId || "unknown",
    chatId,
    chatType: "private",
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    durationSeconds,
  });

  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const emoji = percentage >= 80 ? "🏆" : percentage >= 60 ? "👍" : percentage >= 40 ? "📚" : "💪";

  const resultText = `🏁 <b>Test yakunlandi!</b>

📊 Jami savollar: ${totalQuestions}
✅ To'g'ri: ${correctAnswers}
❌ Noto'g'ri: ${wrongAnswers}
⌛️ Javobsiz: ${missed}
⏱ Vaqt: ${minutes} daqiqa ${seconds} soniya

${emoji} Natija: <b>${percentage}%</b>

Yangi test uchun /newtest`;

  await bot.sendMessage(chatId, resultText, { parse_mode: "HTML" });
}