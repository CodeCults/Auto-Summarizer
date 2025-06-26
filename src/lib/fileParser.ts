import mammoth from 'mammoth';
import pdf from 'pdf-parse';

export async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (file.type === 'application/pdf') {
    const data = await pdf(buffer);
    return data.text;
  }

  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (file.type === 'text/plain') {
    return buffer.toString('utf-8');
  }

  throw new Error('Unsupported file type');
} 