#!/usr/bin/env tsx
import { Command } from 'commander';
import { intro, confirm, outro, isCancel } from '@clack/prompts';
import { registerCommands, defaultTask } from './commands/index';

const program = new Command();
program.name('colleague').description('Personal CLI').version('1.0.0');

await registerCommands(program);

program.action(async () => {
	intro('Hey! Good to see you.');

	const startTodo = await confirm({
		message: 'Do you want to start ticking off your todo list?',
		initialValue: true,
	});

	if (isCancel(startTodo)) {
		outro('See you later.');
		return;
	}

	if (startTodo) {
		await defaultTask();
	} else {
		outro('Alright, see you later.');
	}
});

program.parse();
