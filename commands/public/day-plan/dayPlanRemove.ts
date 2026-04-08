import { intro, multiselect, outro, isCancel, log } from '@clack/prompts';
import { evictOldPlans, getPlan, savePlan } from '../../../utils/dayPlanState';
import { today } from '../../../utils/dailyState';
import { showTaskList } from './dayPlanUtils';

export async function dayPlanRemoveFlow(): Promise<void> {
  evictOldPlans();
  intro('Day Planner — Remove Tasks');

  const date = today();
  const plan = getPlan(date);

  if (!plan || plan.tasks.length === 0) {
    log.info('No tasks planned for today.');
    outro('');
    return;
  }

  const removable = plan.tasks.filter(t => !t.done);
  if (removable.length === 0) {
    log.info('All tasks are checked off — nothing to remove.');
    outro('');
    return;
  }

  const toRemove = await multiselect({
    message: 'Select tasks to remove:',
    options: removable.map(t => ({ value: t.id, label: t.label })),
    required: false,
  });
  if (isCancel(toRemove)) { outro('Cancelled.'); return; }

  const removeIds = new Set(toRemove as string[]);
  plan.tasks = plan.tasks.filter(t => !removeIds.has(t.id));
  savePlan(date, plan);

  if (plan.tasks.length > 0) {
    showTaskList(plan.tasks, date);
  } else {
    log.info('No tasks remaining.');
  }

  outro(`Removed ${removeIds.size} task${removeIds.size !== 1 ? 's' : ''}.`);
}
