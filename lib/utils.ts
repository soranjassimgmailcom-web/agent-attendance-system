export function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-CA");
}

export function formatTime(date: Date | string | null) {
  if (!date) return "--";
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calculateWorkHours(checkInAt: Date | string | null, checkOutAt: Date | string | null) {
  if (!checkInAt || !checkOutAt) return "--";

  const start = new Date(checkInAt).getTime();
  const end = new Date(checkOutAt).getTime();
  const diffMs = end - start;

  if (diffMs <= 0) return "0h 0m";

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}
