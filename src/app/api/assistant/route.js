import { Groq } from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages, profile, currentPath } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    // Construct the System Prompt
    let systemPrompt = `You are the NeuroPath Cognitive Mentor, an elite AI career coach and psychological advisor. 
You live inside a floating widget on the user's dashboard. Keep your answers concise, actionable, and formatted nicely (use bullet points if needed).
Respond in Indonesian since the user interface is in Indonesian.`;

    if (profile && profile.archetype) {
      systemPrompt += `\n\nCRITICAL CONTEXT: The user you are talking to has taken the NeuroPath Cognitive Interview.
Here is their Cognitive Blueprint data:
- Primary Archetype: ${profile.archetype.toUpperCase()}
- Description: ${profile.description || 'N/A'}
- Key Strengths: ${profile.strengths?.join(", ") || 'N/A'}
- Areas to Improve: ${profile.weaknesses?.join(", ") || 'N/A'}
- Scores (0-100):
  * Logic: ${profile.logicScore || profile.analyticalScore || 'N/A'}
  * Creativity: ${profile.creativityScore || profile.creativeScore || 'N/A'}
  * Technical: ${profile.technicalScore || 'N/A'}
  * Communication: ${profile.communicationScore || 'N/A'}
  * Leadership: ${profile.leadershipScore || 'N/A'}
  * Adaptability: ${profile.adaptabilityScore || 'N/A'}
`;

      if (profile.milestones && Array.isArray(profile.milestones)) {
        systemPrompt += `\n- Roadmap Milestones (Langkah-langkah Karir):\n`;
        profile.milestones.forEach((m, idx) => {
          systemPrompt += `  ${idx + 1}. ${m.title}: ${m.description}\n`;
        });
      }

      systemPrompt += `\nIMPORTANT RULE: You MUST tailor your advice based on this specific profile! If they ask about careers, suggest roles that fit this archetype. If they ask for interview advice, warn them about their 'Areas to Improve' and tell them to highlight their 'Key Strengths'. DO NOT give generic advice. Always refer back to their cognitive traits when relevant.
      
STRICT FORMATTING RULE: You MUST format your responses to be highly readable. 
- Use short paragraphs (separated by blank lines).
- Use bullet points for lists.
- Use **bold** text to emphasize key terms, tool names, or important concepts.
- NEVER output a single giant solid block of text.

CRITICAL TOOL INSTRUCTIONS: 
You have access to two tools:
1. 'find_real_jobs': USE THIS ONLY if the user explicitly asks to find job vacancies, open the job board, or search for jobs (e.g., "cari kerja", "lowongan").
2. 'generate_portfolio': USE THIS ONLY if the user explicitly asks to generate a portfolio, create a resume, or build a CV (e.g., "buat portofolio", "generate resume").
DO NOT mix them up. If the user asks for a portfolio, DO NOT call find_real_jobs. If they ask a general question or say "halo", do NOT call any tools.`;
    } else {
      systemPrompt += `\n\nThe user has not completed their cognitive interview yet. Encourage them to take the interview to get personalized advice.`;
    }

    // Environmental Context (Fix #4)
    if (currentPath) {
      let envDesc = "Pengguna sedang berada di dalam aplikasi NeuroPath.";
      if (currentPath.includes("/dashboard/roadmap")) {
        envDesc = "PENTING: Pengguna saat ini sedang membuka halaman 'Roadmap Karir'. Mereka sedang melihat panduan langkah demi langkah (milestones) untuk mencapai target karir mereka. Berikan saran yang berorientasi pada pencapaian langkah-langkah praktis.";
      } else if (currentPath.includes("/dashboard/profile")) {
        envDesc = "PENTING: Pengguna saat ini sedang membuka halaman 'Profil Analitik'. Mereka sedang melihat grafik skor kognitif, kelemahan, dan kelebihan mereka secara mendetail. Berikan analisis atau motivasi psikologis yang mendalam.";
      } else if (currentPath === "/dashboard") {
        envDesc = "PENTING: Pengguna saat ini sedang berada di halaman utama 'Dasbor'. Mereka melihat ringkasan umum (Overview).";
      } else if (currentPath.includes("/interview")) {
        envDesc = "PENTING: Pengguna saat ini sedang berada di halaman 'Interview Room'. Mereka mungkin bersiap untuk wawancara AI atau baru saja menyelesaikannya.";
      }
      
      systemPrompt += `\n\nENVIRONMENTAL CONTEXT:\n${envDesc}`;
    }

    // Convert frontend messages to Groq format
    const formattedMessages = messages.map(msg => ({
      role: msg.sender === "ai" ? "assistant" : "user",
      content: msg.text
    }));

    const tools = [
      {
        type: "function",
        function: {
          name: "find_real_jobs",
          description: "STRICT REQUIREMENT: ONLY call this tool if the user explicitly says words like 'cari kerja', 'lowongan', 'job search', or 'pekerjaan nyata'. NEVER call this tool if the user asks to generate a portfolio or resume.",
          parameters: {
            type: "object",
            properties: {
              jobTitles: {
                type: "array",
                items: { type: "string" },
                description: "2-3 highly specific job titles matching the user's archetype."
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "2-3 broad skills or keywords matching the user."
              }
            },
            required: ["jobTitles", "keywords"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_portfolio",
          description: "STRICT REQUIREMENT: ONLY call this tool if the user explicitly asks to 'generate portfolio', 'buat resume', 'bikin CV', or anything related to creating a portfolio.",
          parameters: {
            type: "object",
            properties: {
              intent: { type: "string", description: "The intent, always 'portfolio'" }
            },
            required: ["intent"]
          }
        }
      }
    ];

    let response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Updated to the latest supported model
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedMessages
      ],
      tools: tools,
      tool_choice: "auto",
      temperature: 0.6,
      max_tokens: 1500,
    });

    const responseMessage = response.choices[0]?.message;

    // Handle Tool Calling
    if (responseMessage?.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function.name === "find_real_jobs") {
        return NextResponse.json({ 
          reply: "Tentu, saya akan membukakan panel Analisis Pencarian Kerja untuk Anda sekarang...", 
          action: "TRIGGER_JOB_MODAL" 
        });
      } else if (toolCall.function.name === "generate_portfolio") {
        return NextResponse.json({ 
          reply: "Siap! Saya akan membukakan panel Generate Portfolio Anda sekarang...", 
          action: "TRIGGER_PORTFOLIO_MODAL" 
        });
      }
    }

    const replyText = response.choices[0]?.message?.content || "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";

    return NextResponse.json({ reply: replyText });

  } catch (error) {
    console.error("API Assistant Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
