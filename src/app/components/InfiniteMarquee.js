"use client";

import styles from "./InfiniteMarquee.module.css";

const CAREERS = [
  "ARCHITECT",
  "CLINICAL PSYCHOLOGIST",
  "UX DESIGNER",
  "MECHANICAL ENGINEER",
  "ENTREPRENEUR",
  "DATA SCIENTIST",
  "CORPORATE LAWYER",
  "MEDICAL DOCTOR",
  "FILM DIRECTOR",
  "FINANCIAL ANALYST",
  "URBAN PLANNER",
  "MARINE BIOLOGIST"
];

export default function InfiniteMarquee() {
  // We duplicate the array multiple times to ensure the screen is fully filled 
  // and the CSS transform translateX(-50%) creates a seamless endless loop.
  const items = [...CAREERS, ...CAREERS, ...CAREERS, ...CAREERS];

  return (
    <div className={styles.marqueeContainer}>
      <div className={styles.marqueeTrack}>
        {items.map((career, index) => (
          <div key={index} className={styles.marqueeItem}>
            {career}
            <span className={styles.separator}>✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
