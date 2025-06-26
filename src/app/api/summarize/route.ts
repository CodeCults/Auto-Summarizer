import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Return a mock response to avoid API calls and build errors.
  const mockSummary = {
    mainSummary: "This is a sample summary of the document. The key point is that the system is working without making a real API call.",
    sections: [
      { title: "Introduction", summary: "This is the summary for the introduction section." },
      { title: "Conclusion", summary: "This is the summary for the conclusion section." }
    ],
    keywords: ["mock data", "sample", "demo", "no-api"],
    ideaCards: [
      { title: "Core Idea 1", content: "The application UI is fully functional." },
      { title: "Core Idea 2", content: "API calls are mocked to prevent build failures and costs." }
    ],
    mindMap: "- Main Topic\n  - Sub-topic 1\n  - Sub-topic 2",
    quiz: [
      { question: "Is this a real summary?", answer: "No, this is a placeholder to demonstrate UI." },
      { question: "Are API calls being made?", answer: "No, the backend returns a mock response." }
    ],
    originalText: "This is the original text that was submitted for summarization."
  };

  return NextResponse.json(mockSummary);
} 