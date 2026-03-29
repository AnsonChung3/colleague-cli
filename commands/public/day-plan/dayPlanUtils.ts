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
