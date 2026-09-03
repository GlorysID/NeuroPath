const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

function isLocalRouter(url) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
}

const ROUTER_URL = (process.env.AI_ROUTER_URL || "").trim().replace(/\/+$/, "");
const ROUTER_ENABLED =
  ROUTER_URL.length > 0 &&
  !(process.env.NODE_ENV === "production" && isLocalRouter(ROUTER_URL));

// Groq models known to be active and supported
const GROQ_FALLBACK_MODELS = [
  process.env.AI_MODEL,
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
  "groq/compound"
].filter(Boolean);

const AI_MODEL = process.env.AI_MODEL || "openai/gpt-oss-120b";
const AI_ROUTER_MODEL = process.env.AI_ROUTER_MODEL || "NeuroPath";

const FETCH_TIMEOUT_MS = Number(process.env.AI_FETCH_TIMEOUT_MS || 15000);

async function fetchCompletion(endpoint, apiKey, model, payload) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({ model, ...payload }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`AI API ${res.status}: ${text.substring(0, 200)}`);
  }

  // Handle SSE stream text if proxy/router returns text/event-stream chunks
  if (text.trim().startsWith("data:")) {
    const lines = text.split("\n");
    let fullContent = "";
    let lastRole = "assistant";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, "");
      if (jsonStr === "[DONE]") break;
      try {
        const chunk = JSON.parse(jsonStr);
        const delta = chunk.choices?.[0]?.delta;
        if (delta?.content) fullContent += delta.content;
        if (delta?.role) lastRole = delta.role;
      } catch {
        // ignore incomplete chunk json
      }
    }
    return {
      data: { choices: [{ message: { role: lastRole, content: fullContent } }] },
      message: { role: lastRole, content: fullContent },
      content: fullContent
    };
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

  if (ROUTER_ENABLED) {
    try {
      const result = await fetchCompletion(
        `${ROUTER_URL}/chat/completions`,
        process.env.AI_ROUTER_KEY || "",
        AI_ROUTER_MODEL,
        payload
      );
      return { source: "router", ...result };
    } catch (e) {
      console.warn(`AI router unavailable (${e.message}), falling back to Groq...`);
    }
  }

  // Fallback to Groq with model cascading
  const triedModels = new Set();
  const modelsToTry = [...GROQ_FALLBACK_MODELS, "openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"];
  let lastError = null;

  for (const model of modelsToTry) {
    if (triedModels.has(model)) continue;
    triedModels.add(model);

    try {
      const result = await fetchCompletion(GROQ_ENDPOINT, process.env.GROQ_API_KEY, model, payload);
      return { source: "groq", model, ...result };
    } catch (err) {
      console.warn(`Groq model ${model} failed (${err.message}), trying next model...`);
      lastError = err;
    }
  }

  throw lastError || new Error("All AI providers and models failed.");
}
