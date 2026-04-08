import { intro, multiselect, note, outro, isCancel, log } from '@clack/prompts';
import { evictOldPlans, getPlan, savePlan, allowedDates } from '../../../utils/dayPlanState';
import { formatDate } from './dayPlanUtils';

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

  // Today — interactive checklist (already-done tasks are excluded)
  const alreadyDone = plan.tasks.filter(t => t.done);
  const remaining = plan.tasks.filter(t => !t.done);

  if (remaining.length === 0) {
    outro(`${alreadyDone.length}/${plan.tasks.length} task${plan.tasks.length !== 1 ? 's' : ''} done.`);
    return;
  }

  const result = await multiselect({
    message: 'Space to tick, Enter to confirm:',
    options: remaining.map(t => ({ value: t.id, label: t.label })),
    required: false,
  });

  if (isCancel(result)) { outro('Cancelled.'); return; }

  const newlyDoneIds = new Set(result as string[]);
  plan.tasks.forEach(t => { if (newlyDoneIds.has(t.id)) t.done = true; });
  savePlan(date, plan);

  const doneCount = plan.tasks.filter(t => t.done).length;
  outro(`${doneCount}/${plan.tasks.length} task${plan.tasks.length !== 1 ? 's' : ''} done.`);
}
