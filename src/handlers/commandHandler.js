import sessionManager from "../managers/sessionManager.js";
import { showResults } from "../utils/quizLogic.js";
import {
  isUserSubscribed,
  getSubscriptionBlockMessage,
} from "../utils/subscriptionChecker.js";
import {
  getStartMenuKeyboard,
  getGroupReadyKeyboard,
  getTimeKeyboard,
} from "../keyboards/keyboards.js";
import { saveUser } from "../services/dbService.js";

const MIN_READY_PLAYERS = 2;
const START_COUNTDOWN   = 5; // sekund

export function setupCommandHandlers(bot) {

  // /start
  bot.onText(/\/start(?:@\w+)?\s*(.*)/, async (msg, match) => {
    const args = match[1].trim();
    const userId   = msg.from.id;
    const chatId   = msg.chat.id;
    const chatType = msg.chat.type;


    await saveUser(msg.from);

    // ════════════════════════════════════════════
    // ✅ GURUHDA: /start quiz_QUIZID
    // startgroup URL dan kelgan → chatId bor!
    // ════════════════════════════════════════════
    if (chatType !== "private" && args.startsWith("quiz_")) {
      const quizId     = args.replace("quiz_", "");
      const quizStorage = (await import("../managers/quizStorage.js")).default;
      const quiz        = await quizStorage.getQuiz(quizId);

      if (!quiz) {
        await bot.sendMessage(chatId, "❌ Test topilmadi yoki muddati tugagan.");
        return;
      }

      // Guruhda test allaqachon boryaptiganmi?
      if (sessionManager.hasSession(chatId)) {
        await bot.sendMessage(chatId, "⚠️ Bu guruhda allaqachon test davom etmoqda!\n/stop — Testni to'xtatish");
        return;
      }

      // Guruh uchun pending quiz allaqachon bormi?
      const existing = sessionManager.getPendingGroup(quizId);
      if (existing && existing.chatId === chatId) {
        await bot.sendMessage(chatId, "⏳ Test allaqachon kutmoqda! Tayyor bo'lish uchun tugmani bosing.");
        return;
      }

      // ✅ Ready-up xabarini guruhga yuborish
      const sentMsg = await bot.sendMessage(
        chatId,
        `🎯 <b>${quiz.title || "Test"}</b>\n\n` +
        `📝 Savollar: <b>${quiz.questions.length} ta</b>\n` +
        `👤 Yaratuvchi: @${quiz.creatorName}\n\n` +
        `✋ Ishtirok etish uchun <b>"Tayyor!"</b> tugmasini bosing\n` +
        `(Kamida ${MIN_READY_PLAYERS} kishi kerak)`,
        {
          parse_mode: "HTML",
          reply_markup: getGroupReadyKeyboard(quizId, 0, MIN_READY_PLAYERS),
        },
      );

      // Pending group yaratish (chatId BILAN — chunki guruh kontekstidamiz!)
      sessionManager.createPendingGroup(quizId, chatId, sentMsg.message_id);
      console.log(`⏳ Guruh ready-up: quizId=${quizId}, chatId=${chatId}`);
      return;
    }

    // ════════════════════════════════════════════
    // PRIVATE CHATDA
    // ════════════════════════════════════════════
    if (chatType === "private") {
      // Subscription check
      const isSubscribed = await isUserSubscribed(bot, userId, "private");
      if (!isSubscribed) {
        const { text, keyboard } = getSubscriptionBlockMessage();
        await bot.sendMessage(chatId, text, { parse_mode: "HTML", reply_markup: keyboard });
        return;
      }

      // Deep link: private chatda quiz boshlash
      if (args.startsWith("quiz_")) {
        const quizId     = args.replace("quiz_", "");
        const quizStorage = (await import("../managers/quizStorage.js")).default;
        const quiz        = await quizStorage.getQuiz(quizId);

        if (!quiz) {
          await bot.sendMessage(chatId, "❌ Test topilmadi yoki muddati tugagan.");
          return;
        }

        await bot.sendMessage(
          chatId,
          `📝 <b>${quiz.questions.length} ta savollik test</b>\n\n` +
          `👤 Yaratuvchi: @${quiz.creatorName}\n\n` +
          `⏱ Vaqtni tanlang:`,
          { parse_mode: "HTML", reply_markup: getTimeKeyboard() },
        );

        const session     = sessionManager.createSession(chatId, quiz.questions, null, "private");
        session.quizId    = quizId;
        session.userId    = userId;
        session.userName  = msg.from.username || msg.from.first_name || "User";
        return;
      }

      // Oddiy /start — bosh menyu
      await bot.sendMessage(
        chatId,
        `👋 <b>Xush kelibsiz!</b>\n\n` +
        `🤖 Men avtomatlashtirilgan quiz bot.\n` +
        `Fayldan savollar yuklab, test o'tkazishingiz mumkin.\n\n` +
        `📝 Quyidagi tugmalardan birini tanlang:`,
        { parse_mode: "HTML", reply_markup: getStartMenuKeyboard() },
      );
    }
  });

  // /newtest
  bot.onText(/\/newtest/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    await saveUser(msg.from);

    const isSubscribed = await isUserSubscribed(bot, userId, msg.chat.type);
    if (!isSubscribed) {
      const { text, keyboard } = getSubscriptionBlockMessage();
      await bot.sendMessage(chatId, text, { parse_mode: "HTML", reply_markup: keyboard });
      return;
    }

    if (sessionManager.hasSession(chatId)) sessionManager.endSession(chatId);

    await bot.sendMessage(chatId, "🆕 Yangi test uchun fayl yuboring.\n\n📁 Formatlar: TXT, PDF, DOCX, PPTX");
  });

  // /stop
  bot.onText(/\/stop/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const isSubscribed = await isUserSubscribed(bot, userId, msg.chat.type);
    if (!isSubscribed) {
      const { text, keyboard } = getSubscriptionBlockMessage();
      await bot.sendMessage(chatId, text, { parse_mode: "HTML", reply_markup: keyboard });
      return;
    }

    if (!sessionManager.hasSession(chatId)) {
      await bot.sendMessage(chatId, "❌ Hech qanday test boshlanmagan.\n/newtest — Yangi test");
      return;
    }

    const session = sessionManager.getSession(chatId);
    sessionManager.endSession(chatId);
    await bot.sendMessage(chatId, "⏹ Test to'xtatildi. Natijalar:");
    await showResults(bot, chatId, session);
  });

  // /help
  bot.onText(/\/help/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      `📚 <b>Bot qo'llanmasi</b>\n\n` +
      `<b>Buyruqlar:</b>\n` +
      `/start - Botni ishga tushirish\n` +
      `/newtest - Yangi test boshlash\n` +
      `/stop - Testni to'xtatish\n` +
      `/mystats - Statistikangiz\n\n` +
      `<b>Fayl formati:</b>\n` +
      `<code>Savol\n=====\nJavob 1\n=====\n#To'g'ri javob\n=====\nJavob 3\n+++++</code>`,
      { parse_mode: "HTML" },
    );
  });

  // /mystats
  bot.onText(/\/mystats/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const { getUserStats } = await import("../services/dbService.js");
    const user = await getUserStats(userId);

    if (!user) {
      await bot.sendMessage(chatId, "❌ Statistika topilmadi. Avval /start yuboring.");
      return;
    }

    const total    = user.totalCorrect + user.totalWrong;
    const accuracy = total > 0 ? Math.round((user.totalCorrect / total) * 100) : 0;

    await bot.sendMessage(
      chatId,
      `📊 <b>Sizning statistikangiz</b>\n\n` +
      `👤 ${user.username ? `@${user.username}` : user.firstName}\n` +
      `📝 Yaratilgan testlar: <b>${user.totalTests}</b>\n` +
      `🎯 Topshirilgan quizlar: <b>${user.totalQuizzes}</b>\n` +
      `✅ To'g'ri javoblar: <b>${user.totalCorrect}</b>\n` +
      `❌ Noto'g'ri javoblar: <b>${user.totalWrong}</b>\n` +
      `🎖 Aniqlik: <b>${accuracy}%</b>`,
      { parse_mode: "HTML" },
    );
  });
}