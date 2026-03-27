#!/usr/bin/env tsx
import { Command } from 'commander';
import { intro, confirm, select, outro, isCancel } from '@clack/prompts';
import { registerCommands, defaultTask, handlers } from './commands/index';

const program = new Command();
program.name('colleague').description('Personal CLI').version('1.0.0');

await registerCommands(program);

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
		return;
	}

	// Build once — descriptions come from the program so they stay in sync
	// automatically as commands are added. 'completion' is excluded as it's
	// not useful as an interactive menu option.
	const options = program.commands
		.filter(cmd => cmd.name() !== 'completion')
		.map(cmd => ({
			value: cmd.name(),
			label: cmd.name(),
			hint: cmd.description(),
		}));

	while (true) {
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

program.parse();
