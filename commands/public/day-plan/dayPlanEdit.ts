import { select, text, multiselect, confirm, outro, isCancel, log } from '@clack/prompts';
import { getPlan, savePlan, emptyPlan } from '../../../utils/dayPlanState';
import { showTaskList, runAddLoop } from './dayPlanUtils';

export async function dayPlanEditFlow(date: string): Promise<void> {
  const plan = getPlan(date) ?? emptyPlan();

  // ── Zero tasks path ──────────────────────────────────────────────────────────
  if (plan.tasks.length === 0) {
    log.info("No tasks planned for this day. Let's add to the list:");
    const ok = await runAddLoop(plan.tasks);
    if (!ok) { outro('Cancelled.'); return; }
    if (plan.tasks.length === 0) { outro('No tasks added.'); return; }
    savePlan(date, plan);
  }

  // Show list before entering edit gate
  showTaskList(plan.tasks, date);

  // ── Edit mode loop ───────────────────────────────────────────────────────────
  while (true) {
    const enter = await confirm({ message: 'Enter edit mode?', initialValue: false });
    if (isCancel(enter) || !enter) { outro('Done.'); return; }

    const action = await select({
      message: 'What would you like to do?',
      options: [
        { value: 'check', label: 'Check off tasks' },
        { value: 'add', label: 'Add tasks' },
        { value: 'edit', label: 'Edit a task' },
        { value: 'remove', label: 'Remove tasks' },
        { value: 'view', label: 'View full list' },
      ],
    });
    if (isCancel(action)) { outro('Cancelled.'); return; }

    if (action === 'check') {
      const remaining = plan.tasks.filter(t => !t.done);
      if (remaining.length === 0) {
        log.info('All tasks already done.');
      } else {
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
        log.success(`${doneCount}/${plan.tasks.length} task${plan.tasks.length !== 1 ? 's' : ''} done.`);
      }
    } else if (action === 'add') {
      const ok = await runAddLoop(plan.tasks);
      if (!ok) { outro('Cancelled.'); return; }
      savePlan(date, plan);
    } else if (action === 'edit') {
      if (plan.tasks.length === 0) {
        log.warn('No tasks to edit.');
      } else {
        const taskChoice = await select({
          message: 'Which task would you like to edit?',
          options: plan.tasks.map(t => ({ value: t.id, label: t.label })),
        });
        if (isCancel(taskChoice)) { outro('Cancelled.'); return; }

        const task = plan.tasks.find(t => t.id === (taskChoice as string));
        if (task) {
          const newLabel = await text({ message: 'New label:', initialValue: task.label });
          if (isCancel(newLabel)) { outro('Cancelled.'); return; }
          const trimmed = (newLabel as string).trim();
          if (trimmed) task.label = trimmed;
          savePlan(date, plan);
        }
      }
    } else if (action === 'remove') {
      const removable = plan.tasks.filter(t => !t.done);
      if (removable.length === 0) {
        log.warn(plan.tasks.length === 0 ? 'No tasks to remove.' : 'All tasks are checked off — nothing to remove.');
      } else {
        const toRemove = await multiselect({
          message: 'Select tasks to remove:',
          options: removable.map(t => ({ value: t.id, label: t.label })),
          required: false,
        });
        if (isCancel(toRemove)) { outro('Cancelled.'); return; }
        const removeIds = new Set(toRemove as string[]);
        plan.tasks = plan.tasks.filter(t => !removeIds.has(t.id));
        savePlan(date, plan);
        if (removeIds.size > 0) {
          log.success(`Removed ${removeIds.size} task${removeIds.size !== 1 ? 's' : ''}.`);
        }
      }
    }

    // Show updated list after every action (including view)
    if (plan.tasks.length > 0) {
      showTaskList(plan.tasks, date);
    } else {
      log.info('No tasks remaining.');
    }
  }
}
