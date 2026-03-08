# CLAUDE.md — Quiz Bot Project Documentation

> Bu fayl AI assistant uchun yozilgan. Ushbu faylni ko'rgan Claude darhol
> loyihaga tushunib olishi va kerakli fayllarni so'rashi kerak.

---

## 🤖 Loyiha Haqida

**Nomi:** Sessiya Quiz Bot  
**Platform:** Telegram  
**Til:** Node.js (ES Modules)  
**Bot username:** @sessiya_quiztest_bot  
**Telegram kanal:** @socidevs  

**Maqsad:** Foydalanuvchi fayl yuboradi (TXT/PDF/DOCX/DOC/PPTX) →
Bot faylni o'qib savollarni ajratadi → Quiz (poll) formatida test o'tkazadi →
Natijalarni chiqaradi. Ham yakka (private), ham guruhda ishlaydi.

---

## 📁 Loyiha Strukturasi

```
quiz-bot/
├── src/
│   ├── index.js                      # Entry point
│   ├── config.js                     # Konfiguratsiya
│   ├── config/
│   │   └── database.js               # DB ulanish (MongoDB yoki SQLite)
│   ├── managers/
│   │   ├── sessionManager.js         # Session boshqaruvi
│   │   └── quizStorage.js            # Quiz saqlash (RAM + DB)
│   ├── handlers/
│   │   ├── commandHandler.js         # /start /stop /newtest /help /mystats
│   │   ├── fileHandler.js            # Fayl qabul qilish
│   │   ├── callBackHandler.js        # Tugmalar + poll_answer
│   │   └── inlineHandler.js          # Inline query (guruhga yuborish)
│   ├── keyboards/
│   │   └── keyboards.js              # Barcha inline keyboardlar
│   ├── models/
│   │   ├── User.js                   # User modeli
│   │   ├── Quiz.js                   # Quiz modeli
│   │   └── Result.js                 # Result modeli
│   ├── services/
│   │   └── dbService.js              # Barcha DB operatsiyalari
│   ├── parsers/
│   │   ├── fileParser.js             # Fayl o'qish (PDF/DOCX/PPTX/TXT)
│   │   └── questionParser.js         # Savollarni ajratish + shuffle
│   └── utils/
│       ├── quizLogic.js              # Quiz yuborish + natijalar
│       └── subscriptionChecker.js    # Kanal obuna tekshiruvi
├── .env
├── .env.example
├── package.json
└── CLAUDE.md
```

---

## ⚙️ .env Konfiguratsiya

```env
BOT_TOKEN=telegram_bot_token
CHANNEL_ID=@socidevs
CHANNEL_LINK=https://t.me/socidevs

# MongoDB (agar ishlatilsa)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/quizbot?retryWrites=true&w=majority

# SQLite (agar MongoDB o'rniga ishlatilsa)
DB_PATH=./data/quizbot.db

# AI (Gemini bepul tier tavsiya etiladi)
GEMINI_API_KEY=your_gemini_api_key
```

---

## 📦 Dependencies

```json
{
  "node-telegram-bot-api": "^0.64.0",
  "mongoose": "latest",
  "dotenv": "^16.3.1",
  "mammoth": "^1.6.0",
  "pdf-parse": "^1.1.1",
  "pptxparse": "^0.1.2",
  "axios": "^1.6.0",
  "nodemon": "dev"
}
```

`package.json` da: `"type": "module"` (ES Modules ishlatiladi)

---

## 🎯 Bot Ishlash Oqimi

### Private Chat:
```
/start → Kanal obuna tekshiruv → Bosh menyu
  └─ "Test Yaratish" → "Fayl bilan" | "AI bilan"
       └─ Fayl yuborish → Savollar ajratiladi → Quiz saqlandi
            ├─ "Shu yerda boshlash" → Vaqt tanlash → Quiz boshlanadi
            └─ "Guruhga yuborish" → startgroup URL → Chat picker
                 └─ /start quiz_ID guruhga → Ready-up
```

### Guruh:
```
"Guruhga yuborish" (url: startgroup) → group picker → guruh tanlanadi
  └─ /start quiz_QUIZID guruhga yuboriladi
       └─ Ready-up xabar: "Tayyor!" tugmasi
            └─ 2 kishi bosdi → 5s countdown
                 └─ Vaqt tanlash → Quiz boshlanadi
                      └─ Test tugagach → Leaderboard
```

