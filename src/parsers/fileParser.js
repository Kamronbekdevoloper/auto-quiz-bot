import { config } from "../config.js";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

// === FILE PARSER ===

// Format tekshirish
export function isValidFileFormat(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  return config.VALID_FILE_EXTENSIONS.includes(ext);
}

// Faylni yuklab olish (Native fetch - Node.js 18+)
export async function downloadFile(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
}

// Buffer'dan matn olish
export async function parseFileBuffer(buffer, fileName) {
  const ext = path.extname(fileName).toLowerCase();

  try {
    switch (ext) {
      case ".txt":
        return buffer.toString("utf-8");

      case ".pdf":
        const pdfData = await pdfParse(buffer);
        return pdfData.text;

      case ".docx":
      case ".doc":
        const docxResult = await mammoth.extractRawText({ buffer });
        return docxResult.value;

      case ".pptx":
        // PPTX parsing uchun mammoth bilan sinab ko'ramiz
        try {
          const pptxResult = await mammoth.extractRawText({ buffer });
          return pptxResult.value;
        } catch (pptxError) {
          console.warn(
            "PPTX parsing error, trying as text:",
            pptxError.message,
          );
          return buffer.toString("utf-8");
        }

      default:
        throw new Error(`Qo'llab-quvvatlanmagan format: ${ext}`);
    }
  } catch (error) {
    console.error(`File parsing error (${ext}):`, error.message);
    throw error;
  }
}
