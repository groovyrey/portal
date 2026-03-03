"use server";

export async function askLlama(messages: any[]) {
  const API_TOKEN = process.env.AI_WORKER_API;
  const ACCOUNT_ID = "6fc752615c51f96c4ce397b92c40fdd6";
  const MODEL = "@cf/meta/llama-3.2-11b-vision-instruct"; 

  if (!API_TOKEN) {
    throw new Error("AI_WORKER_API environment variable is not set.");
  }

  // Check if any message contains an image
  const lastMessage = messages[messages.length - 1];
  const hasImage = !!lastMessage.image;

  if (hasImage) {
    // For multimodal, the REST API with the 'image' field is the most reliable
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`,
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ 
          messages: messages.map(m => ({ role: m.role, content: m.content || "" })),
          image: Array.from(Buffer.from(lastMessage.image, 'base64')),
          tools: [
            {
              type: "function",
              function: {
                name: "show_toast",
                description: "Show a notification toast to the user.",
                parameters: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    type: { type: "string", enum: ["success", "error", "info", "warning"] }
                  },
                  required: ["message"]
                }
              }
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare API error (REST): ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return {
      response: result.result.response,
      tool_calls: result.result.tool_calls
    };
  } else {
    // For text-only (including tool results), the OpenAI-compatible endpoint is better
    const cleanedMessages = messages.map(m => ({
      role: m.role,
      content: m.content || "",
      ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
      ...(m.name ? { name: m.name } : {}),
    }));

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/v1/chat/completions`,
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ 
          model: MODEL,
          messages: cleanedMessages,
          tools: [
            {
              type: "function",
              function: {
                name: "show_toast",
                description: "Show a notification toast to the user.",
                parameters: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    type: { type: "string", enum: ["success", "error", "info", "warning"] }
                  },
                  required: ["message"]
                }
              }
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare API error (v1): ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const choice = result.choices[0].message;
    return {
      response: choice.content,
      tool_calls: choice.tool_calls
    };
  }
}
