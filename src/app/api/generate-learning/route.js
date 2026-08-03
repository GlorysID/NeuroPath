import { NextResponse } from 'next/server';
import { callAI } from '../../../lib/ai';

export async function POST(req) {
  try {
    const { topic, profile, lang } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const systemPrompt = `You are an expert tech educator. The user wants to learn the following topic: "${topic}".
Generate the BEST possible YouTube search query to find a highly relevant, high-quality, and modern tutorial video.
Keep it under 6 words. For example: "React hooks crash course 2024" or "System design interview basics".
Return ONLY the raw search query as plain text. No quotes, no markdown, no explanations.`;

    const { content } = await callAI({
      messages: [{ role: "system", content: systemPrompt }],
      maxTokens: 50,
      temperature: 0.2
    });
    let optimizedQuery = content.trim();

    // Clean up if the LLM adds quotes
    optimizedQuery = optimizedQuery.replace(/^["']|["']$/g, '');

    // Return the YouTube search results URL directly. 
    // This gives the user options to choose the best video rather than forcing a potentially irrelevant scrape.
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(optimizedQuery)}`;

    return NextResponse.json({ url: searchUrl });
  } catch (error) {
    console.error("Error generating learning url:", error);
    return NextResponse.json({ error: "Failed to generate url" }, { status: 500 });
  }
}
