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
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    try {
      const [statusResponse, historyResponse] = await Promise.all([
        fetch("/api/attendance/status", { credentials: "include" }),
        fetch("/api/attendance/history", { credentials: "include" }),
      ]);

      const [statusData, historyData] = await Promise.all([
        statusResponse.json(),
        historyResponse.json(),
      ]);

      if (!statusResponse.ok || !historyResponse.ok) {
        throw new Error(statusData.error || historyData.error || "Could not load attendance");
      }

      setTodayRecord(statusData.record);
      setHistory(historyData.records || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load attendance");
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAction(type: "check-in" | "check-out") {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/attendance/${type}`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Action failed");
      }

      setMessage(type === "check-in" ? "You're checked in. Have a great day!" : "You're checked out. Your day is recorded.");
      setError("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div className="brand-inline">
          <span className="brand-name">PROJECT <span>SYSTEM</span></span>
          <div>
            <p className="eyebrow">Dashboard</p>
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
            Check-in status: <strong>{loadingData ? "Loading..." : todayRecord?.checkInAt ? "Checked In" : "Not checked in"}</strong>
          </p>
          {todayRecord?.checkOutAt ? <p className="status-line">You have completed today&apos;s attendance.</p> : null}

          {message ? <p className="success-text" role="status">{message}</p> : null}
          {error ? <p className="error-text" role="alert">{error}</p> : null}

          <div className="button-row">
            <button
              className="primary-btn"
              onClick={() => handleAction("check-in")}
              disabled={loading || loadingData || !!todayRecord?.checkInAt}
            >
              {loading ? "Processing..." : "Check In"}
            </button>

            <button
              className="secondary-btn"
              onClick={() => handleAction("check-out")}
              disabled={loading || loadingData || !todayRecord?.checkInAt || !!todayRecord?.checkOutAt}
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
