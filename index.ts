#!/usr/bin/env tsx
import { Command } from 'commander';
import { intro, confirm, outro, isCancel } from '@clack/prompts';
import { todo } from './commands/todo';

const program = new Command();

program.name('colleague').description('Personal CLI').version('1.0.0');

program.command('todo').description('Interactive todo list').action(todo);

try {
  const { registerPrivateCommands } = await import('./commands/private/index');
  registerPrivateCommands(program);
} catch {
  // private commands not present
}

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
		await todo();
	} else {
		outro('Alright, see you later.');
	}
});

program.parse();
