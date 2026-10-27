/**
 * Utility to extract clean, readable plain-text from files (PDF, DOCX, DOC, TXT, MD, JSON, CSV, etc.)
 * in client-side browser environments with drag-and-drop support.
 */

/**
 * Converts a browser File object to a Base64 string without data URI prefix
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data:application/pdf;base64, or any mime header if present
      const base64Index = result.indexOf(';base64,');
      if (base64Index !== -1) {
        resolve(result.substring(base64Index + 8));
      } else {
        // Raw base64 or array buffer fallback
        const commaIndex = result.indexOf(',');
        resolve(commaIndex !== -1 ? result.substring(commaIndex + 1) : result);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Determines whether the given file is a binary document (PDF, Word, etc.)
 */
export function isBinaryDocument(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.pdf') ||
    name.endsWith('.docx') ||
    name.endsWith('.doc') ||
    file.type === 'application/pdf' ||
    file.type.includes('wordprocessingml')
  );
}

/**
 * Reads and extracts full plain-text from any file format, delegating
 * PDF and DOCX binary streams to the backend server-side parser.
 */
export async function readFileText(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // For PDF, DOCX, and DOC binary documents, utilize backend extraction for 100% font/stream fidelity
  if (isBinaryDocument(file)) {
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/candidates/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, fileName: file.name }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text && typeof data.text === 'string' && data.text.trim().length > 0) {
          return data.text.trim();
        }
      }
    } catch (err) {
      console.warn('Backend document extraction failed, falling back to local extractor:', err);
    }
  }

  // Plain-text family: read directly
  if (
    file.type.startsWith('text/') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.json') ||
    fileName.endsWith('.csv') ||
    fileName.endsWith('.rtf') ||
    fileName.endsWith('.xml') ||
    fileName.endsWith('.html') ||
    fileName.endsWith('.yml') ||
    fileName.endsWith('.yaml')
  ) {
    try {
      const text = await file.text();
      return text.trim();
    } catch {
      // Fall through
    }
  }

  // Fallback direct text read
  try {
    const text = await file.text();
    if (text.trim().length > 0) return text.trim();
  } catch {
    // Ignore
  }

  return `Document: ${file.name}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Filter and validate dropped or selected files against supported document extensions
 */
export function filterSupportedFiles(files: FileList | File[]): File[] {
  const fileArray = Array.from(files);
  const supportedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.rtf', '.json', '.csv'];
  return fileArray.filter((f) => {
    const name = f.name.toLowerCase();
    return supportedExtensions.some((ext) => name.endsWith(ext)) || f.type.startsWith('text/');
  });
}
