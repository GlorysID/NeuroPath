"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import styles from "./ChatWidget.module.css";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Halo! Saya adalah Asisten Kognitif NeuroPath Anda. Saya telah membaca profil Anda. Ada pertanyaan tentang karir atau skor Anda?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const messagesEndRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Listen to external toggle events (e.g., from FloatingDock)
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleChatWidget', handleToggle);
    return () => window.removeEventListener('toggleChatWidget', handleToggle);
  }, []);

  // Fetch user data on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data().profile || null);
          }
        } catch (error) {
          console.error("Error fetching user profile for ChatWidget:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleWidget = () => setIsOpen(!isOpen);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { sender: "user", text: userText }]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Prune history to last 10 messages (Fix #2: Token Overload)
          messages: [...messages, { sender: "user", text: userText }].slice(-10),
          profile: userData,
          currentPath: pathname // Fix #4: Environmental Awareness
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { sender: "ai", text: data.reply }]);
        
        // Agentic UI Teleportation (Fix #1 Page Dependency)
        if (data.action === "TRIGGER_JOB_MODAL") {
          if (pathname !== "/dashboard") {
            router.push("/dashboard?action=openJobModal");
          } else {
            window.dispatchEvent(new Event("openJobModal"));
          }
        } else if (data.action === "TRIGGER_PORTFOLIO_MODAL") {
          if (pathname !== "/dashboard") {
            router.push("/dashboard?action=openPortfolioModal");
          } else {
            window.dispatchEvent(new Event("openPortfolioModal"));
          }
        }
      } else {
        setMessages(prev => [...prev, { sender: "ai", text: "Maaf, server AI sedang sibuk." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: "ai", text: "Terjadi kesalahan jaringan." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render URLs and Bold text
  const renderFormattedText = (text) => {
    // First, handle bold text (**text**)
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    
    return boldParts.map((boldPart, bIndex) => {
      if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
        const innerText = boldPart.slice(2, -2);
        return <strong key={`b-${bIndex}`}>{innerText}</strong>;
      }
      
      // Then handle URLs within normal text
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return boldPart.split(urlRegex).map((part, index) => {
        if (part.match(urlRegex)) {
          const cleanUrl = part.replace(/[.,)]+$/, "");
          return (
            <a key={`u-${bIndex}-${index}`} href={cleanUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#63b3ed', textDecoration: 'underline' }}>
              {cleanUrl}
            </a>
          );
        }
        return part;
      });
    });
  };

  return (
    <div className={styles.widgetContainer}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className={styles.chatWindow}
          >
            <div className={styles.header}>
              <div className={styles.title} style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <span className={styles.mainTitle}>NeuroPath AI</span>
              </div>
              <button onClick={toggleWidget} className={styles.closeBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className={styles.messages}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`${styles.message} ${msg.sender === "ai" ? styles.ai : styles.user}`}>
                  {renderFormattedText(msg.text)}
                </div>
              ))}
              {isLoading && (
                <div className={`${styles.message} ${styles.ai}`}>
                  <div className={styles.loadingDots}>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
              <form onSubmit={handleSubmit} className={styles.form}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask your mentor..."
                  className={styles.input}
                  disabled={isLoading}
                />
                <button type="submit" disabled={!inputValue.trim() || isLoading} className={styles.sendBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
