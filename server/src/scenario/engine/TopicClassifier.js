export class TopicClassifier {
  constructor(topics) {
    this.topics = topics;
    this.byKey = new Map(topics.map((topic) => [topic.key, topic]));
  }

  classify(text) {
    const lower = text.toLowerCase();
    return this.topics
      .filter((topic) => topic.keywords.some((keyword) => lower.includes(keyword)))
      .map((topic) => topic.key);
  }

  get(key) {
    return this.byKey.get(key) ?? { key, label: 'Other', keywords: [], action: '' };
  }

  keywords(key) {
    return this.get(key).keywords;
  }
}
