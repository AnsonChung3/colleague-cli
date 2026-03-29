import { intro, select, text, confirm, note, outro, isCancel, log } from '@clack/prompts';
import { allowedDates, evictOldPlans, getPlan, savePlan, emptyPlan } from '../../utils/dayPlanState';
import type { DayPlan } from '../../utils/dayPlanState';
import { today } from '../../utils/dailyState';
import { collectMealTimesFlow } from './mealTimes';
import { checkDayFlow } from './dayPlanCheck';

// Parses 'task one', 'task two' format into an array.
// Falls back to treating the whole input as a single task if no quotes are used.
// Returns empty array on blank input (signals end of loop).
function parseTasks(input: string): string[] {
  const quoted = [...input.matchAll(/'([^']+)'/g)].map(m => m[1].trim()).filter(Boolean);
  if (quoted.length > 0) return quoted;
  const trimmed = input.trim();
  return trimmed ? [trimmed] : [];
}

// Formats a YYYY-MM-DD string into a readable label e.g. "Thu 27 Mar"
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00'); // T00:00:00 avoids timezone shifting the date
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export async function dayPlan(options: { check?: string | boolean } = {}) {
  if (options.check !== undefined) {
    const raw = typeof options.check === 'string' ? parseInt(options.check, 10) : 0;
    const offset = (raw === 1 || raw === 2 ? raw : 0) as 0 | 1 | 2;
    await checkDayFlow(offset);
    return;
  }

  evictOldPlans();

  const [d0, d1, d2] = allowedDates();
  intro('Day Planner');

  // ── Step 1: pick which day to plan ──────────────────────────────────────────
  const dateChoice = await select({
    message: 'Which day are you planning for?',
    options: [
      { value: d0, label: `Today     (${formatDate(d0)})` },
      { value: d1, label: `Tomorrow  (${formatDate(d1)})` },
      { value: d2, label: `Day after (${formatDate(d2)})` },
    ],
  });
  if (isCancel(dateChoice)) { outro('Cancelled.'); return; }
  const date = dateChoice as string;

  const plan: DayPlan = getPlan(date) ?? emptyPlan();

  // ── Step 2: meal times (today only, skipped if already configured) ───────────
  // Meal time reminders are handled globally by runTimeChecks in index.ts.
  // Here we only set them up if they haven't been configured yet.
  if (date === today() && plan.meals.length === 0) {
    const meals = await collectMealTimesFlow();
    if (meals === null) { outro('Cancelled.'); return; }
    plan.meals = meals;
    savePlan(date, plan);
  }

  // ── Step 3: add tasks ────────────────────────────────────────────────────────
  let shouldAddTasks = plan.tasks.length === 0;

  if (plan.tasks.length > 0) {
    log.info(`${plan.tasks.length} existing task${plan.tasks.length !== 1 ? 's' : ''} for this day.`);
    const addMore = await confirm({ message: 'Add more tasks?', initialValue: true });
    if (isCancel(addMore)) { outro('Cancelled.'); return; }
    shouldAddTasks = addMore as boolean;
  }

  if (shouldAddTasks) {
    while (true) {
      const input = await text({
        message: 'Add tasks',
        placeholder: "'Fix bug', 'Review PR'  —  leave empty to continue",
      });

      // Escape exits the whole command
      if (isCancel(input)) { outro('Cancelled.'); return; }

      const parsed = parseTasks((input ?? '') as string);
      if (parsed.length === 0) break; // empty Enter → move on

      for (const label of parsed) {
        plan.tasks.push({ id: String(plan.tasks.length + 1), label, done: false });
      }
      log.success(`Added ${parsed.length} task${parsed.length !== 1 ? 's' : ''}.`);
    }
  }

  savePlan(date, plan);

  // ── Step 4: show summary ─────────────────────────────────────────────────────
  if (plan.tasks.length > 0) {
    const taskList = plan.tasks.map((t, i) => `${i + 1}. ${t.label}`).join('\n');
    note(taskList, `Plan for ${formatDate(date)}`);
  }

  // check-day command (not yet implemented) will allow reviewing and ticking off tasks
  outro(`Plan saved. Use 'colleague check-day' to review and tick off tasks later.`);
}
