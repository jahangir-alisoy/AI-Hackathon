export class PhishingFinding {
  detect({ events, phishing }) {
    return events.filter((event) => phishing.has(event.id)).map((event) => ({
      kind: 'phishing',
      severity: 'high',
      title: `Phishing email: "${event.subject}"`,
      detail: `${phishing.get(event.id).signals.join('. ')}. StandIn will not open the link — report it to IT.`,
      sources: [event.ref],
    }));
  }
}
