export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return "Not set";
  return date.toLocaleString();
}

export function formatDateOnly(value) {
  const date = toDate(value);
  if (!date) return "No due date";
  return date.toLocaleDateString();
}

export function isOverdue(dueDate, status) {
  if (status === "completed") return false;
  const due = toDate(dueDate);
  if (!due) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export function safeTaskStatus(status) {
  return ["pending", "in_progress", "completed"].includes(status)
    ? status
    : "pending";
}

export function canManageAssignments(role) {
  return role === "admin" || role === "teacher";
}

export function roleLabel(role) {
  if (role === "admin") return "Admin";
  if (role === "teacher") return "Teacher";
  return "Student";
}
