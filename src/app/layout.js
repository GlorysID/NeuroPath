import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeProvider";
import CustomCursor from "./components/CustomCursor";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata = {
  title: "NeuroPath | AI Career Assistant",
  description: "Discover your ideal future with NeuroPath's AI career assistant.",
};

const themeScript = `
  (function() {
    try {
      var storedTheme = localStorage.getItem('theme') || 'system';
      var activeTheme = storedTheme;
      if (storedTheme === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', activeTheme);
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <Script id="theme-loader" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system">
          <LanguageProvider>
            <CustomCursor />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
