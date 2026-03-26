import sessionManager from "../managers/sessionManager.js";
import quizStorage from "../managers/quizStorage.js";
import { sendQuizQuestion, showResults, snapshotSession } from "../utils/quizLogic.js";
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
const START_COUNTDOWN = 5;

export function setupCallbackHandler(bot) {
  bot.on("callback_query", async (query) => {
    const userId   = query.from.id;
    const userName = query.from.username || query.from.first_name || "User";
    const chatId   = query.message?.chat?.id;
    const data     = query.data;

    if (data === "check_subscription") {
      const isSubscribed = await isUserSubscribed(bot, userId, query.message?.chat?.type || "private");
      if (!isSubscribed) {
        await bot.answerCallbackQuery(query.id, { text: "❌ Hali obuna qilmagansiz!", show_alert: true });
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
    if (data.startsWith("grp_ready_")) {
      const quizId  = data.replace("grp_ready_", "");
      const pending = sessionManager.getPendingGroup(quizId);

      if (!pending) {
        await bot.answerCallbackQuery(query.id, { text: "❌ Test topilmadi yoki allaqachon boshlangan.", show_alert: true });
        return;
      }

      if (pending.readyPlayers.has(userId)) {
        await bot.answerCallbackQuery(query.id, { text: "✅ Siz allaqachon tayyorsiz!", show_alert: false });
        return;
      }

      sessionManager.addReadyPlayer(quizId, userId, userName);
      const readyCount = sessionManager.getReadyCount(quizId);

      await bot.answerCallbackQuery(query.id, { text: `✅ Tayyor! ${readyCount}/${MIN_READY_PLAYERS}`, show_alert: false });

      const readyNames = Array.from(pending.readyPlayers.values()).map(n => `@${n}`).join(", ");
      const quiz = await quizStorage.getQuiz(quizId);

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

      await bot.editMessageText(
        `🎯 <b>${quiz?.title || "Test"}</b>\n\n` +
        `📝 Savollar: <b>${quiz?.questions?.length || 0} ta</b>\n\n` +
        `✅ Tayyor: ${readyNames}\n\n` +
        `🚀 <b>${START_COUNTDOWN} sekunddan so'ng boshlanadi!</b>`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: [] },
        },
      );

      const pending2 = sessionManager.getPendingGroup(quizId);
      pending2.startTimeout = setTimeout(async () => {
        if (!sessionManager.getPendingGroup(quizId)) return;

        const quizData = await quizStorage.getQuiz(quizId);
        if (!quizData) return;

        sessionManager.deletePendingGroup(quizId);

        await bot.sendMessage(
          chatId,
          `⏱ <b>Vaqtni tanlang</b>\n\nHar bir savol uchun necha sekund?`,
          { parse_mode: "HTML", reply_markup: getTimeKeyboard() },
        );

        const session = sessionManager.createSession(chatId, quizData.questions, null, "group");
        session.quizId = quizId;

        console.log(`🚀 Guruh test ready: chatId=${chatId}, quizId=${quizId}`);
      }, START_COUNTDOWN * 1000);

      return;
    }

    if (data.startsWith("grp_status_")) {
      const quizId = data.replace("grp_status_", "");
      const readyCount = sessionManager.getReadyCount(quizId);
      await bot.answerCallbackQuery(query.id, { text: `👥 Tayyor: ${readyCount}/${MIN_READY_PLAYERS}`, show_alert: false });
      return;
    }

    if (data.startsWith("grp_stop_")) {
      const targetChatId = parseInt(data.replace("grp_stop_", ""));
      const session      = sessionManager.getSession(targetChatId);

      if (!session || !session.isActive) {
        await bot.answerCallbackQuery(query.id, { text: "❌ Test allaqachon tugagan.", show_alert: true });
        return;
      }

      const voteCount = sessionManager.addStopVote(targetChatId, userId);
      await bot.answerCallbackQuery(query.id, { text: `⏹ Ovozingiz qabul qilindi (${voteCount}/${MIN_STOP_VOTES})` });

      try {
        await bot.editMessageReplyMarkup(
          getGroupStopKeyboard(targetChatId, voteCount, MIN_STOP_VOTES),
          { chat_id: targetChatId, message_id: query.message.message_id },
        );
      } catch (_) {}

      if (voteCount >= MIN_STOP_VOTES) {
        // ✅ FIX: snapshotSession KEYIN endSession — groupResults bo'sh kelmasligi uchun
        const savedSession = snapshotSession(targetChatId, session);
        sessionManager.endSession(targetChatId);
        await bot.sendMessage(targetChatId, "⏹ Test ovoz bilan to'xtatildi. Natijalar:");
        await showResults(bot, targetChatId, savedSession);
      }
      return;
    }

    if (data.startsWith("start_quiz_")) {
      const quizId = data.replace("start_quiz_", "");

      const isSubscribed = await isUserSubscribed(bot, userId, query.message.chat.type);
      if (!isSubscribed) {
        await bot.answerCallbackQuery(query.id, { text: "🔒 Avval kanalga obuna bo'ling!", show_alert: true });
        const { text, keyboard } = getSubscriptionBlockMessage();
        await bot.sendMessage(chatId, text, { parse_mode: "HTML", reply_markup: keyboard });
        return;
      }

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

      const session = sessionManager.createSession(chatId, quiz.questions, null, "private");
      session.quizId = quizId;
      session.userId = userId;
      session.userName = userName;
      return;
    }

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
      const savedSession = snapshotSession(chatId, session);
      sessionManager.endSession(chatId);
      await bot.sendMessage(chatId, "⏹ Test to'xtatildi. Natijalar:");
      await showResults(bot, chatId, savedSession);
      return;
    }

    if (data.startsWith("time_")) {
      const timeLimit = parseInt(data.split("_")[1]);
      const session   = sessionManager.getSession(chatId);

      if (!session) {
        await bot.answerCallbackQuery(query.id, { text: "❌ Avval fayl yuboring!", show_alert: true });
        return;
      }

      // ✅ FIX: Guruhda bir nechta kishi time_ tugmasini bossa, faqat bir marta ishlaydi
      // session.timeLimit allaqachon o'rnatilgan bo'lsa — ikkinchi bosilish e'tiborga olinmaydi
      if (session.timeLimit !== null && session.timeLimit !== undefined) {
        await bot.answerCallbackQuery(query.id, { text: "⏱ Test allaqachon boshlangan!", show_alert: false });
        return;
      }

      // Subscription faqat private chatda tekshiriladi (subscriptionChecker.js da ham bor)
      const isSubscribed = await isUserSubscribed(bot, userId, query.message.chat.type);
      if (!isSubscribed) {
        await bot.answerCallbackQuery(query.id, { text: "🔒 Avval kanalga obuna bo'ling!", show_alert: true });
        const { text, keyboard } = getSubscriptionBlockMessage();
        await bot.sendMessage(chatId, text, { parse_mode: "HTML", reply_markup: keyboard });
        return;
      }

      session.timeLimit      = timeLimit;
      session.startTime      = Date.now();
      session.lastAnswerTime = Date.now();

      await bot.answerCallbackQuery(query.id);
      await bot.deleteMessage(chatId, query.message.message_id);

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
    const userId = pollAnswer.user.id;

    // ✅ FIX Bug 2: GroupAnonymousBot (@Channel_Bot, ID: 1087968824) ni filtrlaymiz
    // Guruh kanalga ulangan bo'lsa, Telegram shu botni avtomatik yaratadi
    // Bu bot real userlar o'rniga poll_answer yuborib, haqiqiy javoblarni bloklaydi
    if (userId === 1087968824) {
      console.log(`🚫 GroupAnonymousBot (Channel_Bot) javobi o'tkazib yuborildi`);
      return;
    }

    // ✅ FIX Bug 1: username bo'lsa "@username", bo'lmasa faqat "firstName" (@ belgisisiz)
    const userName = pollAnswer.user.username
      ? `@${pollAnswer.user.username}`
      : (pollAnswer.user.first_name || "User");
    const pollId = pollAnswer.poll_id;

    // pollToChatMap orqali chatId topish
    let chatId = sessionManager.getChatIdByPollId(pollId);
    if (!chatId) {
      chatId = userId; // fallback: private
      console.log(`⚠️ Poll ${pollId} uchun chatId topilmadi, fallback=${userId}`);
    }

    const session = sessionManager.getSession(chatId);
    if (!session || !session.isActive) return;

    // Subscription tekshiruvi — guruhda shart emas (subscriptionChecker.js da return true)
    const isSubscribed = await isUserSubscribed(bot, userId, session.chatType);
    if (!isSubscribed) {
      if (session.chatType === "private") sessionManager.endSession(chatId);
      return;
    }

    const isGroup = session.chatType !== "private";

    // Guruhda: har user har poll uchun bitta javob (pollId_userId)
    // Private: faqat bitta javob (pollId)
    const dedupKey = isGroup ? `${pollId}_${userId}` : pollId;
    if (session.answeredQuestions.has(dedupKey)) return;
    session.answeredQuestions.add(dedupKey);

    // ✅ FIX: isCorrect ni pollCorrectMap dan olamiz
    // OLDIN: session.currentShuffledQuestion?.correctIndex
    //   → birinchi user javob berganda currentShuffledQuestion yangi savolga o'zgaradi
    //   → ikkinchi user eski pollga javob berganda NOTO'G'RI correctIndex ishlatilardi
    // ENDI: pollId bo'yicha saqlab qo'yilgan correctIndex ishlatiladi
    const correctIndex = session.pollCorrectMap?.get(pollId);
    const isCorrect = correctIndex !== undefined
      ? pollAnswer.option_ids[0] === correctIndex
      : false;

    // Guruh ishtirokchisi scorini yangilash
    if (isGroup) {
      const groupSession = sessionManager.groupSessions.get(chatId);
      if (groupSession) {
        const existing = groupSession.participants.get(userId) || {
          correctAnswers: 0,
          wrongAnswers: 0,
        };
        sessionManager.updateGroupParticipant(chatId, userId, userName, {
          correctAnswers: existing.correctAnswers + (isCorrect ? 1 : 0),
          wrongAnswers: existing.wrongAnswers + (!isCorrect ? 1 : 0),
          endTime: Date.now(),
        });
      }
    }

    // Savolni faqat BIR MARTA oldinga siljitish
    // Guruhda birinchi javob bergan kishi savolni almashtiradi
    const advanceKey = `advance_${pollId}`;
    if (session.answeredQuestions.has(advanceKey)) {
      console.log(`📊 Guruh score yangilandi: ${userId} (${userName}) — ${isCorrect ? "✅" : "❌"}`);
      return;
    }
    session.answeredQuestions.add(advanceKey);

    // Quyidagi kod faqat BIR MARTA (birinchi javob uchun) ishlaydi

    session.answered = true;
    sessionManager.resetUnanswered(chatId);

    if (session.maxTimeTimeout) {
      clearTimeout(session.maxTimeTimeout);
      session.maxTimeTimeout = null;
    }

    // Private uchun session-level counter
    if (!isGroup) {
      if (isCorrect) {
        session.correctAnswers++;
      } else {
        session.wrongAnswers++;
      }
    }

    console.log(`📊 Chat ${chatId}: savol oldinga siljitilyapti (${userName} — ${isCorrect ? "✅" : "❌"})`);

    setTimeout(() => {
      if (sessionManager.hasSession(chatId) && session.isActive) {
        session.currentIndex++;
        session.answered = false;
        sendQuizQuestion(bot, chatId, session);
      }
    }, config.ANSWER_DELAY);
  });
}