import { intro, multiselect, outro, isCancel } from '@clack/prompts';

const items = [
  { value: '1', label: 'Review pull requests' },
  { value: '2', label: 'Update project documentation' },
  { value: '3', label: 'Fix login page bug' },
  { value: '4', label: 'Write unit tests for auth module' },
  { value: '5', label: 'Deploy staging environment' },
];

export async function todo() {
  intro('My Todo List');

  const done = await multiselect({
    message: 'Space to tick, Enter to confirm:',
    options: items,
    required: false,
  });

  if (isCancel(done)) {
    outro('Cancelled.');
    return;
  }

  const count = (done as string[]).length;
  const remaining = items.length - count;
  outro(`Ticked off ${count} item${count !== 1 ? 's' : ''}. ${remaining} remaining.`);
}
