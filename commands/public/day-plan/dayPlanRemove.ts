import { intro, multiselect, note, outro, isCancel, log } from '@clack/prompts';
import { evictOldPlans, getPlan, savePlan } from '../../../utils/dayPlanState';
import { today } from '../../../utils/dailyState';
import { formatDate } from './dayPlanUtils';

export async function dayPlanRemoveFlow(): Promise<void> {
  evictOldPlans();
  intro('Day Planner — Remove Tasks');

  const date = today();
  const plan = getPlan(date);

  if (!plan || plan.tasks.length === 0) {
    log.info('No tasks planned for today.');
    process.exit(0);
  }

  const toRemove = await multiselect({
    message: 'Select tasks to remove:',
    options: plan.tasks.map(t => ({ value: t.id, label: t.label })),
    required: false,
  });
  if (isCancel(toRemove)) { outro('Cancelled.'); return; }

  const removeIds = new Set(toRemove as string[]);
  plan.tasks = plan.tasks.filter(t => !removeIds.has(t.id));
  savePlan(date, plan);

  if (plan.tasks.length > 0) {
    const taskList = plan.tasks.map((t, i) => `${i + 1}. ${t.label}`).join('\n');
    note(taskList, `Plan for ${formatDate(date)}`);
  } else {
    log.info('No tasks remaining.');
  }

  outro(`Removed ${removeIds.size} task${removeIds.size !== 1 ? 's' : ''}.`);
}
