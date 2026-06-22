// Map readinessLevel to LinkedIn experience filter
export const SENIORITY_MAP = {
  'Student': '1',       // Internship
  'Fresh Grad': '2',    // Entry level
  'Professional': '3,4', // Associate + Mid-Senior
  'Switcher': '2,3',    // Entry + Associate
};

export async function searchJobs(keywords, location = "Indonesia") {
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

export function buildLinkedInUrl(jobTitles, keywords = [], readinessLevel, location = "Indonesia") {
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