---

## 📖 Fayl Formati (Quiz savollari)

```
Savol matni?
=====
Javob A
=====
#To'g'ri javob B   ← # bilan belgilanadi
=====
Javob C
+++++

Keyingi savol?
=====
#To'g'ri javob
=====
Noto'g'ri javob
+++++
```

**Belgilar:**
- `=====` — Savolni javoblardan ajratish (3+ ta `=`)
- `#` — To'g'ri javob belgisi
- `+++++` — Savol bloki oxiri (3+ ta `+`)

---

## 🗄️ Database

### ⚠️ MongoDB muammosi
MongoDB Atlas ba'zan ulanmayapti (network/auth xatolari).  
**Tavsiya:** MongoDB o'rniga **SQLite** ishlatish — serverga o'rnatish shart emas,
fayl sifatida saqlanadi, hech qanday cloud kerak emas.

### SQLite o'tish rejasi
```
npm install better-sqlite3
```
```
database.js  → SQLite ulanish
dbService.js → SQL so'rovlar (mongoose o'rniga)
models/      → Schema emas, CREATE TABLE SQL
```

### Modellar (hozir MongoDB, kelajakda SQLite)

**User**
```js
{ telegramId, username, firstName, lastName, languageCode,
  totalTests, totalQuizzes, totalCorrect, totalWrong,
  isSubscribed, lastActive, createdAt, updatedAt }
```

**Quiz**
```js
{ quizId, creatorId, creatorName, title,
  questions: [{ question, options: [], correctIndex }],
  totalPlays, expiresAt }  // 24 soat TTL
```

**Result**
```js
{ userId, userName, quizId, chatId, chatType,
  totalQuestions, correctAnswers, wrongAnswers,
  missedAnswers, percentage, durationSeconds, createdAt }
```

**Titul** *(yangi — kelajakda)*
```js
{ userId, title, badge, earnedAt, condition }
// condition: { minCorrect, minAccuracy, minQuizzes }
```

---

## 🔑 Muhim Arxitektura Qarorlari

### 1. quizStorage — Ikki qavat (RAM + DB)
```
Quiz yaratilganda → RAM ga ham, DB ga ham saqlanadi
Quiz olinganda   → Avval RAM dan qidiradi (tez)
                 → Topilmasa DB dan oladi (bot restart holati)
```

### 2. pollToChatMap — Guruh uchun muhim
```
poll_answer eventida Telegram chat_id BERMAYDI!
Yechim: Poll yuborilganda → pollId: chatId saqlanadi (sessionManager)
poll_answer kelganda → pollId orqali chatId topiladi
```

### 3. Guruh per-user tracking
```
OLDIN: answeredQuestions.has(pollId) → 2-user bloklanardi ❌
ENDI:  dedupKey = `${pollId}_${userId}` → har user o'z javobini beradi ✅
       advanceKey = `advance_${pollId}` → savol faqat 1 marta oldinga siljiydi ✅
```

### 4. Session snapshot + endSession
```
OLDIN: showResults keyin endSession → groupSessions o'chib, results = [] ❌
ENDI:  snapshotSession() → endSession() → showResults(snapshot) ✅
```

### 5. Guruh Quiz oqimi (tuzatilgan)
```
OLDIN: switch_inline_query_chosen_chat → 2 ta group picker (loop) ❌
ENDI:  url: startgroup → 1 ta group picker ✅
       /start@bot quiz_ID → regex (?:@\w+)?\s* → args to'g'ri ajratiladi ✅
```

### 6. Kanal Subscription
```
- Faqat private chatda tekshiriladi
- Guruhda tekshirilmaydi (Telegram API cheklovi)
- Bot kanalda ADMIN bo'lishi shart!
```

---

## ✅ Tuzatilgan Buglar

