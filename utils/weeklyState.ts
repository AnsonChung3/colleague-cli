import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

// Returns the ISO week string for today, e.g. "2026-W13".
// Weeks run Monday–Sunday per ISO 8601.
export function currentISOWeek(): string {
  const d = new Date();
  const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // make Sunday = 7
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dayOfWeek - 1));
  const year = monday.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const weekNum = Math.ceil(((monday.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

interface WeeklyRecord<T> {
  week: string;
  data: T;
}

// Factory that creates a self-contained weekly state manager for a given file.
// Resets to defaultData() at the start of each new ISO week.
// Same pattern as createDailyState — T is the shape of data, defaultData is a factory.
export function createWeeklyState<T>(filePath: string, defaultData: () => T) {
  function read(): WeeklyRecord<T> {
    if (!existsSync(filePath)) return { week: currentISOWeek(), data: defaultData() };
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  function write(record: WeeklyRecord<T>): void {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(record, null, 2));
  }

  function clearIfNewWeek(): void {
    const record = read();
    if (record.week !== currentISOWeek()) write({ week: currentISOWeek(), data: defaultData() });
  }

  function getData(): T {
    return read().data;
  }

  function setData(data: T): void {
    write({ week: currentISOWeek(), data });
  }

  return { clearIfNewWeek, getData, setData };
}
