"use client";

import { useEffect, useState } from "react";
import { readApiResponse } from "@/lib/client-api";

type Agent = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
  isActive: boolean;
};

type LeaveDay = {
  id: string;
  date: string;
  type: "VACATION" | "AUTHORIZED_ABSENCE";
  user: {
    id: string;
    name: string;
    email: string;
  };
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
  const [leaveDays, setLeaveDays] = useState<LeaveDay[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [leaveDate, setLeaveDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [leaveType, setLeaveType] = useState<LeaveDay["type"]>("VACATION");
  const [savingLeave, setSavingLeave] = useState(false);
  const [busyAgentId, setBusyAgentId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });

  async function loadData() {
    try {
      const response = await fetch(`/api/admin/agents?month=${currentMonth}`, {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const data = await readApiResponse<{
        agents: Agent[];
        attendance: AttendanceRecord[];
        leaveDays: LeaveDay[];
      }>(response);

      setAgents(data.agents);
      setAttendance(data.attendance);
      setLeaveDays(data.leaveDays);
      if (!selectedAgentId || !data.agents.some((agent) => agent.id === selectedAgentId && agent.isActive)) {
        setSelectedAgentId(data.agents.find((agent) => agent.isActive)?.id ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard data. Please try again.");
    }
  }

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  async function handleCreateAgent(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/agents", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });

      await readApiResponse<{ message: string }>(response);

      setSuccess("Agent account created successfully");
      setForm({ name: "", email: "", password: "" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create agent. Please try again.");
    }
  }

  async function handleToggleAgent(agent: Agent) {
    const isActive = !agent.isActive;
    if (
      !isActive &&
      !window.confirm(`Deactivate ${agent.name}? Past attendance and time-off records will be kept.`)
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setBusyAgentId(agent.id);

    try {
      const response = await fetch(`/api/admin/agents/${agent.id}`, {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      const data = await readApiResponse<{ message: string }>(response);
      setSuccess(data.message);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update agent account.");
    } finally {
      setBusyAgentId("");
    }
  }

  async function handleRecordLeave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSavingLeave(true);

    try {
      const response = await fetch("/api/admin/leave-days", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userId: selectedAgentId,
          date: leaveDate,
          type: leaveType,
        }),
      });
      const data = await readApiResponse<{ message: string }>(response);
      setSuccess(data.message);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record time off.");
    } finally {
      setSavingLeave(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  function downloadReport() {
    window.location.href = `/api/admin/reports/monthly?month=${currentMonth}`;
  }

  function downloadSalaryReport() {
    window.location.href = `/api/admin/reports/salary?month=${currentMonth}`;
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <div className="brand-inline">
            <img
              className="runaki-dashboard-logo"
              src="https://agentproject-three.vercel.app/runaki-logo.jpeg"
              alt="Runaki"
              width={56}
              height={56}
            />
            <div>
              <p className="eyebrow">Admin Dashboard</p>
              <h1>Project System</h1>
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

            <button className="primary-btn" type="submit">
              Add Agent
            </button>
          </form>
        </div>

        <div className="panel">
          <h2>Record a Day Away</h2>
          <form className="stack-form" onSubmit={handleRecordLeave}>
            <label>
              Agent
              <select
                value={selectedAgentId}
                onChange={(event) => setSelectedAgentId(event.target.value)}
                required
                disabled={!agents.some((agent) => agent.isActive)}
              >
                <option value="" disabled>Select an active agent</option>
                {agents.filter((agent) => agent.isActive).map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                value={leaveDate}
                onChange={(event) => setLeaveDate(event.target.value)}
                required
              />
            </label>

            <label>
              Type
              <select
                value={leaveType}
                onChange={(event) => setLeaveType(event.target.value as LeaveDay["type"])}
              >
                <option value="VACATION">Vacation</option>
                <option value="AUTHORIZED_ABSENCE">Authorized absence</option>
              </select>
            </label>

            <button className="primary-btn" type="submit" disabled={savingLeave || !selectedAgentId}>
              {savingLeave ? "Saving..." : "Record day away"}
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

          <div className="report-actions">
            <button className="primary-btn" onClick={downloadReport}>
              Attendance Excel
            </button>
            <button className="secondary-btn" onClick={downloadSalaryReport}>
              Salary Excel
            </button>
          </div>
        </div>
      </section>

      {error ? <p className="error-text" role="alert">{error}</p> : null}
      {success ? <p className="success-text" role="status">{success}</p> : null}

      <section className="panel">
        <h2>Agents</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Account</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td>{agent.name}</td>
                  <td>{agent.email}</td>
                  <td>{agent.isActive ? "Active" : "Deactivated"}</td>
                  <td>
                    <button
                      className={agent.isActive ? "secondary-btn" : "primary-btn"}
                      onClick={() => handleToggleAgent(agent)}
                      disabled={busyAgentId === agent.id}
                    >
                      {busyAgentId === agent.id
                        ? "Saving..."
                        : agent.isActive
                          ? "Deactivate"
                          : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
              {agents.length === 0 ? <tr><td colSpan={4}>No agents yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Days Away · {currentMonth}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Date</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {leaveDays.map((leaveDay) => (
                <tr key={leaveDay.id}>
                  <td>{leaveDay.user.name}</td>
                  <td>{leaveDay.date}</td>
                  <td>{leaveDay.type === "VACATION" ? "Vacation" : "Authorized absence"}</td>
                </tr>
              ))}
              {leaveDays.length === 0 ? (
                <tr><td colSpan={3}>No days away recorded for this month.</td></tr>
              ) : null}
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
