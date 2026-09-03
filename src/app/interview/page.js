"use client";

import { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from 'three';
import { useGLTF, useAnimations, Environment, Float } from "@react-three/drei";
import { useTheme } from "next-themes";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "../components/LanguageToggle";
import { motion } from "framer-motion";
import styles from "./page.module.css";
import { SkeletonUtils } from "three-stdlib";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

function HumanoidModel({ state }) {
  const modelRef = useRef();
  const { scene, animations } = useGLTF("/models/xbot.glb");
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, modelRef);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const isFirstRun = useRef(true);
  const meshesRef = useRef([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? resolvedTheme : 'dark';

  useEffect(() => {
    const meshes = [];
    clone.traverse((object) => {
      object.frustumCulled = false;
      if (object.isMesh) {
        if (!object.material.isMeshStandardMaterial) {
           object.material = new THREE.MeshStandardMaterial({
             color: '#050505',
             roughness: 0.1,
             metalness: 1.0,
             envMapIntensity: 4.0,
           });
        }
        meshes.push(object);
      }
    });
    meshesRef.current = meshes;

    if (!actions) return;
    
    // Always keep idle playing as a base layer to prevent T-pose
    if (actions['idle']) {
      actions['idle'].play();
    }
    
    let timeScale = 1;
    if (state === "analyzing") {
      timeScale = 1.5;
    }

    // Handle the speaking animation (agree)
    if (actions['agree']) {
      if (state === "speaking") {
        actions['agree'].reset().fadeIn(0.3).play();
      } else {
        actions['agree'].fadeOut(0.3);
      }
    }
    
    // Apply timeScale to all playing actions
    Object.values(actions).forEach(action => {
      if (action.isRunning()) {
        action.setEffectiveTimeScale(timeScale);
      }
    });
    
    if (isFirstRun.current) {
      isFirstRun.current = false;
      // Delay visibility by a split second to hide the 1-frame T-pose from R3F
      setTimeout(() => setIsReady(true), 100);
    }
  }, [state, actions, clone]);

  useFrame(() => {
    const isLightMode = currentTheme === 'light';
    meshesRef.current.forEach((child) => {
      if (!child.material) return;
      const targetR = isLightMode ? 0.95 : 0.02; 
      const targetG = isLightMode ? 0.95 : 0.02;
      const targetB = isLightMode ? 0.95 : 0.02;
      const targetMetalness = isLightMode ? 0.4 : 1.0; 
      const targetRoughness = isLightMode ? 0.1 : 0.1; 
      const targetEnv = isLightMode ? 1.0 : 4.0; 

      child.material.color.r += (targetR - child.material.color.r) * 0.05;
      child.material.color.g += (targetG - child.material.color.g) * 0.05;
      child.material.color.b += (targetB - child.material.color.b) * 0.05;
      
      if (child.material.metalness !== undefined) {
        child.material.metalness += (targetMetalness - child.material.metalness) * 0.05;
        child.material.roughness += (targetRoughness - child.material.roughness) * 0.05;
        child.material.envMapIntensity += (targetEnv - child.material.envMapIntensity) * 0.05;
      }
    });
  });

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.1}
      floatIntensity={0.2}
      floatingRange={[-0.02, 0.02]}
    >
      <primitive 
        object={clone} 
        ref={modelRef}
        scale={3} 
        position={[0, -4.8, 0]} 
        visible={isReady}
      />
    </Float>
  );
}

function InterviewRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewType = searchParams.get('type') || '';
  const { lang } = useLanguage();
  const [state, setState] = useState("initializing"); // initializing, speaking, listening, analyzing, extracting, complete
  const [transcript, setTranscript] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const transcriptRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const submitBtnRef = useRef(null);
  const utteranceRef = useRef(null); // Fix Chrome GC bug for long speeches
  
  // Voice vs Text Mode
  const [interactionMode, setInteractionMode] = useState("voice"); // "voice" | "text"
  const modeRef = useRef("voice");
  useEffect(() => { modeRef.current = interactionMode; }, [interactionMode]);
  
  // Enforce Authenticated Session
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const interviewStarted = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_redirect', '/interview');
        }
        router.push('/login?redirect=/interview');
      } else {
        setCurrentUser(user);
        setAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const getUserId = () => currentUser?.uid || auth.currentUser?.uid || "";

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const currentTheme = mounted ? resolvedTheme : 'dark';

  // --- TEXT TO SPEECH (AI VOICE) ---
  const speakText = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setState("listening"); // Fallback if TTS not supported
      return;
    }

    // Text-to-speech runs in BOTH voice and text mode. 
    // The mode only affects whether the user's microphone turns on afterwards.
    
    // Debounce to prevent multiple rapid triggers (e.g. from React Strict Mode)
    if (window.speakTimeout) clearTimeout(window.speakTimeout);
    
    window.speakTimeout = setTimeout(() => {
      window.speechSynthesis.cancel(); // Must be right before speaking to clear the queue
      window.speechSynthesis.resume(); // Chrome bug workaround: prevents the engine from getting stuck in a silent state
      
      utteranceRef.current = new SpeechSynthesisUtterance(text);
      const availableVoices = window.speechSynthesis.getVoices();
      const targetPrefix = lang === 'id' ? 'id' : 'en';
      const langVoices = availableVoices.filter(v => v.lang.toLowerCase().startsWith(targetPrefix));
      
      // Prioritize high quality neural/online voices
      let bestVoice = langVoices.find(v => v.name.toLowerCase().includes('online') || v.name.toLowerCase().includes('natural')) || 
                      langVoices.find(v => v.name.toLowerCase().includes('google')) ||
                      langVoices[0] ||
                      availableVoices.find(v => v.default) ||
                      availableVoices[0];
                      
      // Explicitly set the language property so the OS knows which accent to force
      utteranceRef.current.lang = lang === 'id' ? 'id-ID' : 'en-US';
      
      if (bestVoice) utteranceRef.current.voice = bestVoice;
      utteranceRef.current.rate = 1.0;
      utteranceRef.current.pitch = 1.0;
      
      utteranceRef.current.onstart = () => setState("speaking");
      utteranceRef.current.onend = () => {
        setState("idle"); // Stop 3D animation immediately
        // Wait 1.5s to ensure speaker reverb is fully dead before opening mic
        setTimeout(() => {
          setInputValue("");
          setInterimText("");
          setState("listening");
        }, 1500); 
      };
      
      // Fallback if browser blocks TTS (e.g. no interaction)
      utteranceRef.current.onerror = (e) => {
        if (e.error === "interrupted" || e.error === "canceled") {
          // Intentionally do nothing. We canceled it manually to clear the queue.
          return;
        }
        console.warn("TTS Audio Blocked or Failed (Often due to lack of user interaction on page load):", e.error || "Unknown Error");
        setState("listening");
      };

      window.speechSynthesis.speak(utteranceRef.current);
    }, 100);
  };

  // --- SPEECH RECOGNITION (HANDS-FREE INPUT) ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = lang === 'id' ? 'id-ID' : 'en-US';

        recognitionRef.current.onresult = (event) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setInterimText(interim);
          
          if (final) {
            setInputValue(prev => {
              const newVal = (prev + " " + final).trim() + " ";
              
              // AUTO-SUBMIT LOGIC: Only auto submit in voice mode
              if (modeRef.current === "voice") {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => {
                   if (submitBtnRef.current) submitBtnRef.current.click();
                }, 3000); // Wait 3 seconds of silence before auto-submitting
              }

              return newVal;
            });
          } else if (interim) {
             // Delay auto-submit while still receiving interim results
             if (modeRef.current === "voice") {
               if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
               silenceTimerRef.current = setTimeout(() => {
                   if (submitBtnRef.current) submitBtnRef.current.click();
               }, 3500); 
             }
          }
        };

        recognitionRef.current.onerror = (e) => {
          // Ignore 'aborted' (manual stop) and 'no-speech' (silence timeout)
          // as they are benign and our auto-restart logic handles them gracefully.
          if (e.error !== "aborted" && e.error !== "no-speech") {
            console.error("Speech error", e.error);
            setState("listening");
          };
        };
        
        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, [lang]);

  // Smoothly apply language changes mid-session to both TTS and Recognition
  useEffect(() => {
    // We intentionally DO NOT cancel window.speechSynthesis here anymore.
    // If the user changes language mid-speech, let the AI finish its current 
    // sentence naturally so the voice doesn't "disappear". The NEXT sentence 
    // will automatically use the new language.

    // 1. Dynamically update the microphone language
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'id' ? 'id-ID' : 'en-US';
      
      // If the mic is currently open, smoothly restart it so the new language takes effect instantly
      if (isRecording) {
        recognitionRef.current.stop();
        setTimeout(() => {
          if (isRecording && recognitionRef.current) {
            recognitionRef.current.start();
          }
        }, 300);
      }
    }
  }, [lang]);

  // Auto-manage microphone based on AI state
  useEffect(() => {
    let startTimer;
    if (state === "listening" && interactionMode === "voice") {
      // Force flush any lingering text before we start listening
      setInputValue("");
      setInterimText("");
      
      startTimer = setTimeout(() => {
        if (recognitionRef.current && !isRecording) {
          try {
            recognitionRef.current.start();
            setIsRecording(true);
          } catch (e) {} // ignore "already started" errors
        }
      }, 300); // Give React state time to clear the input box
    } else {
      if (recognitionRef.current && isRecording) {
        try { recognitionRef.current.stop(); } catch(e) {}
        setIsRecording(false);
      }
    }
    return () => clearTimeout(startTimer);
  }, [state, isRecording, interactionMode]);

  const toggleRecording = () => {
    if (state !== "listening") return;
    
    if (!recognitionRef.current) {
      alert("Microphone not supported in this browser. Please type instead.");
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setInterimText("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const t = {
    placeholder: lang === 'id' ? "Bagikan pemikiran Anda..." : "Share your thoughts...",
    waiting: lang === 'id' ? "Mohon tunggu..." : "Please wait...",
    sysError: lang === 'id' ? "Sistem Error. Gagal terhubung ke Neural Core." : "System Error. Failed to connect to Neural Core.",
    netError: lang === 'id' ? "Kegagalan jaringan." : "Network failure.",
    anomaly: lang === 'id' ? "Anomali koneksi terdeteksi." : "Connection anomaly detected.",
    extracted: lang === 'id' ? "Profil Kognitif Diekstrak. Membuat Cetak Biru personalisasi Anda..." : "Cognitive Profile Extracted. Generating your personalized Blueprint..."
  };

  // Auto scroll to bottom of transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  // Initial sequence
  const startInterview = async (isReset = false) => {
    setState("analyzing");
    if (isReset) {
      setTranscript([]);
      setProgressPercent(0);
      setInputValue("");
      setInterimText("");
      if (typeof window !== 'undefined' && window.speechSynthesis) {
         // Fix iOS/Chrome TTS bug: Unlock audio context synchronously and avoid permanent cancellation state
         window.speechSynthesis.cancel();
         window.speechSynthesis.resume();
         const unlockUtterance = new SpeechSynthesisUtterance('');
         unlockUtterance.volume = 0;
         window.speechSynthesis.speak(unlockUtterance);
      }
      if (recognitionRef.current && isRecording) {
         try { recognitionRef.current.stop(); } catch(e){}
         setIsRecording(false);
      }
    }
    
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [], 
          lang, 
          interviewType,
          userId: getUserId(),
          isReset
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.threshold && data.currentScore !== undefined) {
           const pct = Math.min(100, Math.round((data.currentScore / data.threshold) * 100));
           setProgressPercent(pct);
        }
        
        if (data.restoredTranscript && data.restoredTranscript.length > 0) {
          setTranscript(data.restoredTranscript);
          setState("listening"); // Resume listening immediately, no new TTS
        } else {
          setTranscript([{ sender: "ai", text: data.reply }]);
          speakText(data.reply); // This triggers speaking state, then listening on end
        }
      } else {
        const errorData = await res.json();
        setTranscript([{ sender: "ai", text: errorData.error || t.sysError }]);
        setState("complete");
      }
    } catch (err) {
      setTranscript([{ sender: "ai", text: t.netError }]);
      setState("complete");
    }
  };

  useEffect(() => {
    if (authReady && currentUser && !interviewStarted.current) {
      interviewStarted.current = true;
      const timer = setTimeout(() => {
        startInterview();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [authReady, currentUser]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); // Stop auto-submit
    
    if (!inputValue.trim() && !interimText.trim() || state !== "listening") return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const finalMessage = inputValue.trim() || interimText.trim();
    const newTranscript = [...transcript, { sender: "user", text: finalMessage }];
    setTranscript(newTranscript);
    setInputValue("");
    setInterimText("");
    setState("analyzing");

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newTranscript, 
          lang, 
          interviewType,
          userId: getUserId()
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.reply.includes("[END_INTERVIEW]")) {
          setState("extracting");
          setTranscript(prev => [...prev, { sender: "ai", text: t.extracted }]);
          
          try {
            // Call extraction API
            const extractRes = await fetch("/api/extract", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messages: newTranscript, lang, interviewType, userId: getUserId() })
            });

            if (extractRes.ok) {
              const extractedData = await extractRes.json();
              
              // Save to Firestore (Stateful)
              if (auth.currentUser) {
                const userDocRef = doc(db, "users", auth.currentUser.uid);
                
                // Fetch existing to append to history
                const docSnap = await getDoc(userDocRef);
                const existingData = docSnap.exists() ? docSnap.data() : {};
                const interviewHistory = existingData.interviewHistory || [];
                
                interviewHistory.push({
                  date: new Date().toISOString(),
                  type: interviewType || 'Initial Profiling',
                  transcript: newTranscript,
                  extracted: extractedData
                });

                await setDoc(userDocRef, {
                  profile: extractedData, // Update latest profile
                  interviewHistory: interviewHistory, // Save stateful history
                  hasRoadmap: true,
                  lastInterview: new Date().toISOString()
                }, { merge: true });
              }
            }
          } catch (error) {
            console.error("Extraction failed", error);
          }

          setState("complete");
          router.push("/dashboard");
        } else {
          setTranscript(prev => [...prev, { sender: "ai", text: data.reply }]);
          
          if (data.threshold && data.currentScore !== undefined) {
             const pct = Math.min(100, Math.round((data.currentScore / data.threshold) * 100));
             setProgressPercent(pct);
          }

          speakText(data.reply);
        }
      } else {
        const errorData = await res.json();
        setTranscript(prev => [...prev, { sender: "ai", text: errorData.error || t.sysError }]);
        setState("listening");
      }
    } catch (err) {
      setTranscript(prev => [...prev, { sender: "ai", text: t.anomaly }]);
      setState("listening");
    }
  };

  return (
    <>
      {/* Fixed Preloader Curtain to hide the initial 3D model loading and T-pose */}
      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: state === 'initializing' ? 0 : '-100vh' }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
          background: 'var(--bg-color)', zIndex: 999999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-main)',
        }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px', height: '80px' }}
        >
          <motion.div style={{ width: '4px', background: 'var(--text-main)', borderRadius: '4px' }} animate={{ height: ["20px", "50px", "20px"] }} transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut", delay: 0.0 }} />
          <motion.div style={{ width: '4px', background: 'var(--text-main)', borderRadius: '4px' }} animate={{ height: ["35px", "70px", "35px"] }} transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut", delay: 0.2 }} />
          <motion.div style={{ width: '4px', background: 'var(--text-main)', borderRadius: '4px' }} animate={{ height: ["50px", "90px", "50px"] }} transition={{ repeat: Infinity, duration: 1.0, ease: "easeInOut", delay: 0.4 }} />
          <motion.div style={{ width: '4px', background: 'var(--text-main)', borderRadius: '4px' }} animate={{ height: ["35px", "70px", "35px"] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut", delay: 0.6 }} />
          <motion.div style={{ width: '4px', background: 'var(--text-main)', borderRadius: '4px' }} animate={{ height: ["20px", "50px", "20px"] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.8 }} />
        </motion.div>
        
        <div style={{ width: '120px', height: '1px', background: 'var(--text-muted)', overflow: 'hidden', position: 'relative' }}>
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'var(--text-main)' }}
          />
        </div>
      </motion.div>

      <div className={styles.container}>
      
      {/* 3D Humanoid Core (Right Side) */}
      <div className={styles.coreContainer}>
        <Canvas 
          camera={{ position: [0, -1.5, 3.5], fov: 35 }}
          dpr={[1, 1.5]} /* Cap pixel ratio at 1.5x to massively save GPU */
          performance={{ min: 0.5 }} /* Allow framerate scaling if device struggles */
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={currentTheme === 'light' ? 0.1 : 0.5} />
          {/* Harsh Key Light for dramatic contrast */}
          <directionalLight position={[8, 10, 6]} intensity={currentTheme === 'light' ? 4.5 : 2} color="#ffffff" />
          {/* Dark Rim/Fill Light for shading */}
          <directionalLight position={[-10, -5, -5]} intensity={currentTheme === 'light' ? 1.0 : 3} color={currentTheme === 'light' ? "#556677" : "#00e5ff"} />
          
          <Suspense fallback={null}>
            <Environment preset="city" background={false} />
            <group rotation={[0, 0, 0]}>
              <HumanoidModel state={state} />
            </group>
          </Suspense>
        </Canvas>
      </div>

      {/* Chat / Transcript Interface (Left Side HUD) */}
      <div className={styles.chatInterface}>
        <div className={styles.topControls}>
          {/* Exit Button */}
          <button
            className={styles.iconBtn}
            onClick={() => {
              if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
              if (recognitionRef.current && isRecording) try { recognitionRef.current.stop(); } catch(e){}
              router.push('/dashboard');
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span className={styles.hideTextMobile}>{lang === 'id' ? "Keluar" : "Exit"}</span>
          </button>
          
          <LanguageToggle />
          
          <div className={styles.iconBtnGroup}>
            <button
              className={`${styles.iconBtn} ${interactionMode === "voice" ? styles.active : ""}`}
              onClick={() => setInteractionMode("voice")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              <span className={styles.hideTextMobile}>{lang === 'id' ? "Suara" : "Voice"}</span>
            </button>
            <button
              className={`${styles.iconBtn} ${interactionMode === "text" ? styles.active : ""}`}
              onClick={() => setInteractionMode("text")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="8" x2="6.01" y2="8"></line><line x1="10" y1="8" x2="10.01" y2="8"></line><line x1="14" y1="8" x2="14.01" y2="8"></line><line x1="18" y1="8" x2="18.01" y2="8"></line><line x1="6" y1="12" x2="6.01" y2="12"></line><line x1="10" y1="12" x2="10.01" y2="12"></line><line x1="14" y1="12" x2="14.01" y2="12"></line><line x1="18" y1="12" x2="18.01" y2="12"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>
              <span className={styles.hideTextMobile}>{lang === 'id' ? "Teks" : "Text"}</span>
            </button>
          </div>
          
          {/* Reset Button */}
          <button
            className={styles.iconBtn}
            onClick={() => startInterview(true)}
            style={{ borderColor: 'rgba(255, 50, 50, 0.3)', color: '#ff4444' }}
            title={lang === 'id' ? "Mulai Ulang Sesi Ini" : "Reset This Session"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <polyline points="3 3 3 8 8 8"></polyline>
            </svg>
          </button>
        </div>
        
        <div className={styles.transcriptContainer} ref={transcriptRef}>
          {/* Spacer to push content to the bottom and allow natural scrolling */}
          <div style={{ flex: 1, minHeight: '20px' }} />
          
          {/* History Messages (Faded, small) */}
          {transcript.slice(0, -1).map((msg, idx) => (
            <div key={idx} className={`${styles.message} ${msg.sender === "ai" ? `${styles.ai} ${styles.history}` : styles.user}`}>
              {msg.text}
            </div>
          ))}
          {/* Latest Message (Huge Cinematic Typography) */}
          {transcript.length > 0 && (
            <div className={`${styles.message} ${transcript[transcript.length - 1].sender === "ai" ? `${styles.ai} ${styles.latest}` : styles.user}`}>
              {transcript[transcript.length - 1].text}
            </div>
          )}
        </div>

        {/* VERTICAL PROGRESS INDICATOR */}
        <div className={styles.progressBarContainer}>
           <div className={styles.progressLabel}>
              <span>{progressPercent}%</span>
              <span>{lang === 'id' ? "Progres Fase" : "Phase Progress"}</span>
           </div>
           <div className={styles.progressTrack}>
             <div className={styles.progressFill} style={{ height: `${progressPercent}%`, '--progress-width': `${progressPercent}%` }} />
           </div>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          {/* Interim text display above input */}
          {interimText && state === "listening" && (
            <div className={styles.interimText}>
              <span className={styles.interimTextSpan}>{interimText}...</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className={styles.inputArea}>
            <input
              type="text"
              className={styles.terminalInput}
              placeholder={
                interactionMode === "voice" 
                  ? "🎙️ Voice Mode Active (Typing Disabled)" 
                  : (state === "listening" ? t.placeholder : (state === "extracting" ? "Extracting Blueprint..." : t.waiting))
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={state !== "listening" || interactionMode === "voice"}
              autoFocus
            />
            {/* Microphone Button */}
            {interactionMode === "voice" && (
              <button 
                type="button"
                className={`${styles.micBtn} ${isRecording ? styles.recording : ''}`}
                onClick={toggleRecording}
                disabled={state !== "listening"}
                title={lang === 'id' ? 'Input Suara' : 'Voice Input'}
              >
                {isRecording ? (
                  <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20"><path d="M6 19h12v2H6z" /><path d="M12 3a3 3 0 00-3 3v8a3 3 0 006 0V6a3 3 0 00-3-3z" /><path d="M19 11v3a7 7 0 01-14 0v-3h2v3a5 5 0 0010 0v-3h2z" /></svg>
                ) : (
                  <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20"><path d="M12 14a3 3 0 003-3V6a3 3 0 00-6 0v5a3 3 0 003 3z" /><path d="M19 11v3a7 7 0 01-14 0v-3h2v3a5 5 0 0010 0v-3h2zM11 20v2h2v-2h-2z" /></svg>
                )}
              </button>
            )}
            {/* Submit Button */}
            <button 
              type="submit" 
              ref={submitBtnRef}
              className={styles.submitBtn}
              disabled={state !== "listening" || (!inputValue.trim() && !interimText.trim())}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)', color: 'var(--text-main)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--text-main)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <InterviewRoom />
    </Suspense>
  );
}
