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

type TeamAgent = {
  id: string;
  name: string;
  jobRole: AgentJobRole;
  hasProfileImage: boolean;
  activityCount: number;
  categoryCounts: Array<{ title: string; count: number }>;
  recentActivities: AgentActivity[];
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  sender: { name: string };
  ownReaction?: string | null;
  reactions: Array<{ reaction: string; count: number }>;
};

type ChatAgent = {
  id: string;
  name: string;
  jobRole: AgentJobRole;
  lastMessage: {
    body: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
};

type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: string;
};

type PersonalReport = {
  start: string;
  end: string;
  activities: AgentActivity[];
  totals: Record<string, number>;
};

const reactionOptions = ["👍", "❤️", "🎉", "🙏"];

function getLocalDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
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
  const [activityForm, setActivityForm] = useState({ date: getLocalDate(), title: "", details: "" });
  const [teamAgents, setTeamAgents] = useState<TeamAgent[]>([]);
  const [teamMonth, setTeamMonth] = useState(() => getLocalDate().slice(0, 7));
  const [teamRoleFilter, setTeamRoleFilter] = useState<AgentJobRole | "ALL">("ALL");
  const [loadingTeamActivities, setLoadingTeamActivities] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "activities" | "team" | "profile" | "notifications" | "messages" | "reports">("dashboard");
  const [profileName, setProfileName] = useState(user.name);
  const [savedProfileName, setSavedProfileName] = useState(user.name);
  const [savingProfile, setSavingProfile] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", message: "" });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<"week" | "month">("week");
  const [reportDate, setReportDate] = useState(getLocalDate());
  const [personalReport, setPersonalReport] = useState<PersonalReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [chatAgents, setChatAgents] = useState<ChatAgent[]>([]);
  const [selectedChatAgent, setSelectedChatAgent] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
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
    loadNotifications(false).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not load announcements");
    });
    fetch("/api/agent/profile-image", { credentials: "include", cache: "no-store" })
      .then((response) => {
        if (response.ok) {
          setProfileImageUrl(`/api/agent/profile-image?v=${Date.now()}`);
        }
      })
      .catch(() => setProfileImageUrl(""));
  }, []);

  async function loadNotifications(markRead: boolean) {
    const response = await fetch("/api/notifications", { credentials: "include", cache: "no-store" });
    const data = await readApiResponse<{ announcements: Announcement[]; unreadCount: number }>(response);
    setAnnouncements(data.announcements);
    setUnreadAnnouncements(data.unreadCount);
    if (markRead && data.announcements.length) {
      const readResponse = await fetch("/api/notifications", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ announcementIds: data.announcements.map((item) => item.id) }),
      });
      await readApiResponse<{ message: string }>(readResponse);
      setUnreadAnnouncements(0);
    }
  }

  async function openNotifications() {
    setActivePage("notifications");
    setError("");
    try {
      await loadNotifications(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load announcements");
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/agent/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: profileName }),
      });
      const data = await readApiResponse<{ user: { name: string }; message: string }>(response);
      setProfileName(data.user.name);
      setSavedProfileName(data.user.name);
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveAnnouncement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAnnouncement(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(announcementForm),
      });
      const data = await readApiResponse<{ message: string }>(response);
      setAnnouncementForm({ title: "", message: "" });
      setMessage(data.message);
      await loadNotifications(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send announcement");
    } finally {
      setSavingAnnouncement(false);
    }
  }

  async function reactToAnnouncement(announcementId: string, reaction: string) {
    setError("");
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ announcementId, reaction }),
      });
      await readApiResponse<{ message: string }>(response);
      await loadNotifications(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your reaction");
    }
  }

  async function loadPersonalReport(period = reportPeriod, date = reportDate) {
    setLoadingReport(true);
    setError("");
    try {
      const response = await fetch(`/api/agent/reports?period=${period}&date=${date}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await readApiResponse<PersonalReport>(response);
      setPersonalReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your report");
    } finally {
      setLoadingReport(false);
    }
  }

  async function loadChatList() {
    setLoadingChat(true);
    setError("");
    try {
      const response = await fetch("/api/messages", { credentials: "include", cache: "no-store" });
      const data = await readApiResponse<{ agents: ChatAgent[] }>(response);
      setChatAgents(data.agents);
      const targetId = data.agents.some((agent) => agent.id === selectedChatAgent)
        ? selectedChatAgent
        : data.agents[0]?.id;
      setSelectedChatAgent(targetId ?? "");
      if (targetId) {
        const conversationResponse = await fetch(`/api/messages?with=${encodeURIComponent(targetId)}`, {
          credentials: "include",
          cache: "no-store",
        });
        const conversationData = await readApiResponse<{ messages: ChatMessage[] }>(conversationResponse);
        setChatMessages(conversationData.messages);
        setChatAgents(data.agents.map((agent) => (
          agent.id === targetId ? { ...agent, unreadCount: 0 } : agent
        )));
      } else {
        setChatMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages");
    } finally {
      setLoadingChat(false);
    }
  }

  async function loadConversation(agentId: string) {
    if (!agentId) return;
    setSelectedChatAgent(agentId);
    setLoadingChat(true);
    setError("");
    try {
      const response = await fetch(`/api/messages?with=${encodeURIComponent(agentId)}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await readApiResponse<{ messages: ChatMessage[] }>(response);
      setChatMessages(data.messages);
      setChatAgents((agents) => agents.map((agent) => (
        agent.id === agentId ? { ...agent, unreadCount: 0 } : agent
      )));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this conversation");
    } finally {
      setLoadingChat(false);
    }
  }

  async function sendChatMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChatAgent || !chatDraft.trim()) return;
    setSendingChat(true);
    setError("");
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ receiverId: selectedChatAgent, body: chatDraft }),
      });
      await readApiResponse<{ message: ChatMessage }>(response);
      setChatDraft("");
      await Promise.all([loadConversation(selectedChatAgent), loadChatList()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message");
    } finally {
      setSendingChat(false);
    }
  }

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
      const data = await readApiResponse<{ agents: TeamAgent[] }>(response);
      setTeamAgents(data.agents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load team activities");
    } finally {
      setLoadingTeamActivities(false);
    }
  }

  function openTeamActivities() {
    setActivePage("team");
    loadTeamActivities(teamMonth);
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

  const firstName = profileName.trim().split(/\s+/)[0] || profileName;

  return (
    <main className="agent-layout">
      <aside className="agent-sidebar">
        <a className="agent-sidebar-brand" href="/agent" aria-label="Acc Agent dashboard">
          <span className="agent-brand-mark" aria-hidden="true">A</span>
          <span>Acc Agent</span>
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
              <span>{getInitials(profileName)}</span>
            )}
          </button>
          <div className="agent-profile-info">
            <strong>{profileName}</strong>
            <span>Agent</span>
          </div>
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
            <span aria-hidden="true">◎</span> Team
          </button>
          <button
            type="button"
            className={activePage === "notifications" ? "agent-nav-link active" : "agent-nav-link"}
            onClick={openNotifications}
            aria-current={activePage === "notifications" ? "page" : undefined}
          >
            <span aria-hidden="true">♧</span> Notifications
            {unreadAnnouncements > 0 ? <span className="agent-nav-badge">{unreadAnnouncements}</span> : null}
          </button>
          <button
            type="button"
            className={activePage === "messages" ? "agent-nav-link active" : "agent-nav-link"}
            onClick={() => {
              setActivePage("messages");
              loadChatList();
            }}
            aria-current={activePage === "messages" ? "page" : undefined}
          >
            <span aria-hidden="true">✉</span> Chat
          </button>
          <button
            type="button"
            className={activePage === "reports" ? "agent-nav-link active" : "agent-nav-link"}
            onClick={() => {
              setActivePage("reports");
              loadPersonalReport();
            }}
            aria-current={activePage === "reports" ? "page" : undefined}
          >
            <span aria-hidden="true">▧</span> My Reports
          </button>
          <button
            type="button"
            className={activePage === "profile" ? "agent-nav-link active" : "agent-nav-link"}
            onClick={() => setActivePage("profile")}
            aria-current={activePage === "profile" ? "page" : undefined}
          >
            <span aria-hidden="true">◉</span> Profile
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
                : activePage === "team" ? "Your Team"
                  : activePage === "activities" ? "My Activities"
                    : activePage === "profile" ? "My Profile"
                      : activePage === "notifications" ? "Notifications"
                        : activePage === "messages" ? "Team Chat"
                          : "My Reports"}
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
        ) : activePage === "team" ? (
          <section className="panel agent-team-panel">
            <div className="agent-section-heading agent-team-heading">
              <div>
                <p className="eyebrow">Your responsibility group</p>
                <h2>{getAgentJobRoleLabel(jobRole)}</h2>
                <p className="agent-team-description">
                  Your assigned role is your team. Browse team members and their shared activity updates below.
                </p>
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
            ) : teamAgents.filter((agent) => teamRoleFilter === "ALL" || agent.jobRole === teamRoleFilter).length === 0 ? (
              <p className="agent-empty-state">
                No agents found for {teamRoleFilter === "ALL"
                  ? new Date(`${teamMonth}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })
                  : getAgentJobRoleLabel(teamRoleFilter)}.
              </p>
            ) : (
              <div className="agent-team-activity-grid">
                {teamAgents
                  .filter((agent) => teamRoleFilter === "ALL" || agent.jobRole === teamRoleFilter)
                  .map((agent) => (
                    <article
                      className={`agent-team-activity-card role-${agent.jobRole.toLowerCase()}`}
                      key={agent.id}
                    >
                      <div className="agent-team-card-profile">
                        <span className="agent-team-avatar">
                          {getInitials(agent.name)}
                          {agent.hasProfileImage ? (
                            <img
                              src={`/api/activities/team/${agent.id}/profile-image`}
                              alt=""
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.style.visibility = "hidden";
                              }}
                            />
                          ) : null}
                        </span>
                        <strong className="agent-team-name">{agent.name}</strong>
                        <span className="agent-team-role">{getAgentJobRoleLabel(agent.jobRole)}</span>
                      </div>
                      <div className="agent-team-total">
                        <span className="agent-team-total-icon" aria-hidden="true">▤</span>
                        <div>
                          <strong>{agent.activityCount}</strong>
                          <span>{agent.activityCount === 1 ? "Activity logged" : "Activities logged"}</span>
                        </div>
                      </div>
                      <div className="agent-team-category-list">
                        {activityCategories[agent.jobRole].map((category, index) => {
                          const count = agent.categoryCounts.find((entry) => entry.title === category)?.count ?? 0;
                          return (
                            <div className="agent-team-category-row" key={category}>
                              <span className={`agent-category-mark mark-${index % 6}`} aria-hidden="true" />
                              <span className="agent-team-category-name">{category}</span>
                              <strong className={`agent-team-category-count count-${index % 6}`}>{count}</strong>
                            </div>
                          );
                        })}
                      </div>
                      {agent.recentActivities.length > 0 ? (
                        <div className="agent-team-recent">
                          <span className="agent-team-recent-label">LATEST UPDATE</span>
                          <strong>{agent.recentActivities[0].title}</strong>
                          <time dateTime={agent.recentActivities[0].date}>{agent.recentActivities[0].date}</time>
                        </div>
                      ) : (
                        <div className="agent-team-recent agent-team-no-activity">
                          <span className="agent-team-recent-label">THIS MONTH</span>
                          <span>No activity logged yet</span>
                        </div>
                      )}
                    </article>
                  ))}
              </div>
            )}
            <p className="agent-team-note">Activity totals and category counts update for the selected month.</p>
          </section>
        ) : activePage === "profile" ? (
          <section className="panel agent-profile-editor">
            <div className="agent-section-heading">
              <div><p className="eyebrow">Your account</p><h2>Profile settings</h2></div>
            </div>
            <div className="agent-profile-editor-card">
              <button
                className="agent-profile-editor-avatar"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                aria-label="Change profile photo"
              >
                {profileImageUrl ? <img src={profileImageUrl} alt="" /> : getInitials(profileName)}
              </button>
              <div>
                <strong>Profile picture</strong>
                <p>Use a JPEG, PNG, or WebP image up to 1 MB.</p>
                <button className="agent-text-btn" type="button" onClick={() => fileInputRef.current?.click()}>
                  {uploadingImage ? "Uploading…" : "Choose a photo"}
                </button>
              </div>
            </div>
            <form className="stack-form agent-profile-name-form" onSubmit={saveProfile}>
              <label>
                Display name
                <input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  maxLength={80}
                  required
                />
              </label>
              <label>
                Email
                <input value={user.email} readOnly />
              </label>
              <button className="primary-btn" type="submit" disabled={savingProfile || profileName.trim() === savedProfileName}>
                {savingProfile ? "Saving…" : "Save profile"}
              </button>
            </form>
          </section>
        ) : activePage === "notifications" ? (
          <section className="panel agent-notifications">
            <div className="agent-section-heading">
              <div><p className="eyebrow">Updates from your administrator</p><h2>Announcements</h2></div>
            </div>
            {announcements.length === 0 ? (
              <p className="agent-empty-state">There are no announcements yet.</p>
            ) : announcements.map((announcement) => (
              <article className="agent-announcement-card" key={announcement.id}>
                <div className="agent-announcement-heading">
                  <div><h3>{announcement.title}</h3><span>From {announcement.sender.name}</span></div>
                  <time>{new Date(announcement.createdAt).toLocaleString()}</time>
                </div>
                <p>{announcement.message}</p>
                <div className="agent-reaction-list" aria-label="React to announcement">
                  {announcement.reactions.map(({ reaction, count }) => (
                    <button
                      type="button"
                      key={reaction}
                      className={announcement.ownReaction === reaction ? "agent-reaction active" : "agent-reaction"}
                      onClick={() => reactToAnnouncement(announcement.id, reaction)}
                      aria-pressed={announcement.ownReaction === reaction}
                    >
                      {reaction} <span>{count}</span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </section>
        ) : activePage === "reports" ? (
          <div className="agent-report-page">
            <section className="panel">
              <div className="agent-section-heading">
                <div><p className="eyebrow">Your recorded work only</p><h2>Activity report</h2></div>
                <div className="agent-report-controls">
                  <label>
                    Period
                    <select
                      value={reportPeriod}
                      onChange={(event) => setReportPeriod(event.target.value as "week" | "month")}
                    >
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                    </select>
                  </label>
                  <label>
                    Reference date
                    <input type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} />
                  </label>
                  <button className="primary-btn" type="button" onClick={() => loadPersonalReport()} disabled={loadingReport}>
                    {loadingReport ? "Loading…" : "View report"}
                  </button>
                </div>
              </div>
              {personalReport ? (
                <>
                  <p className="agent-report-range">{personalReport.start} — {personalReport.end}</p>
                  <div className="agent-report-totals">
                    {Object.entries(personalReport.totals).map(([title, count]) => (
                      <div key={title}><span>{title}</span><strong>{count}</strong></div>
                    ))}
                    {Object.keys(personalReport.totals).length === 0 ? <p>No activity was logged in this period.</p> : null}
                  </div>
                  <div className="agent-activity-list">
                    {personalReport.activities.map((activity) => (
                      <article className="agent-activity-item" key={activity.id}>
                        <span className="agent-activity-dot" aria-hidden="true" />
                        <div>
                          <div className="agent-activity-title-row"><strong>{activity.title}</strong><time>{activity.date}</time></div>
                          {activity.details ? <p>{activity.details}</p> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : <p className="agent-empty-state">Choose a week or month to view your activity report.</p>}
            </section>
          </div>
        ) : (
          <section className="agent-chat-layout">
            <aside className="panel agent-chat-contacts">
              <div className="agent-section-heading"><div><p className="eyebrow">Direct messages</p><h2>Agents</h2></div></div>
              {loadingChat && chatAgents.length === 0 ? <p className="agent-empty-state">Loading agents…</p> : null}
              {chatAgents.length === 0 && !loadingChat ? <p className="agent-empty-state">No other active agents are available.</p> : null}
              {chatAgents.map((agent) => (
                <button
                  className={selectedChatAgent === agent.id ? "agent-chat-contact active" : "agent-chat-contact"}
                  type="button"
                  key={agent.id}
                  onClick={() => loadConversation(agent.id)}
                >
                  <span><strong>{agent.name}</strong><small>{getAgentJobRoleLabel(agent.jobRole)}</small></span>
                  {agent.unreadCount > 0 ? <b>{agent.unreadCount}</b> : null}
                  {agent.lastMessage ? <small className="agent-chat-preview">{agent.lastMessage.body}</small> : null}
                </button>
              ))}
            </aside>
            <div className="panel agent-chat-conversation">
              <div className="agent-section-heading">
                <div>
                  <p className="eyebrow">Private conversation</p>
                  <h2>{chatAgents.find((agent) => agent.id === selectedChatAgent)?.name ?? "Choose an agent"}</h2>
                </div>
              </div>
              <div className="agent-chat-messages" aria-live="polite">
                {chatMessages.map((chatMessage) => (
                  <article className={chatMessage.senderId === user.userId ? "agent-chat-bubble own" : "agent-chat-bubble"} key={chatMessage.id}>
                    <p>{chatMessage.body}</p><time>{new Date(chatMessage.createdAt).toLocaleString()}</time>
                  </article>
                ))}
                {!chatMessages.length && selectedChatAgent ? <p className="agent-empty-state">Start the conversation with a message.</p> : null}
                {loadingChat ? <p className="agent-empty-state">Loading conversation…</p> : null}
              </div>
              <form className="agent-chat-compose" onSubmit={sendChatMessage}>
                <input
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  maxLength={2000}
                  placeholder="Write a message…"
                  aria-label="Message"
                  disabled={!selectedChatAgent || sendingChat}
                />
                <button className="primary-btn" type="submit" disabled={!selectedChatAgent || !chatDraft.trim() || sendingChat}>
                  {sendingChat ? "Sending…" : "Send"}
                </button>
              </form>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
