# 📖 INSTALLATION & SETUP GUIDE

# STEP 1: DEPENDENCIES O'RNATISH

```bash
cd quiz-bot
npm install
```

Package'lar:

- node-telegram-bot-api (Telegram bot API)
- axios (HTTP requests)
- mammoth (DOCX & DOC parsing)
- pdf-parse (PDF parsing)
- pptxparse (PowerPoint parsing) ← YANGI!
- dotenv (Environment variables)
- nodemon (dev) (Auto-reload)

# STEP 2: .ENV FAYLINI TAYYORLASH

.env file yaratish yoki tahrirarlash:

```
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE
```

## TOKEN QANDAY OLISH?

1. Telegram'da @BotFather ga yozing
2. /newbot buyrug'ini yuboring
3. Bot nomi va username kiriting
4. Token olyapsiz (ko'ch qo'ying .env ga)

# STEP 3: BOTNI ISHGA TUSHIRISH

## PRODUCTION:

```bash
npm start
```

## DEVELOPMENT (AUTO-RELOAD):

```bash
npm run dev
```

Terminal'da ko'rishi kerak:

```
✅ Bot ishga tushdi!
```

# STEP 4: TESTING

1. BotFather'dan yaratilgan botni oching
2. Quiz savollari bilan TXT/PDF/DOCX fayl tayyorlash

## FAYL FORMAT:

```
Birinchi savol?
===
Javob A
===
#Javob B (to'g'ri)
===
Javob C
+++

Ikkinchi savol?
===
#To'g'ri javob
===
Noto'g'ri javob
+++
```

## SUPPORT QILINGAN FORMATLAR:

✅ .txt - Oddiy text
✅ .pdf - PDF documents  
✅ .docx - Microsoft Word (2007+)
✅ .doc - Microsoft Word (97-2003)
✅ .pptx - PowerPoint slides

3. Botga fayl yuboring
4. Vaqt tanlang (10-30 sekund)
5. Test boshlaydi
6. /stop test to'xtaydi

✅ HECHO TAYYORI!

# TROUBLESHOOTING

❌ "Bot token not found"
-> .env faylida BOT_TOKEN yo'q
-> Fix: .env ga token qo'shing

❌ "Cannot find module..."
-> Dependencies o'rnatilmagan
-> Fix: npm install

❌ "File parsing error"
-> Fayl format noto'g'ri
-> Fix: README.md'da format ko'ring

❌ "/stop ishlamaydi"
-> Yangi versiyada fixed ✅
-> SessionManager ishlayapti

❌ "Poll timeout"
-> Telegramga ulanish muammosi
-> Fix: Internet tekshiring

# FOLDER STRUCTURE

quiz-bot/
├── src/
│ ├── index.js (Bot entry point)
│ ├── config.js (Settings)
│ ├── managers/
│ │ └── sessionManager.js (Session control)
│ ├── parsers/
│ │ ├── fileParser.js (TXT/PDF/DOCX)
│ │ └── questionParser.js (Question parsing)
│ ├── handlers/
│ │ ├── commandHandlers.js (/start, /stop, /newtest)
│ │ ├── fileHandler.js (File upload)
│ │ └── callbackHandler.js (Buttons & polls)
│ ├── keyboards/
│ │ └── keyboards.js (UI keyboards)
│ └── utils/
│ └── quizLogic.js (Quiz logic)
├── package.json
├── .env
└── README.md

# LOGS KONTROL QILISH

Bot console'da barcha operatsiyalarni ko'rsatadi:

```
✅ Bot ishga tushdi!
📄 Chat 12345: File qabul qilindi - test.pdf
📏 Uzunligi: 5000 belgi
📚 Jami 10 ta blok topildi
✓ Savol: "Birinchi savol..."
✓ 4 ta javob topildi
✅ SAVOL #1 QO'SHILDI!
⏱️ Chat 12345: Vaqt tanlandi - 20 sekund per savol
🚀 Test boshlandi!
📤 Savol 1/10 yuborildi
✅ To'g'ri! Savol #1
📊 Chat 12345 Natija: 1✅ / 0❌
⏹️ Chat 12345: /stop buyrug'i ishga tushdi
⏹ Test to'xtatildi. Natijalar:
```

# PERFORMANCE TIPS

1. Katta fayllar (500+ KB) bir xil parse qiladi
2. 1000+ savol bo'lsa session memory ko'payadi
3. 1000+ foydalanuvchi concurrent bo'lsa serverga yuk ko'payadi
4. PDF parsing PDF-parse kutubxonasiga bog'liq

# SECURITY NOTES

1. .env faylida SECRET ma'lumotlar bo'ladi
   -> .gitignore-ga qo'shilgan ✅

2. Bot token leak qilmang
   -> BotFather'da /revoke token bilan o'zgartiring

3. User data saqlashmayiniz
   -> Barcha ma'lumot RAM'da, bot stop'da o'chiriladi

4. Rate limiting yo'q (yangi feature)
   -> Telegramning o'z rate limits bor

# YANGI FEATURES QOSISH

Yangi feature qo'shmoqchi bo'lsangiz:

1. Handler yaratish:
   src/handlers/myFeature.js

2. Config'ga parameter qo'shish:
   src/config.js

3. index.js'ga qo'shish:
   setupMyFeature(bot);

4. Test qilish va commit qilish

# SUPPORT & DEBUGGING

1. Logs ko'rish:
   - npm run dev (nodemon yordamida)
   - Terminal'da console.log() messages

2. Bot testing:
   - Telegram @BotFather
   - Test fayllar yaratish

3. Error reporting:
   - try-catch blocks o'qish
   - console.error() ko'rish

✅ TAYYORMANSIZ!
