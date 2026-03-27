import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

// Shared date/time helpers used across all time-sensitive commands.
// ISO string comparisons (YYYY-MM-DD, HH:MM) are intentionally used over
// Date arithmetic — simpler, no timezone edge cases for local-time comparisons.

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Returns current local time as HH:MM (24-hour, zero-padded)
export function currentTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
