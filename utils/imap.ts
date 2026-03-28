import { ImapFlow } from 'imapflow';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { esmDirname } from './paths';

const __dirname = esmDirname(import.meta.url);
const credentialsFile = join(__dirname, '..', 'data', 'gmail-credentials.json');

export interface EmailSummary {
  uid: number;
  from: string;
  subject: string;
}

interface GmailCredentials {
  user: string;
  password: string;
}

export { credentialsFile };

export function credentialsExist(): boolean {
  return existsSync(credentialsFile);
}

export function saveCredentials(user: string, password: string): void {
  mkdirSync(dirname(credentialsFile), { recursive: true });
  writeFileSync(credentialsFile, JSON.stringify({ user, password }, null, 2));
}

function loadCredentials(): GmailCredentials {
  return JSON.parse(readFileSync(credentialsFile, 'utf-8'));
}

function createClient(credentials: GmailCredentials): ImapFlow {
  return new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: credentials.user,
      pass: credentials.password,
    },
    logger: false,
  });
}

// Returns the start of the rolling 7-day window (7 days ago at 00:00:00).
function rollingWindowStart(): Date {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  since.setHours(0, 0, 0, 0);
  return since;
}

export async function getRecentUnreadEmails(): Promise<EmailSummary[]> {
  const credentials = loadCredentials();
  const client = createClient(credentials);
  const since = rollingWindowStart();

  await client.connect();

  const emails: EmailSummary[] = [];

  try {
    await client.mailboxOpen('INBOX');

    const uids = await client.search({
      seen: false,
      since,
    });

    if (uids.length > 0) {
      for await (const msg of client.fetch(uids, { envelope: true, uid: true })) {
        const env = msg.envelope;
        const fromAddr = env.from?.[0];
        const fromLabel = fromAddr?.name
          ? fromAddr.name
          : (fromAddr?.address ?? 'Unknown');
        emails.push({
          uid: msg.uid,
          from: fromLabel,
          subject: env.subject ?? '(no subject)',
        });
      }
    }
  } finally {
    await client.logout();
  }

  return emails;
}

export async function markEmailsAsRead(uids: number[]): Promise<void> {
  if (uids.length === 0) return;

  const credentials = loadCredentials();
  const client = createClient(credentials);

  await client.connect();

  try {
    await client.mailboxOpen('INBOX');
    await client.messageFlagsAdd(uids, ['\\Seen'], { uid: true });
  } finally {
    await client.logout();
  }
}
