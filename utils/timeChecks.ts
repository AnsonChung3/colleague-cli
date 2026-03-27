import { confirm, isCancel } from '@clack/prompts';
import { getUnacknowledgedPastMeals, acknowledgeMeal } from './dayPlanState';

// Single place to register all time-sensitive checks that surface on any CLI
// interaction. Add new checks here as the CLI grows — index.ts just calls this.
export async function runTimeChecks(): Promise<void> {
	// Meal reminders — prompts for each past unacknowledged meal.
	// Only stops prompting once the user confirms they've eaten.
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
