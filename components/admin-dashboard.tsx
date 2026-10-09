"use client";

import { useEffect, useState } from "react";

type Agent = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
};

type AttendanceRecord = {
  id: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export function AdminDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  async function loadData() {
    const response = await fetch("/api/admin/agents", { credentials: "include" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Failed to load data");
      return;
    }

    setAgents(data.agents);
    setAttendance(data.attendance);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateAgent(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const response = await fetch("/api/admin/agents", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Failed to create agent");
      return;
    }

    setSuccess("Agent account created successfully");
    setForm({ name: "", email: "", password: "" });
    loadData();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  function downloadReport() {
    window.location.href = `/api/admin/reports/monthly?month=${currentMonth}`;
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <div className="brand-inline">
            <img src="/logo.svg" alt="company logo" width={60} height={45} />
            <div>
              <p className="eyebrow">Admin Dashboard</p>
              <h1>Agent Audince</h1>
            </div>
          </div>
        </div>
        <button className="secondary-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="panel-grid">
        <div className="panel">
          <h2>Create Agent</h2>
          <form className="stack-form" onSubmit={handleCreateAgent}>
            <label>
              Name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </label>

            {error ? <p className="error-text">{error}</p> : null}
            {success ? <p className="success-text">{success}</p> : null}

            <button className="primary-btn" type="submit">
              Add Agent
            </button>
          </form>
        </div>

        <div className="panel">
          <h2>Monthly Report</h2>
          <label>
            Month
            <input
              type="month"
              value={currentMonth}
              onChange={(event) => setCurrentMonth(event.target.value)}
            />
          </label>

          <button className="primary-btn" onClick={downloadReport}>
            Download Excel
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Agents</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td>{agent.name}</td>
                  <td>{agent.email}</td>
                  <td>{agent.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Attendance Records</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record) => (
                <tr key={record.id}>
                  <td>{record.user.name}</td>
                  <td>{record.date}</td>
                  <td>{record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString() : "--"}</td>
                  <td>{record.checkOutAt ? new Date(record.checkOutAt).toLocaleTimeString() : "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
