import { intro, multiselect, note, outro, isCancel, log } from '@clack/prompts';
import { evictOldPlans, getPlan, savePlan, allowedDates } from '../utils/dayPlanState';
import { formatDate } from './dayPlan';

export async function checkDayFlow(offset: 0 | 1 | 2): Promise<void> {
  evictOldPlans();

  const date = allowedDates()[offset];
  const plan = getPlan(date);

  intro(`Task Review — ${formatDate(date)}`);

  if (!plan || plan.tasks.length === 0) {
    log.info('No tasks planned for this day.');
    outro('');
    return;
  }

  if (offset > 0) {
    const taskList = plan.tasks.map(t => `${t.done ? '✓' : '○'} ${t.label}`).join('\n');
    note(taskList, `${formatDate(date)} (read-only)`);
    outro('');
    return;
  }

  // Today — interactive checklist
  const result = await multiselect({
    message: 'Space to tick, Enter to confirm:',
    options: plan.tasks.map(t => ({ value: t.id, label: t.label })),
    initialValues: plan.tasks.filter(t => t.done).map(t => t.id),
    required: false,
  });

  if (isCancel(result)) { outro('Cancelled.'); return; }

  const doneIds = new Set(result as string[]);
  plan.tasks.forEach(t => { t.done = doneIds.has(t.id); });
  savePlan(date, plan);

  const doneCount = plan.tasks.filter(t => t.done).length;
  outro(`${doneCount}/${plan.tasks.length} task${plan.tasks.length !== 1 ? 's' : ''} done.`);
}
