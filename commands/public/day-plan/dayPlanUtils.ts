import { note, text, isCancel, log } from '@clack/prompts';
import type { Task } from '../../../utils/dayPlanState';

// Formats a YYYY-MM-DD string into a readable label e.g. "Thu 27 Mar"
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00'); // T00:00:00 avoids timezone shifting the date
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Parses 'task one', 'task two' format into an array.
// Falls back to treating the whole input as a single task if no quotes are used.
// Returns empty array on blank input (signals end of loop).
export function parseTasks(input: string): string[] {
  const quoted = [...input.matchAll(/'([^']+)'/g)].map(m => m[1].trim()).filter(Boolean);
  if (quoted.length > 0) return quoted;
  const trimmed = input.trim();
  return trimmed ? [trimmed] : [];
}

// Renders the full task list as a clack note, using ✓/□ markers for done state.
export function showTaskList(tasks: Task[], date: string): void {
  const taskList = tasks.map(t => `${t.done ? '✓' : '□'} ${t.label}`).join('\n');
  note(taskList, `Plan for ${formatDate(date)}`);
}

// Shared add loop — used by dayPlanAdd.ts and dayPlanEdit.ts.
// Mutates the tasks array in place. Returns false if the user cancelled (Escape).
export async function runAddLoop(tasks: Task[]): Promise<boolean> {
  while (true) {
    const input = await text({
      message: 'Add tasks',
      placeholder: "'Fix bug', 'Review PR'  —  leave empty and press Enter to exit",
    });
    if (isCancel(input)) return false;
    const parsed = parseTasks((input ?? '') as string);
    if (parsed.length === 0) break;
    for (const label of parsed) {
      tasks.push({ id: String(tasks.length + 1), label, done: false });
    }
    log.success(`Added ${parsed.length} task${parsed.length !== 1 ? 's' : ''}.`);
  }
  return true;
}
