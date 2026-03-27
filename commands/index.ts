import { Command } from 'commander';
import { todo } from './todo';
import { stamp } from './stamp';

export { todo as defaultTask };

export async function registerCommands(program: Command) {
	program.command('todo').description('Interactive todo list').action(todo);

	program
		.command('stamp [label]')
		.description('Log a timestamped note')
		.option('-l, --list', "show today's stamps")
		.action(stamp);

	try {
		const { registerPrivateCommands } = await import('./private/index');
		registerPrivateCommands(program);
	} catch {
		// private commands not present
	}
}
