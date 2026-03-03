# 🤖 Quiz Bot v2.0 (Node.js + Telegram)

Professional Telegram quiz bot o'zbekcha savollarni PDF/DOCX/TXT/PPTX formatlardan o'qib quiz tartibi bilan o'tkaziladigan bot.

| Buyruq     | Tavsif                                      |
| ---------- | ------------------------------------------- |
| `/start`   | Botni ishga tushirish va menuni ko'rsatish  |
| `/newtest` | Yangi test boshlash (eski test tugatiladi)  |
| `/stop`    | Testni to'xtatish va natijalarni ko'rsatish |
| `/help`    | Yordam va format haqida ma'lumot            |

## 📖 Fayl Format

Quiz savollari quyidagi format bilan tayyorlangan bo'lishi kerak:

```
Birinchi savol?
=====
Javob 1
=====
#To'g'ri javob (# bilan boshlanish MUHIM!)
=====
Javob 3
+++++

Ikkinchi savol?
=====
#To'g'ri javob
=====
Javob 2
=====
Javob 3
+++++
```

**Muhim belgilar:**

- `=====` - Savolni javobrdan ajratish (3+ ta `=`)
- `#` - To'g'ri javobni belgilash
- `+++++` - Har bir savol blokunning oxiri (3+ ta `+`)

## 📝 License

MIT