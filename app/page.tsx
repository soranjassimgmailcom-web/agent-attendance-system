import Image from "next/image";

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="hero-card">
        <div className="brand-lockup">
          <Image
            src="/logo.svg"
            alt="Agent Audince in Bardarash Co logo"
            width={260}
            height={190}
            priority
          />
        </div>

        <p className="eyebrow">Agent Audince in Bardarash Co</p>
        <h1>Daily attendance tracking for your team.</h1>
        <p className="subtitle">
          Admins can create agent accounts, agents can check in and check out every day,
          and reports can be exported to Excel each month.
        </p>

        <div className="hero-actions">
          <a href="/login" className="primary-btn">
            Login
          </a>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <strong>Admin</strong>
            <span>Create agent accounts</span>
          </div>
          <div className="stat-box">
            <strong>Agents</strong>
            <span>Check in and out daily</span>
          </div>
          <div className="stat-box">
            <strong>Reports</strong>
            <span>Monthly Excel export</span>
          </div>
        </div>
      </section>
    </main>
  );
}
