import { intro, select, outro, isCancel, log } from '@clack/prompts';
import { allowedDates, evictOldPlans, getPlan, savePlan, emptyPlan } from '../../../utils/dayPlanState';
import { today } from '../../../utils/dailyState';
import { collectMealTimesFlow } from '../mealTimes';
import { checkDayFlow } from './dayPlanCheck';
import { dayPlanEditFlow } from './dayPlanEdit';
import { dayPlanAddFlow } from './dayPlanAdd';
import { dayPlanRemoveFlow } from './dayPlanRemove';
import { formatDate } from './dayPlanUtils';

export { formatDate };

const VALID_CHECK_OFFSETS = ['0', '1', '2'] as const;

export async function dayPlan(
  offset?: string,
  options: { check?: boolean; edit?: boolean; add?: boolean; remove?: boolean } = {},
) {
  // ── Mutual exclusion guard ───────────────────────────────────────────────────
  const activeFlags = [options.check, options.edit, options.add, options.remove].filter(Boolean);
  if (activeFlags.length > 1) {
    log.error('Only one flag can be used at a time: --check, --edit, --add, --remove');
    process.exit(1);
  }

  // ── Flag: --check ────────────────────────────────────────────────────────────
  if (options.check) {
    if (offset !== undefined && !(VALID_CHECK_OFFSETS as readonly string[]).includes(offset)) {
      log.error(`Invalid argument: "${offset}". Accepted: 0 (today), 1 (tomorrow), 2 (day after).`);
      process.exit(1);
    }
    const raw = parseInt(offset ?? '0', 10);
    await checkDayFlow((raw === 1 || raw === 2 ? raw : 0) as 0 | 1 | 2);
    return;
  }

  // ── Flag: --edit (today only) ────────────────────────────────────────────────
  if (options.edit) {
    evictOldPlans();
    intro('Day Planner');
    await dayPlanEditFlow(today());
    return;
  }

  // ── Flag: --add (today only) ─────────────────────────────────────────────────
  if (options.add) {
    await dayPlanAddFlow();
    return;
  }

  // ── Flag: --remove (today only) ──────────────────────────────────────────────
  if (options.remove) {
    await dayPlanRemoveFlow();
    return;
  }

  // ── Interactive menu path ────────────────────────────────────────────────────
  evictOldPlans();

  const [d0, d1, d2] = allowedDates();
  intro('Day Planner');

  // Step 1: pick which day to plan
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

  const plan = getPlan(date) ?? emptyPlan();

  // Step 2: meal times (today only, skipped if already configured)
  if (date === today() && plan.meals.length === 0) {
    const meals = await collectMealTimesFlow();
    if (meals === null) { outro('Cancelled.'); return; }
    plan.meals = meals;
    savePlan(date, plan);
  }

  // Step 3: edit flow (handles both zero-task and has-task paths)
  await dayPlanEditFlow(date);
}
