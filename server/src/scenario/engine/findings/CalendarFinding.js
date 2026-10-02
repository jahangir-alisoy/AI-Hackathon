export class CalendarFinding {
  detect({ calendar }) {
    if (!calendar.changes.length && !calendar.overlaps.length) return [];
    const changes = calendar.changes.map((change) => change.description);
    return [{
      kind: 'calendar',
      severity: 'medium',
      title: `Calendar fixed: ${calendar.changes.length} change(s), ${calendar.overlaps.length} overlap(s) left`,
      detail: [...changes, `${calendar.overlaps.length} overlapping meetings remain — see the Calendar tab for suggestions.`].join(' · '),
      sources: [...new Set(calendar.changes.flatMap((change) => change.sources))],
    }];
  }
}
