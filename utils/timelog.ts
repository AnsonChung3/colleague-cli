import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { today } from './dailyState';

// ESM modules don't have __dirname built in, so we derive it from the current
// file's URL. This ensures the data folder is always relative to this file,
// not the directory you happen to be in when you run the CLI.
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const logFile = join(dataDir, 'timelog.json');

interface Stamp {
  time: string;  // HH:MM
  label: string; // the note you typed
}

interface TimeLog {
  date: string;    // YYYY-MM-DD — used to detect when a new day starts
  stamps: Stamp[];
}

interface DayRecord {
  date: string;
  stamps: Stamp[];
}

// Returns the current time as HH:MM (24-hour, zero-padded)
function currentTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Reads the log file from disk. If it doesn't exist yet, returns a fresh log
// for today so callers don't need to handle the missing-file case themselves.
function readLog(): TimeLog {
  if (!existsSync(logFile)) return { date: today(), stamps: [] };
  return JSON.parse(readFileSync(logFile, 'utf-8'));
}

// Writes the log to disk. `recursive: true` means mkdirSync won't throw if
// the data/ folder already exists.
function writeLog(log: TimeLog): void {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(logFile, JSON.stringify(log, null, 2));
}

// Determines which quarter a date belongs to, using the Mar–May, Jun–Aug,
// Sep–Nov, Dec–Feb pattern. Returns a label and the anchor year.
// For Dec–Feb, the year is the year December falls in (e.g. Dec 2026–Feb 2027
// is labelled 2026-dec-feb), so the file doesn't straddle two years in name.
function getQuarterInfo(dateStr: string): { label: string; year: number } {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  const year = date.getFullYear();

  if (month >= 3 && month <= 5) return { label: 'mar-may', year };
  if (month >= 6 && month <= 8) return { label: 'jun-aug', year };
  if (month >= 9 && month <= 11) return { label: 'sep-nov', year };
  // December belongs to the current year's quarter;
  // January and February belong to the previous year's Dec quarter.
  return { label: 'dec-feb', year: month === 12 ? year : year - 1 };
}

// Returns the full path to the history file for a given date,
// e.g. data/history/2026-mar-may.json
function getHistoryFile(dateStr: string): string {
  const { label, year } = getQuarterInfo(dateStr);
  return join(dataDir, 'history', `${year}-${label}.json`);
}

// Appends a completed day's stamps to the appropriate quarterly history file.
// Skips days with no stamps. Guards against duplicate entries in case this is
// somehow called twice for the same date.
function archiveDay(date: string, stamps: Stamp[]): void {
  if (stamps.length === 0) return;

  const histFile = getHistoryFile(date);
  mkdirSync(dirname(histFile), { recursive: true });

  let history: DayRecord[] = [];
  if (existsSync(histFile)) {
    history = JSON.parse(readFileSync(histFile, 'utf-8'));
  }

  const alreadyArchived = history.some(entry => entry.date === date);
  if (!alreadyArchived) {
    history.push({ date, stamps });
    writeFileSync(histFile, JSON.stringify(history, null, 2));
  }
}

// Called when the stamp command is used. If the stored date is not today,
// the CLI is being used on a new day — archive the previous day's stamps
// then wipe the log.
export function clearIfNewDay(): void {
  const log = readLog();
  if (log.date !== today()) {
    archiveDay(log.date, log.stamps);
    writeLog({ date: today(), stamps: [] });
  }
}

// Appends a new stamp with the current time to today's log.
export function addStamp(label: string): void {
  const log = readLog();
  log.stamps.push({ time: currentTime(), label });
  writeLog(log);
}

// Returns all stamps for today, used by the --list flag.
export function getStamps(): Stamp[] {
  return readLog().stamps;
}
