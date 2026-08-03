import { NextResponse } from 'next/server';
import { searchJobs, buildLinkedInUrl } from '../../../lib/jobService';
import { callAI } from '../../../lib/ai';

function cleanFeed(text) {
  return text
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s*#+\s*/gm, '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    .split('\n')
    .map(line => line.replace(/^\s*[-*•]\s+/, '').trim())
    .filter(line => !(line.startsWith('[') && line.endsWith(']')))
    .filter(line => !/^[A-Z0-9\s#—\-:]+$/.test(line) && !/^[A-Z][^a-z]*:$/.test(line))
    .join('\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function POST(req) {
  try {
    const { action, profile, lang } = await req.json();

    let systemPrompt = "";

    if (action === "resume") {
      systemPrompt = `You are an expert AI resume writer. Based on this profile: ${JSON.stringify(profile)}, generate 3 high-impact resume bullet points that the user can immediately use. Make them action-oriented and quantifiable. Return plain text only.`;

    } else if (action === "jobs") {
      // UPGRADED: Structured job analysis with STRICT LinkedIn-friendly constraint
      systemPrompt = `You are an expert AI career matchmaker. Based on this profile: ${JSON.stringify(profile)}, return ONLY a valid JSON object (no markdown, no backticks):
{
  "analysis": "A 2-sentence career direction analysis",
  "jobTitles": ["Job Title 1", "Job Title 2", "Job Title 3"],
  "keywords": ["skill1", "skill2", "skill3", "skill4"],
  "reasoning": ["1-line reason for Job 1", "1-line reason for Job 2", "1-line reason for Job 3"]
}

CRITICAL REQUIREMENT: The 'jobTitles' array MUST ONLY contain standard, highly searchable corporate job titles that exist on LinkedIn or Jobstreet (e.g., 'Data Analyst', 'Esports Operations Manager', 'UI/UX Designer'). Do NOT output non-corporate titles, hobbyist titles, or unrealistic roles like 'Pro Player' or 'Gamer'.

Base your recommendations on the user's archetype "${profile?.archetype || 'Unknown'}" and readiness level "${profile?.readinessLevel || 'Student'}".
Return ONLY the raw JSON.`;

    } else if (action === "feed") {
      systemPrompt = `You are NeuroPath, a calm and professional AI career mentor. Based on this profile: ${JSON.stringify(profile)}, write 2 concise observations about the user's career trajectory and the best next step for each.

STRICT FORMAT:
- Plain editorial sentences only. No emojis, no icons, no markdown, no bold text, no ALL-CAPS words, no headers, no bullet lists, and no labels such as "SIGNAL", "ALERT", "FEED", "NOTICE", or "PRIORITY".
- Speak naturally, in a warm advisory tone, directly to the user ("you").
- Each observation is one short paragraph of 2-3 sentences.
- Separate the two paragraphs with a single blank line.
- Total around 70 words. Never shout.`;

    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    if (lang === 'id') {
      systemPrompt += " Respond in Indonesian.";
    } else {
      systemPrompt += " Respond in English.";
    }

    const { content: rawResult } = await callAI({
      messages: [{ role: "system", content: systemPrompt }],
      maxTokens: 400,
      temperature: action === "jobs" ? 0.2 : 0.7
    });

    // For jobs action, parse structured response and enrich with LinkedIn + JSearch
    if (action === "jobs") {
      try {
        let text = rawResult.trim();
        if (text.startsWith('```json')) text = text.replace(/^```json/, '');
        if (text.startsWith('```')) text = text.replace(/^```/, '');
        if (text.endsWith('```')) text = text.replace(/```$/, '');
        text = text.trim();

        const parsed = JSON.parse(text);
        const linkedinUrl = buildLinkedInUrl(
          parsed.jobTitles || [],
          parsed.keywords || [],
          profile?.readinessLevel || "Student"
        );

        // Query JSearch API in parallel
        const listings = await searchJobs(
          parsed.keywords || parsed.jobTitles || [],
          "Indonesia"
        );

        return NextResponse.json({
          result: parsed.analysis || rawResult,
          jobTitles: parsed.jobTitles || [],
          reasoning: parsed.reasoning || [],
          linkedinUrl,
          listings: listings || []
        });
      } catch (parseErr) {
        // Fallback: return raw text if JSON parse fails
        const linkedinUrl = buildLinkedInUrl(
          [profile?.archetype || "Software Engineer"],
          [],
          profile?.readinessLevel || "Student"
        );
        return NextResponse.json({
          result: rawResult,
          jobTitles: [],
          reasoning: [],
          linkedinUrl,
          listings: []
        });
      }
    }

    return NextResponse.json({ result: action === "feed" ? cleanFeed(rawResult) : rawResult });
  } catch (error) {
    console.error("Error in Agent API:", error);
    return NextResponse.json({ error: "Failed to generate agent response" }, { status: 500 });
  }
}

