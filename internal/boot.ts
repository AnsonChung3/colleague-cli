import { Command } from 'commander';
import { intro, confirm, select, outro, isCancel } from '@clack/prompts';
import { defaultTask, handlers } from '../commands/index';
import { runTimeChecks } from '../utils/timeChecks';

export function registerBootAction(program: Command) {
	program.action(async () => {
		intro('Hey! Good to see you.');

		const onBoot = await confirm({
			message: 'Do you want to start ticking off your todo list?',
			initialValue: true,
		});

		if (isCancel(onBoot)) {
			outro('See you later.');
			return;
		}

		if (onBoot) {
			await defaultTask();
			// Fall through to the menu loop after the task completes or is aborted
		}

		// Built from program.commands so descriptions stay in sync automatically
		// as new commands are added. 'completion' excluded — not a menu option.
		const options = program.commands
			.filter(cmd => cmd.name() !== 'completion')
			.map(cmd => ({
				value: cmd.name(),
				label: cmd.name(),
				hint: cmd.description(),
			}));

		while (true) {
			await runTimeChecks();

			const choice = await select({
				message: 'What would you like to do?  (Esc to exit)',
				options,
			});

			if (isCancel(choice)) {
				outro('See you later.');
				return;
			}

			const handler = handlers.get(choice as string);
			if (handler) await handler();
		}
	});
}
