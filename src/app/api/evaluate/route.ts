import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Return a mock response to avoid API calls and build errors.
  const mockEvaluation = {
    score: 88,
    feedback: "This is a sample evaluation. The feature is demonstrated, but no real analysis was performed."
  };

  return NextResponse.json(mockEvaluation);
} 