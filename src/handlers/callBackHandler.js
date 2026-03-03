import sessionManager from "../managers/sessionManager.js";
import quizStorage from "../managers/quizStorage.js";
import { sendQuizQuestion, showResults } from "../utils/quizLogic.js";
import { config } from "../config.js";
import {
  isUserSubscribed,
  getSubscriptionBlockMessage,
} from "../utils/subscriptionChecker.js";
import {
  getStartMenuKeyboard,
  getTestCreationTypeKeyboard,
  getTimeKeyboard,
  getGroupReadyKeyboard,
  getGroupStopKeyboard,
} from "../keyboards/keyboards.js";

const MIN_READY_PLAYERS = 2;
const MIN_STOP_VOTES    = 2;
const START_COUNTDOWN   = 5; // sekund

// === CALLBACK HANDLER ===

export function setupCallbackHandler(bot) {
  bot.on("callback_query", async (query) => {
    const userId   = query.from.id;
    const userName = query.from.username || query.from.first_name || "User";
    const chatId   = query.message?.chat?.id;
    const data     = query.data;

    // ─── SUBSCRIPTION CHECK ───────────────────────────────
    if (data === "check_subscription") {
      const isSubscribed = await isUserSubscribed(bot, userId, query.message?.chat?.type || "private");

      if (!isSubscribed) {
        await bot.answerCallbackQuery(query.id, {
          text: "❌ Hali obuna qilmagansiz!",
          show_alert: true,
        });
        const { text, keyboard } = getSubscriptionBlockMessage();
        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "HTML",
          reply_markup: keyboard,
        });
        return;
      }

      await bot.answerCallbackQuery(query.id, { text: "✅ Obuna tasdiqlandi!" });
      await bot.deleteMessage(chatId, query.message.message_id);
      await bot.sendMessage(
        chatId,
        `👋 <b>Xush kelibsiz!</b>\n\n🤖 Men avtomatlashtirilgan quiz bot.\n\n📝 Quyidagi tugmalardan birini tanlang:`,
        { parse_mode: "HTML", reply_markup: getStartMenuKeyboard() },
      );
      return;
    }

    // ─── START MENU ───────────────────────────────────────
    if (data === "create_test") {
      await bot.answerCallbackQuery(query.id);
      await bot.editMessageText(`📝 <b>Test yaratish</b>\n\nQanday usulda?`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: getTestCreationTypeKeyboard(),
      });
      return;
    }

    if (data === "create_titul_soon") {
      await bot.answerCallbackQuery(query.id, { text: "🏆 Tez orada qo'shiladi!", show_alert: true });
      return;
    }

    if (data === "test_from_file") {
      await bot.answerCallbackQuery(query.id);
      await bot.deleteMessage(chatId, query.message.message_id);
      await bot.sendMessage(chatId, "📁 Test uchun fayl yuboring.\n\n✅ Formatlar: TXT, PDF, DOCX, PPTX");
      return;
    }

    if (data === "test_with_ai_soon") {
      await bot.answerCallbackQuery(query.id, { text: "🤖 AI bilan test tez orada!", show_alert: true });
      return;
    }

    if (data === "back_to_start_menu") {
      await bot.answerCallbackQuery(query.id);
      await bot.editMessageText(
        `👋 <b>Xush kelibsiz!</b>\n\n🤖 Men avtomatlashtirilgan quiz bot.\n\n📝 Quyidagi tugmalardan birini tanlang:`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "HTML",
          reply_markup: getStartMenuKeyboard(),
        },
      );
      return;
    }

    if (data === "help_menu") {
      await bot.answerCallbackQuery(query.id);
      await bot.editMessageText(
        `📚 <b>Bot qo'llanmasi</b>\n\n/start - Botni ishga tushirish\n/newtest - Yangi test\n/stop - To'xtatish\n/mystats - Statistika\n\n<b>Fayl formati:</b>\n<code>Savol\n=====\nJavob 1\n=====\n#To'g'ri javob\n+++++</code>`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: [[{ text: "⬅️ Orqaga", callback_data: "back_to_start_menu" }]] },
        },
      );
      return;
    }

    // ─── GURUH: TAYYOR TUGMASI ────────────────────────────
    // ✅ Bu callback guruh xabaridan keladi → query.message.chat.id = guruh chatId!
    if (data.startsWith("grp_ready_")) {
      const quizId  = data.replace("grp_ready_", "");
      const pending = sessionManager.getPendingGroup(quizId);

      if (!pending) {
        await bot.answerCallbackQuery(query.id, {
          text: "❌ Test topilmadi yoki allaqachon boshlangan.",
          show_alert: true,
        });
        return;
      }

      // Allaqachon tayyor bo'lganmi?
      if (pending.readyPlayers.has(userId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "✅ Siz allaqachon tayyorsiz!",
          show_alert: false,
        });
        return;
      }

      // Tayyor ro'yxatiga qo'shish
      sessionManager.addReadyPlayer(quizId, userId, userName);
      const readyCount = sessionManager.getReadyCount(quizId);

      await bot.answerCallbackQuery(query.id, {
        text: `✅ Tayyor! ${readyCount}/${MIN_READY_PLAYERS}`,
        show_alert: false,
      });

      // Tayyor bo'lganlar nomini ko'rsat
      const readyNames = Array.from(pending.readyPlayers.values())
        .map(n => `@${n}`).join(", ");

      const quiz = await quizStorage.getQuiz(quizId);

      // ── Hali yetarli emas ──
      if (readyCount < MIN_READY_PLAYERS) {
        await bot.editMessageText(
          `🎯 <b>${quiz?.title || "Test"}</b>\n\n` +
          `📝 Savollar: <b>${quiz?.questions?.length || 0} ta</b>\n\n` +
          `✅ Tayyor: ${readyNames}\n` +
          `⏳ Yana ${MIN_READY_PLAYERS - readyCount} kishi kerak...`,
          {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: getGroupReadyKeyboard(quizId, readyCount, MIN_READY_PLAYERS),
          },
        );
        return;
      }

      // ── Yetarli kishi tayyor — countdown boshlash ──
      await bot.editMessageText(
        `🎯 <b>${quiz?.title || "Test"}</b>\n\n` +
        `📝 Savollar: <b>${quiz?.questions?.length || 0} ta</b>\n\n` +
        `✅ Tayyor: ${readyNames}\n\n` +
        `🚀 <b>${START_COUNTDOWN} sekunddan so'ng boshlanadi!</b>`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: [] }, // Tugmalarni olib tashlash
        },
      );

      // Countdown tugasi
      const pending2 = sessionManager.getPendingGroup(quizId);
      pending2.startTimeout = setTimeout(async () => {
        if (!sessionManager.getPendingGroup(quizId)) return;

        const quizData = await quizStorage.getQuiz(quizId);
        if (!quizData) return;

        sessionManager.deletePendingGroup(quizId);

        // Vaqt tanlash xabari
        await bot.sendMessage(
          chatId,
          `⏱ <b>Vaqtni tanlang</b>\n\nHar bir savol uchun necha sekund?`,
          { parse_mode: "HTML", reply_markup: getTimeKeyboard() },
        );

        // Session yaratish
        const session     = sessionManager.createSession(chatId, quizData.questions, null, "group");
        session.quizId    = quizId;

        console.log(`🚀 Guruh test ready: chatId=${chatId}, quizId=${quizId}`);
      }, START_COUNTDOWN * 1000);

      return;
    }

    // ─── GURUH: STATUS (faqat info) ──────────────────────
    if (data.startsWith("grp_status_")) {
      const quizId    = data.replace("grp_status_", "");
      const readyCount = sessionManager.getReadyCount(quizId);
      await bot.answerCallbackQuery(query.id, {
        text: `👥 Tayyor: ${readyCount}/${MIN_READY_PLAYERS}`,
        show_alert: false,
      });
      return;
    }

    // ─── GURUH: TO'XTATISH OVOZI ─────────────────────────
    if (data.startsWith("grp_stop_")) {
      const targetChatId = parseInt(data.replace("grp_stop_", ""));
      const session      = sessionManager.getSession(targetChatId);

      if (!session || !session.isActive) {
        await bot.answerCallbackQuery(query.id, { text: "❌ Test allaqachon tugagan.", show_alert: true });
        return;
      }

      const voteCount = sessionManager.addStopVote(targetChatId, userId);
      await bot.answerCallbackQuery(query.id, {
        text: `⏹ Ovozingiz qabul qilindi (${voteCount}/${MIN_STOP_VOTES})`,
      });

      // Tugmani yangilash
      try {
        await bot.editMessageReplyMarkup(
          getGroupStopKeyboard(targetChatId, voteCount, MIN_STOP_VOTES),
          { chat_id: targetChatId, message_id: query.message.message_id },
        );
      } catch (_) {}

      if (voteCount >= MIN_STOP_VOTES) {
        const savedSession = { ...session };
        sessionManager.endSession(targetChatId);
        await bot.sendMessage(targetChatId, "⏹ Test ovoz bilan to'xtatildi. Natijalar:");
        await showResults(bot, targetChatId, savedSession);
      }
      return;
    }

    // ─── PRIVATE QUIZ BOSHLASH ────────────────────────────
    if (data.startsWith("start_quiz_")) {
      const quizId = data.replace("start_quiz_", "");

      const isSubscribed = await isUserSubscribed(bot, userId, query.message.chat.type);
      if (!isSubscribed) {
        await bot.answerCallbackQuery(query.id, { text: "🔒 Avval kanalga obuna bo'ling!", show_alert: true });
        const { text, keyboard } = getSubscriptionBlockMessage();
        await bot.sendMessage(chatId, text, { parse_mode: "HTML", reply_markup: keyboard });
        return;
      }

      // ✅ await — bu fix muhim!
      const quiz = await quizStorage.getQuiz(quizId);
      if (!quiz) {
        await bot.answerCallbackQuery(query.id, { text: "❌ Test topilmadi.", show_alert: true });
        return;
      }

      await bot.answerCallbackQuery(query.id);
      await bot.deleteMessage(chatId, query.message.message_id);
      await bot.sendMessage(
        chatId,
        `📝 <b>${quiz.questions.length} ta savollik test</b>\n\n⏱ Vaqtni tanlang:`,
        { parse_mode: "HTML", reply_markup: getTimeKeyboard() },
      );

      const session     = sessionManager.createSession(chatId, quiz.questions, null, "private");
      session.quizId    = quizId;
      session.userId    = userId;
      session.userName  = userName;
      return;
    }

    // ─── DAVOM ETASIZMI? ──────────────────────────────────
    if (data === "continue_test_yes") {
      const session = sessionManager.getSession(chatId);
      if (!session || !session.isActive) {
        await bot.answerCallbackQuery(query.id, { text: "❌ Test topilmadi.", show_alert: true });
        return;
      }
      await bot.answerCallbackQuery(query.id, { text: "✅ Davom ettirilmoqda!" });
      await bot.deleteMessage(chatId, query.message.message_id);
      sessionManager.resetUnanswered(chatId);
      sendQuizQuestion(bot, chatId, session);
      return;
    }

    if (data === "continue_test_no") {
      const session = sessionManager.getSession(chatId);
      if (!session) {
        await bot.answerCallbackQuery(query.id, { text: "❌ Test topilmadi.", show_alert: true });
        return;
      }
      await bot.answerCallbackQuery(query.id, { text: "⏹ To'xtatildi!" });
      await bot.deleteMessage(chatId, query.message.message_id);
      sessionManager.endSession(chatId);
      await bot.sendMessage(chatId, "⏹ Test to'xtatildi. Natijalar:");
      await showResults(bot, chatId, session);
      return;
    }

    // ─── VAQT TANLASH ─────────────────────────────────────
    if (data.startsWith("time_")) {
      const isSubscribed = await isUserSubscribed(bot, userId, query.message.chat.type);
      if (!isSubscribed) {
        await bot.answerCallbackQuery(query.id, { text: "🔒 Avval kanalga obuna bo'ling!", show_alert: true });
        const { text, keyboard } = getSubscriptionBlockMessage();
        await bot.sendMessage(chatId, text, { parse_mode: "HTML", reply_markup: keyboard });
        return;
      }

      const timeLimit = parseInt(data.split("_")[1]);
      const session   = sessionManager.getSession(chatId);

      if (!session) {
        await bot.answerCallbackQuery(query.id, { text: "❌ Avval fayl yuboring!", show_alert: true });
        return;
      }

      session.timeLimit      = timeLimit;
      session.startTime      = Date.now();
      session.lastAnswerTime = Date.now();

      await bot.answerCallbackQuery(query.id);
      await bot.deleteMessage(chatId, query.message.message_id);

      // Guruhda "to'xtatish" tugmasi bilan xabar
      const isGroup    = session.chatType !== "private";
      const stopMarkup = isGroup ? getGroupStopKeyboard(chatId, 0, MIN_STOP_VOTES) : null;

      await bot.sendMessage(
        chatId,
        `🚀 <b>Test boshlandi!</b>\n` +
        `⏱ Har bir savol uchun ${timeLimit} sekund.\n\n` +
        `💡 To'xtatish: /stop${isGroup ? " yoki quyidagi tugma" : ""}`,
        {
          parse_mode: "HTML",
          ...(stopMarkup && { reply_markup: stopMarkup }),
        },
      );

      sendQuizQuestion(bot, chatId, session);
    }
  });
}

