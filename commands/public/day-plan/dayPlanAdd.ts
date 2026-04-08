import { intro, outro, log } from '@clack/prompts';
import { evictOldPlans, getPlan, savePlan, emptyPlan } from '../../../utils/dayPlanState';
import { today } from '../../../utils/dailyState';
import { showTaskList, runAddLoop } from './dayPlanUtils';

export async function dayPlanAddFlow(): Promise<void> {
  evictOldPlans();
  intro('Day Planner — Add Tasks');

  const date = today();
  const plan = getPlan(date) ?? emptyPlan();

  const ok = await runAddLoop(plan.tasks);
  if (!ok) { outro('Cancelled.'); return; }

  savePlan(date, plan);

  if (plan.tasks.length > 0) {
    showTaskList(plan.tasks, date);
  } else {
    log.info('No tasks added.');
  }

  outro('Tasks saved.');
}
