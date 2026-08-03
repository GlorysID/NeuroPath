const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const ROUTER_URL = (process.env.AI_ROUTER_URL || "").trim().replace(/\/+$/, "");
const AI_MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile";
const AI_ROUTER_MODEL = process.env.AI_ROUTER_MODEL || AI_MODEL;

async function fetchCompletion(endpoint, apiKey, model, payload) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({ model, ...payload })
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`AI API ${res.status}: ${text.substring(0, 200)}`);
  }

  const data = JSON.parse(text);
  const message = data?.choices?.[0]?.message;
  if (!message) {
    throw new Error("AI API: no message in response");
  }

  return { data, message, content: message.content };
}

export async function callAI({ messages, maxTokens = 400, temperature = 0.7, tools }) {
  const payload = { messages, max_tokens: maxTokens, temperature, stream: false };
  if (tools) payload.tools = tools;

  if (ROUTER_URL) {
    try {
      const result = await fetchCompletion(
        `${ROUTER_URL}/chat/completions`,
        process.env.AI_ROUTER_KEY || "",
        AI_ROUTER_MODEL,
        payload
      );
      return { source: "router", ...result };
    } catch (e) {
      console.warn(`9Router unavailable (${e.message}), falling back to Groq...`);
    }
  }

  const result = await fetchCompletion(GROQ_ENDPOINT, process.env.GROQ_API_KEY, AI_MODEL, payload);
  return { source: "groq", ...result };
}
