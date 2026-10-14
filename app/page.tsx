import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <main className="landing-page redesigned-landing">
      <div className="home-shell">
        <header className="home-header redesigned-header">
          <div className="brand-lockup">
            <Image className="home-runaki-logo" src="/runaki-logo.png" alt="Bardarash Co logo" width={72} height={72} priority />
            <div>
              <span className="brand-kicker">Bardarash Co</span>
              <strong>Agent Audience</strong>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <section className="hero-card home-hero redesigned-hero">
          <div className="hero-copy">
            <span className="eyebrow">Attendance, collaboration, performance</span>
            <h1>Everything your team needs, in one calm workspace.</h1>
            <p className="subtitle">Track attendance, share important updates, chat with your team, and understand performance without the clutter.</p>
            <div className="hero-actions">
              <a href="/login" className="primary-btn">Sign in to workspace <span aria-hidden="true">→</span></a>
              <a href="#features" className="secondary-btn">Explore features</a>
            </div>
            <p className="login-help">Secure access for authorized agents and administrators.</p>
          </div>
          <div className="hero-preview" aria-hidden="true">
            <div className="preview-top"><span /><span /><span /></div>
            <div className="preview-content"><div className="preview-sidebar" /><div className="preview-main"><i /><i /><i /><b /></div></div>
          </div>
        </section>

        <section id="features" className="feature-grid" aria-label="Workspace features">
          <article className="feature-card"><span>◷</span><h2>Attendance</h2><p>Clear check-in and check-out records for every working day.</p></article>
          <article className="feature-card"><span>✦</span><h2>Team communication</h2><p>Announcements, team chat, and direct messages in one place.</p></article>
          <article className="feature-card"><span>↗</span><h2>Performance reports</h2><p>Review weekly and monthly activity with useful summaries.</p></article>
        </section>
        <footer className="landing-footer">Agent Audience · Bardarash Co</footer>
      </div>
    </main>
  );
}
