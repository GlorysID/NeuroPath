import { NextResponse } from 'next/server';

// Map readinessLevel to LinkedIn experience filter
const SENIORITY_MAP = {
  'Student': '1',       // Internship
  'Fresh Grad': '2',    // Entry level
  'Professional': '3,4', // Associate + Mid-Senior
  'Switcher': '2,3',    // Entry + Associate
};

async function searchJobs(keywords, location = "Indonesia") {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) return null;

  try {
    const query = encodeURIComponent(keywords.join(" "));
    const loc = encodeURIComponent(location);
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${query}%20in%20${loc}&page=1&num_pages=1&date_posted=week`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "jsearch.p.rapidapi.com"
        }
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data) return null;

    return data.data.slice(0, 6).map(job => ({
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country,
      url: job.job_apply_link || `https://www.google.com/search?q=${encodeURIComponent(job.job_title + ' ' + job.employer_name + ' apply')}`,
      type: job.job_employment_type || "Full-time",
      posted: job.job_posted_at_datetime_utc
    }));
  } catch (e) {
    console.error("JSearch error:", e);
    return null;
  }
}

function buildLinkedInUrl(jobTitles, keywords = [], readinessLevel, location = "Indonesia") {
  // Mix job titles with broad cognitive keywords to guarantee results even for niche roles
  const searchTerms = [...jobTitles.slice(0, 2), ...keywords.slice(0, 2)];
  const query = searchTerms.join(" OR ");
  const exp = SENIORITY_MAP[readinessLevel] || "2,3";
  const params = new URLSearchParams({
    keywords: query,
    location,
    f_E: exp,
    f_TPR: "r604800", // Past week
    sortBy: "R"        // Most relevant
  });
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
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
      systemPrompt = `You are an AI career agent named OpenClaw. Look at this user profile: ${JSON.stringify(profile)}. Generate 2 short, proactive, and slightly urgent recommendations or observations about their career trajectory as if you are analyzing them in real-time. Make it sound like a live agent feed. Return plain text.`;

    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    if (lang === 'id') {
      systemPrompt += " Respond in Indonesian.";
    } else {
      systemPrompt += " Respond in English.";
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }],
        max_tokens: 400,
        temperature: action === "jobs" ? 0.2 : 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Agent API Error: ${await response.text()}`);
    }

    const data = await response.json();
    const rawResult = data.choices[0].message.content;

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

    return NextResponse.json({ result: rawResult });
  } catch (error) {
    console.error("Error in Agent API:", error);
    return NextResponse.json({ error: "Failed to generate agent response" }, { status: 500 });
  }
}

