import { normalizeClock } from '../domain/time.js';

export class InboxReader {
  constructor(tableReader) {
    this.tableReader = tableReader;
  }

  read(filePath) {
    return this.tableReader.read(filePath).map((row) => ({
      id: `inbox-${row.id}`,
      ref: `Inbox #${row.id}`,
      source: 'inbox',
      time: normalizeClock(row.timestamp),
      actor: row.from_name,
      role: row.from_role_or_org,
      subject: row.subject,
      body: row.body,
    }));
  }
}
