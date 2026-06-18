import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const INTERVIEW_STATES = ["PROFILING", "TECHNICAL_DEEP_DIVE", "CASE_STUDY", "STRATEGIC_BRANDING"];
const SCORE_THRESHOLD = 20;

export async function POST(req) {
  try {
    const { messages, lang, interviewType, userId = "guest_temp" } = await req.json();

    // 1. Fetch State from Firestore
    const stateRef = doc(db, 'users', userId);
    const stateSnap = await getDoc(stateRef);
    let userData = stateSnap.exists() ? stateSnap.data() : {};
    let interviewState = userData.interviewState || {
      currentState: "PROFILING",
      currentScore: 0,
      askedQuestions: [],
      lastSessionSummary: ""
    };

    let langInstruction = "You MUST speak and respond ONLY in English.";
    let initialPromptText = "Tell me one topic or field you master the most. If you are not sure, just tell me one hobby or leisure activity you do most often lately.";
    
    if (lang === 'id') {
      langInstruction = "You MUST speak and respond ONLY in Indonesian (Bahasa Indonesia).";
      initialPromptText = "Sebutkan satu topik atau bidang yang paling Anda kuasai. Jika Anda belum yakin, ceritakan saja satu hobi atau aktivitas luang yang paling sering Anda lakukan akhir-akhir ini.";
    }

    // STATE LOCKING: Validate that the requested interview type matches current state
    if (interviewType && INTERVIEW_STATES.includes(interviewType)) {
      const requestedIndex = INTERVIEW_STATES.indexOf(interviewType);
      const currentIndex = INTERVIEW_STATES.indexOf(interviewState.currentState);
      if (requestedIndex > currentIndex) {
        return new Response(
          JSON.stringify({ error: "State Locked. Complete the current phase before advancing." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const typeContext = interviewType 
      ? `This specific interview session is focused on: "${interviewType}". Tailor your questions around this topic, but keep them accessible.` 
      : `This is a progressive cognitive and career profiling interview applicable to ANY profession (business, arts, healthcare, trades, etc.). Do not assume the user is in technology.`;

    const userArchetype = userData.profile?.archetype;
    const archetypeContext = userArchetype 
      ? `User's Locked Profession/Archetype: "${userArchetype}". CRITICAL: You MUST tailor ALL your questions, scenarios, and vocabulary specifically to this profession. Do NOT ask generic questions or guess their profession.`
      : `The user's profession is currently uncalibrated.`;

    let humanReadablePhase = "";
    if (interviewState.currentState === "PROFILING") humanReadablePhase = "getting to know their background and topic of interest";
    else if (interviewState.currentState === "TECHNICAL_DEEP_DIVE") humanReadablePhase = "asking a deeper technical or conceptual question based on their topic";
    else if (interviewState.currentState === "CASE_STUDY") humanReadablePhase = "giving them a brief, practical scenario or problem to solve";
    else if (interviewState.currentState === "STRATEGIC_BRANDING") humanReadablePhase = "asking about their long-term vision or strategic impact";

    // 2. Build CONTEXT_BLOCK
    const CONTEXT_BLOCK = `
=========================================
[NEUROPATH SYSTEM CONTEXT BLOCK - DO NOT IGNORE]
Your goal for this specific reply: Focus on ${humanReadablePhase}.
Target Threshold: ${SCORE_THRESHOLD} points to advance. (Current: ${interviewState.currentScore} pts)
${archetypeContext}

FORBIDDEN QUESTIONS (You have already asked these, DO NOT repeat the same topic):
${interviewState.askedQuestions.length > 0 ? interviewState.askedQuestions.map(q => "- " + q).join('\n') : "None."}
=========================================
`;

    // 3. System Prompt
    const SYSTEM_PROMPT = `
You are the NeuroPath Core Intelligence. Your task is to conduct an immersive, conversational interview with the user.
${typeContext}

${CONTEXT_BLOCK}

CRITICAL ADAPTIVE EXPERTISE MODE INSTRUCTIONS (FOR DEMO/FAST INTERVIEW):
1. INITIAL QUESTION: If the user has NOT provided any topic yet (if FORBIDDEN QUESTIONS is "None."), you MUST open the interview EXACTLY with this friendly prompt: "${initialPromptText}"
2. ANCHOR & DIG DEEP: Once the user provides a topic/hobby, you MUST anchor all your subsequent questions strictly to that topic. Turn their hobby/expertise into a professional cognitive question.
3. FAST-PACED: Keep your questions SHORT and VERY EASY to understand. Do not ask multiple questions at once. Ask ONE focused question.
4. SCORE ACCELERATION: To ensure a professional 10-question demonstration, if the user provides ANY coherent answer, you MUST reward them. Secretly end your response EXACTLY with the format: [SCORE: 2].

RULES:
1. NEVER ask about topics listed in FORBIDDEN QUESTIONS.
2. ${langInstruction}
3. EVALUATION: You MUST end your response exactly with the format: [SCORE: X] (e.g., [SCORE: 2]). This tag is hidden from the user. Use 2 for normal answers, or 0 if they completely dodge the question.
4. CRITICAL SECRECY: DO NOT ever mention the word "score", "nilai", or tell the user you are evaluating them in your dialogue. Keep your dialogue strictly conversational.
5. NATURAL TRANSITIONS: You MUST NEVER mention system backend variables like "PROFILING", "TECHNICAL_DEEP_DIVE", "CASE_STUDY", or "STRATEGIC_BRANDING" in your dialogue. Do not announce phases to the user. Speak completely naturally like a human interviewer gracefully moving to a new topic.
`;

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-5).map(msg => ({
        role: msg.sender === "ai" ? "assistant" : "user",
        content: msg.text
      }))
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: apiMessages,
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error response:", errorText);
      return new Response(JSON.stringify({ error: `System Error. Failed to connect to Neural Core. Detail: ${errorText.substring(0, 100)}` }), { status: response.status });
    }

    const data = await response.json();
    let replyText = data.choices && data.choices[0] ? data.choices[0].message.content : "System Error. Response format invalid.";
    
    // 4. Parse Score and Update State
    let score = 0;
    const scoreMatch = replyText.match(/\[SCORE:\s*(\d+)\]/i) || replyText.match(/Skor.*?(\d+)/i);
    if (scoreMatch) {
      score = parseInt(scoreMatch[1], 10);
    }
    
    // Aggressive cleanup: remove [SCORE: X] tags and any sentences containing the word "skor", "nilai", "evaluasi", or "batas maksimal"
    replyText = replyText.replace(/\[SCORE:\s*\d+\]/gi, '').trim();
    replyText = replyText.split(/(?<=[.?!])\s+/).filter(sentence => {
      const lower = sentence.toLowerCase();
      return !lower.includes('skor') && !lower.includes('nilai') && !lower.includes('evaluasi') && !lower.includes('batas maksimal');
    }).join(' ').trim();
    
    if (!replyText) {
      replyText = "Menarik. Bisa Anda ceritakan lebih detail mengenai hal itu?";
    }

    // Don't save empty AI replies to history
    if (replyText.length > 5) {
      interviewState.askedQuestions.push(replyText);
      // Keep history manageable (last 10 questions)
      if (interviewState.askedQuestions.length > 10) {
        interviewState.askedQuestions.shift();
      }
    }

    // Update Score & State Progression
    interviewState.currentScore += score;
    if (interviewState.currentScore >= SCORE_THRESHOLD) {
      const currentIndex = INTERVIEW_STATES.indexOf(interviewState.currentState);
      if (currentIndex < INTERVIEW_STATES.length - 1) {
        interviewState.currentState = INTERVIEW_STATES[currentIndex + 1];
        interviewState.currentScore = 0; // Reset score for new state
        interviewState.lastSessionSummary += `\nUser successfully completed ${INTERVIEW_STATES[currentIndex]} phase.`;
      } else {
        // Finished all states
        interviewState.currentState = "COMPLETED";
      }
      // Always end the current interview session when a phase is completed!
      replyText += " [END_INTERVIEW]";
    }

    // Save back to Firestore (Only save if not guest_temp, though guest_temp will just create a dummy doc)
    userData.interviewState = interviewState;
    await setDoc(stateRef, userData, { merge: true });
    
    return new Response(JSON.stringify({ 
      reply: replyText,
      newState: interviewState.currentState,
      currentScore: interviewState.currentScore,
      threshold: SCORE_THRESHOLD,
      askedQuestionsCount: interviewState.askedQuestions.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in interview API:", error);
    return new Response(JSON.stringify({ error: "System Error. Internal server anomaly." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
