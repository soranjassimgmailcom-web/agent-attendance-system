"use client";

import { useEffect, useRef, useState } from "react";
import { readApiResponse } from "@/lib/client-api";
import {
  activityCategories,
  AgentJobRole,
  agentJobRoles,
  getAgentJobRoleLabel,
} from "@/lib/agent-roles";

type AttendanceEntry = {
  id: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  leaveType?: "VACATION" | "AUTHORIZED_ABSENCE";
};

type AgentActivity = {
  id: string;
  date: string;
  title: string;
  details: string | null;
  createdAt: string;
};

type TeamActivity = AgentActivity & {
  user: {
    id: string;
    name: string;
    jobRole: AgentJobRole;
  };
};

function getLocalDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AgentDashboard({
  user,
}: {
  user: { userId: string; name: string; email: string; role: string };
}) {
  const [todayRecord, setTodayRecord] = useState<AttendanceEntry | null>(null);
  const [todayLeave, setTodayLeave] = useState<"VACATION" | "AUTHORIZED_ABSENCE" | null>(null);
  const [history, setHistory] = useState<AttendanceEntry[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [jobRole, setJobRole] = useState<AgentJobRole>("UNASSIGNED");
  const [activityMonthCount, setActivityMonthCount] = useState(0);
  const [activePage, setActivePage] = useState<"dashboard" | "activities" | "team">("dashboard");
  const [activityForm, setActivityForm] = useState({ date: getLocalDate(), title: "", details: "" });
  const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([]);
  const [teamMonth, setTeamMonth] = useState(() => getLocalDate().slice(0, 7));
  const [teamRoleFilter, setTeamRoleFilter] = useState<AgentJobRole | "ALL">("ALL");
  const [loadingTeamActivities, setLoadingTeamActivities] = useState(false);
  const [teamActivitiesLoaded, setTeamActivitiesLoaded] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [savingActivity, setSavingActivity] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    try {
      const [statusResponse, historyResponse, activitiesResponse] = await Promise.all([
        fetch("/api/attendance/status", { credentials: "include", cache: "no-store" }),
        fetch("/api/attendance/history", { credentials: "include", cache: "no-store" }),
        fetch("/api/activities", { credentials: "include", cache: "no-store" }),
      ]);

      const [statusData, historyData, activitiesData] = await Promise.all([
        readApiResponse<{
          record: AttendanceEntry | null;
          leaveDay: { type: "VACATION" | "AUTHORIZED_ABSENCE" } | null;
        }>(statusResponse),
        readApiResponse<{
          records: AttendanceEntry[];
          leaveDays: Array<{ id: string; date: string; type: "VACATION" | "AUTHORIZED_ABSENCE" }>;
        }>(historyResponse),
        readApiResponse<{
          activities: AgentActivity[];
          monthCount: number;
          jobRole: AgentJobRole;
        }>(activitiesResponse),
      ]);

      setTodayRecord(statusData.record);
      setTodayLeave(statusData.leaveDay?.type ?? null);
      setHistory([
        ...historyData.records,
        ...historyData.leaveDays.map((leaveDay) => ({
          id: `leave-${leaveDay.id}`,
          date: leaveDay.date,
          checkInAt: null,
          checkOutAt: null,
          leaveType: leaveDay.type,
        })),
      ].sort((left, right) => right.date.localeCompare(left.date)));
      setActivities(activitiesData.activities);
      setActivityMonthCount(activitiesData.monthCount);
      setJobRole(activitiesData.jobRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your dashboard");
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadData();
    fetch("/api/agent/profile-image", { credentials: "include", cache: "no-store" })
      .then((response) => {
        if (response.ok) {
          setProfileImageUrl(`/api/agent/profile-image?v=${Date.now()}`);
        }
      })
      .catch(() => setProfileImageUrl(""));
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
      await readApiResponse<{ message: string }>(response);

      setMessage(type === "check-in" ? "You're checked in. Have a great day!" : "You're checked out. Your day is recorded.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingActivity(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(activityForm),
      });
      const data = await readApiResponse<{ message: string }>(response);
      setMessage(data.message);
      setActivityForm({ date: getLocalDate(), title: "", details: "" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this activity");
    } finally {
      setSavingActivity(false);
    }
  }

  async function loadTeamActivities(month: string) {
    setLoadingTeamActivities(true);
    setError("");

    try {
      const response = await fetch(`/api/activities/team?month=${month}`, {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const data = await readApiResponse<{ activities: TeamActivity[] }>(response);
      setTeamActivities(data.activities);
      setTeamActivitiesLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load team activities");
    } finally {
      setLoadingTeamActivities(false);
    }
  }

  function openTeamActivities() {
    setActivePage("team");
    if (!teamActivitiesLoaded) {
      loadTeamActivities(teamMonth);
    }
  }

  async function handleProfileImage(event: React.ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0];
    event.target.value = "";
    if (!image) return;

    if (image.size > 1024 * 1024) {
      setError("Profile pictures must be 1 MB or smaller.");
      return;
    }

    setUploadingImage(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/agent/profile-image", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": image.type },
        body: image,
      });
      const data = await readApiResponse<{ message: string }>(response);
      setProfileImageUrl(`/api/agent/profile-image?v=${Date.now()}`);
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your profile picture");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  return (
    <main className="agent-layout">
      <aside className="agent-sidebar">
        <a className="agent-sidebar-brand" href="/agent" aria-label="Runaki agent dashboard">
          <img src="/runaki-logo.png" alt="" />
          <span>Runaki</span>
        </a>

        <div className="agent-profile">
          <button
            className="agent-avatar-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change profile picture"
            disabled={uploadingImage}
          >
            {profileImageUrl ? (
              <img className="agent-avatar-image" src={profileImageUrl} alt="" />
            ) : (
              <span>{getInitials(user.name)}</span>
            )}
          </button>
          <div className="agent-profile-info">
            <strong>{user.name}</strong>
            <span>Agent</span>
          </div>
          <label className="agent-photo-link" htmlFor="agent-profile-image">
            {uploadingImage ? "Uploading..." : "Change photo"}
          </label>
          <input
            ref={fileInputRef}
            id="agent-profile-image"
            className="agent-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleProfileImage}
            disabled={uploadingImage}
          />
        </div>

        <p className="agent-nav-heading">Workspace</p>
        <nav className="agent-nav" aria-label="Agent navigation">
          <button
            type="button"
            className={activePage === "dashboard" ? "agent-nav-link active" : "agent-nav-link"}
            onClick={() => setActivePage("dashboard")}
            aria-current={activePage === "dashboard" ? "page" : undefined}
          >
            <span aria-hidden="true">⌂</span> Dashboard
          </button>
          <button
            type="button"
            className={activePage === "activities" ? "agent-nav-link active" : "agent-nav-link"}
            onClick={() => setActivePage("activities")}
            aria-current={activePage === "activities" ? "page" : undefined}
          >
            <span aria-hidden="true">▤</span> My Activities
          </button>
          <button
            type="button"
            className={activePage === "team" ? "agent-nav-link active" : "agent-nav-link"}
            onClick={openTeamActivities}
            aria-current={activePage === "team" ? "page" : undefined}
          >
            <span aria-hidden="true">◎</span> Team Activities
          </button>
        </nav>

        <div className="agent-sidebar-footer">
          <span>{user.email}</span>
          <button className="agent-logout-btn" type="button" onClick={handleLogout}>
            <span aria-hidden="true">↪</span> Log out
          </button>
        </div>
      </aside>

      <div className="agent-main">
        <header className="agent-page-header">
          <div>
            <p className="eyebrow">Agent workspace</p>
            <h1>
              {activePage === "dashboard"
                ? `Welcome, ${firstName}`
                : activePage === "team" ? "Team Activities" : "My Activities"}
            </h1>
          </div>
          <button className="secondary-btn agent-header-logout" type="button" onClick={handleLogout}>
            Logout
          </button>
        </header>

        {message ? <p className="success-text" role="status">{message}</p> : null}
        {error ? <p className="error-text" role="alert">{error}</p> : null}

        {activePage === "dashboard" ? (
          <>
            <section className="agent-stat-grid" aria-label="Monthly summary">
              <article className="agent-stat-card">
                <span className="agent-stat-icon">▤</span>
                <div><span>Activities this month</span><strong>{activityMonthCount}</strong></div>
              </article>
              <article className="agent-stat-card">
                <span className="agent-stat-icon">✓</span>
                <div><span>Attendance days</span><strong>{history.filter((entry) => !entry.leaveType).length}</strong></div>
              </article>
              <article className="agent-stat-card">
                <span className="agent-stat-icon">◷</span>
                <div>
                  <span>Today</span>
                  <strong>{loadingData
                    ? "Loading"
                    : todayLeave
                      ? todayLeave === "VACATION" ? "Vacation" : "Approved leave"
                      : todayRecord?.checkInAt
                        ? todayRecord.checkOutAt ? "Complete" : "Checked in"
                        : "Not checked in"}</strong>
                </div>
              </article>
            </section>

            <section className="panel agent-attendance-panel">
              <div className="agent-section-heading">
                <div><p className="eyebrow">Daily attendance</p><h2>Today</h2></div>
                <span className="agent-date-label">{getLocalDate()}</span>
              </div>
              {todayLeave ? (
                <p className="status-line">Your time off for today has been recorded by an administrator.</p>
              ) : null}
              {todayRecord?.checkOutAt ? <p className="status-line">You have completed today&apos;s attendance.</p> : null}
              <div className="button-row">
                <button
                  className="primary-btn"
                  type="button"
                  onClick={() => handleAction("check-in")}
                  disabled={loading || loadingData || !!todayRecord?.checkInAt || !!todayLeave}
                >
                  {loading ? "Processing..." : "Check In"}
                </button>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => handleAction("check-out")}
                  disabled={loading || loadingData || !todayRecord?.checkInAt || !!todayRecord?.checkOutAt}
                >
                  {loading ? "Processing..." : "Check Out"}
                </button>
              </div>
            </section>

            <section className="panel">
              <div className="agent-section-heading">
                <div><p className="eyebrow">Your records</p><h2>Recent Activities</h2></div>
                <button className="agent-text-btn" type="button" onClick={() => setActivePage("activities")}>
                  View all
                </button>
              </div>
              {activities.length === 0 ? (
                <p className="agent-empty-state">Your activity updates will appear here after you add one.</p>
              ) : (
                <div className="agent-activity-list">
                  {activities.slice(0, 5).map((activity) => (
                    <article className="agent-activity-item" key={activity.id}>
                      <span className="agent-activity-dot" aria-hidden="true" />
                      <div>
                        <div className="agent-activity-title-row"><strong>{activity.title}</strong><time>{activity.date}</time></div>
                        {activity.details ? <p>{activity.details}</p> : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="agent-section-heading">
                <div><p className="eyebrow">Time and attendance</p><h2>My Attendance</h2></div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th></tr></thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td colSpan={4}>No attendance or time-off records yet.</td></tr>
                    ) : history.map((row) => (
                      <tr key={row.id}>
                        <td>{row.date}</td>
                        <td>{row.leaveType
                          ? row.leaveType === "VACATION" ? "Vacation" : "Authorized absence"
                          : "Present"}</td>
                        <td>{row.checkInAt ? new Date(row.checkInAt).toLocaleTimeString() : "--"}</td>
                        <td>{row.checkOutAt ? new Date(row.checkOutAt).toLocaleTimeString() : "--"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : activePage === "activities" ? (
          <div className="agent-activities-page">
            <section className="panel agent-activity-form-panel">
              <div className="agent-section-heading">
                <div>
                  <p className="eyebrow">{jobRole === "UNASSIGNED" ? "Contact your administrator to get started" : getAgentJobRoleLabel(jobRole)}</p>
                  <h2>Record an activity</h2>
                </div>
              </div>
              {jobRole === "UNASSIGNED" ? (
                <p className="agent-empty-state">Your responsibility role has not been assigned yet, so activity categories are not available.</p>
              ) : (
              <form className="stack-form" onSubmit={handleSaveActivity}>
                <label>
                  Date
                  <input
                    type="date"
                    value={activityForm.date}
                    max={getLocalDate()}
                    onChange={(event) => setActivityForm({ ...activityForm, date: event.target.value })}
                    required
                  />
                </label>
                <label>
                  Activity category
                  <select
                    value={activityForm.title}
                    onChange={(event) => setActivityForm({ ...activityForm, title: event.target.value })}
                    required
                  >
                    <option value="" disabled>Select an activity</option>
                    {activityCategories[jobRole].map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Details <span className="agent-optional-label">Optional</span>
                  <textarea
                    value={activityForm.details}
                    onChange={(event) => setActivityForm({ ...activityForm, details: event.target.value })}
                    maxLength={2000}
                    rows={4}
                    placeholder="Add notes or a short description"
                  />
                </label>
                <button className="primary-btn" type="submit" disabled={savingActivity || !activityForm.title}>
                  {savingActivity ? "Saving..." : "Save activity"}
                </button>
              </form>
              )}
            </section>

            <section className="panel">
              <div className="agent-section-heading">
                <div><p className="eyebrow">Your work log</p><h2>Activity history</h2></div>
                <span className="agent-date-label">{activities.length} total</span>
              </div>
              {activities.length === 0 ? (
                <p className="agent-empty-state">No activities yet. Add your first update above.</p>
              ) : (
                <div className="agent-activity-list">
                  {activities.map((activity) => (
                    <article className="agent-activity-item" key={activity.id}>
                      <span className="agent-activity-dot" aria-hidden="true" />
                      <div>
                        <div className="agent-activity-title-row"><strong>{activity.title}</strong><time>{activity.date}</time></div>
                        {activity.details ? <p>{activity.details}</p> : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <section className="panel agent-team-panel">
            <div className="agent-section-heading agent-team-heading">
              <div>
                <p className="eyebrow">Shared with your team</p>
                <h2>What everyone is working on</h2>
              </div>
              <label className="agent-team-month">
                <span>Month</span>
                <input
                  type="month"
                  value={teamMonth}
                  onChange={(event) => {
                    const month = event.target.value;
                    setTeamMonth(month);
                    if (month) loadTeamActivities(month);
                  }}
                />
              </label>
            </div>

            <div className="agent-team-filters" aria-label="Filter team activities by role">
              <button
                type="button"
                className={teamRoleFilter === "ALL" ? "agent-filter-chip active" : "agent-filter-chip"}
                onClick={() => setTeamRoleFilter("ALL")}
                aria-pressed={teamRoleFilter === "ALL"}
              >
                Everyone
              </button>
              {agentJobRoles.filter((role) => role.value !== "UNASSIGNED").map((role) => (
                <button
                  type="button"
                  key={role.value}
                  className={`agent-filter-chip role-${role.value.toLowerCase()}${teamRoleFilter === role.value ? " active" : ""}`}
                  onClick={() => setTeamRoleFilter(role.value)}
                  aria-pressed={teamRoleFilter === role.value}
                >
                  {role.label}
                </button>
              ))}
            </div>

            {loadingTeamActivities ? (
              <p className="agent-empty-state" role="status">Loading team activities…</p>
            ) : teamActivities.filter((activity) => teamRoleFilter === "ALL" || activity.user.jobRole === teamRoleFilter).length === 0 ? (
              <p className="agent-empty-state">
                No team activities found for {teamRoleFilter === "ALL"
                  ? new Date(`${teamMonth}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })
                  : getAgentJobRoleLabel(teamRoleFilter)}.
              </p>
            ) : (
              <div className="agent-team-activity-grid">
                {teamActivities
                  .filter((activity) => teamRoleFilter === "ALL" || activity.user.jobRole === teamRoleFilter)
                  .map((activity) => (
                    <article
                      className={`agent-team-activity-card role-${activity.user.jobRole.toLowerCase()}`}
                      key={activity.id}
                    >
                      <div className="agent-team-card-top">
                        <span className="agent-team-avatar">{getInitials(activity.user.name)}</span>
                        <div className="agent-team-person">
                          <strong>{activity.user.name}</strong>
                          <span>{getAgentJobRoleLabel(activity.user.jobRole)}</span>
                        </div>
                        <time dateTime={activity.date}>{activity.date}</time>
                      </div>
                      <span className="agent-activity-category">{activity.title}</span>
                      {activity.details ? <p>{activity.details}</p> : null}
                    </article>
                  ))}
              </div>
            )}
            <p className="agent-team-note">
              Showing up to 500 active agents&apos; activities for the selected month.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
