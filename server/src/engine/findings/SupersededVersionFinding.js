export class SupersededVersionFinding {
  detect({ corrections, events, facts }) {
    return corrections.filter((correction) => correction.superseded.length).map((correction) => {
      const pattern = new RegExp(`\\b(${correction.superseded.join('|')})\\b`, 'i');
      const staleMessages = events.filter((event) => event !== correction.event && pattern.test(`${event.subject} ${event.body}`));
      const staleFacts = facts.filter((fact) => pattern.test(fact.text));
      const citing = staleFacts.map((fact) => `"${fact.text}"`).join('; ');
      return {
        kind: 'superseded',
        severity: 'high',
        title: `${correction.superseded.join(', ')} replaced by ${correction.current}`,
        detail: `${correction.event.actor}: ${correction.event.subject || correction.event.body}.${citing ? ` The quarter notes still cite the old version: ${citing} — flagged VERIFY in the one-pager.` : ''}`,
        sources: [correction.event.ref, ...staleMessages.map((event) => event.ref), ...staleFacts.map((fact) => fact.ref)],
      };
    });
  }
}
