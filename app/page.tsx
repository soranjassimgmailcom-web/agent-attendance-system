import Image from "next/image";

export default function HomePage() {
  return (
    <main className="landing-page">
      <div className="home-shell">
        <header className="home-header">
          <Image
            className="home-runaki-logo"
            src="/runaki-logo.png"
            alt="Bardarash Co logo"
            width={100}
            height={100}
            priority
          />
        </header>

        <section className="hero-card home-hero">
          <h1>Agent Audience - Bardarash Co</h1>
          <p className="subtitle">
            One place for attendance tracking, daily updates, team chat, and monthly performance reports.
          </p>

          <div className="hero-actions">
            <a href="/login" className="primary-btn">
              Sign in
            </a>
          </div>

          <p className="login-help">
            If you have any problems logging in, please contact your supervisor.
          </p>
        </section>

        <footer className="landing-footer">Agent Audience - Bardarash Co</footer>
      </div>
    </main>
  );
}
