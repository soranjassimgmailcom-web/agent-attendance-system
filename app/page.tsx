import Image from "next/image";

export default function HomePage() {
  return (
    <main className="landing-page">
      <div className="home-shell">
        <header className="home-header">
          <p className="government-name">Government of Kurdistan</p>
          <Image
            className="home-runaki-logo"
            src="https://agentproject-three.vercel.app/runaki-logo.jpeg"
            alt="Runaki logo"
            width={100}
            height={100}
            priority
          />
        </header>

        <section className="hero-card home-hero">
          <h1>Agent Audince In Bardarash Co</h1>
          <p className="subtitle">
            One place for agent check-ins, check-outs, and monthly attendance reports.
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

        <footer className="landing-footer">Baardarash Co</footer>
      </div>
    </main>
  );
}
