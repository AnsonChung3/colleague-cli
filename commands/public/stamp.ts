import { log } from '@clack/prompts';
import { addStamp, getStamps, clearIfNewDay } from '../../utils/timelog';

// Commander passes the positional argument as the first param and any flags
// as the second. label is undefined if you run `colleague stamp --list`
// without a note.
export function stamp(label: string | undefined, options: { list?: boolean }) {
  clearIfNewDay();
  // --list flag: print all of today's stamps and exit
  if (options.list) {
    const stamps = getStamps();
    if (stamps.length === 0) {
      log.info('No stamps yet today.');
      return;
    }
    stamps.forEach((s) => log.info(`${s.time}  ${s.label}`));
    return;
  }

  // Guard: if no label was provided and --list wasn't used, tell the user
  if (!label) {
    log.error('Provide a label: colleague stamp "your note"');
    return;
  }

  addStamp(label);
  log.success(
    `[${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}] Stamped.`,
  );
}
