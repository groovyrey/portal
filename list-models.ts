import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Missing API key");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const res = await axios.get(url);
    console.log("Models:", res.data.models.map((m: any) => m.name));
  } catch (error: any) {
    console.error("Error listing models:", error.response?.data || error.message);
  }
}

listModels();
