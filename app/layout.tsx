import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project System",
  description: "Project System for attendance tracking, team reporting, and monthly exports",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
