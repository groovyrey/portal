import { DeepgramClient, ListenV1Response } from "@deepgram/sdk";
import { NextRequest, NextResponse } from "next/server";
import { filterProfanity } from '@/lib/sanitization';
import { decrypt } from '@/lib/auth';
import { cache } from '@/lib/cache';

const TTS_MODELS = new Set([
  'aura-asteria-en',
  'aura-luna-en',
  'aura-stella-en',
  'aura-athena-en',
  'aura-hera-en',
  'aura-orion-en',
  'aura-arcas-en',
  'aura-perseus-en',
  'aura-angus-en',
  'aura-orpheus-en',
  'aura-helios-en',
  'aura-zeus-en',
]);

const DEFAULT_TTS_MODEL = 'aura-helios-en';
const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_TTS_CHARS = 5000;

// Best-effort in-memory sliding-window rate limiter (per process instance).
// Works reliably when the serverless function stays warm; mirrors the
// codebase's existing in-memory cache approach rather than pretending to be
// globally distributed.
const RL_WINDOW_MS = 60 * 1000; // 1 minute
const RL_MAX_REQUESTS = 10;

function allowed(cacheKey: string, max: number): boolean {
  const now = Date.now();
  const hits = (cache.get<number[]>(cacheKey) || [])
    .filter((t) => now - t < RL_WINDOW_MS);
  if (hits.length >= max) {
    cache.set(cacheKey, hits, RL_WINDOW_MS);
    return false;
  }
  hits.push(now);
  cache.set(cacheKey, hits, RL_WINDOW_MS);
  return true;
}

/**
 * Require a valid session cookie. Deepgram usage is metered (and costs money),
 * so every handler must be authenticated. The session payload is a JSON
 * object containing a non-empty `userId`.
 */
function isAuthenticated(req: NextRequest): { ok: boolean; userId?: string } {
  const sessionCookie = req.cookies.get('session_token');
  if (!sessionCookie?.value) return { ok: false };
  try {
    const sessionData = JSON.parse(decrypt(sessionCookie.value));
    const userId = typeof sessionData?.userId === 'string' ? sessionData.userId.trim() : '';
    if (!userId) return { ok: false };
    return { ok: true, userId };
  } catch {
    return { ok: false };
  }
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const auth = isAuthenticated(req);
  if (!auth.ok) return unauthorized();
  if (!auth.userId) return unauthorized();

  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json(
      { error: "Deepgram API key is not configured" },
      { status: 500 }
    );
  }

  if (!allowed(`deepgram:stt:${auth.userId}`, RL_MAX_REQUESTS)) {
    return NextResponse.json(
      { error: "Too many transcription requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (audioFile.size === 0 || audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Audio file must be between 1 byte and 15 MB" },
        { status: 400 }
      );
    }

    const contentType = (audioFile.type || '').toLowerCase();
    if (contentType && !contentType.startsWith('audio/')) {
      return NextResponse.json(
        { error: "Invalid audio file type" },
        { status: 400 }
      );
    }

    const deepgram = new DeepgramClient({ apiKey: DEEPGRAM_API_KEY });
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await deepgram.listen.v1.media.transcribeFile(
      buffer,
      {
        model: "nova-3",
        smart_format: true,
        language: "tl",
      }
    );

    // Deepgram v5 response structure handling for synchronous file transcription
    if ('results' in result) {
        const transcript = filterProfanity(
          (result as ListenV1Response).results?.channels?.[0]?.alternatives?.[0]?.transcript || ""
        );
        return NextResponse.json({ transcript });
    } else {
        throw new Error("Asynchronous transcription response received, but synchronous was expected.");
    }
  } catch (err: any) {
    console.error("Transcription error:", err);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = isAuthenticated(req);
  if (!auth.ok) return unauthorized();
  if (!auth.userId) return unauthorized();

  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json(
      { error: "Deepgram API key is not configured" },
      { status: 500 }
    );
  }

  if (!allowed(`deepgram:tts:${auth.userId}`, RL_MAX_REQUESTS)) {
    return NextResponse.json(
      { error: "Too many speech requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const { text, model } = await req.json();

    const cleanedText = typeof text === 'string' ? text.slice(0, MAX_TTS_CHARS).trim() : '';

    if (!cleanedText) {
      return NextResponse.json(
        { error: "No valid text provided for TTS" },
        { status: 400 }
      );
    }

    const ttsModel = TTS_MODELS.has(model) ? model : DEFAULT_TTS_MODEL;

    const deepgram = new DeepgramClient({ apiKey: DEEPGRAM_API_KEY });

    const response = await deepgram.speak.v1.audio.generate(
      {
        text: cleanedText,
        model: ttsModel,
        encoding: "linear16",
        container: "wav",
      }
    );

    const stream = response.stream();
    if (!stream) {
      throw new Error("Failed to get stream from Deepgram");
    }

    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
      },
    });
  } catch (err: any) {
    console.error("TTS error:", err);
    return NextResponse.json(
      { error: "TTS failed" },
      { status: 500 }
    );
  }
}
