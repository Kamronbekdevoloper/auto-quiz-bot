import dotenv from "dotenv";
dotenv.config();

export const config = {
  BOT_TOKEN: process.env.BOT_TOKEN,

  // Kanal
  CHANNEL_ID: process.env.CHANNEL_ID || null,
  CHANNEL_LINK: process.env.CHANNEL_LINK || null,

  // ✅ MongoDB
  MONGO_URI: process.env.MONGO_URI || null,

  POLLING_TIMEOUT: 30,
  VALID_FILE_EXTENSIONS: [".txt", ".pdf", ".docx", ".doc", ".pptx"],
  MAX_QUESTION_LENGTH: 300,
  MAX_ANSWER_LENGTH: 100,
  MAX_ANSWERS: 10,
  MIN_ANSWERS: 2,
  ANSWER_DELAY: 2000,
  MIN_TIME_LIMIT: 10,
  MAX_TIME_LIMIT: 30,
  MAX_UNANSWERED_QUESTIONS: 3,
  INACTIVITY_CHECK_INTERVAL: 5000,
};