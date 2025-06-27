import mammoth from 'mammoth';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

// This is required to prevent a worker error in Node.js environments.
// We point to a "fake" worker script.
GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.js';

export async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  if (file.type === 'application/pdf') {
    const loadingTask = getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => (item as TextItem).str).join(' ') + '\n';
    }
    return text;
  }

  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (file.type === 'text/plain') {
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('utf-8');
  }

  throw new Error('Unsupported file type');
} 