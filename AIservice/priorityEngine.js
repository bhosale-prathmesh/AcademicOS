import { isOverdue, safeTaskStatus } from "../engine/dataEngine.js";
import { isOllamaReachable, generatePrioritization } from "./ollamaClient.js";
import { buildPriorityPrompt } from "./promptBuilder.js";
import { parsePriorityResponse } from "./responseParser.js";

function scoreTask(task) {
  const status = safeTaskStatus(task.status);
  if (status === "completed") return -Infinity;

  let score = 0;
  const priorityWeight = { high: 30, medium: 15, low: 5 };
  score += priorityWeight[task.priority] || 15;

  if (isOverdue(task.dueDate, status)) score += 100;

  if (task.dueDate) {
    const due = new Date(task.dueDate);
    if (!Number.isNaN(due.getTime())) {
      const days = (due - Date.now()) / (1000 * 60 * 60 * 24);
      if (days <= 1) score += 50;
      else if (days <= 3) score += 30;
      else if (days <= 7) score += 15;
    }
  }

  if (status === "in_progress") score += 10;
  return score;
}

export function ruleBasedPriority(tasks) {
  const openTasks = tasks.filter(
    task => safeTaskStatus(task.status) !== "completed"
  );

  if (!openTasks.length) {
    return {
      source: "rules",
      taskId: null,
      reason: "All personal tasks are completed. Great work!"
    };
  }

  const ranked = [...openTasks].sort((a, b) => scoreTask(b) - scoreTask(a));
  const top = ranked[0];

  let reason = "Highest rule-based score";
  if (isOverdue(top.dueDate, top.status)) {
    reason = "This task is overdue.";
  } else if (top.dueDate) {
    reason = "This task has the nearest deadline.";
  } else if (top.priority === "high") {
    reason = "This task has high priority.";
  } else if (top.status === "in_progress") {
    reason = "Continue the task already in progress.";
  }

  return {
    source: "rules",
    taskId: top.id,
    reason
  };
}

export async function recommendNextTask(tasks, options = {}) {
  const openTasks = tasks.filter(
    task => safeTaskStatus(task.status) !== "completed"
  );

  if (!openTasks.length) {
    return {
      source: "rules",
      taskId: null,
      reason: "No open tasks to prioritize."
    };
  }

  const reachable = await isOllamaReachable(options.baseUrl);

  if (!reachable) {
    return ruleBasedPriority(tasks);
  }

  try {
    const prompt = buildPriorityPrompt(openTasks);
    const raw = await generatePrioritization(prompt, options);
    const parsed = parsePriorityResponse(
      raw,
      openTasks.map(task => task.id)
    );

    if (parsed) {
      return {
        source: "ai",
        taskId: parsed.taskId,
        reason: parsed.reason
      };
    }
  } catch (error) {
    console.warn("Ollama prioritization failed:", error);
  }

  return ruleBasedPriority(tasks);
}