// === POLL ANSWER HANDLER ===

export function setupPollAnswerHandler(bot) {
  bot.on("poll_answer", async (pollAnswer) => {
    const userId   = pollAnswer.user.id;
    const userName = pollAnswer.user.username || pollAnswer.user.first_name || "User";
    const pollId   = pollAnswer.poll_id;

    // ✅ pollToChatMap orqali chatId topish
    let chatId = sessionManager.getChatIdByPollId(pollId);
    if (!chatId) {
      chatId = userId; // fallback: private
      console.log(`⚠️ Poll ${pollId} uchun chatId topilmadi, fallback=${userId}`);
    }

    const session = sessionManager.getSession(chatId);
    if (!session || !session.isActive) return;

    const isSubscribed = await isUserSubscribed(bot, userId, session.chatType);
    if (!isSubscribed) {
      if (session.chatType === "private") sessionManager.endSession(chatId);
      return;
    }

    if (session.answeredQuestions.has(pollId)) return;

    session.answeredQuestions.add(pollId);
    session.answered = true;
    sessionManager.resetUnanswered(chatId);

    if (session.maxTimeTimeout) {
      clearTimeout(session.maxTimeTimeout);
      session.maxTimeTimeout = null;
    }

    const currentQuestion = session.questions[session.currentIndex];
    if (!currentQuestion) return;

    const isCorrect = pollAnswer.option_ids[0] === session.currentShuffledQuestion.correctIndex;

    if (isCorrect) {
      session.correctAnswers++;
    } else {
      session.wrongAnswers++;
    }

    // Guruh ishtirokchisini yangilash
    if (session.chatType !== "private") {
      const groupSession = sessionManager.groupSessions.get(chatId);
      if (groupSession) {
        const existing = groupSession.participants.get(userId);
        sessionManager.updateGroupParticipant(chatId, userId, userName, {
          correctAnswers: (existing?.correctAnswers || 0) + (isCorrect ? 1 : 0),
          wrongAnswers:   (existing?.wrongAnswers   || 0) + (!isCorrect ? 1 : 0),
          endTime: Date.now(),
        });
      }
    }

    console.log(`📊 Chat ${chatId}: ${session.correctAnswers}✅/${session.wrongAnswers}❌ (${userName})`);

    setTimeout(() => {
      if (sessionManager.hasSession(chatId) && session.isActive) {
        session.currentIndex++;
        session.answered = false;
        sendQuizQuestion(bot, chatId, session);
      }
    }, config.ANSWER_DELAY);
  });
}