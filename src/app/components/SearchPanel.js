"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import styles from "./SearchPanel.module.css";

export default function SearchPanel({ userId }) {
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const t = {
    placeholder: lang === 'id' ? "Cari jurnal, roadmap, atau lowongan..." : "Search journal, roadmap, or jobs...",
    title: lang === 'id' ? "Pencarian" : "Search",
    notesGroup: lang === 'id' ? "Jurnal Bimbingan" : "Counseling Journal",
    roadmapGroup: lang === 'id' ? "Milestone Roadmap" : "Roadmap Milestones",
    jobsGroup: lang === 'id' ? "Lowongan Live" : "Live Jobs",
    noNotes: lang === 'id' ? "Tidak ada catatan yang cocok." : "No matching notes.",
    noRoadmap: lang === 'id' ? "Tidak ada milestone yang cocok." : "No matching milestones.",
    noJobs: lang === 'id' ? "Belum ada lowongan live (coba kata kunci lain)." : "No live jobs found (try another keyword).",
    empty: lang === 'id' ? "Ketik kata kunci untuk mencari jurnal, milestone, dan lowongan sekaligus." : "Type a keyword to search notes, milestones, and jobs at once.",
    openLinkedin: lang === 'id' ? "Buka Pencarian LinkedIn" : "Open LinkedIn Search",
    searching: lang === 'id' ? "Mencari..." : "Searching...",
    error: lang === 'id' ? "Pencarian gagal. Coba lagi." : "Search failed. Try again.",
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q || q.length < 2) {
      setResults(null);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, userId, lang })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "search failed");
        setResults(data);
        setError("");
      } catch (e) {
        console.error("Search error:", e);
        setError(t.error);
        setResults(null);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query, lang]);

  const totalHits = results ? (results.notes?.length || 0) + (results.roadmap?.length || 0) + (results.jobs?.length || 0) : 0;

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>{t.title}</h3>

      <div className={styles.searchBox}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.placeholder}
          className={styles.input}
        />
        {loading && <span className={styles.spinner} />}
      </div>

      <div className={styles.results}>
        {!searched && !loading && <p className={styles.empty}>{t.empty}</p>}
        {error && <p className={styles.empty}>{error}</p>}
        {searched && !loading && totalHits === 0 && (
          <p className={styles.empty}>{lang === 'id' ? `Tidak ada hasil untuk "${query}".` : `No results for "${query}".`}</p>
        )}

        {results?.notes?.length > 0 && (
          <div className={styles.group}>
            <h4 className={styles.groupTitle}>{t.notesGroup} <span className={styles.groupCount}>{results.notes.length}</span></h4>
            {results.notes.map((n) => (
              <div key={`n-${n.id}`} className={styles.item}>
                <span className={styles.itemTitle}>{n.title}</span>
                <span className={styles.itemMeta}>{n.content}</span>
              </div>
            ))}
          </div>
        )}

        {results?.roadmap?.length > 0 && (
          <div className={styles.group}>
            <h4 className={styles.groupTitle}>{t.roadmapGroup} <span className={styles.groupCount}>{results.roadmap.length}</span></h4>
            {results.roadmap.map((m, i) => (
              <div key={`r-${i}`} className={styles.item}>
                <span className={styles.itemTitle}>{m.title}</span>
                <span className={styles.itemMeta}>{m.description}</span>
              </div>
            ))}
          </div>
        )}

        {results?.jobs?.length > 0 && (
          <div className={styles.group}>
            <h4 className={styles.groupTitle}>{t.jobsGroup} <span className={styles.groupCount}>{results.jobs.length}</span></h4>
            {results.jobs.map((j, i) => (
              <div key={`j-${i}`} className={styles.item}>
                <span className={styles.itemTitle}>{j.title}</span>
                <span className={styles.itemMeta}>{j.company} · {j.location}</span>
                <a href={j.url} target="_blank" rel="noopener noreferrer" className={styles.itemLink}>
                  {lang === 'id' ? "Lamar →" : "Apply →"}
                </a>
              </div>
            ))}
          </div>
        )}

        {results?.linkedinUrl && results?.jobs?.length === 0 && (
          <a href={results.linkedinUrl} target="_blank" rel="noopener noreferrer" className={styles.linkedinBtn}>
            {t.openLinkedin} →
          </a>
        )}
      </div>
    </div>
  );
}
