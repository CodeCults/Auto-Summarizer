import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/fileParser';
import { extractTextFromUrl } from '@/lib/urlScraper';
import OpenAI from 'openai';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import { File } from 'formidable';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req: NextRequest): Promise<{ fields: any; files: any }> => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req as any, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

const getStyleInstruction = (style: string) => {
  switch (style) {
    case 'Academic':
      return 'Summarize in a formal, academic tone with proper terminology, in Turkish.';
    case 'Bullet Points':
      return 'Summarize the key information as 5-7 concise bullet points, in Turkish.';
    case 'Simplified':
    default:
      return 'Summarize in plain, simple Turkish, as if explaining to a 14-year-old.';
  }
};

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const { fields, files } = await parseForm(req);
    const textInput = fields.text?.[0];
    const urlInput = fields.url?.[0];
    const fileInput = files.file?.[0];
    const summaryStyle = fields.summaryStyle?.[0] || 'Simplified';
    
    let combinedText = '';

    if (textInput) {
      combinedText += textInput + '\\n\\n';
    }

    if (urlInput) {
      const urlText = await extractTextFromUrl(urlInput);
      combinedText += urlText + '\\n\\n';
    }

    if (fileInput) {
        const tempFilePath = fileInput.filepath;
        const fileContent = await fs.readFile(tempFilePath);
        const originalFilename = fileInput.originalFilename || 'file';
        const mimetype = fileInput.mimetype || 'application/octet-stream';

        const fileObject = new global.File([fileContent], originalFilename, { type: mimetype });
        const fileText = await extractTextFromFile(fileObject as any);
        combinedText += fileText + '\\n\\n';
        await fs.unlink(tempFilePath);
    }
    
    if (!combinedText.trim()) {
      return NextResponse.json({ error: 'No text provided for summarization.' }, { status: 400 });
    }

    // Truncate text to avoid exceeding token limits (e.g., ~15k chars for 4k tokens)
    const maxLength = 15000;
    const truncatedText = combinedText.substring(0, maxLength);

    const systemPrompt = `
      You are an expert text analyst. Your response must be in Turkish.
      Analyze the following content and provide a detailed, structured analysis.

      **Summary Style Instruction:** ${getStyleInstruction(summaryStyle)}

      Respond with a single JSON object with the following structure:
      {
        "mainSummary": "A summary of the entire text, adhering to the style instruction above.",
        "sections": [
          {
            "title": "Section Title (e.g., Introduction)",
            "summary": "A summary of this specific section, also in the requested style."
          }
        ],
        "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
        "ideaCards": [
          {
            "title": "Core Idea Title",
            "content": "A 1-2 sentence explanation of a core idea."
          }
        ],
        "mindMap": "A hierarchical mind map represented as a string with markdown-style indentation.",
        "quiz": [
            {
                "question": "A short-answer question testing comprehension of a key point.",
                "answer": "A concise, correct answer to the question."
            }
        ]
      }
      
      **Additional Instructions:**
      - Generate 3-5 quiz questions with answers.
    `;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        { role: 'user', content: truncatedText },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
        return NextResponse.json({ error: 'Failed to generate summary.' }, { status: 500 });
    }
    
    const structuredSummary = JSON.parse(responseContent);

    // Include the original text for the evaluation feature
    const finalResponse = {
      ...structuredSummary,
      originalText: truncatedText
    }

    return NextResponse.json(finalResponse);

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
} 