#!/usr/bin/env tsx
import { Command } from 'commander';
import { intro, confirm, select, outro, isCancel } from '@clack/prompts';
import { registerCommands, defaultTask, handlers } from './commands/index';
import { getUnacknowledgedPastMeals, acknowledgeMeal } from './utils/dayPlanState';

const program = new Command();
program.name('colleague').description('Personal CLI').version('1.0.0');

await registerCommands(program);

// Single place to register all time-sensitive checks that should surface
// on any CLI interaction. Add new checks here as the CLI grows.
async function runTimeChecks(): Promise<void> {
	// Meal reminders — prompt for each past unacknowledged meal.
	// Only stops prompting once the user confirms they've eaten (acknowledged).
	for (const meal of getUnacknowledgedPastMeals()) {
		const eaten = await confirm({
			message: `It's past your ${meal.label} time (${meal.time}). Have you eaten?`,
			initialValue: true,
		});
		if (!isCancel(eaten) && eaten) {
			acknowledgeMeal(meal.label);
		}
	}
}

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
		// Run time-sensitive checks before every menu interaction
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

program.parse();
