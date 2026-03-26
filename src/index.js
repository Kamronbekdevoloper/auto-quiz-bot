import TelegramBot from "node-telegram-bot-api";
import { config } from "./config.js";
import { connectDB } from "./config/database.js";
import sessionManager from "./managers/sessionManager.js";
import quizStorage from "./managers/quizStorage.js";
import { debugChannelConfig } from "./utils/subscriptionChecker.js";
import { setupCommandHandlers } from "./handlers/commandHandler.js";
import { setupFileHandler } from "./handlers/fileHandler.js";
import { setupCallbackHandler, setupPollAnswerHandler } from "./handlers/callBackHandler.js";
import { setupInlineQueryHandler } from "./handlers/inlineHandler.js";

// === BOT INITIALIZATION ===
const bot = new TelegramBot(config.BOT_TOKEN, {
  polling: {
    allowedUpdates: [
      "message",
      "callback_query",
      "inline_query",
      "poll_answer",   // ← shu bo'lmasa guruh poll javoblari kelmaydi!
      "poll",
      "chosen_inline_result",
    ],
  },
});
console.log("✅ Bot ishga tushdi!");

// ✅ MongoDB ulanish
await connectDB();

// Debug
debugChannelConfig();

// Handlers
setupCommandHandlers(bot);
setupFileHandler(bot);
setupCallbackHandler(bot);
setupPollAnswerHandler(bot);
setupInlineQueryHandler(bot);

// RAM tozalash (har 1 soat)
setInterval(() => {
  quizStorage.cleanOldQuizzes();
}, 60 * 60 * 1000);

// Error handling
bot.on("polling_error", (error) => {
  console.error("❌ Polling error:", error.message);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n📴 Bot o'chirilmoqda...");
  sessionManager.clearAllSessions();
  bot.stopPolling();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n📴 Bot o'chirilmoqda...");
  sessionManager.clearAllSessions();
  bot.stopPolling();
  process.exit(0);
});