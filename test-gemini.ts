import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Missing API key");
    return;
  }

  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey: apiKey,
      temperature: 0,
    });

    const res = await model.invoke("Hello, say 'Model is working' if you hear me.");
    console.log("Response:", res.content);
  } catch (error: any) {
    console.error("Test failed:", error.message);
  }
}

test();
