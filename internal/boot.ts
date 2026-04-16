import { Command } from 'commander';
import { intro, select, outro, isCancel } from '@clack/prompts';
import { handlers } from '../commands/index';
import { runTimeChecks } from '../utils/timeChecks';
import { getConfig } from '../utils/configState';

export function registerBootAction(program: Command) {
	program.action(async () => {
		const rows = process.stdout.rows ?? 24;
		process.stdout.write('\n'.repeat(rows) + `\x1b[${rows}A`);
		intro('Hey! Good to see you.');

		const config = getConfig();
		if (config.defaultTask.enabled && config.defaultTask.lineup.length > 0) {
			for (const name of config.defaultTask.lineup) {
				const handler = handlers.get(name);
				if (handler) await handler();
			}
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

			const rows = process.stdout.rows ?? 24;
			process.stdout.write('\n'.repeat(rows) + `\x1b[${rows}A`);

			const handler = handlers.get(choice as string);
			if (handler) await handler();
		}
	});
}