| # | Muammo | Yechim | Fayl |
|---|--------|--------|------|
| 1 | Bot admin emas → obuna bo'lgan user bloklanadi | Xato turi tekshiriladi, config xatosida `true` qaytariladi | `subscriptionChecker.js` |
| 2 | `poll_answer` da guruh `chatId` topilmaydi | `pollToChatMap`: pollId→chatId saqlash | `sessionManager.js`, `quizLogic.js` |
| 3 | `clearAllSessions` xavfli loop | `Array.from(keys())` nusxa olish | `sessionManager.js` |
| 4 | `quizStorage.getQuiz()` oldida `await` yo'q | Barcha chaqiruvlarga `await` qo'shildi | `callBackHandler.js`, `inlineHandler.js`, `commandHandler.js` |
| 5 | Guruh quiz loop (2 ta group picker) | `switch_inline_query` → `url: startgroup` | `keyboards.js` |
| 6 | `/start@bot quiz_ID` regex xatosi | `(?:@\w+)?\s*` — bot username o'tkazib yuboriladi | `commandHandler.js` |
| 7 | Guruhda 2-user poll_answer bloklanardi | `dedupKey = pollId_userId` per-user tracking | `callBackHandler.js` |
| 8 | `showResults` da groupResults bo'sh kelardi | `snapshotSession()` → endSession → showResults | `quizLogic.js` |
| 9 | Session endSession qilinmasdi | `snapshotSession` + `endSession` oldin | `quizLogic.js` |

---

## ❌ Hali Tuzatilmagan / Tekshirilmagan Muammolar

