import { fromMinutes, minutesBetween, toMinutes } from '../../shared/time.js';

const attends = (entry, requester) => entry.attendees.some((name) => name.toLowerCase().includes(requester));

export class CalendarResolver {
  resolve(entries, intents) {
    const changes = [];
    const handledEventIds = new Set();
    const deduplicated = this.removeDuplicates(entries, intents, changes, handledEventIds);
    const resolved = this.applyMoves(deduplicated, intents, changes, handledEventIds);
    const meetings = resolved.filter((entry) => entry.kind === 'meeting').sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    return {
      original: entries,
      meetings,
      deadlines: resolved.filter((entry) => entry.kind === 'deadline'),
      changes,
      handledEventIds,
      overlaps: this.findOverlaps(meetings),
    };
  }

  removeDuplicates(entries, intents, changes, handledEventIds) {
    const groups = new Map();
    for (const entry of entries) {
      const key = entry.title.toLowerCase();
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    }
    const removed = new Set();
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      const confirming = [...intents].reverse().find((intent) =>
        group.some((entry) => entry.start === intent.target && attends(entry, intent.requester)));
      const kept = confirming ? group.find((entry) => entry.start === confirming.target) : group[group.length - 1];
      if (confirming) handledEventIds.add(confirming.event.id);
      for (const entry of group.filter((candidate) => candidate !== kept)) {
        removed.add(entry.id);
        changes.push({
          type: 'duplicate-removed',
          entryId: entry.id,
          title: entry.title,
          description: `Removed stale "${entry.title}" at ${entry.start}; kept ${kept.start}`,
          sources: [entry.ref, kept.ref, ...(confirming ? [confirming.event.ref] : [])],
        });
      }
    }
    return entries.filter((entry) => !removed.has(entry.id));
  }

  applyMoves(entries, intents, changes, handledEventIds) {
    const resolved = entries.map((entry) => ({ ...entry, movedFrom: null }));
    for (const intent of intents) {
      const own = resolved.filter((entry) => entry.kind === 'meeting' && attends(entry, intent.requester));
      if (own.some((entry) => entry.start === intent.target)) {
        handledEventIds.add(intent.event.id);
        continue;
      }
      const moving = intent.from && own.find((entry) => entry.start === intent.from);
      if (!moving) continue;
      const duration = minutesBetween(moving.start, moving.end);
      moving.movedFrom = moving.start;
      moving.start = intent.target;
      moving.end = fromMinutes(toMinutes(intent.target) + duration);
      handledEventIds.add(intent.event.id);
      changes.push({
        type: 'moved',
        entryId: moving.id,
        title: moving.title,
        description: `Moved "${moving.title}" from ${moving.movedFrom} to ${moving.start} (calendar was stale)`,
        sources: [moving.ref, intent.event.ref],
      });
    }
    return resolved;
  }

  findOverlaps(meetings) {
    const overlaps = [];
    meetings.forEach((first, index) => {
      for (const second of meetings.slice(index + 1)) {
        const minutes = Math.min(toMinutes(first.end), toMinutes(second.end)) - toMinutes(second.start);
        if (minutes > 0) overlaps.push({ first, second, minutes });
      }
    });
    return overlaps;
  }
}
