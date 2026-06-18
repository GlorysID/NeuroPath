import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const { messages, lang, userId } = await req.json();

    if (!messages || messages.length === 0) {
      return Response.json({ error: "No transcript provided" }, { status: 400 });
    }

    let existingArchetype = null;
    if (userId && userId !== "guest_temp") {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.profile && data.profile.archetype) {
            existingArchetype = data.profile.archetype;
          }
        }
      } catch (e) {
        console.error("Error fetching existing profile for extraction:", e);
      }
    }

    const transcriptText = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join("\n");

    const archetypeInstruction = existingArchetype 
      ? `"archetype": "CRITICAL: YOU MUST USE EXACTLY THIS STRING: '${existingArchetype}'. Do NOT change it, invent a new one, or translate it. The user has already been assigned this archetype.",`
      : `"archetype": "A 2-3 word title describing their primary professional archetype. CRITICAL: This MUST be a standard, real-world corporate job title that exists on LinkedIn (e.g., 'Data Analyst', 'Community Manager', 'Product Owner'). If their topic is a hobby like Gaming, map it to a real corporate role like 'Esports Consultant' or 'Game QA Specialist', NEVER use non-corporate titles like 'Pro Player' or 'Hobbyist'.",`;

    const prompt = `
You are an expert career and cognitive analyst AI.
Review the following interview transcript between an AI and a USER.
Analyze the user's personality, skills, and goals.

Extract the following information and return ONLY a valid JSON object (no markdown, no backticks, no other text):
{
  ${archetypeInstruction}
  "communicationScore": <integer 1-100 representing verbal clarity and persuasion>,
  "technicalScore": <integer 1-100 representing technical/hard skill proficiency>,
  "logicScore": <integer 1-100 representing logical and analytical reasoning>,
  "creativityScore": <integer 1-100 representing creative and innovative thinking>,
  "leadershipScore": <integer 1-100 representing leadership and initiative>,
  "adaptabilityScore": <integer 1-100 representing flexibility and learning agility>,
  "analyticalScore": <same value as logicScore for backward compatibility>,
  "creativeScore": <same value as creativityScore for backward compatibility>,
  "readinessLevel": "Must be exactly one of: 'Student', 'Fresh Grad', 'Professional', or 'Switcher' based on their current status",
  "nextInterviewType": "A short 2-4 word topic for their next highly recommended AI interview (e.g., 'Technical Case Study', 'Personal Branding', 'Basic Skill Improvement', 'Leadership Assessment')",
  "milestones": [
    {
      "title": "Very specific, small-step milestone (e.g., 'Master Python Pandas')",
      "description": "1 sentence description of this specific micro-step"
    },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." },
    { "title": "Ultimate Goal / Final Stage", "description": "The final milestone to reach the target role" }
  ]
}

IMPORTANT: The 'milestones' array MUST contain at least 8 to 10 items. Break down the user's career journey into very specific, granular, actionable micro-steps rather than broad vague categories. End the roadmap with their ultimate career goal.

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
