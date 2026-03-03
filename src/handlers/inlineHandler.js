import quizStorage from "../managers/quizStorage.js";
import { isUserSubscribed } from "../utils/subscriptionChecker.js";

// === INLINE QUERY HANDLER ===
// Guruhga quiz card yuborish uchun

export function setupInlineQueryHandler(bot) {
  bot.on("inline_query", async (query) => {
    try {
      const userId = query.from.id;
      const quizId = query.query.trim();

      console.log(`🔍 Inline query: userId=${userId}, quizId="${quizId}"`);

      // Subscription check
      const isSubscribed = await isUserSubscribed(bot, userId, "private");
      if (!isSubscribed) {
        await bot.answerInlineQuery(query.id, [], {
          cache_time: 0,
          switch_pm_text: "⚠️ Avval kanalga obuna bo'ling",
          switch_pm_parameter: "subscribe",
        });
        return;
      }

      // quizId bo'sh bo'lsa — yo'riqnoma ko'rsat
      if (!quizId) {
        await bot.answerInlineQuery(query.id, [], {
          cache_time: 0,
          switch_pm_text: "📝 Avval test yarating",
          switch_pm_parameter: "create",
        });
        return;
      }

      // Quizni topish
      const quiz = await quizStorage.getQuiz(quizId);
      if (!quiz) {
        await bot.answerInlineQuery(query.id, [], {
          cache_time: 0,
          switch_pm_text: "❌ Test topilmadi",
          switch_pm_parameter: "create",
        });
        console.log(`⚠️ Inline: Quiz topilmadi - ${quizId}`);
        return;
      }

      // Bot username olish
      const botInfo = await bot.getMe();
      const botUsername = botInfo.username;

      // startgroup URL — guruhda /start quiz_QUIZID yuboradi
      const startGroupUrl = `https://t.me/${botUsername}?startgroup=quiz_${quizId}`;

      // Quiz card yaratish
      const results = [
        {
          type: "article",
          id: quizId,
          title: `📝 ${quiz.title || "Test"} — ${quiz.questions.length} ta savol`,
          description: `Guruhda boshlash uchun ushbu kartani yuboring`,
          thumbnail_url: "https://telegram.org/img/t_logo.png",
          input_message_content: {
            message_text:
              `🎯 <b>${quiz.title || "Test"}</b>\n\n` +
              `📝 Savollar soni: <b>${quiz.questions.length}</b>\n` +
              `👤 Yaratuvchi: @${quiz.creatorName}\n\n` +
              `👇 Guruhda testni boshlash uchun quyidagi tugmani bosing:`,
            parse_mode: "HTML",
          },
          reply_markup: {
            inline_keyboard: [
              [
                {
                  // ✅ startgroup — guruhda /start quiz_QUIZID yuboradi
                  text: "▶️ Guruhda boshlash",
                  url: startGroupUrl,
                },
              ],
            ],
          },
        },
      ];

      await bot.answerInlineQuery(query.id, results, {
        cache_time: 30,
      });

      console.log(`✅ Inline quiz card yuborildi: ${quizId}`);
    } catch (error) {
      console.error(`❌ Inline query xatosi: ${error.message}`);
      try {
        await bot.answerInlineQuery(query.id, [], { cache_time: 0 });
      } catch (_) {}
    }
  });
}