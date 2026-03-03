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
│   │   └── database.js               # MongoDB ulanish
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
│   │   ├── User.js                   # MongoDB User modeli
│   │   ├── Quiz.js                   # MongoDB Quiz modeli
│   │   └── Result.js                 # MongoDB Result modeli
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
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/quizbot?retryWrites=true&w=majority
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
  └─ "Test Yaratish" → "Fayl bilan"
       └─ Fayl yuborish → Savollar ajratiladi → Quiz saqlandi
            ├─ "Shu yerda boshlash" → Vaqt tanlash → Quiz boshlanadi
            └─ "Guruhga yuborish" → Chat picker → Guruhga card yuboriladi
```

### Guruh:
```
Inline card → "Guruhda boshlash" (startgroup URL)
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

## 🗄️ MongoDB Modellari

### User
```js
{
  telegramId, username, firstName, lastName, languageCode,
  totalTests,    // Yaratilgan testlar soni
  totalQuizzes,  // Topshirilgan quizlar soni
  totalCorrect,  // Jami to'g'ri javoblar
  totalWrong,    // Jami noto'g'ri javoblar
  isSubscribed, lastActive, createdAt, updatedAt
}
```

### Quiz
```js
{
  quizId,        // 8 belgili random ID
  creatorId, creatorName, title,
  questions: [{ question, options: [], correctIndex }],
  totalPlays,
  expiresAt      // 24 soatdan keyin avtomatik o'chadi (TTL index)
}
```

### Result
```js
{
  userId, userName, quizId, chatId,
  chatType,       // "private" | "group" | "supergroup"
  totalQuestions, correctAnswers, wrongAnswers,
  missedAnswers, percentage, durationSeconds,
  createdAt
}
```

---

## 🔑 Muhim Arxitektura Qarorlari

### 1. quizStorage — Ikki qavat (RAM + DB)
```
Quiz yaratilganda → RAM ga ham, MongoDB ga ham saqlanadi
Quiz olinganda   → Avval RAM dan qidiradi (tez)
                 → Topilmasa DB dan oladi (bot restart holati)
```

### 2. pollToChatMap — Guruh uchun muhim
```
poll_answer eventida Telegram chat_id BERMAYDI!
Yechim: Poll yuborilganda → pollId: chatId saqlanadi (sessionManager)
poll_answer kelganda → pollId orqali chatId topiladi
```

### 3. Kanal Subscription
```
- Faqat private chatda tekshiriladi
- Guruhda tekshirilmaydi (Telegram API cheklovi)
- Bot kanalda ADMIN bo'lishi shart!
- Bot admin emas bo'lsa → userlar bloklanmaydi (config xatosi)
```

### 4. Guruh Quiz — switch_inline_query_chosen_chat
```
switch_inline_query_chosen_chat → faqat guruh chatlarni ko'rsatadi
→ Guruh tanlanadi → inline query yuboriladi
→ Bot inline card yuboradi → card ichida startgroup URL
→ startgroup → /start quiz_ID GURUHGA yuboriladi → chatId bor!
```

---

## ✅ Tuzatilgan Buglar

| # | Muammo | Yechim | Fayl |
|---|--------|--------|------|
| 1 | Bot admin emas → obuna bo'lgan user bloklanadi | Xato turi tekshiriladi, config xatosida `true` qaytariladi | `subscriptionChecker.js` |
| 2 | `poll_answer` da guruh `chatId` topilmaydi | `pollToChatMap`: pollId→chatId saqlash | `sessionManager.js`, `quizLogic.js` |
| 3 | `clearAllSessions` xavfli loop | `Array.from(keys())` nusxa olish | `sessionManager.js` |
| 4 | `quizStorage.getQuiz()` oldida `await` yo'q | Barcha chaqiruvlarga `await` qo'shildi | `callBackHandler.js`, `inlineHandler.js`, `commandHandler.js` |
| 5 | Guruh quiz private chatda ochilardi | `switch_inline_query_chosen_chat` + startgroup URL | `keyboards.js`, `inlineHandler.js` |
| 6 | Bot guruhga qo'shilmaydi | BotFather → Group Privacy → Disable | BotFather sozlama |

