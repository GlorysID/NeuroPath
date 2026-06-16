import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messages, lang, interviewType } = await req.json();

    let langInstruction = "You MUST speak and respond ONLY in English.";
    if (lang === 'id') {
      langInstruction = "You MUST speak and respond ONLY in Indonesian (Bahasa Indonesia).";
    }

    const typeContext = interviewType 
      ? `This specific interview session is focused on: "${interviewType}". Tailor your questions heavily around this topic to test or guide the user appropriately.` 
      : `This is a general initial cognitive and career profiling interview.`;

    const SYSTEM_PROMPT = `
You are the NeuroPath Core Intelligence. Your task is to conduct an immersive cognitive profile interview with the user.
${typeContext}
Keep your responses short, mysterious, but highly intelligent and professional. 
Do not use markdown formatting like **bold** unless necessary. Use plain text.
The interview should last maximum 3 questions. 
Start by acknowledging their previous response and then ask the next profound question about their career, technical skills, or problem-solving methods.
If they have answered 3 times, output exactly: "[END_INTERVIEW]" and nothing else.
${langInstruction}
`;

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.sender === "ai" ? "assistant" : "user",
        content: msg.text
      }))
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: apiMessages,
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error response:", errorText);
      let errorMessage = "System Error. Failed to connect to Neural Core.";
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.message) {
          errorMessage = "Neural Core Error: " + errorJson.error.message;
        }
      } catch (e) {
        // If it's HTML or not JSON
      }
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await response.json();
    const replyText = data.choices && data.choices[0] ? data.choices[0].message.content : "System Error. Response format invalid.";
    
    return new Response(JSON.stringify({ reply: replyText }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in interview API:", error);
    return new Response(JSON.stringify({ error: "System Error. Internal server anomaly." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
