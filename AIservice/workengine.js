import { listPersonalTasks } from "../engine/taskEngine.js";
import { listJoinedGroups } from "../engine/groupEngine.js";
import { listGroupTasks, getTaskProgress } from "../engine/progressEngine.js";
import { toDate, safeTaskStatus } from "../engine/dataEngine.js";

// Everything the student still has to do: open personal tasks plus open
// assignments from groups where the user is a student. Each item has a unique
// string id, so the AI can point at exactly one of them.

async function openGroupWork(user) {
  const groups = (await listJoinedGroups(user)).filter(
    group => group.myRole === "student"
  );

  const results = await Promise.allSettled(
    groups.map(async group => {
      const tasks = await listGroupTasks(group.id);

      const rows = await Promise.all(
        tasks.map(async task => {
          const progress = await getTaskProgress(group.id, task.id, user.uid);
          const status = safeTaskStatus(progress?.status);
          if (status === "completed") return null;

          const due = toDate(task.dueDate);

          return {
            id: `group:${group.id}:${task.id}`,
            title: task.title || "Untitled assignment",
            subject: group.name || "Group",
            priority: "medium",
            status,
            // ISO string so date maths works the same as for personal tasks.
            dueDate: due ? due.toISOString() : null,
            source: "group",
            groupId: group.id,
            groupName: group.name || "Group"
          };
        })
      );

      return rows.filter(Boolean);
    })
  );

  const items = [];
  let failed = 0;

  for (const result of results) {
    if (result.status === "fulfilled") items.push(...result.value);
    else {
      failed += 1;
      console.error("Group work failed:", result.reason);
    }
  }

  return { items, failed };
}

export async function loadOpenWork(user) {
  const [personal, groups] = await Promise.allSettled([
    listPersonalTasks(user.uid),
    openGroupWork(user)
  ]);

  if (personal.status === "rejected" && groups.status === "rejected") {
    throw personal.reason;
  }

  const items = [];
  let partial = false;

  if (personal.status === "fulfilled") {
    for (const task of personal.value) {
      const status = safeTaskStatus(task.status);
      if (status === "completed") continue;

      items.push({
        id: `personal:${task.id}`,
        title: task.title || "Untitled task",
        subject: task.subject || "",
        priority: task.priority || "medium",
        status,
        dueDate: task.dueDate || null,
        source: "personal",
        groupName: ""
      });
    }
  } else {
    partial = true;
    console.error("Personal work failed:", personal.reason);
  }

  if (groups.status === "fulfilled") {
    items.push(...groups.value.items);
    if (groups.value.failed) partial = true;
  } else {
    partial = true;
    console.error("Group work failed:", groups.reason);
  }

  return { items, partial };
}