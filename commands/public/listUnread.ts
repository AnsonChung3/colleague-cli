import { intro, multiselect, select, outro, isCancel, log, spinner, confirm, text, note } from '@clack/prompts';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { esmDirname } from '../../utils/paths';
import { credentialsExist, saveCredentials, getRecentUnreadEmails, markEmailsAsRead } from '../../utils/imap';

const __dirname = esmDirname(import.meta.url);
const dismissedFile = join(__dirname, '..', '..', 'data', 'email-dismissed.json');

interface DismissedEntry {
  uid: number;
  dismissedAt: string; // YYYY-MM-DD
}

// Loads dismissed entries, dropping any older than 7 days.
function loadDismissed(): DismissedEntry[] {
  if (!existsSync(dismissedFile)) return [];
  const entries: DismissedEntry[] = JSON.parse(readFileSync(dismissedFile, 'utf-8'));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return entries.filter(e => e.dismissedAt >= cutoffStr);
}

function saveDismissed(entries: DismissedEntry[]): void {
  mkdirSync(dirname(dismissedFile), { recursive: true });
  writeFileSync(dismissedFile, JSON.stringify(entries, null, 2));
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function listUnread(): Promise<void> {
  intro('Unread Emails');

  if (!credentialsExist()) {
    const setup = await confirm({ message: 'No Gmail credentials found. Set them up now?' });
    if (isCancel(setup) || !setup) { outro('Returning to menu.'); return; }

    note(
      '1. Go to Gmail → Settings (gear icon) → See all settings\n' +
      '2. Open the "Forwarding and POP/IMAP" tab\n' +
      '3. Under "IMAP access", select "Enable IMAP"\n' +
      '4. Click "Save Changes"',
      'Step 1 — Enable IMAP in Gmail'
    );

    const user = await text({
      message: 'Your Gmail address:',
      placeholder: 'you@gmail.com',
      validate: v => v.includes('@') ? undefined : 'Enter a valid email address',
    });
    if (isCancel(user)) { outro('Cancelled.'); return; }

    note(
      '1. Go to myaccount.google.com → Security\n' +
      '2. Under "How you sign in to Google", open "2-Step Verification"\n' +
      '   (must be enabled — if not, enable it first)\n' +
      '3. Scroll to the bottom and click "App passwords"\n' +
      '4. Enter a name (e.g. "Colleague CLI") and click "Create"\n' +
      '5. Copy the 16-character password shown',
      'Step 2 — Generate a Gmail App Password'
    );

    const password = await text({
      message: 'Paste your App Password (16 characters, spaces are fine):',
      validate: v => v.replace(/\s/g, '').length === 16 ? undefined : 'App passwords are 16 characters long',
    });
    if (isCancel(password)) { outro('Cancelled.'); return; }

    saveCredentials((user as string).trim(), (password as string).replace(/\s/g, ''));
    log.success('Credentials saved to data/gmail-credentials.json');
  }

  const dismissedEntries = loadDismissed();
  const dismissedUids = new Set(dismissedEntries.map(e => e.uid));

  const s = spinner();
  s.start('Fetching unread emails…');

  let emails;
  try {
    emails = await getRecentUnreadEmails();
  } catch (err) {
    s.stop('Failed to fetch emails.');
    log.error(err instanceof Error ? err.message : String(err));
    outro('');
    return;
  }

  s.stop(`Fetched ${emails.length} unread email${emails.length !== 1 ? 's' : ''} in the last 7 days.`);

  const visible = emails.filter(e => !dismissedUids.has(e.uid));

  if (visible.length === 0) {
    outro(emails.length > 0
      ? 'All unread emails have been dismissed.'
      : 'No unread emails in the last 7 days.');
    return;
  }

  const options = visible.map(e => ({
    value: e.uid,
    label: e.subject,
    hint: e.from,
  }));

  // ── Pick emails ──────────────────────────────────────────────────────────────
  const selected = await multiselect({
    message: 'Select emails to action (space to select, enter to confirm)',
    options,
    required: false,
  });
  if (isCancel(selected)) { outro('Cancelled.'); return; }

  const selectedUids = selected as number[];

  if (selectedUids.length === 0) {
    outro('No action taken.');
    return;
  }

  // ── Pick action ──────────────────────────────────────────────────────────────
  const action = await select({
    message: 'What do you want to do with the selected emails?',
    options: [
      { value: 'read',    label: 'Mark as read in Gmail' },
      { value: 'ignore',  label: 'Ignore locally (7 days)' },
      { value: 'both',    label: 'Both' },
    ],
  });
  if (isCancel(action)) { outro('Cancelled.'); return; }

  const doRead   = action === 'read'   || action === 'both';
  const doIgnore = action === 'ignore' || action === 'both';

  if (doRead) {
    const s2 = spinner();
    s2.start('Marking as read…');
    try {
      await markEmailsAsRead(selectedUids);
      s2.stop(`Marked ${selectedUids.length} email${selectedUids.length !== 1 ? 's' : ''} as read in Gmail.`);
    } catch (err) {
      s2.stop('Failed to mark emails as read.');
      log.error(err instanceof Error ? err.message : String(err));
    }
  }

  if (doIgnore) {
    const today = todayStr();
    saveDismissed([
      ...dismissedEntries,
      ...selectedUids.map(uid => ({ uid, dismissedAt: today })),
    ]);
    log.success(`Ignored ${selectedUids.length} email${selectedUids.length !== 1 ? 's' : ''} locally for 7 days.`);
  }

  const stillVisible = visible.filter(e => !selectedUids.includes(e.uid)).length;
  outro(stillVisible > 0
    ? `${stillVisible} email${stillVisible !== 1 ? 's' : ''} still need attention.`
    : 'All caught up.');
}
