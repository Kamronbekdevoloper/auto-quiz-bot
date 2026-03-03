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

// ✅ Fayl yuborilgandan keyin ko'rsatiladigan keyboard
export function getQuizShareKeyboard(quizId, botUsername) {
  return {
    inline_keyboard: [
      // 1. Shu yerda (private) boshlash
      [
        {
          text: "▶️ Shu yerda boshlash",
          callback_data: `start_quiz_${quizId}`,
        },
      ],
      // 2. Guruhga yuborish — chat picker ochiladi, guruh tanlanadi,
      //    bot inline query javob beradi, card guruhga yuboriladi
      [
        {
          text: "👥 Guruhga yuborish",
          switch_inline_query_chosen_chat: {
            query: quizId,
            allow_user_chats: false,
            allow_bot_chats: false,
            allow_group_chats: true,
            allow_channel_posts: false,
          },
        },
      ],
    ],
  };
}

// ✅ Guruhda ready-up keyboard (callback_data ishlaydi chunki guruh kontekstida!)
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