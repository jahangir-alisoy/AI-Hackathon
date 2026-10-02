export class AssistantOutFinding {
  detect({ events }) {
    const autoReply = events.find((event) => /out of office|automatic reply/i.test(`${event.role} ${event.subject}`));
    if (!autoReply) return [];
    return [{
      kind: 'coverage',
      severity: 'low',
      title: 'Your assistant is out with no backup',
      detail: `${autoReply.body} StandIn is covering scheduling, triage and deadline tracking today.`,
      sources: [autoReply.ref],
    }];
  }
}
