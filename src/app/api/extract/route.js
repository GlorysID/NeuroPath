export async function POST(req) {
  try {
    const { messages, lang } = await req.json();

    if (!messages || messages.length === 0) {
      return Response.json({ error: "No transcript provided" }, { status: 400 });
    }

    const transcriptText = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join("\n");

    const prompt = `
You are an expert career and cognitive analyst AI.
Review the following interview transcript between an AI and a USER.
Analyze the user's personality, skills, and goals.

Extract the following information and return ONLY a valid JSON object (no markdown, no backticks, no other text):
{
  "archetype": "A 2-3 word title describing their primary professional archetype (e.g., 'System Architect', 'Visionary Designer', 'Data Strategist')",
  "analyticalScore": <integer between 1 and 100 representing analytical/logical thinking>,
  "creativeScore": <integer between 1 and 100 representing creative problem solving>,
  "readinessLevel": "Must be exactly one of: 'Student', 'Fresh Grad', 'Professional', or 'Switcher' based on their current status",
  "nextInterviewType": "A short 2-4 word topic for their next highly recommended AI interview (e.g., 'Technical Case Study', 'Personal Branding', 'Basic Skill Improvement', 'Leadership Assessment')",
  "milestones": [
    {
      "title": "Short title of a career milestone/skill to learn",
      "description": "1 sentence description"
    },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." }
  ]
}

Make the response in ${lang === 'id' ? 'Indonesian' : 'English'}.
Return ONLY the raw JSON.

Transcript:
${transcriptText}
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: prompt }],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API Error: ${await response.text()}`);
    }

    const result = await response.json();
    let text = result.choices[0].message.content.trim();
    
    // Clean up potential markdown formatting if Llama still adds it
    if (text.startsWith('```json')) text = text.replace(/^```json/, '');
    if (text.startsWith('```')) text = text.replace(/^```/, '');
    if (text.endsWith('```')) text = text.replace(/```$/, '');
    text = text.trim();

    const data = JSON.parse(text);

    return Response.json(data);
  } catch (error) {
    console.error("Extraction error:", error);
    return Response.json({ error: "Failed to extract blueprint" }, { status: 500 });
  }
}
