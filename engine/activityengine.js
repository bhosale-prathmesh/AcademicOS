import { listPersonalTasks } from "./taskEngine.js";
import { listJoinedGroups } from "./groupEngine.js";
import { listGroupTasks, getTaskProgress } from "./progressEngine.js";
import { toDate } from "./dataEngine.js";

// Every completion becomes one event: { id, date, title, source, groupName }.
// source is "personal" (own task) or "group" (own progress on a group assignment).

function personalEvents(tasks) {
  const events = [];

  for (const task of tasks) {
    if (task.status !== "completed") continue;

    // Older tasks may have no completedAt; fall back to the last update time.
    const date = toDate(task.completedAt) || toDate(task.updatedAt);
    if (!date) continue;

    events.push({
      id: `personal:${task.id}`,
      date,
      title: task.title || "Untitled task",
      source: "personal",
      groupName: ""
    });
  }

  return events;
}

async function groupEvents(user) {
  const groups = await listJoinedGroups(user);

  const results = await Promise.allSettled(
    groups.map(async group => {
      const tasks = await listGroupTasks(group.id);

      const rows = await Promise.all(
        tasks.map(async task => {
          const progress = await getTaskProgress(group.id, task.id, user.uid);
          if (progress?.status !== "completed") return null;

          const date = toDate(progress.completedAt) || toDate(progress.updatedAt);
          if (!date) return null;

          return {
            id: `group:${group.id}:${task.id}`,
            date,
            title: task.title || "Untitled assignment",
            source: "group",
            groupName: group.name || "Group"
          };
        })
      );

      return rows.filter(Boolean);
    })
  );

  const events = [];
  let failed = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      events.push(...result.value);
    } else {
      failed += 1;
      console.error("Group activity failed:", result.reason);
    }
  }

  return { events, failed };
}

export async function loadActivityEvents(user) {
  const [personal, groups] = await Promise.allSettled([
    listPersonalTasks(user.uid),
    groupEvents(user)
  ]);

  if (personal.status === "rejected" && groups.status === "rejected") {
    throw personal.reason;
  }

  const events = [];
  let partial = false;

  if (personal.status === "fulfilled") {
    events.push(...personalEvents(personal.value));
  } else {
    partial = true;
    console.error("Personal activity failed:", personal.reason);
  }

  if (groups.status === "fulfilled") {
    events.push(...groups.value.events);
    if (groups.value.failed) partial = true;
  } else {
    partial = true;
    console.error("Group activity failed:", groups.reason);
  }

  return { events, partial };
}