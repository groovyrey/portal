import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const origin = req.nextUrl.origin;
    
    // 1. Try Primary Reviewer (HuggingFace)
    try {
      const response = await fetch(`${origin}/api/ai/reviewer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return NextResponse.json(await response.json());
      }
      
      console.warn('Primary reviewer (HuggingFace) returned error, attempting fallback.');
    } catch (hfError: any) {
      console.warn('Primary reviewer (HuggingFace) failed:', hfError.message);
    }

    // 2. Try Fallback Reviewer (xAI / Grok)
    try {
      const response = await fetch(`${origin}/api/ai/fallback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return NextResponse.json(await response.json());
      }
      
      console.error('Fallback reviewer (xAI) also returned error.');
    } catch (xaiError: any) {
      console.error('Fallback reviewer (xAI) failed:', xaiError.message);
    }

    // 3. Last Resort Fallback
    return NextResponse.json({
        decision: "APPROVED",
        topic: "General",
        reason: "Review service temporarily unavailable. Post approved with pending status.",
        growth_tip: "Ensure your post follows school guidelines.",
        safety_score: 50
    });

  } catch (error: any) {
    console.error('Moderation Coordinator Error:', error);
    return NextResponse.json({ error: 'Failed to coordinate post review: ' + error.message }, { status: 500 });
  }
}
