export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="hero-card">
        <div className="brand-lockup">
          <span className="sun-mark" aria-hidden="true" />
          <span className="brand-name">BARDARASH <span>ATTENDANCE</span></span>
        </div>

        <p className="eyebrow">Team attendance</p>
        <h1>Agent Audince In Bardrash Co</h1>
        <p className="subtitle">
          One place for agent check-ins, check-outs, and monthly attendance reports.
        </p>

        <div className="hero-actions">
          <a href="/login" className="primary-btn">
            Sign in
          </a>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-label">01 / ADMIN</span>
            <strong>Manage agents</strong>
            <span>Create and maintain agent accounts.</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">02 / DAILY</span>
            <strong>Record attendance</strong>
            <span>Track check-in and check-out times.</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">03 / REPORTS</span>
            <strong>Review each month</strong>
            <span>Export attendance records to Excel.</span>
          </div>
        </div>

        <footer className="landing-footer">Baardarash Co</footer>
      </section>
    </main>
  );
}
