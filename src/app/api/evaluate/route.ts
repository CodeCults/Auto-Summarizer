import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const { originalText, userSummary } = await req.json();

    if (!originalText || !userSummary) {
      return NextResponse.json({ error: 'Original text and user summary are required.' }, { status: 400 });
    }

    const systemPrompt = `
      You are an expert evaluator of text summaries. Your response must be in Turkish.
      Evaluate the user-written summary based on how well it reflects the original text.
      Provide a score from 0 to 100, where 100 is a perfect summary.
      Also, provide concise, constructive feedback highlighting strengths and areas for improvement.

      Respond with a single JSON object with the following structure:
      {
        "score": 87,
        "feedback": "The summary correctly identifies the main argument but misses the nuance of the counter-arguments. It could be improved by including more specific data points mentioned in the original text."
      }
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        { role: 'user', content: `Original Text:\n"""${originalText}"""\n\nUser's Summary:\n"""${userSummary}"""` },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });
    
    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return NextResponse.json({ error: 'Failed to generate evaluation.' }, { status: 500 });
    }

    const evaluationResult = JSON.parse(responseContent);

    return NextResponse.json(evaluationResult);

  } catch (error) {
    console.error('Evaluation API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 