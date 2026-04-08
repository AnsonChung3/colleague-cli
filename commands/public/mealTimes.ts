import { intro, confirm, text, outro, isCancel, log } from '@clack/prompts';
import { today } from '../../utils/dailyState';
import { currentTime } from '../../utils/dailyState';
import { getPlan, savePlan, emptyPlan } from '../../utils/dayPlanState';
import type { Meal } from '../../utils/dayPlanState';

// Accepts HHMM (4-digit) or HH:MM and normalises to HH:MM.
// Returns null if the input is not a valid time.
function normalizeTime(input: string): string | null {
  const s = input.trim();
  if (/^\d{2}:\d{2}$/.test(s)) return s <= '23:59' ? s : null;
  if (/^\d{4}$/.test(s)) {
    const normalized = `${s.slice(0, 2)}:${s.slice(2)}`;
    return normalized <= '23:59' ? normalized : null;
  }
  return null;
}

// Prompts for a single time value. Returns the normalised HH:MM string,
// or null if the user cancelled.
async function promptTime(label: string): Promise<string | null> {
  const input = await text({
    message: `${label} (HHMM or HH:MM)`,
    placeholder: '1300',
    validate: v => normalizeTime(v) ? undefined : 'Enter time as HHMM (e.g. 1300) or HH:MM (e.g. 13:00)',
  });
  if (isCancel(input)) return null;
  return normalizeTime((input ?? '') as string);
}

// Core meal-time setup flow. Returns the configured Meal[] array, or null if
// the user cancels at any point. Intentionally has no intro/outro so it can be
// embedded inside other commands (e.g. day-plan) without double-wrapping.
//
// Time/eaten decision table:
//   < 11:00, eaten     → Lunch, Dinner
//   < 11:00, not eaten → Brunch, Lunch, Dinner
//   11–15:00, eaten    → Dinner only
//   11–15:00, not eaten→ Lunch, Dinner
//   ≥ 15:00            → Dinner only (no eaten prompt)
export async function collectMealTimesFlow(): Promise<Meal[] | null> {
  const now = currentTime();
  const hour = parseInt(now.slice(0, 2), 10);
  const meals: Meal[] = [];

  // Helper: offer a single named meal, push to meals if accepted
  async function offerMeal(label: string): Promise<boolean> {
    const want = await confirm({ message: `Set a time for ${label}?`, initialValue: true });
    if (isCancel(want)) return false; // signals outer function to return null
    if (!want) return true; // skipped, but not cancelled
    const t = await promptTime(`${label} time`);
    if (t === null) return false; // cancelled inside promptTime
    meals.push({ label, time: t, acknowledged: false });
    return true;
  }

  if (hour >= 15) {
    // Late in the day — skip eaten question, offer dinner only
    if (!await offerMeal('Dinner')) return null;
    return meals;
  }

  // Before 15:00 — ask if they've eaten
  const eaten = await confirm({ message: 'Have you eaten?', initialValue: false });
  if (isCancel(eaten)) return null;

  if (hour < 11) {
    if (eaten) {
      if (!await offerMeal('Lunch')) return null;
    } else {
      if (!await offerMeal('Brunch')) return null;
      if (!await offerMeal('Lunch')) return null;
    }
  } else {
    // 11:00–15:00
    if (!eaten) {
      if (!await offerMeal('Lunch')) return null;
    }
    // eaten in this window → fall straight through to dinner offer below
  }

  // Dinner is offered for all < 15:00 paths
  if (!await offerMeal('Dinner')) return null;

  return meals;
}

// Standalone command. Loads today's plan, optionally resets existing meals,
// runs the flow, and saves.
export async function mealTimes(): Promise<void> {
  intro('Meal Times');

  const plan = getPlan(today()) ?? emptyPlan();

  if (plan.meals.length > 0) {
    log.info(`Meals already set: ${plan.meals.map(m => `${m.label} ${m.time}`).join(', ')}`);
    const reset = await confirm({ message: 'Reset and reconfigure?', initialValue: false });
    if (isCancel(reset) || !reset) { outro('Unchanged.'); return; }
    plan.meals = [];
  }

  const meals = await collectMealTimesFlow();
  if (meals === null) { outro('Cancelled.'); return; }

  plan.meals = meals;
  savePlan(today(), plan);

  if (meals.length === 0) {
    outro('No meal times set.');
  } else {
    outro(`Saved: ${meals.map(m => `${m.label} at ${m.time}`).join(', ')}`);
  }
}
