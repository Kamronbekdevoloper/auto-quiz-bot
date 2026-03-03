# 📄 QOLLAB-QUVVATLANADIGAN FAYL FORMATLARI

✅ SUPPORTED FORMATS:

1. 📝 TXT (.txt)
   - Oddiy text fayllar
   - UTF-8 encoding
   - Unlimited size (recommended: < 500KB)

2. 📕 PDF (.pdf)
   - PDF documents
   - Scanning qilingan PDF
   - Scan quality: high
   - Max size: 100MB

3. 📘 DOCX (.docx)
   - Microsoft Word (2007+)
   - Modern format
   - Embedding images/tables: text olinadi
   - Max size: 50MB

4. 📗 DOC (.doc)
   - Microsoft Word (97-2003)
   - Legacy format
   - Supported via mammoth
   - Max size: 50MB

5. 📊 PPTX (.pptx)
   - Microsoft PowerPoint (2007+)
   - Extract text from slides
   - Animations/videos: ignored
   - Max size: 50MB

# 🔧 INSTALLATION:

npm install
npm install pptxparse

Barcha kutubxonalar allaqachon package.json'da!

# 📝 FILE FORMAT (QUIZ SAVOLLARI):

Har bir fayl format uchun savollar shunday bo'lishi kerak:

# Birinchi savol?

# Javob A

# #To'g'ri javob B

Javob C
+++

# Ikkinchi savol?

# #Correct answer 1

Wrong answer 2
+++

⚙️ PARSING DETAILS:

.txt -> Direct text reading
.pdf -> pdf-parse library
.doc -> mammoth library
.docx -> mammoth library
.pptx -> pptxparse library (+ fallback XML parsing)

⚠️ TROUBLESHOOTING:

Problem: "❌ Faylni o'qishda xatolik"

Solution:

1. Fayl formati qo'llashtirilgani tekshiring
2. Fayl size'i tekshiring (max 100MB)
3. Fayl korrupted bo'lmasligi tekshiring
4. PDF scanned bo'lsa OCR qilamiz
5. Encoding UTF-8 bo'lsa yaxshi

Example test fayllar:

- test.txt (oddiy text)
- test.pdf (regular PDF)
- test.docx (Word document)
- test.doc (Old Word)
- test.pptx (PowerPoint)

📊 SIZE LIMITS:

| Format | Max Size  | Parsing Speed    |
| ------ | --------- | ---------------- |
| TXT    | Unlimited | Instant          |
| PDF    | 100MB     | Slow (large PDF) |
| DOCX   | 50MB      | Fast             |
| DOC    | 50MB      | Fast             |
| PPTX   | 50MB      | Medium           |

🎯 RECOMMENDED:

Best: .txt, .docx, .pptx
Good: .pdf, .doc
Avoid: Large scanned PDF, corrupted files

✨ TIPS:

1. DOCX/DOC -> TXT ga convert qiling:
   - Microsoft Word'da "Save As" -> Plain Text
   - More reliable parsing

2. PDF optimize qiling:
   - Scanned PDF -> OCR process
   - Large PDF -> split qiling

3. PPTX optimize qiling:
   - Slide notes -> text olinadi
   - Text shapes -> automatically extracted

4. All formats:
   - UTF-8 encoding (recommended)
   - Simple formatting (no complex styles)
   - ASCII characters (Uzbek Latin recommended)

📞 SUPPORT:

Muammo bo'lsa:

1. Console logs ko'ring
2. Fayl format tekshiring
3. Fayl size tekshiring
4. Encoding tekshiring
5. Bot restart qiling

Hamma format supported! 🎉
