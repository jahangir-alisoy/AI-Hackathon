import { TRIAGE_PHRASES } from '../config/triageRules.js';
import { eventText, includesAny, summarize } from '../../shared/text.js';

export class TriageClassifier {
  constructor(phrases = TRIAGE_PHRASES) {
    this.rules = [
      { category: 'SECURITY_RISK', match: (event, context) => context.phishing.has(event.id) && 'Phishing signals — do not click, report to IT' },
      { category: 'NOISE', match: (event) => event.role.includes('@') && 'Automated external sender' },
      { category: 'FYI', match: (event) => /out of office|automatic reply/i.test(`${event.role} ${event.subject}`) && 'Auto-reply: assistant is out — StandIn is covering' },
      { category: 'AUTO_HANDLED', match: (event, context) => context.handledEventIds.has(event.id) && 'Schedule change applied to the calendar' },
      { category: 'APPROVE_DRAFT', match: (event) => this.phrase(event, phrases.approveDraft) },
      { category: 'CEO_DECISION', match: (event) => this.phrase(event, phrases.ceoDecision) },
      { category: 'LATER', match: (event) => this.phrase(event, phrases.later) },
      { category: 'FYI', match: () => 'For information' },
    ];
  }

  phrase(event, phrases) {
    const found = includesAny(eventText(event), phrases);
    return found && `Asks: "${found}"`;
  }

  classify(events, context) {
    return events.map((event) => {
      const rule = this.rules.find((candidate) => candidate.match(event, context));
      return {
        id: event.id,
        ref: event.ref,
        time: event.time,
        actor: event.actor,
        source: event.source,
        summary: summarize(event),
        topics: event.topics,
        category: rule.category,
        reason: rule.match(event, context),
      };
    });
  }
}
