import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { callAI } from '../../../lib/ai';

const INTERVIEW_STATES = ["PROFILING", "TECHNICAL_DEEP_DIVE", "CASE_STUDY", "STRATEGIC_BRANDING"];
const SCORE_THRESHOLD = 20;

export async function POST(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { messages = [], lang = 'id', interviewType, userId = "guest_temp", isReset = false } = body;
    const safeMessages = Array.isArray(messages) ? messages.filter(m => m && typeof m.text === 'string') : [];

    // 1. Fetch State from Firestore with safe defaults
    let userData = {};
    let interviewState = {
      currentState: "PROFILING",
      currentScore: 0,
      askedQuestions: [],
      currentTranscript: [],
      lastSessionSummary: ""
    };

const withTimeout = (promise, ms = 1500) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
  ]);

    try {
      if (userId) {
        const stateRef = doc(db, 'users', userId);
        const stateSnap = await withTimeout(getDoc(stateRef), 1500);
        if (stateSnap && stateSnap.exists()) {
          userData = stateSnap.data() || {};
          if (userData.interviewState) {
            interviewState = {
              currentState: userData.interviewState.currentState || "PROFILING",
              currentScore: typeof userData.interviewState.currentScore === 'number' ? userData.interviewState.currentScore : 0,
              askedQuestions: Array.isArray(userData.interviewState.askedQuestions) ? userData.interviewState.askedQuestions : [],
              currentTranscript: Array.isArray(userData.interviewState.currentTranscript) ? userData.interviewState.currentTranscript : [],
              lastSessionSummary: userData.interviewState.lastSessionSummary || ""
            };
          }
        }
      }
    } catch (dbErr) {
      console.warn("Firestore read skipped or timed out:", dbErr.message);
    }

    // Manual Reset handling
    if (isReset) {
      interviewState.currentScore = 0;
      interviewState.currentTranscript = [];
      // we intentionally keep `askedQuestions` so the AI doesn't repeat the exact same questions from the bad run
    }

    // RESTORE SESSION: If it's the initial load but we have a saved transcript (and not resetting)
    if (!isReset && safeMessages.length === 0 && interviewState.currentTranscript && interviewState.currentTranscript.length > 0) {
      return NextResponse.json({ 
        restoredTranscript: interviewState.currentTranscript,
        newState: interviewState.currentState,
        currentScore: interviewState.currentScore,
        threshold: SCORE_THRESHOLD,
        askedQuestionsCount: interviewState.askedQuestions.length
      });
    }

    let langInstruction = "You MUST speak and respond ONLY in English.";
    let initialPromptText = "Tell me one topic or field you master the most. If you are not sure, just tell me one hobby or leisure activity you do most often lately.";
    
    if (lang === 'id') {
      langInstruction = "You MUST speak and respond ONLY in Indonesian (Bahasa Indonesia).";
      initialPromptText = "Sebutkan satu topik atau bidang yang paling Anda kuasai. Jika Anda belum yakin, ceritakan saja satu hobi atau aktivitas luang yang paling sering Anda lakukan akhir-akhir ini.";
    }

    // BYPASS LLM ON INITIAL LOAD (ONLY FOR PROFILING): Guarantee language compliance and save tokens
    if (safeMessages.length === 0 && interviewState.currentState === "PROFILING") {
       interviewState.currentTranscript = [{ sender: "ai", text: initialPromptText }];
       try {
         if (userId) {
           const stateRef = doc(db, 'users', userId);
           withTimeout(setDoc(stateRef, { interviewState }, { merge: true }), 1500).catch(e => {
             console.warn("Could not save initial interview state (background):", e.message);
           });
         }
       } catch (dbSaveErr) {
         console.warn("Could not save initial interview state:", dbSaveErr);
       }
       return NextResponse.json({ 
         reply: initialPromptText,
         newState: interviewState.currentState,
         currentScore: interviewState.currentScore,
         threshold: SCORE_THRESHOLD,
         askedQuestionsCount: interviewState.askedQuestions.length
       });
    }

    // INITIAL PROMPT FOR ADVANCED PHASES ON FRESH LOAD
    if (safeMessages.length === 0 && interviewState.currentState !== "PROFILING") {
      let phasePrompt = "";
      if (interviewState.currentState === "TECHNICAL_DEEP_DIVE") {
        phasePrompt = lang === 'id'
          ? "Mari kita masuk ke aspek teknis. Apa keahlian teknis atau konsep inti yang paling sering Anda gunakan?"
          : "Let us dive into technical aspects. What core technical skill or concept do you apply most frequently?";
      } else if (interviewState.currentState === "CASE_STUDY") {
        phasePrompt = lang === 'id'
          ? "Mari kita bahas studi kasus nyata. Bagaimana cara Anda mengatasi kendala tak terduga dalam sebuah proyek?"
          : "Let us discuss a real case study. How do you resolve unexpected roadblocks during a project?";
      } else {
        phasePrompt = lang === 'id'
          ? "Di tahap strategis ini, apa tujuan atau visi jangka panjang yang ingin Anda capai dalam karir Anda?"
          : "In this strategic phase, what long-term vision or career impact do you strive to achieve?";
      }
      interviewState.currentTranscript = [{ sender: "ai", text: phasePrompt }];
      try {
        if (userId) {
          const stateRef = doc(db, 'users', userId);
          withTimeout(setDoc(stateRef, { interviewState }, { merge: true }), 1500).catch(e => {
            console.warn("Could not save phase prompt state (background):", e.message);
          });
        }
      } catch (dbSaveErr) {
        console.warn("Could not save phase prompt state:", dbSaveErr);
      }
      return NextResponse.json({
        reply: phasePrompt,
        newState: interviewState.currentState,
        currentScore: interviewState.currentScore,
        threshold: SCORE_THRESHOLD,
        askedQuestionsCount: interviewState.askedQuestions.length
      });
    }

    // STATE LOCKING: Validate that the requested interview type matches current state
    if (interviewType && INTERVIEW_STATES.includes(interviewType)) {
      const requestedIndex = INTERVIEW_STATES.indexOf(interviewType);
      const currentIndex = INTERVIEW_STATES.indexOf(interviewState.currentState);
      if (requestedIndex > currentIndex) {
        return NextResponse.json(
          { error: "State Locked. Complete the current phase before advancing." },
          { status: 403 }
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
2. ANCHOR & DIG DEEP: Once the user provides a topic/hobby, you MUST anchor ALL your subsequent questions strictly to that topic. Turn their hobby/expertise into a professional cognitive question.
3. SCORE ACCELERATION: To ensure a professional 10-question demonstration, if the user provides ANY coherent answer, you MUST reward them. Secretly end your response EXACTLY with the format: [SCORE: 2].

CRITICAL QUESTION QUALITY RULES (HIGHEST PRIORITY - MORE IMPORTANT THAN EVERYTHING ELSE):
1. EXACTLY ONE QUESTION: Your entire reply must contain exactly ONE question mark ("?"). NEVER ask two questions, NEVER say "A, B, dan C?". One question, and nothing else.
2. SHORT: The question must be AT MOST 20 words. One short sentence.
3. SIMPLE LANGUAGE: Write like a friendly human talking to a high school student. If you need a technical term, explain it in parentheses in 3 words max, or avoid it entirely. NEVER use jargon the user did not introduce themselves. NEVER open with definitions, explanations, or mini-lectures.
4. NO LISTS: Never use bullets, numbering, or multi-part questions.
5. STRUCTURE: Optional short friendly phrase (max 5 words), then the single question ending with "?".

PER-PHASE QUESTION STYLE:
- PROFILING: Ask about hobbies or favorite topics. Examples: "Hobi apa yang paling kamu nikmati?" or "Topik apa yang paling kamu kuasai?"
- TECHNICAL_DEEP_DIVE: Pick ONE simple concept from the user's own words and ask "Bagaimana cara kamu ...?" or "Apa yang terjadi kalau ...?". Use THEIR words, not new technical terms.
- CASE_STUDY: Set a tiny everyday scenario in ONE short sentence, then ask ONE simple question like "Apa yang akan kamu lakukan?"
- STRATEGIC_BRANDING: Ask about dreams simply: "Di mana kamu membayangkan dirimu lima tahun lagi?" or "Mimpi terbesarmu di bidang ini apa?"

RULES:
1. NEVER ask about topics listed in FORBIDDEN QUESTIONS.
2. ${langInstruction}
3. EVALUATION: You MUST end your response exactly with the format: [SCORE: X] (e.g., [SCORE: 2]). This tag is hidden from the user. Use 2 for normal answers, or 0 if they completely dodge the question.
4. CRITICAL SECRECY: DO NOT ever mention the word "score", "nilai", or tell the user you are evaluating them in your dialogue. Keep your dialogue strictly conversational.
5. NATURAL TRANSITIONS: You MUST NEVER mention system backend variables like "PROFILING", "TECHNICAL_DEEP_DIVE", "CASE_STUDY", or "STRATEGIC_BRANDING" in your dialogue. Do not announce phases to the user. Speak completely naturally like a human interviewer gracefully moving to a new topic.
6. ALWAYS ASK A QUESTION: You are the interviewer. Your response MUST ALWAYS end with a question asking the user for their thoughts, decisions, or elaborations. NEVER end your turn with just a statement.
`;

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...safeMessages.slice(-5).map(msg => ({
        role: msg.sender === "ai" ? "assistant" : "user",
        content: String(msg.text || "")
      }))
    ];

    let replyText = "";
    try {
      const { content } = await callAI({
        messages: apiMessages,
        maxTokens: 300,
        temperature: 0.7
      });
      replyText = content || "";
    } catch (aiErr) {
      console.error("AI call in interview API error:", aiErr);
    }

    // Contextual fallback if AI output is empty
    if (!replyText || replyText.trim().length === 0) {
      replyText = lang === 'id'
        ? "Menarik sekali pemikiran Anda. Bagaimana biasanya Anda mempraktikkan hal tersebut dalam kegiatan sehari-hari? [SCORE: 2]"
        : "Very interesting point. How do you usually put that into practice in your daily work? [SCORE: 2]";
    }
    
    // 4. Parse Score and Update State
    let score = 0;
    if (safeMessages.length > 0) {
      const scoreMatch = replyText.match(/\[SCORE:\s*(\d+)\]/i) || replyText.match(/Skor.*?(\d+)/i);
      if (scoreMatch) {
        score = parseInt(scoreMatch[1], 10);
      }
    }
    
    // Cleanup: remove [SCORE: X] tags and unwanted metadata words
    replyText = replyText.replace(/\[SCORE:\s*\d+\]/gi, '').trim();
    replyText = replyText.split(/(?<=[.?!])\s+/).filter(sentence => {
      const lower = sentence.toLowerCase();
      return !lower.includes('skor') && !lower.includes('nilai') && !lower.includes('evaluasi') && !lower.includes('batas maksimal');
    }).join(' ').trim();

    // SINGLE-QUESTION GUARD: cut everything after the first "?" so the reply can never contain multiple questions
    const firstQuestionMark = replyText.indexOf('?');
    if (firstQuestionMark > -1) {
      replyText = replyText.slice(0, firstQuestionMark + 1).trim();
    }

    if (!replyText) {
      replyText = lang === 'id'
        ? "Menarik. Bisa Anda ceritakan lebih detail mengenai hal itu?"
        : "Interesting. Could you tell me more about that in detail?";
    }

    // Don't save empty AI replies to history
    if (replyText.length > 5) {
      interviewState.askedQuestions.push(replyText);
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
      // End the current interview session when a phase is completed
      replyText += " [END_INTERVIEW]";
      interviewState.currentTranscript = []; // Clear transcript for next phase
    } else {
      // Save current progress to transcript
      interviewState.currentTranscript = [
        ...safeMessages,
        { sender: "ai", text: replyText }
      ];
    }

    // Save back to Firestore safely
    try {
      if (userId) {
        const stateRef = doc(db, 'users', userId);
        userData.interviewState = interviewState;
        withTimeout(setDoc(stateRef, userData, { merge: true }), 1500).catch(e => {
          console.warn("Could not persist interview state (background):", e.message);
        });
      }
    } catch (dbSaveErr) {
      console.warn("Could not persist interview state to Firestore:", dbSaveErr);
    }
    
    return NextResponse.json({ 
      reply: replyText,
      newState: interviewState.currentState,
      currentScore: interviewState.currentScore,
      threshold: SCORE_THRESHOLD,
      askedQuestionsCount: interviewState.askedQuestions.length
    });
  } catch (error) {
    console.error("Fatal error caught in interview API:", error);
    // Never crash with internal server anomaly; provide smooth continuation
    const safeFallback = "Menarik sekali pandangan Anda. Dari pengalaman tersebut, apa tantangan terbesar yang pernah Anda hadapi dan bagaimana solusinya?";
    return NextResponse.json({ 
      reply: safeFallback,
      newState: "PROFILING",
      currentScore: 2,
      threshold: SCORE_THRESHOLD,
      askedQuestionsCount: 1
    });
  }
}
