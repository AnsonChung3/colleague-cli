import { Command } from 'commander';
import { todo } from './todo';
import { stamp } from './stamp';
import { makeCompletionAction } from './completion';

export { todo as defaultTask };

export async function registerCommands(program: Command) {
	program.command('todo').description('Interactive todo list').action(todo);

	program
		.command('stamp [label]')
		.description('Log a timestamped note')
		.option('-l, --list', "show today's stamps")
		.action(stamp);

	// completion is registered last so all other commands (including private)
	// are already in program.commands when the script is generated
	program
		.command('completion')
		.description('Generate shell tab completion')
		.option('--install', 'append completion script to ~/.bashrc')
		.action(makeCompletionAction(program));

	try {
		const { registerPrivateCommands } = await import('./private/index');
		registerPrivateCommands(program);
	} catch {
		// private commands not present
	}
}
