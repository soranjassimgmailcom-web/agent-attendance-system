import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";
import "./design-overrides.css";
import "./dashboard-overrides.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: "Agent Audience - Bardarash Co",
  description: "Attendance, collaboration, and performance workspace for Bardarash Co.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <div className="global-theme-control"><ThemeToggle /></div>
        {children}
      </body>
    </html>
  );
}
