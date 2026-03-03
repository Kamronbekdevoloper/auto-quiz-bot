import sessionManager from "../managers/sessionManager.js";
import quizStorage from "../managers/quizStorage.js";
import {
  isValidFileFormat,
  downloadFile,
  parseFileBuffer,
} from "../parsers/fileParser.js";
import { parseQuestions } from "../parsers/questionParser.js";
import { getQuizShareKeyboard } from "../keyboards/keyboards.js";
import { config } from "../config.js";
import {
  isUserSubscribed,
  getSubscriptionBlockMessage,
} from "../utils/subscriptionChecker.js";

// === FILE HANDLER ===

export function setupFileHandler(bot) {
  bot.on("document", async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const chatType = msg.chat.type; // "private", "group", "supergroup"
    const fileId = msg.document.file_id;
    const fileName = msg.document.file_name;

    console.log(
      `📄 Chat ${chatId} (${chatType}): File qabul qilindi - ${fileName}`,
    );

    // ✅ SUBSCRIPTION CHECK
    const isSubscribed = await isUserSubscribed(bot, userId, chatType);
    if (!isSubscribed) {
      const { text, keyboard } = getSubscriptionBlockMessage();
      await bot.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
      return;
    }

    // Format tekshirish
    if (!isValidFileFormat(fileName)) {
      await bot.sendMessage(
        chatId,
        `❌ Qo'llab-quvvatlanmagan format!\n\n✅ Qabul qilinadigan formatlar:\n${config.VALID_FILE_EXTENSIONS.join(", ")}`,
      );
      return;
    }

    const loadingMsg = await bot.sendMessage(chatId, "⏳ File o'qilmoqda...");

    try {
      const fileUrl = await bot.getFileLink(fileId);
      const buffer = await downloadFile(fileUrl);

      if (!buffer || buffer.length === 0) {
        await bot.editMessageText("❌ Fayl bo'sh yoki yuklab olib bo'lmadi.", {
          chat_id: chatId,
          message_id: loadingMsg.message_id,
        });
        return;
      }

      const text = await parseFileBuffer(buffer, fileName);

      if (!text || text.trim().length === 0) {
        await bot.editMessageText("❌ Faylda matn topilmadi.", {
          chat_id: chatId,
          message_id: loadingMsg.message_id,
        });
        return;
      }

      console.log(`\n📄 File: ${fileName}`);
      console.log(`📏 Uzunligi: ${text.length} belgi`);

      const questions = parseQuestions(text);

      if (questions.length === 0) {
        await bot.editMessageText(
          "❌ Faylda savollar topilmadi.\n\nFormat:\n- Savol\n- =====\n- Javoblar (===== bilan ajratilgan)\n- To'g'ri javob # bilan\n- +++++",
          {
            chat_id: chatId,
            message_id: loadingMsg.message_id,
          },
        );
        return;
      }

      await bot.deleteMessage(chatId, loadingMsg.message_id);

      // ✅ QUIZNI SAQLASH
      const userName = msg.from.username || msg.from.first_name || "User";
      const quizId = await quizStorage.saveQuiz(
        questions,
        userId,
        userName,
        fileName,
      );

      // ✅ BOT USERNAME olish
      const botInfo = await bot.getMe();
      const botUsername = botInfo.username;

      // ✅ QUIZ ULASHISH TUGMALARINI KO'RSATISH
      await bot.sendMessage(
        chatId,
        `✅ <b>${questions.length} ta savol topildi!</b>

📝 Test tayyor. Qayerda boshlaysiz?`,
        {
          parse_mode: "HTML",
          reply_markup: getQuizShareKeyboard(quizId, botUsername),
        },
      );

      console.log(
        `✅ Chat ${chatId}: Quiz yaratildi - ID: ${quizId} (${questions.length} ta savol)`,
      );
    } catch (err) {
      console.error("File error:", err);
      await bot.editMessageText("❌ Faylni o'qishda xatolik.", {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
      });
    }
  });
}
