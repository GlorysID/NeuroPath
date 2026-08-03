import { NextResponse } from 'next/server';
import { callAI } from '../../../lib/ai';

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

    const { content } = await callAI({
      messages: [{ role: "system", content: systemPrompt }],
      maxTokens: 1000,
      temperature: 0.2
    });
    let text = content.trim();
    if (text.startsWith('```json')) text = text.replace(/^```json/, '');
    if (text.startsWith('```')) text = text.replace(/^```/, '');
    if (text.endsWith('```')) text = text.replace(/```$/, '');

    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
