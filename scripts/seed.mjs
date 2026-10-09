* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: linear-gradient(135deg, #f4efe5 0%, #efe7d9 100%);
  color: #1f2937;
}

a {
  text-decoration: none;
}

button,
input,
img {
  font: inherit;
}

button {
  cursor: pointer;
}

.landing-page,
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.hero-card,
.auth-card,
.panel {
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(168, 142, 91, 0.2);
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(68, 54, 22, 0.1);
}

.hero-card {
  width: min(100%, 1100px);
  padding: 36px 28px 42px;
  text-align: center;
}

.brand-lockup {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.brand-inline {
  display: flex;
  align-items: center;
  gap: 14px;
}

.eyebrow {
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  color: #a77b1b;
  font-weight: 700;
}

h1 {
  margin: 0 0 14px;
  font-size: clamp(2rem, 4vw, 3.2rem);
  color: #2d2414;
}

.subtitle {
  max-width: 760px;
  margin: 0 auto;
  font-size: 1.05rem;
  color: #4b5563;
  line-height: 1.7;
}

.hero-actions {
  margin-top: 24px;
}

.primary-btn,
.secondary-btn {
  border: none;
  border-radius: 12px;
  padding: 12px 22px;
  font-weight: 700;
  transition: transform 0.15s ease;
}

.primary-btn {
  background: linear-gradient(135deg, #c89b3d 0%, #a16f11 100%);
  color: white;
}

.secondary-btn {
  background: #ece6d9;
  color: #1f2937;
}

.primary-btn:hover,
.secondary-btn:hover {
  transform: translateY(-1px);
}

.primary-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-grid {
  margin-top: 26px;
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 16px;
}

.stat-box {
  background: #faf7f0;
  border-radius: 16px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #e5d7b2;
}

.stat-box strong {
  font-size: 1.1rem;
  color: #2d2414;
}

.stat-box span {
  color: #4b5563;
}

.auth-card {
  width: min(100%, 500px);
  padding: 32px 28px;
}

.mini-brand {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.auth-card h1 {
  font-size: 2rem;
  margin-bottom: 8px;
}

.auth-card p {
  margin-top: 0;
  color: #6b7280;
}

.auth-form,
.stack-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-form label,
.stack-form label,
.panel label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 600;
  color: #374151;
}

.auth-form input,
.stack-form input,
.panel input {
  border: 1px solid #d8c79c;
  border-radius: 10px;
  background: white;
  padding: 12px 14px;
}

.error-text {
  color: #b91c1c;
  font-weight: 600;
  margin: 0;
}

.success-text {
  color: #166534;
  font-weight: 600;
  margin: 0;
}

.demo-box {
  background: #f6f1e6;
  border-radius: 12px;
  padding: 14px 16px;
  color: #374151;
}

.demo-box p {
  margin: 0 0 6px;
}

.demo-box code {
  background: #fff;
  display: inline-block;
  border-radius: 8px;
  padding: 6px 8px;
}

.dashboard-shell {
  width: min(100%, 1100px);
  margin: 0 auto;
  padding: 28px 20px 50px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-bottom: 20px;
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.panel {
  padding: 24px 22px;
}

.panel h2 {
  margin-top: 0;
  margin-bottom: 18px;
  font-size: 1.35rem;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

th,
td {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 1px solid #e5e7eb;
}

th {
  color: #374151;
  background: #faf7f0;
}

.button-row {
  display: flex;
  gap: 12px;
  margin-top: 18px;
  flex-wrap: wrap;
}

.status-line {
  margin: 0;
  font-size: 1.05rem;
}

@media (max-width: 760px) {
  .panel-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
