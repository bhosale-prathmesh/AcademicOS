export function buildPriorityPrompt(tasks) {
  const lines = tasks.map(task => {
    const due = task.dueDate ? ` due=${task.dueDate}` : "";
    return `- id=${task.id} | title=${task.title} | status=${task.status} | priority=${task.priority || "medium"} | subject=${task.subject || "general"}${due}`;
  });

  return `You are an academic task prioritization assistant.
Return ONLY valid JSON with this shape:
{"taskId":"<id from list>","reason":"<short explanation>"}

Pick the single best next task from this list:
${lines.join("\n")}

Rules:
- Prefer overdue and nearest deadlines.
- Prefer incomplete tasks over completed ones.
- Use only task IDs from the list.`;
}
