import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bardarash Attendance",
  description: "Attendance system for agent check-in and monthly report export",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
