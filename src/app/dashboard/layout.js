import FloatingDock from "../components/FloatingDock";
import styles from "./layout.module.css";

export const metadata = {
  title: "Dashboard | NeuroPath",
  description: "Your AI-powered career roadmap and cognitive profile.",
};

export default function DashboardLayout({ children }) {
  return (
    <div className={styles.layoutContainer}>
      <main className={styles.mainContent}>
        {children}
      </main>
      <FloatingDock />
    </div>
  );
}
