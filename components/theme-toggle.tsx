"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("agent-audience-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = saved ? saved === "dark" : prefersDark;
    document.documentElement.dataset.theme = shouldUseDark ? "dark" : "light";
    setDark(shouldUseDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("agent-audience-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      <span aria-hidden="true">{dark ? "☀" : "☾"}</span>
      <span>{dark ? "Light" : "Dark"}</span>
    </button>
  );
}
