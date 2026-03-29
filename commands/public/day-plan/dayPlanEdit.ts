import { select, text, multiselect, confirm, note, outro, isCancel, log } from '@clack/prompts';
import { getPlan, savePlan, emptyPlan } from '../../../utils/dayPlanState';
import type { Task } from '../../../utils/dayPlanState';
import { formatDate, parseTasks } from './dayPlanUtils';

function showTaskList(tasks: Task[], date: string): void {
  const taskList = tasks.map((t, i) => `${i + 1}. ${t.label}`).join('\n');
  note(taskList, `Plan for ${formatDate(date)}`);
}

// Shared add loop — used by this flow and dayPlanAdd.ts.
// Mutates the tasks array in place. Returns false if the user cancelled (Escape).
export async function runAddLoop(tasks: Task[]): Promise<boolean> {
  while (true) {
    const input = await text({
      message: 'Add tasks',
      placeholder: "'Fix bug', 'Review PR'  —  leave empty to finish",
    });
    if (isCancel(input)) return false;
    const parsed = parseTasks((input ?? '') as string);
    if (parsed.length === 0) break;
    for (const label of parsed) {
      tasks.push({ id: String(tasks.length + 1), label, done: false });
    }
    log.success(`Added ${parsed.length} task${parsed.length !== 1 ? 's' : ''}.`);
  }
  return true;
}

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
        { value: 'add', label: 'Add tasks' },
        { value: 'edit', label: 'Edit a task' },
        { value: 'remove', label: 'Remove tasks' },
        { value: 'view', label: 'View full list' },
      ],
    });
    if (isCancel(action)) { outro('Cancelled.'); return; }

    if (action === 'add') {
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
      if (plan.tasks.length === 0) {
        log.warn('No tasks to remove.');
      } else {
        const toRemove = await multiselect({
          message: 'Select tasks to remove:',
          options: plan.tasks.map(t => ({ value: t.id, label: t.label })),
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
