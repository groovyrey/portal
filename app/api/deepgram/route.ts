import { DeepgramClient, ListenV1Response } from "@deepgram/sdk";
import { NextResponse } from "next/server";

export async function GET() {
  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
  const DEEPGRAM_PROJECT_ID = process.env.DEEPGRAM_PROJECT_ID;

  if (!DEEPGRAM_API_KEY || !DEEPGRAM_PROJECT_ID) {
    return NextResponse.json(
      { error: "Deepgram configuration is missing" },
      { status: 500 }
    );
  }

  try {
    console.log("Deepgram: Attempting to create temporary key for project:", DEEPGRAM_PROJECT_ID);
    const deepgram = new DeepgramClient({ apiKey: DEEPGRAM_API_KEY });
    const result = await deepgram.manage.v1.projects.keys.create(
      DEEPGRAM_PROJECT_ID,
      {
        comment: "Temporary key for live transcription",
        scopes: ["usage:write"],
        time_to_live_in_seconds: 14400, 
      }
    );

    console.log("Deepgram: Key creation result:", result ? "Success (Key present)" : "Failed (No result)");
    
    if (!result.key) {
      console.error("Deepgram: Key property missing in response:", result);
      throw new Error("Key creation failed: No key in response");
    }
    return NextResponse.json({ key: result.key });
  } catch (err: any) {
    console.error("Deepgram API Error Details:", {
      message: err.message,
      stack: err.stack,
      raw: err
    });
    return NextResponse.json(
      { error: err.message || "Failed to generate key", details: err.toString() },
      { status: 500 }
    );
  }
}

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

    // Deepgram v5 response structure handling for synchronous file transcription
    if ('results' in result) {
        const transcript = (result as ListenV1Response).results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
        return NextResponse.json({ transcript });
    } else {
        throw new Error("Asynchronous transcription response received, but synchronous was expected.");
    }
  } catch (err: any) {
    console.error("Transcription error:", err);
    return NextResponse.json(
      { error: err.message || "Transcription failed" },
      { status: 500 }
    );
  }
}
