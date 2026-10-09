"use client";

import { useEffect, useState } from "react";

type AttendanceEntry = {
  id: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
};

export function AgentDashboard({ user }: { user: { userId: string; name: string; email: string; role: string } }) {
  const [todayRecord, setTodayRecord] = useState<AttendanceEntry | null>(null);
  const [history, setHistory] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    const [statusResponse, historyResponse] = await Promise.all([
      fetch("/api/attendance/status", { credentials: "include" }),
      fetch("/api/attendance/history", { credentials: "include" }),
    ]);

    const statusData = await statusResponse.json();
    const historyData = await historyResponse.json();

    if (statusResponse.ok) {
      setTodayRecord(statusData.record);
    }

    if (historyResponse.ok) {
      setHistory(historyData.records || []);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAction(type: "check-in" | "check-out") {
    setLoading(true);
    setMessage("");
    setError("");

    const response = await fetch(`/api/attendance/${type}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Action failed");
      setLoading(false);
      return;
    }

    setMessage(data.message || "Success");
    await loadData();
    setLoading(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div className="brand-inline">
          <img src="/logo.svg" alt="company logo" width={60} height={45} />
          <div>
            <p className="eyebrow">Agent Dashboard</p>
            <h1>Welcome, {user.name}</h1>
          </div>
        </div>
        <button className="secondary-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="panel-grid">
        <div className="panel action-panel">
          <h2>Today</h2>
          <p className="status-line">
            Check-in status: <strong>{todayRecord?.checkInAt ? "Checked In" : "Not checked in"}</strong>
          </p>

          {message ? <p className="success-text">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}

          <div className="button-row">
            <button
              className="primary-btn"
              onClick={() => handleAction("check-in")}
              disabled={loading || !!todayRecord?.checkInAt}
            >
              {loading ? "Processing..." : "Check In"}
            </button>

            <button
              className="secondary-btn"
              onClick={() => handleAction("check-out")}
              disabled={loading || !todayRecord?.checkInAt || !!todayRecord?.checkOutAt}
            >
              {loading ? "Processing..." : "Check Out"}
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>My Attendance</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={3}>No attendance records yet.</td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>{row.checkInAt ? new Date(row.checkInAt).toLocaleTimeString() : "--"}</td>
                    <td>{row.checkOutAt ? new Date(row.checkOutAt).toLocaleTimeString() : "--"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
