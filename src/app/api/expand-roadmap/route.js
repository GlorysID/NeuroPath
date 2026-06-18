import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { profile, lang } = await req.json();

    const systemPrompt = `You are an expert AI career strategist.
The user has a current cognitive profile and a short 3-step roadmap.
Profile: ${JSON.stringify(profile)}

Your task is to EXPAND their roadmap into a highly specific, granular 10-step micro-roadmap.
Return ONLY a valid JSON object:
{
  "milestones": [
    { "title": "Micro-step 1", "description": "Specific action" },
    ... 10 items ...
  ]
}

Make the response in ${lang === 'id' ? 'Indonesian' : 'English'}.
Return ONLY the raw JSON.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }],
        max_tokens: 1000,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error("API Error");
    }

    const data = await response.json();
    let text = data.choices[0].message.content.trim();
    if (text.startsWith('```json')) text = text.replace(/^```json/, '');
    if (text.startsWith('```')) text = text.replace(/^```/, '');
    if (text.endsWith('```')) text = text.replace(/```$/, '');

    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
