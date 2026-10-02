export class FactAnnotator {
  constructor(topicClassifier) {
    this.topicClassifier = topicClassifier;
  }

  annotate(notes, { events, corrections, resolutions }) {
    const usedUpdates = new Set();
    return notes.map((note) => {
      const topics = this.topicClassifier.classify(`${note.section} ${note.text}`).filter((topic) => topic !== 'onepager');
      const fact = { ...note, topics, status: 'CURRENT', annotations: [] };
      this.applyVersionCorrections(fact, corrections);
      this.applyTopicCorrections(fact, corrections);
      this.applyResolutions(fact, resolutions);
      this.applyLatestUpdate(fact, events, usedUpdates);
      return fact;
    });
  }

  applyVersionCorrections(fact, corrections) {
    for (const correction of corrections) {
      const stale = correction.superseded.find((version) => new RegExp(`\\b${version}\\b`, 'i').test(fact.text));
      if (!stale) continue;
      fact.status = 'VERIFY';
      fact.annotations.push({
        text: `Taken from ${stale}, which was replaced by ${correction.current} — re-check this number against ${correction.current}`,
        sources: [correction.event.ref],
      });
    }
  }

  applyTopicCorrections(fact, corrections) {
    const primaryTopic = (correction) => correction.topics.find((topic) => topic !== 'onepager');
    const relevant = corrections.filter((correction) =>
      !correction.superseded.length && fact.topics.includes(primaryTopic(correction)));
    if (!relevant.length) return;
    fact.status = 'VERIFY';
    fact.annotations.push({
      text: `Changed since this was written: ${relevant.map((correction) => correction.event.subject || correction.event.body).join(' / ')}`,
      sources: relevant.map((correction) => correction.event.ref),
    });
  }

  applyResolutions(fact, resolutions) {
    for (const topic of fact.topics) {
      const event = resolutions.get(topic);
      if (!event) continue;
      if (fact.status === 'CURRENT') fact.status = 'UPDATED';
      fact.annotations.push({ text: `Resolved since: ${event.subject || event.body}`, sources: [event.ref] });
    }
  }

  applyLatestUpdate(fact, events, usedUpdates) {
    if (fact.status !== 'CURRENT') return;
    const latest = [...events].reverse().find((event) =>
      event.topics[0] !== 'onepager' && event.topics.some((topic) => fact.topics.includes(topic)));
    if (!latest || usedUpdates.has(latest.id)) return;
    usedUpdates.add(latest.id);
    fact.status = 'UPDATED';
    fact.annotations.push({ text: `Latest: ${latest.subject || latest.body}`, sources: [latest.ref] });
  }
}
