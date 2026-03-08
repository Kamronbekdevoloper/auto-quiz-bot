// === KEYBOARDS ===

export function getStartMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "📝 Test Yaratish", callback_data: "create_test" }],
      [{ text: "🏆 Titul Yaratish (Tez kunda)", callback_data: "create_titul_soon" }],
      [{ text: "📚 Yordam", callback_data: "help_menu" }],
    ],
  };
}

export function getTestCreationTypeKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "📁 Fayl bilan", callback_data: "test_from_file" }],
      [{ text: "🤖 AI bilan (Tez kunda)", callback_data: "test_with_ai_soon" }],
      [{ text: "⬅️ Orqaga", callback_data: "back_to_start_menu" }],
    ],
  };
}

export function getTimeKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "⏱ 10 sekund", callback_data: "time_10" },
        { text: "⏱ 15 sekund", callback_data: "time_15" },
      ],
      [
        { text: "⏱ 20 sekund", callback_data: "time_20" },
        { text: "⏱ 25 sekund", callback_data: "time_25" },
      ],
      [{ text: "⏱ 30 sekund", callback_data: "time_30" }],
    ],
  };
}

export function getContinueTestKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✅ Ha, davom etish", callback_data: "continue_test_yes" },
        { text: "❌ Yo'q, to'xtatish", callback_data: "continue_test_no" },
      ],
    ],
  };
}

// ✅ FIX: switch_inline_query_chosen_chat O'RNIGA to'g'ridan-to'g'ri startgroup URL
// OLDIN: private → "Guruhga yuborish" (switch_inline_query → 1-picker)
//          → guruhga inline card → "Guruhda boshlash" (startgroup → 2-picker) 🔄 LOOP
// ENDI:  private → "Guruhga yuborish" (startgroup → 1-picker)
//          → /start quiz_ID guruhga → Ready-up xabar ✅
export function getQuizShareKeyboard(quizId, botUsername) {
  return {
    inline_keyboard: [
      [
        {
          text: "▶️ Shu yerda boshlash",
          callback_data: `start_quiz_${quizId}`,
        },
      ],
      [
        {
          // ✅ FIX: Endi bitta group picker — to'g'ridan-to'g'ri /start yuboriladi
          text: "👥 Guruhga yuborish",
          url: `https://t.me/${botUsername}?startgroup=quiz_${quizId}`,
        },
      ],
    ],
  };
}

// ✅ Guruhda ready-up keyboard
export function getGroupReadyKeyboard(quizId, readyCount, minPlayers = 2) {
  const needed = Math.max(0, minPlayers - readyCount);
  return {
    inline_keyboard: [
      [
        {
          text: `🙋 Tayyor! (${readyCount}/${minPlayers})`,
          callback_data: `grp_ready_${quizId}`,
        },
      ],
      [
        {
          text: needed > 0 ? `⏳ Yana ${needed} kishi kerak` : `✅ Barcha tayyor!`,
          callback_data: `grp_status_${quizId}`,
        },
      ],
    ],
  };
}

// ✅ Guruhda to'xtatish tugmasi
export function getGroupStopKeyboard(chatId, voteCount = 0, minVotes = 2) {
  return {
    inline_keyboard: [
      [
        {
          text: `⏹ To'xtatish (${voteCount}/${minVotes})`,
          callback_data: `grp_stop_${chatId}`,
        },
      ],
    ],
  };
}