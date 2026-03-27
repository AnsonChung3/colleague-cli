import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

// Shared date helper used across all time-sensitive commands.
// Returns YYYY-MM-DD in ISO format — simple string comparison is enough to
// detect a day boundary without any date arithmetic.
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface DailyRecord<T> {
  date: string;
  data: T;
}

// Factory that creates a self-contained daily state manager for a given file.
// T is the shape of the data you want to persist (e.g. string[], number[]).
// defaultData is a function (not a value) so each call gets a fresh copy.
//
// Usage:
//   const state = createDailyState<string[]>(filePath, () => []);
//   state.clearIfNewDay();
//   const checked = state.getData();
//   state.setData(['1', '3']);
export function createDailyState<T>(filePath: string, defaultData: () => T) {
  function read(): DailyRecord<T> {
    if (!existsSync(filePath)) return { date: today(), data: defaultData() };
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  function write(record: DailyRecord<T>): void {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(record, null, 2));
  }

  // If the stored date is not today, replace the data with a fresh default.
  function clearIfNewDay(): void {
    const record = read();
    if (record.date !== today()) write({ date: today(), data: defaultData() });
  }

  // Returns just the data portion of the record.
  function getData(): T {
    return read().data;
  }

  // Overwrites the data for today.
  function setData(data: T): void {
    write({ date: today(), data });
  }

  return { clearIfNewDay, getData, setData };
}
