export function buildSystemPrompt(goal?: string, constraints?: string) {
  const trimmedGoal = goal?.trim();
  const trimmedConstraints = constraints?.trim();
  if (!trimmedGoal && !trimmedConstraints) {
    return undefined;
  }

  const lines: string[] = [];
  if (trimmedGoal) {
    lines.push(
      `Persona / Goal: ${trimmedGoal}`
    );
  }
  if (trimmedConstraints) {
    lines.push(`Constraints: ${trimmedConstraints}`);
  }
  lines.push(
    "Your job is to keep the user focused on meaningful milestones, celebrate progress, and recommend next actions when appropriate."
  );

  return lines.join("\n");
}
