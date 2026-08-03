import { NextResponse } from 'next/server';
import { callAI } from '../../../lib/ai';

export async function POST(req) {
  try {
    const { jobTitle, company, profile, lang } = await req.json();

    if (!jobTitle || !company) {
      return NextResponse.json({ error: "Job title and company are required" }, { status: 400 });
    }

    const archetype = profile?.archetype || "Tech Professional";
    const strengths = profile?.readinessLevel || "High capacity for growth";

    const systemPrompt = `You are OpenClaw, an expert AI career coach.
Write a highly persuasive, professional, and concise Cover Letter for the user.
The user is applying for the role of "${jobTitle}" at "${company}".
Their cognitive archetype is "${archetype}" and their readiness/strengths are described as "${strengths}".
The language should be ${lang === 'id' ? 'Indonesian' : 'English'}.

Rules:
1. Do not use generic buzzwords. Be specific about how their archetype makes them uniquely qualified.
2. Keep it under 250 words.
3. Use a standard business letter format.
4. Leave placeholders like [Your Name], [Your Phone Number], [Date] for the user to fill in.
5. Return ONLY the raw cover letter text. No markdown blocks, no conversational text before or after.`;

    const { content } = await callAI({
      messages: [{ role: "system", content: systemPrompt }],
      maxTokens: 450,
      temperature: 0.5
    });
    let coverLetter = content.trim();

    // Clean up if the LLM still returns markdown backticks
    if (coverLetter.startsWith('```')) coverLetter = coverLetter.replace(/^```[a-zA-Z]*\n?/, '');
    if (coverLetter.endsWith('```')) coverLetter = coverLetter.replace(/\n?```$/, '');

    return NextResponse.json({ coverLetter });
  } catch (error) {
    console.error("Error generating cover letter:", error);
    return NextResponse.json({ error: "Failed to generate cover letter" }, { status: 500 });
  }
}