---

## ❌ Hali Tuzatilmagan / Tekshirilmagan Muammolar

### 1. Guruh Quiz oqimi — To'liq test qilinmagan
- `switch_inline_query_chosen_chat` → `startgroup` oqimi real guruhda sinovdan o'tmagan
- Ready-up → countdown → quiz boshlanishi tekshirilmagan
- Poll answer guruhda to'g'ri `chatId` topilishi tekshirilmagan

### 2. Inline query cache
- `cache_time: 30` — quiz o'chirilsa ham eski card ko'rinishi mumkin
- Yechim: `cache_time: 0` (lekin Telegram rate limit qo'yishi mumkin)

### 3. MongoDB TTL — Test qilinmagan
- Quiz 24 soatdan keyin avtomatik o'chishi kerak
- Atlas da TTL index ishlayotgani hali tekshirilmagan

### 4. Race condition — Bir guruhda 2 ta pending quiz
- `pendingGroups` da bir guruhda ikki quiz bo'lsa nima bo'ladi?
- `hasSession` tekshiruvi bor lekin `pendingGroups` uchun yo'q

### 5. /stop guruhda
- Guruhda `/stop` 1 kishi bosishi bilan ishlaydi
- Kerak: min 2 kishi ovoz berishi (tugma: `grp_stop_` callback)
- Hali real testda tekshirilmagan

### 6. fileHandler.js — await tekshiruvi
- `quizStorage.saveQuiz()` oldida `await` bormi? — tekshirilmagan

---

## 🔧 BotFather Sozlamalari

| Sozlama | Holati |
|---------|--------|
| Group Privacy | ✅ DISABLED |
| Inline Mode | ✅ ENABLED |
| Bot kanalda Admin | ✅ Bo'lishi shart |

---

## 🚀 Kelajak Rejalar (TODO)

- [ ] AI bilan test yaratish (OpenAI/Gemini — kalitlar .env da bor)
- [ ] Titul tizimi (user ranglari, badgelar)
- [ ] Admin panel
- [ ] Quiz kategoriyalari
- [ ] Rasm/media support
- [ ] Excel (.xlsx) support
- [ ] OCR (skanerlangan PDF uchun)
- [ ] Rate limiting

---

## 🆕 Claude Uchun Ko'rsatma

Ushbu faylni ko'rgan Claude quyidagilarni qilsin:

**1. Muammo turiga qarab kerakli fayllarni so'ra:**

| Muammo | So'rash kerak bo'lgan fayllar |
|--------|-------------------------------|
| Guruh quiz | `callBackHandler.js`, `inlineHandler.js`, `sessionManager.js` |
| Subscription | `subscriptionChecker.js` |
| Fayl parsing | `fileParser.js`, `questionParser.js` |
| Database | `dbService.js`, `database.js`, modellar |
| Natija/leaderboard | `quizLogic.js` |
| Keyboard/tugma | `keyboards.js` |
| Umumiy | `index.js`, `config.js` |

**2. Har doim tekshir:**
- `quizStorage.getQuiz()` va `saveQuiz()` oldida `await` bormi?
- `poll_answer` da `pollToChatMap` ishlatilayaptimi?
- `getTimeKeyboard` session yaratilgandan KEYIN ko'rsatilayaptimi?
- `index.js` da `await connectDB()` chaqirilayaptimi?

**3. Kod uslubi:**
- ES Modules (`import/export`) — `require()` ishlatilmaydi
- Async/await — callback emas
- Har bir handler try/catch bilan o'ralgan bo'lishi kerak

---

*Oxirgi yangilanish: 2026 yil mart*