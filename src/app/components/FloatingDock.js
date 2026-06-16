"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import styles from "./FloatingDock.module.css";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingDock() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const navItems = [
    { name: "Overview", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Interview Room", path: "/interview", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
    { name: "My Roadmap", path: "/dashboard/roadmap", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
    { name: "Profile", path: "/dashboard/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { name: "Sign Out", action: handleLogout, icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" },
  ];

  return (
    <div className={styles.dockContainer}>
      <button 
        className={styles.mainButton} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Navigation"
      >
        <motion.svg 
          animate={{ rotate: isOpen ? 90 : 0 }} 
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={styles.menuIcon} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          )}
        </motion.svg>
      </button>

      <div className={`${styles.menuItems} ${isOpen ? styles.open : ''}`}>
        <AnimatePresence>
          {isOpen && navItems.map((item, index) => {
            const isActive = item.path ? pathname === item.path : false;
            
            const buttonContent = (
              <>
                <span className={styles.tooltip}>{item.name}</span>
                <svg className={styles.dockIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
              </>
            );

            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 }}
              >
                {item.path ? (
                  <Link href={item.path} className={`${styles.dockItem} ${isActive ? styles.active : ''}`}>
                    {buttonContent}
                  </Link>
                ) : (
                  <button onClick={item.action} className={styles.dockItem}>
                    {buttonContent}
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
