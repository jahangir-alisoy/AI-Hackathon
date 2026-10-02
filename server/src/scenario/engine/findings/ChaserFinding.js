export class ChaserFinding {
  constructor(minimumAsks = 3) {
    this.minimumAsks = minimumAsks;
  }

  detect({ needsYou }) {
    return needsYou.flatMap((card) => {
      const byPerson = new Map();
      for (const ask of card.asks) byPerson.set(ask.actor, [...(byPerson.get(ask.actor) ?? []), ask]);
      return [...byPerson.entries()]
        .filter(([, asks]) => asks.length >= this.minimumAsks)
        .map(([person, asks]) => ({
          kind: 'chaser',
          severity: 'medium',
          title: `${person} has asked ${asks.length} times about "${card.label}"`,
          detail: `Asked at ${asks.map((ask) => ask.time).join(', ')}. ${card.action}`,
          sources: asks.map((ask) => ask.ref),
        }));
    });
  }
}
