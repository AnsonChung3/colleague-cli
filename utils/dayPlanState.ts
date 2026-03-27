import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { today, currentTime } from './dailyState';
import { esmDirname } from './paths';

const __dirname = esmDirname(import.meta.url);
const stateFile = join(__dirname, '..', 'data', 'day-plan.json');

export interface Task {
  id: string;
  label: string;
  done: boolean;
}

export interface Meal {
  label: string;
  time: string;        // HH:MM 24-hour
  acknowledged: boolean; // true once the user confirms they've eaten
}

export interface DayPlan {
  tasks: Task[];
  meals: Meal[];
}

// The file stores a flat object keyed by YYYY-MM-DD date strings.
// Only today, today+1, and today+2 are kept at any time.
type PlanStore = Record<string, DayPlan>;

// Returns the 3 valid planning dates as [today, tomorrow, day-after]
export function allowedDates(): [string, string, string] {
  return [0, 1, 2].map(offset => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }) as [string, string, string];
}

function read(): PlanStore {
  if (!existsSync(stateFile)) return {};
  return JSON.parse(readFileSync(stateFile, 'utf-8'));
}

function write(store: PlanStore): void {
  mkdirSync(dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, JSON.stringify(store, null, 2));
}

// Drops any date outside the current 3-day window. Called on every command boot.
export function evictOldPlans(): void {
  const store = read();
  const allowed = new Set(allowedDates());
  write(Object.fromEntries(Object.entries(store).filter(([date]) => allowed.has(date))));
}

export function getPlan(date: string): DayPlan | undefined {
  return read()[date];
}

export function savePlan(date: string, plan: DayPlan): void {
  const store = read();
  store[date] = plan;
  write(store);
}

export function emptyPlan(): DayPlan {
  return { tasks: [], meals: [] };
}

// Returns today's meals where the time has passed and the user hasn't yet
// confirmed they've eaten. Used by runTimeChecks in the root menu loop.
export function getUnacknowledgedPastMeals(): Meal[] {
  const plan = getPlan(today());
  if (!plan || plan.meals.length === 0) return [];
  const now = currentTime();
  return plan.meals.filter(m => !m.acknowledged && now > m.time);
}

// Marks a meal as acknowledged and persists. Called after the user confirms
// they've eaten in the meal reminder prompt.
export function acknowledgeMeal(label: string): void {
  const plan = getPlan(today());
  if (!plan) return;
  const meal = plan.meals.find(m => m.label === label);
  if (meal) {
    meal.acknowledged = true;
    savePlan(today(), plan);
  }
}
