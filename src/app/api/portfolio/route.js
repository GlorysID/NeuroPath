import { callAI } from '../../../lib/ai';

export async function POST(req) {
  try {
    const { profile, lang } = await req.json();

    const langInst = lang === 'id' ? 'Respond entirely in Indonesian.' : 'Respond entirely in English.';

    const systemPrompt = `You are an expert AI career consultant and resume writer.
Based on this user profile: ${JSON.stringify(profile)}

Generate a professional portfolio summary that includes:
1. A compelling professional headline (1 line)
2. A powerful executive summary (3-4 sentences)
3. 5 high-impact resume bullet points with quantifiable achievements
4. 3 key technical competencies
5. A recommended career objective (2 sentences)

Format it cleanly with clear section headers. Use plain text only, no markdown.
${langInst}`;

    const { content } = await callAI({
      messages: [{ role: "system", content: systemPrompt }],
      maxTokens: 500,
      temperature: 0.6
    });

    return Response.json({ result: content });
  } catch (error) {
    console.error("Portfolio error:", error);
    return Response.json({ error: "Failed to generate portfolio" }, { status: 500 });
  }
}
