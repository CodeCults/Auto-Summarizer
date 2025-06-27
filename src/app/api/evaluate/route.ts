import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is missing in environment variables. Please add it to your .env.local file.');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { originalText, userSummary } = await req.json();

    if (!originalText || !userSummary) {
      return NextResponse.json({ error: 'Original text and user summary are required.' }, { status: 400 });
    }

    const systemPrompt = `You are an expert in text analysis and evaluation. Your task is to evaluate a user's summary based on the original text.
Provide a score from 0 to 100 representing how well the user's summary captures the key points of the original text.
Also, provide constructive feedback on the user's summary.

Return the output in a clean, valid JSON object with the following structure:
{
  "score": <a number between 0 and 100>,
  "feedback": "<Your constructive feedback here.>"
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Please evaluate the following summary against the original text.\n\nOriginal Text:\n${originalText}\n\nUser's Summary:\n${userSummary}`,
        },
      ],
      model: 'llama3-8b-8192',
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      response_format: { type: 'json_object' },
    });

    const responseJsonString = chatCompletion.choices[0]?.message?.content;

    if (!responseJsonString) {
        throw new Error('Failed to get a valid evaluation from the AI model.');
    }

    let responseJson;
    try {
        responseJson = JSON.parse(responseJsonString);
    } catch {
        console.error('Failed to parse JSON response from AI for evaluation:', responseJsonString);
        throw new Error('The AI returned an evaluation in an invalid format.');
    }

    return NextResponse.json(responseJson);

  } catch (error) {
    console.error('Error in evaluate API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: `Failed to evaluate summary. ${errorMessage}` }, { status: 500 });
  }
} 