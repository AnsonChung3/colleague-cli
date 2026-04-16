import { select, multiselect, note, log, isCancel } from '@clack/prompts';
import { getConfig, setConfig } from '../../utils/configState';

export function makeConfigAction(getCommandNames: () => string[]) {
  return async function config() {
    while (true) {
      const choice = await select({
        message: 'Config / Settings',
        options: [
          { value: 'defaultTask', label: 'Default task settings' },
          { value: 'exit', label: 'Exit' },
        ],
      });

      if (isCancel(choice) || choice === 'exit') return;
      if (choice === 'defaultTask') await defaultTaskSubmenu(getCommandNames);
    }
  };
}

async function defaultTaskSubmenu(getCommandNames: () => string[]) {
  while (true) {
    const cfg = getConfig();
    const { enabled, lineup } = cfg.defaultTask;

    const choice = await select({
      message: 'Default task settings',
      options: [
        {
          value: 'toggle',
          label: 'Toggle on/off',
          hint: enabled ? 'currently on' : 'currently off',
        },
        {
          value: 'view',
          label: 'View lineup',
          hint: lineup.length > 0 ? lineup.join(' → ') : 'empty',
        },
        { value: 'add', label: 'Add to lineup' },
        { value: 'remove', label: 'Remove from lineup' },
        { value: 'reorder', label: 'Reorder lineup' },
        { value: 'back', label: 'Back' },
      ],
    });

    if (isCancel(choice) || choice === 'back') return;

    if (choice === 'toggle') {
      setConfig({ ...cfg, defaultTask: { ...cfg.defaultTask, enabled: !enabled } });
      log.success(`Default task ${!enabled ? 'enabled' : 'disabled'}.`);
    } else if (choice === 'view') {
      if (lineup.length === 0) {
        log.info('Lineup is empty.');
      } else {
        note(lineup.map((name, i) => `${i + 1}. ${name}`).join('\n'), 'lineup');
      }
    } else if (choice === 'add') {
      const available = getCommandNames().filter(n => !lineup.includes(n));
      if (available.length === 0) {
        log.info('All available commands are already in the lineup.');
      } else {
        const selected = await multiselect({
          message: 'Select commands to add:',
          options: available.map(n => ({ value: n, label: n })),
          required: false,
        });
        if (!isCancel(selected) && (selected as string[]).length > 0) {
          const wasEmpty = lineup.length === 0;
          setConfig({
            ...cfg,
            defaultTask: {
              ...cfg.defaultTask,
              enabled: wasEmpty ? true : cfg.defaultTask.enabled,
              lineup: [...lineup, ...(selected as string[])],
            },
          });
          log.success(
            wasEmpty
              ? `Added ${(selected as string[]).join(', ')} to lineup. Default task auto-enabled.`
              : `Added ${(selected as string[]).join(', ')} to lineup.`,
          );
        }
      }
    } else if (choice === 'remove') {
      if (lineup.length === 0) {
        log.info('Lineup is empty.');
      } else {
        const selected = await multiselect({
          message: 'Select commands to remove:',
          options: lineup.map(n => ({ value: n, label: n })),
          required: false,
        });
        if (!isCancel(selected) && (selected as string[]).length > 0) {
          const toRemove = new Set(selected as string[]);
          setConfig({
            ...cfg,
            defaultTask: { ...cfg.defaultTask, lineup: lineup.filter(n => !toRemove.has(n)) },
          });
          log.success(`Removed ${[...toRemove].join(', ')} from lineup.`);
        }
      }
    } else if (choice === 'reorder') {
      if (lineup.length <= 1) {
        log.info('Nothing to reorder.');
      } else {
        const item = await select({
          message: 'Select item to move:',
          options: lineup.map((n, i) => ({ value: i, label: n })),
        });
        if (!isCancel(item)) {
          const idx = item as number;
          const direction = await select({
            message: 'Move direction:',
            options: [
              { value: 'up', label: 'Move up', hint: idx === 0 ? 'already first' : undefined },
              {
                value: 'down',
                label: 'Move down',
                hint: idx === lineup.length - 1 ? 'already last' : undefined,
              },
            ],
          });
          if (!isCancel(direction)) {
            const newLineup = [...lineup];
            if (direction === 'up' && idx > 0) {
              [newLineup[idx - 1], newLineup[idx]] = [newLineup[idx], newLineup[idx - 1]];
            } else if (direction === 'down' && idx < newLineup.length - 1) {
              [newLineup[idx], newLineup[idx + 1]] = [newLineup[idx + 1], newLineup[idx]];
            }
            setConfig({ ...cfg, defaultTask: { ...cfg.defaultTask, lineup: newLineup } });
            log.success('Lineup updated.');
          }
        }
      }
    }
  }
}
