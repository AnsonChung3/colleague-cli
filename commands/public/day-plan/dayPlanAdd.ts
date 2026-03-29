import { intro, note, outro, log } from '@clack/prompts';
import { evictOldPlans, getPlan, savePlan, emptyPlan } from '../../../utils/dayPlanState';
import { today } from '../../../utils/dailyState';
import { runAddLoop } from './dayPlanEdit';
import { formatDate } from './dayPlanUtils';

export async function dayPlanAddFlow(): Promise<void> {
  evictOldPlans();
  intro('Day Planner — Add Tasks');

  const date = today();
  const plan = getPlan(date) ?? emptyPlan();

  const ok = await runAddLoop(plan.tasks);
  if (!ok) { outro('Cancelled.'); return; }

  savePlan(date, plan);

  if (plan.tasks.length > 0) {
    const taskList = plan.tasks.map((t, i) => `${i + 1}. ${t.label}`).join('\n');
    note(taskList, `Plan for ${formatDate(date)}`);
  } else {
    log.info('No tasks added.');
  }

  outro('Tasks saved.');
}
