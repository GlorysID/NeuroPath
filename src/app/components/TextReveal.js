"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function TextReveal({ text, className }) {
  const containerRef = useRef(null);
  
  // Track scroll position of this text block
  const { scrollYProgress } = useScroll({
    target: containerRef,
    // Start revealing when the top of the element hits 80% down the screen.
    // Finish revealing when the bottom of the element hits 50% of the screen.
    offset: ["start 80%", "end 50%"]
  });

  // Split into individual words
  const words = text.split(" ");

  return (
    <h2 
      ref={containerRef} 
      className={className} 
      style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center', 
        gap: '0.25em' 
      }}
    >
      {words.map((word, i) => {
        // We calculate a specific progress range for each word.
        // e.g., the first word fades in from 0% to 10% of scrollYProgress.
        // the last word fades in from 90% to 100% of scrollYProgress.
        const start = i / words.length;
        const end = start + (1 / words.length);
        
        // This is a custom hook inside a loop, which breaks React rules normally, 
        // but useTransform is memoized. Wait, to be safe and strict with React Hooks,
        // we should create a sub-component, OR calculate it statically.
        // Actually, we can use a single useTransform that maps scroll progress to an array,
        // or just use a subcomponent for each Word.
        return <Word key={i} word={word} progress={scrollYProgress} range={[start, end]} />;
      })}
    </h2>
  );
}

// Subcomponent ensures we don't break hook rules (calling hooks inside map)
function Word({ word, progress, range }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity }}>
      {word}
    </motion.span>
  );
}
