// === SESSION MANAGER ===

class SessionManager {
  constructor() {
    this.sessions = new Map();        // chatId -> session
    this.groupSessions = new Map();   // chatId -> { participants, readyPlayers, stopVotes }
    this.pollToChatMap = new Map();   // pollId -> chatId
    this.pendingGroups = new Map();   // quizId -> { chatId, messageId, readyPlayers: Set }
  }

  // ─── PRIVATE/GROUP SESSION ───────────────────────

  createSession(chatId, questions, timeLimit, chatType = "private") {
    const session = {
      chatId,
      chatType,
      questions,
      currentIndex: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      timeLimit,
      startTime: Date.now(),
      answeredQuestions: new Set(),
      answered: false,
      maxTimeTimeout: null,
      currentShuffledQuestion: null,
      currentPollId: null,
      // ✅ FIX: Har poll uchun to'g'ri javob indeksini saqlaymiz
      // Sabab: birinchi user javob berganda currentShuffledQuestion yangi savolga o'tadi
      // Ikkinchi user eski pollga javob berganda isCorrect noto'g'ri chiqardi
      pollCorrectMap: new Map(),      // pollId -> correctIndex
      questionStartTime: null,
      isActive: true,
      unansweredCount: 0,
      lastAnswerTime: Date.now(),
      inactivityWarningShown: false,
      quizId: null,
      userId: null,
      userName: null,
    };

    this.sessions.set(chatId, session);

    if (chatType !== "private") {
      this.groupSessions.set(chatId, {
        participants: new Map(),
        stopVotes: new Set(),
      });
    }

    return session;
  }

  // ─── GURUH KUTISH XONASI ─────────────────────────

  createPendingGroup(quizId, chatId, messageId) {
    this.pendingGroups.set(quizId, {
      chatId,
      messageId,
      readyPlayers: new Map(), // userId -> userName
      startTimeout: null,
    });
    console.log(`⏳ Guruh kutish yaratildi: quiz=${quizId}, chat=${chatId}`);
  }

  addReadyPlayer(quizId, userId, userName) {
    const pending = this.pendingGroups.get(quizId);
    if (!pending) return null;
    pending.readyPlayers.set(userId, userName);
    return pending;
  }

  getReadyCount(quizId) {
    const pending = this.pendingGroups.get(quizId);
    return pending ? pending.readyPlayers.size : 0;
  }

  getPendingGroup(quizId) {
    return this.pendingGroups.get(quizId);
  }

  deletePendingGroup(quizId) {
    const pending = this.pendingGroups.get(quizId);
    if (pending?.startTimeout) clearTimeout(pending.startTimeout);
    this.pendingGroups.delete(quizId);
  }

  // ─── TO'XTATISH OVOZI ────────────────────────────

  addStopVote(chatId, userId) {
    const group = this.groupSessions.get(chatId);
    if (!group) return 0;
    group.stopVotes.add(userId);
    return group.stopVotes.size;
  }

  getStopVotes(chatId) {
    const group = this.groupSessions.get(chatId);
    return group ? group.stopVotes.size : 0;
  }

  clearStopVotes(chatId) {
    const group = this.groupSessions.get(chatId);
    if (group) group.stopVotes.clear();
  }

  // ─── GURUH ISHTIROKCHILARI ───────────────────────

  updateGroupParticipant(chatId, userId, userName, data = {}) {
    if (!this.groupSessions.has(chatId)) return;
    const groupSession = this.groupSessions.get(chatId);

    if (!groupSession.participants.has(userId)) {
      groupSession.participants.set(userId, {
        userId,
        userName,
        correctAnswers: 0,
        wrongAnswers: 0,
        startTime: Date.now(),
        endTime: null,
      });
    }

    const participant = groupSession.participants.get(userId);
    Object.assign(participant, data);
  }

  getGroupResults(chatId) {
    const groupSession = this.groupSessions.get(chatId);
    if (!groupSession) return [];

    return Array.from(groupSession.participants.values())
      .map((p) => ({
        ...p,
        score: p.correctAnswers,
        duration: p.endTime ? Math.floor((p.endTime - p.startTime) / 1000) : 0,
      }))
      .sort((a, b) => b.score !== a.score ? b.score - a.score : a.duration - b.duration);
  }

  // ─── POLL MAPPING ────────────────────────────────

  registerPoll(pollId, chatId) {
    this.pollToChatMap.set(pollId, chatId);
  }

  getChatIdByPollId(pollId) {
    return this.pollToChatMap.get(pollId);
  }

  // ─── ASOSIY SESSION ──────────────────────────────

  getSession(chatId)    { return this.sessions.get(chatId); }
  hasSession(chatId)    { return this.sessions.has(chatId); }

  incrementUnanswered(chatId) {
    const session = this.getSession(chatId);
    if (session) {
      session.unansweredCount++;
      console.log(`⚠️ Chat ${chatId}: Javobsiz - ${session.unansweredCount}`);
    }
  }

  resetUnanswered(chatId) {
    const session = this.getSession(chatId);
    if (session) {
      session.unansweredCount = 0;
      session.lastAnswerTime = Date.now();
      session.inactivityWarningShown = false;
    }
  }

  endSession(chatId) {
    const session = this.sessions.get(chatId);
    if (session) {
      if (session.maxTimeTimeout) {
        clearTimeout(session.maxTimeTimeout);
        session.maxTimeTimeout = null;
      }
      session.isActive = false;
      session.answered = true;
    }

    for (const [pollId, id] of this.pollToChatMap.entries()) {
      if (id === chatId) this.pollToChatMap.delete(pollId);
    }

    this.sessions.delete(chatId);
    this.groupSessions.delete(chatId);
  }

  updateSession(chatId, updates) {
    const session = this.sessions.get(chatId);
    if (session) Object.assign(session, updates);
  }

  clearAllSessions() {
    const chatIds = Array.from(this.sessions.keys());
    for (const chatId of chatIds) this.endSession(chatId);
  }

  getAllSessions() {
    return this.sessions.entries();
  }
}

export default new SessionManager();