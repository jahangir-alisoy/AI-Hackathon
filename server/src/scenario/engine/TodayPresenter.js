import { CATEGORY_LABELS } from '../config/triageRules.js';

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

export class TodayPresenter {
  present(world, mode) {
    const handled = world.triage.filter((item) => !['CEO_DECISION', 'APPROVE_DRAFT'].includes(item.category));
    return {
      asOf: world.asOf,
      mode,
      counts: {
        messages: world.events.length,
        needsYou: world.needsYou.length,
        handledForYou: handled.length,
        findings: world.findings.length,
        byCategory: Object.fromEntries(Object.keys(CATEGORY_LABELS).map((key) => [key, world.triage.filter((item) => item.category === key).length])),
      },
      categoryLabels: CATEGORY_LABELS,
      needsYou: world.needsYou,
      deadlines: world.deadlines,
      defaultActions: world.defaultActions,
      findings: [...world.findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
      calendar: {
        original: world.calendar.original,
        meetings: world.calendar.meetings,
        changes: world.calendar.changes,
        ...world.schedule,
      },
      triage: [...world.triage].reverse(),
    };
  }
}
