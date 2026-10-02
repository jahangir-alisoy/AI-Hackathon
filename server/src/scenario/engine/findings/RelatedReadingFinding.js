import { firstSentenceContaining } from '../../../shared/text.js';

export class RelatedReadingFinding {
  constructor(topicClassifier) {
    this.topicClassifier = topicClassifier;
  }

  detect({ articles, needsYou }) {
    return articles.flatMap((article) => {
      const card = needsYou.find((candidate) =>
        firstSentenceContaining(article.text, this.topicClassifier.keywords(candidate.topic)));
      if (!card) return [];
      const sentence = firstSentenceContaining(article.text, this.topicClassifier.keywords(card.topic));
      return [{
        kind: 'related-reading',
        severity: 'medium',
        title: `Unread article affects "${card.label}"`,
        detail: `"${article.title}": ${sentence}`,
        sources: [article.ref],
      }];
    });
  }
}
