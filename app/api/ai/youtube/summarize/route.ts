import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { decrypt } from '@/lib/auth';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { videoId, title, description } = await req.json();

    if (!videoId || !title) {
      return NextResponse.json({ error: 'Missing video information' }, { status: 400 });
    }

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      decrypt(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const model = new ChatGoogleGenerativeAI({
      model: "gemma-3-27b-it",
      apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      maxOutputTokens: 1024,
    });

    const systemPrompt = `
      You are an expert academic assistant. Your task is to provide a concise and structured summary of an educational YouTube video based on its title and description.
      
      Video Title: ${title}
      Video Description: ${description || 'No description provided.'}
      
      Instructions:
      1. Provide a "Key Takeaway" (1-2 sentences).
      2. List 3-5 "Main Concepts" covered in the video.
      3. Suggest 2 "Follow-up Questions" for the student to consider.
      4. Keep the tone academic, encouraging, and professional.
      5. Use Markdown for formatting.
    `;

    const response = await model.invoke([
      ["user", systemPrompt],
      ["user", "Summarize this video for my studies."]
    ]);

    return NextResponse.json({ summary: response.content });
  } catch (error: any) {
    console.error('YouTube Summarize API Error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
