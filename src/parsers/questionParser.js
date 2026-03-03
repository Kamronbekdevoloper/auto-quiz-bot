import { config } from "../config.js";

// === QUESTION PARSER ===

export function parseQuestions(text) {
  const questions = [];
  const questionBlocks = text.split(/\+{3,}/).filter((block) => block.trim());

  console.log(`\n📚 Jami ${questionBlocks.length} ta blok topildi\n`);

  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i].trim();

    if (!block) continue;

    console.log(`\n🔍 Blok #${i + 1} tekshirilmoqda...`);

    const parts = block
      .split(/={3,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (parts.length < 3) {
      console.log(`❌ Blok #${i + 1}: Kam qismlar (${parts.length})`);
      continue;
    }

    const question = parts[0];
    console.log(`✓ Savol: "${question.substring(0, 70)}..."`);

    const answerOptions = parts.slice(1);
    console.log(`✓ ${answerOptions.length} ta javob topildi`);

    if (answerOptions.length < config.MIN_ANSWERS) {
      console.log(`❌ Blok #${i + 1}: Kam javoblar`);
      continue;
    }

    if (answerOptions.length > config.MAX_ANSWERS) {
      console.log(
        `⚠️ Blok #${i + 1}: ${config.MAX_ANSWERS} tadan ko'p variant, qisqartiraman`,
      );
      answerOptions.splice(config.MAX_ANSWERS);
    }

    let correctIndex = -1;
    const cleanAnswers = answerOptions.map((ans, idx) => {
      const trimmed = ans.trim();
      if (trimmed.startsWith("#")) {
        correctIndex = idx;
        const cleaned = trimmed.substring(1).trim();
        console.log(
          `✓ To'g'ri javob #${idx + 1}: "${cleaned.substring(0, 50)}..."`,
        );
        return cleaned.length > config.MAX_ANSWER_LENGTH
          ? cleaned.substring(0, config.MAX_ANSWER_LENGTH - 3) + "..."
          : cleaned;
      }
      return trimmed.length > config.MAX_ANSWER_LENGTH
        ? trimmed.substring(0, config.MAX_ANSWER_LENGTH - 3) + "..."
        : trimmed;
    });

    if (correctIndex === -1) {
      console.log(`❌ Blok #${i + 1}: To'g'ri javob topilmadi (#)`);
      continue;
    }

    const cleanedQuestion =
      question.length > config.MAX_QUESTION_LENGTH
        ? question.substring(0, config.MAX_QUESTION_LENGTH - 3) + "..."
        : question;

    questions.push({
      question: cleanedQuestion,
      options: cleanAnswers,
      correctIndex,
    });

    console.log(`✅ SAVOL #${questions.length} QO'SHILDI!`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🎯 JAMI ${questions.length} TA SAVOL TAYYOR`);
  console.log(`${"=".repeat(60)}\n`);

  return questions;
}

// JAVOBLARNI ARALASHTIRISH
export function shuffleAnswers(question) {
  const indices = Array.from({ length: question.options.length }, (_, i) => i);

  // Fisher-Yates shuffle algoritmi
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const shuffledOptions = indices.map((i) => question.options[i]);
  const newCorrectIndex = indices.indexOf(question.correctIndex);

  return {
    question: question.question,
    options: shuffledOptions,
    correctIndex: newCorrectIndex,
    originalCorrectIndex: question.correctIndex,
  };
}
