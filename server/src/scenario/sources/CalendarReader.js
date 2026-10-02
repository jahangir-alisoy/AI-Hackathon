import { normalizeClock } from '../../shared/time.js';

export class CalendarReader {
  constructor(tableReader) {
    this.tableReader = tableReader;
  }

  read(filePath, ref) {
    return this.tableReader.read(filePath).map((row, index) => ({
      id: `cal-${index + 1}`,
      ref: `${ref} row ${index + 2}`,
      start: normalizeClock(row.start_time),
      end: row.end_time ? normalizeClock(row.end_time) : null,
      title: row.title.trim(),
      attendees: row.attendees ? row.attendees.split(';').map((name) => name.trim()).filter(Boolean) : [],
      location: row.location,
      status: row.status,
      notes: row.notes,
      kind: row.end_time ? 'meeting' : 'deadline',
    }));
  }
}
