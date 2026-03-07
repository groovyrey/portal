import { DeepgramClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json(
      { error: "Deepgram API key is not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const deepgram = new DeepgramClient({ apiKey: DEEPGRAM_API_KEY });
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await deepgram.listen.v1.media.transcribeFile(
      buffer,
      {
        model: "nova-2",
        smart_format: true,
        detect_language: true,
      }
    );

    if (!('results' in result)) {
      throw new Error("Asynchronous transcription response received, but synchronous was expected.");
    }

    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    return NextResponse.json({ transcript });
  } catch (err: any) {
    console.error("Transcription error:", err);
    return NextResponse.json(
      { error: err.message || "Transcription failed" },
      { status: 500 }
    );
  }
}
