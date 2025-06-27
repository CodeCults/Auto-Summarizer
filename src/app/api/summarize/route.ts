import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { extractTextFromUrl } from '@/lib/urlScraper';
import { extractTextFromFile } from '@/lib/fileParser';


export const runtime = 'nodejs';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is missing in environment variables. Please add it to your .env.local file.');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const text = formData.get('text') as string;
    const url = formData.get('url') as string;
    const file = formData.get('file') as File | null;
    const summaryStyle = formData.get('summaryStyle') as string || 'Simplified';

    let originalText = '';

    if (text) {
      originalText = text;
    } else if (url) {
      originalText = await extractTextFromUrl(url);
    } else if (file) {
      originalText = await extractTextFromFile(file);
    } else {
      return NextResponse.json({ error: 'No text, URL, or file provided.' }, { status: 400 });
    }

    if (!originalText) {
        return NextResponse.json({ error: 'Could not extract text from the source.' }, { status: 400 });
    }

    const systemPrompt = `You are an expert text summarizer. Your task is to provide a comprehensive summary and analysis of the given text.
Please return the output in a clean, valid JSON object. Do not include any text or formatting outside of the JSON object.

The JSON object should have the following structure:
{
  "mainSummary": "A concise, ${summaryStyle} summary of the entire text.",
  "sections": [
    { "title": "Section Title", "summary": "A detailed summary of this specific section." }
  ],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "ideaCards": [
    { "title": "Key Idea 1", "content": "A brief explanation of a core concept." }
  ],
  "mindMap": "A markdown-formatted mind map of the text's structure and key points, using nested lists.",
  "quiz": [
    { "question": "A question about the text.", "answer": "The answer to the question." }
  ],
  "originalText": "The full original text provided by the user."
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Please generate a summary and analysis for the following text:\n\n${originalText}`,
        },
      ],
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
      response_format: { type: 'json_object' },
    });

    const responseJsonString = chatCompletion.choices[0]?.message?.content;
    
    if (!responseJsonString) {
        throw new Error('Failed to get a valid response from the AI model.');
    }
    
    let responseJson;
    try {
        responseJson = JSON.parse(responseJsonString);
    } catch (parseError) {
        console.error('Failed to parse JSON response from AI:', responseJsonString);
        throw new Error('The AI returned a response in an invalid format.');
    }
    
    // Add originalText to the final response object if it's missing from the model's output
    if (!responseJson.originalText) {
        responseJson.originalText = originalText;
    }

    return NextResponse.json(responseJson);

  } catch (error) {
    console.error('Error in summarize API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: `Failed to generate summary. ${errorMessage}` }, { status: 500 });
  }
} 