import { PDFParse } from 'pdf-parse';
import AdmZip from 'adm-zip';

/**
 * Robust document text extraction for PDF, DOCX, TXT, MD, JSON, and CSV files.
 */
export async function extractTextFromFileBuffer(
  buffer: Buffer,
  fileName: string = 'document.pdf'
): Promise<string> {
  const lowerName = fileName.toLowerCase();

  // 1. PDF Documents
  if (lowerName.endsWith('.pdf') || buffer.slice(0, 5).toString('ascii').startsWith('%PDF')) {
    try {
      const parser = new PDFParse(new Uint8Array(buffer));
      const result = await parser.getText();
      const text = (result?.text || '').trim();
      if (text.length > 20) {
        return text;
      }
    } catch (e) {
      console.error('PDFParse extraction error, falling back:', e);
    }
  }

  // 2. DOCX Documents (OpenXML zip archive)
  if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
    try {
      const zip = new AdmZip(buffer);
      const docEntry = zip.getEntry('word/document.xml');
      if (docEntry) {
        const xml = docEntry.getData().toString('utf-8');
        // Extract <w:t> tags
        const textPieces: string[] = [];
        const regex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
        let match;
        while ((match = regex.exec(xml)) !== null) {
          textPieces.push(match[1]);
        }
        if (textPieces.length > 0) {
          return textPieces.join(' ').replace(/\s+/g, ' ').trim();
        }
        // Fallback: strip tags
        const stripped = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (stripped.length > 20) {
          return stripped;
        }
      }
    } catch (e) {
      console.error('DOCX extraction error, falling back:', e);
    }
  }

  // 3. Plain text / Markdown / JSON / CSV
  try {
    const raw = buffer.toString('utf-8');
    // Check if it looks like UTF-8 text
    const nonPrintable = (raw.slice(0, 500).match(/[\x00-\x08\x0E-\x1F]/g) || []).length;
    if (nonPrintable < 15 && raw.trim().length > 0) {
      return raw.trim();
    }
  } catch (e) {
    // Ignore
  }

  return `Document: ${fileName}`;
}
