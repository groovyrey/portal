
import dotenv from 'dotenv';
import path from 'path';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnoseAssistant() {
  console.log("--- Diagnostic Start ---");
  
  const ASSISTANT_KEY = process.env.ASSISTANT_KEY;
  const ASSISTANT_ID = process.env.ASSISTANT_ID;
  const MODEL = "@cf/meta/llama-3.1-8b-instruct";

  console.log(`Model: ${MODEL}`);
  console.log(`ASSISTANT_ID: ${ASSISTANT_ID ? 'Present' : 'MISSING'}`);
  console.log(`ASSISTANT_KEY: ${ASSISTANT_KEY ? 'Present' : 'MISSING'}`);

  if (!ASSISTANT_ID || !ASSISTANT_KEY) {
    console.error("CRITICAL: Missing credentials in .env.local");
    return;
  }

  const model = new ChatOpenAI({
    model: MODEL,
    apiKey: ASSISTANT_KEY,
    configuration: {
      baseURL: `https://api.cloudflare.com/client/v4/accounts/${ASSISTANT_ID}/ai/v1`,
    },
    maxTokens: 50,
    temperature: 0.1, 
  });

  try {
    console.log("Attempting to invoke model...");
    const res = await model.invoke([
      new HumanMessage("Hello, are you operational?")
    ]);
    console.log("Success!");
    console.log("Response:", res.content);
  } catch (e: any) {
    console.error("Invocation Failed:");
    console.error(e);
  }
}

diagnoseAssistant();
