import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, getDocs, getDoc, setDoc, doc } from 'firebase/firestore';
import { searchJobs, buildLinkedInUrl } from '../../../lib/jobService';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(req) {
  try {
    const { query, userId, lang } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json({ error: "Query too short" }, { status: 400 });
    }

    const q = query.trim().toLowerCase();
    const userRef = doc(db, "users", userId || "guest_temp");
    let profile = null;

    // 1. Search counseling journal notes (Firestore subcollection)
    let notes = [];
    try {
      const notesSnap = await getDocs(collection(db, "users", userRef.id, "notes"));
      notesSnap.forEach((d) => {
        const data = d.data();
        const title = (data.title || "").toLowerCase();
        const content = (data.content || "").toLowerCase();
        if (title.includes(q) || content.includes(q)) {
          notes.push({ id: d.id, title: data.title, content: data.content, createdAt: data.createdAt });
        }
      });
    } catch (e) {
      console.error("Search notes error:", e);
    }

    // 2. Search roadmap milestones (from user profile)
    let roadmap = [];
    try {
      const userSnap = await getDoc(userRef);
      profile = userSnap.exists() ? userSnap.data()?.profile : null;
      if (profile && Array.isArray(profile.milestones)) {
        roadmap = profile.milestones.filter((m) => {
          const title = (m.title || "").toLowerCase();
          const desc = (m.description || "").toLowerCase();
          return title.includes(q) || desc.includes(q);
        });
      }
    } catch (e) {
      console.error("Search roadmap error:", e);
    }

    // 3. Search live jobs (JSearch with Firestore cache + LinkedIn fallback)
    let jobs = [];
    let linkedinUrl = buildLinkedInUrl([query.trim()], [], profile?.readinessLevel || "Student");
    try {
      const userSnap = await getDoc(userRef);
      const cacheMap = userSnap.exists() ? userSnap.data()?.jobSearchCache || {} : {};
      const cached = cacheMap[query.trim()];

      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        jobs = cached.jobs || [];
      } else {
        const fresh = await searchJobs([query.trim()], "Indonesia");
        if (fresh && fresh.length > 0) {
          jobs = fresh;
          try {
            await setDoc(userRef, {
              jobSearchCache: { ...cacheMap, [query.trim()]: { jobs: fresh, ts: Date.now() } }
            }, { merge: true });
          } catch (e) {
            console.error("Cache save error:", e);
          }
        } else if (cached) {
          jobs = cached.jobs || [];
        }
      }
    } catch (e) {
      console.error("Search jobs error:", e);
    }

    return NextResponse.json({ notes, roadmap, jobs, linkedinUrl });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
