import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { action, profile, lang } = await req.json();

    let systemPrompt = "";
    if (action === "resume") {
      systemPrompt = `You are an expert AI resume writer. Based on this profile: ${JSON.stringify(profile)}, generate 3 high-impact resume bullet points that the user can immediately use. Make them action-oriented and quantifiable. Return plain text only.`;
    } else if (action === "jobs") {
      systemPrompt = `You are an expert AI career matchmaker. Based on this profile: ${JSON.stringify(profile)}, recommend 3 highly specific, emerging job titles that perfectly fit their archetype and skills. Briefly explain why. Return plain text only.`;
    } else if (action === "feed") {
      systemPrompt = `You are an AI career agent named OpenClaw. Look at this user profile: ${JSON.stringify(profile)}. Generate 2 short, proactive, and slightly urgent recommendations or observations about their career trajectory as if you are analyzing them in real-time. Make it sound like a live agent feed. Return plain text.`;
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    if (lang === 'id') {
      systemPrompt += " Respond in Indonesian.";
    } else {
      systemPrompt += " Respond in English.";
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }],
        max_tokens: 250,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Agent API Error: ${await response.text()}`);
    }

    const data = await response.json();
    return NextResponse.json({ result: data.choices[0].message.content });
  } catch (error) {
    console.error("Error in Agent API:", error);
    return NextResponse.json({ error: "Failed to generate agent response" }, { status: 500 });
  }
}
