import { Command } from 'commander';
import { text, isCancel } from '@clack/prompts';
import { todo } from './todo';
import { stamp } from './stamp';
import { dayPlan } from './dayPlan';
import { mealTimes } from './mealTimes';
import { makeCompletionAction } from './completion';

export { todo as defaultTask };

// Invokable command handlers, keyed by command name.
// index.ts reads this map to run whichever command the user picks
// from the interactive menu. Private commands register into this same map.
export type CommandHandler = () => void | Promise<void>;
export const handlers = new Map<string, CommandHandler>();

export async function registerCommands(program: Command) {
	program.command('todo').description('Interactive todo list').action(todo);
	handlers.set('todo', todo);

	program
		.command('stamp [label]')
		.description('Log a timestamped note')
		.option('-l, --list', "show today's stamps")
		.action(stamp);
	handlers.set('stamp', async () => {
		const label = await text({ message: 'Stamp label (leave blank to view today\'s stamps):' });
		if (isCancel(label)) return;
		const trimmed = (label ?? '').trim();
		stamp(trimmed || undefined, trimmed ? {} : { list: true });
	});

	program.command('day-plan').description('Plan your day interactively').action(dayPlan);
	handlers.set('day-plan', dayPlan);

	program.command('meal-times').description('Set meal time reminders for today').action(mealTimes);
	handlers.set('meal-times', mealTimes);

	try {
		const { registerPrivateCommands } = await import('./private/index');
		registerPrivateCommands(program, handlers);
	} catch {
		// private commands not present
	}

	// completion is registered last so all other commands (including private)
	// are already in program.commands when the script is generated.
	// Excluded from handlers — not useful as an interactive menu option.
	program
		.command('completion')
		.description('Generate shell tab completion')
		.option('--install', 'append completion script to ~/.bashrc')
		.action(makeCompletionAction(program));
}
