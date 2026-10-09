export function parsePriorityResponse(rawText, taskIds) {
  if (!rawText || !taskIds.length) return null;

  const idSet = new Set(taskIds);
  const trimmed = rawText.trim();

  try {
    const direct = JSON.parse(trimmed);
    if (direct?.taskId && idSet.has(direct.taskId)) {
      return {
        taskId: direct.taskId,
        reason: String(direct.reason || "Recommended by AI.")
      };
    }
  } catch {
    // fall through
  }

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.taskId && idSet.has(parsed.taskId)) {
        return {
          taskId: parsed.taskId,
          reason: String(parsed.reason || "Recommended by AI.")
        };
      }
    } catch {
      // fall through
    }
  }

  for (const id of taskIds) {
    if (trimmed.includes(id)) {
      return {
        taskId: id,
        reason: "AI mentioned this task ID in its response."
      };
    }
  }

  return null;
}