### 1. Guruh poll natijasi — Tekshirilmagan
- Guruhda har user score to'g'ri saqlanayaptimi? (per-user fix qilindi, lekin real test yo'q)
- Leaderboard to'g'ri chiqayaptimi?

### 2. MongoDB ulanish xatosi
- Atlas ba'zan ulanmayapti
- **Yechim:** SQLite ga o'tish (rejada)

### 3. MongoDB TTL — Test qilinmagan
- Quiz 24 soatdan keyin avtomatik o'chishi kerak
- Atlas da TTL index ishlayotgani tekshirilmagan

### 4. Race condition — Bir guruhda 2 ta pending quiz
- `pendingGroups` da bir guruhda ikki quiz bo'lsa nima bo'ladi?
- `hasSession` tekshiruvi bor lekin `pendingGroups` uchun yo'q

### 5. /stop guruhda
- Guruhda `/stop` 1 kishi bosishi bilan ishlaydi
- Kerak: min 2 kishi ovoz berishi (tugma: `grp_stop_` callback)

### 6. fileHandler.js — await tekshiruvi
- `quizStorage.saveQuiz()` oldida `await` bormi? — tekshirilmagan

### 7. Inline query cache
- `cache_time: 0` qo'yildi — Telegram rate limit bosishi mumkin

---

## 🔧 BotFather Sozlamalari

| Sozlama | Holati |
|---------|--------|
| Group Privacy | ✅ DISABLED |
| Inline Mode | ✅ ENABLED |
| Bot kanalda Admin | ✅ Bo'lishi shart |

---

## 🚀 Kelajak Rejalar (TODO)

### 🤖 1. AI bilan test yaratish
**Tavsiya: Google Gemini API (bepul tier — oyiga 1500 so'rov)**

```
Oqim:
Foydalanuvchi matn/tema yozadi → Gemini API → savollar generate qilinadi
→ questionParser kabi format → quizStorage.saveQuiz() → oddiy quiz oqimi davom etadi
```

```js
// .env
GEMINI_API_KEY=your_key

// aiService.js (yangi fayl)
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateQuizFromText(text, questionCount = 10) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Quyidagi matndan ${questionCount} ta test savoli yarat.
    Har bir savolda 4 ta javob bo'lsin, 1 tasi to'g'ri.
    JSON formatida qайтар:
    [{ "question": "...", "options": ["A","B","C","D"], "correctIndex": 0 }]
    Faqat JSON, boshqa hech narsa yozma.
    
    Matn: ${text}
  `;

  const result = await model.generateContent(prompt);
  const json = result.response.text().replace(/```json|```/g, "").trim();
  return JSON.parse(json);
}
```

```
npm install @google/generative-ai
```

**UI o'zgarishi:** `getTestCreationTypeKeyboard()` da "AI bilan" tugmasi → faol bo'ladi

---

### 🏆 2. Titul tizimi

**Konsepsiya:**
```
Foydalanuvchi quiz topshiradi → natija DB ga saqlanadi
→ titulChecker.js ishga tushadi → shartlarni tekshiradi
→ Yangi titul topilsa → userga xabar yuboriladi + DB ga yoziladi
```

**Titul shartlari (misol):**
```js
const TITLES = [
  { id: "first_quiz",   badge: "🎯", name: "Boshlang'ich",  condition: { minQuizzes: 1 } },
  { id: "quiz_10",      badge: "📚", name: "O'quvchi",      condition: { minQuizzes: 10 } },
  { id: "perfect_100",  badge: "💯", name: "Mukammal",      condition: { minAccuracy: 100, minQuizzes: 1 } },
  { id: "accuracy_90",  badge: "🎖", name: "Aniq",          condition: { minAccuracy: 90, minQuizzes: 5 } },
  { id: "correct_500",  badge: "🏆", name: "Ustoz",         condition: { minCorrect: 500 } },
  { id: "creator_10",   badge: "✍️", name: "Test yaratuvchi", condition: { minTests: 10 } },
];
```

**Yangi fayllar kerak:**
```
src/utils/titulChecker.js   # Titul shartlarini tekshirish
src/models/Titul.js         # DB modeli
```

**Qachon tekshiriladi:**
```js
// quizLogic.js → showResults oxirida
await checkAndAwardTituls(bot, userId, chatId);
```

---

### 🗄️ 3. MongoDB → SQLite ko'chirish

**Sabab:** MongoDB Atlas tez-tez ulanmayapti, cloud dependency yo'q qilish kerak.

**SQLite afzalliklari:**
- Serverga o'rnatish shart emas — fayl sifatida ishlaydi (`./data/quizbot.db`)
- Bepul, cheksiz
- `better-sqlite3` — sinxron API, async/await shart emas
- Yengil va tez

**O'tish rejasi:**
```
1. npm install better-sqlite3
2. database.js → SQLite ulanish + CREATE TABLE lar
3. dbService.js → mongoose → SQL so'rovlar
4. models/ → schema emas, faqat type definitions (JSDoc)
5. quizStorage.js → isDBConnected() → isSQLiteReady()
```

**Asosiy jadvallar:**
```sql
CREATE TABLE users (
  telegram_id INTEGER PRIMARY KEY,
  username TEXT, first_name TEXT, last_name TEXT,
  total_tests INTEGER DEFAULT 0,
  total_quizzes INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_wrong INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quizzes (
  quiz_id TEXT PRIMARY KEY,
  creator_id INTEGER, creator_name TEXT, title TEXT,
  questions TEXT,  -- JSON string
  total_plays INTEGER DEFAULT 0,
  expires_at DATETIME
);

CREATE TABLE results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, user_name TEXT, quiz_id TEXT,
  chat_id INTEGER, chat_type TEXT,
  total_questions INTEGER, correct_answers INTEGER,
  wrong_answers INTEGER, percentage REAL,
  duration_seconds INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tituls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, titul_id TEXT, badge TEXT,
  name TEXT, earned_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🆕 Claude Uchun Ko'rsatma

**1. Muammo turiga qarab kerakli fayllarni so'ra:**

| Muammo | So'rash kerak bo'lgan fayllar |
|--------|-------------------------------|
| Guruh quiz | `callBackHandler.js`, `inlineHandler.js`, `sessionManager.js` |
| Subscription | `subscriptionChecker.js` |
| Fayl parsing | `fileParser.js`, `questionParser.js` |
| Database | `dbService.js`, `database.js`, modellar |
| Natija/leaderboard | `quizLogic.js` |
| Keyboard/tugma | `keyboards.js` |
| AI feature | `aiService.js`, `fileHandler.js`, `callBackHandler.js` |
| Titul | `titulChecker.js`, `quizLogic.js`, `dbService.js` |
| Umumiy | `index.js`, `config.js` |

**2. Har doim tekshir:**
- `quizStorage.getQuiz()` va `saveQuiz()` oldida `await` bormi?
- `poll_answer` da `pollToChatMap` ishlatilayaptimi?
- `snapshotSession()` → `endSession()` → `showResults()` tartibimi?
- Guruhda `dedupKey = pollId_userId` ishlatilayaptimi?
- `index.js` da `await connectDB()` chaqirilayaptimi?

**3. Kod uslubi:**
- ES Modules (`import/export`) — `require()` ishlatilmaydi
- Async/await — callback emas
- Har bir handler try/catch bilan o'ralgan bo'lishi kerak

---

*Oxirgi yangilanish: 2026 yil 8-mart*