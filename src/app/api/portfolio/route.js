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

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }],
        max_tokens: 800,
        temperature: 0.6
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API Error: ${await response.text()}`);
    }

    const data = await response.json();
    return Response.json({ result: data.choices[0].message.content });
  } catch (error) {
    console.error("Portfolio error:", error);
    return Response.json({ error: "Failed to generate portfolio" }, { status: 500 });
  }
}
