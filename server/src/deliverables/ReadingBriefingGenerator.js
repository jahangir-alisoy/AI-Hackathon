import { firstSentenceContaining } from '../domain/text.js';
import { toMinutes } from '../domain/time.js';

export class ReadingBriefingGenerator {
  type = 'briefing';

  constructor(topicClassifier) {
    this.topicClassifier = topicClassifier;
  }

  generate(world) {
    const openTopics = world.needsYou.map((card) => card.topic);
    const ranked = world.articles
      .map((article) => this.rank(article, openTopics))
      .sort((a, b) => b.score - a.score);
    const script = this.script(ranked, world.asOf);
    return {
      type: this.type,
      title: 'Commute Briefing — Reading Backlog',
      subtitle: `${ranked.length} articles · ranked by relevance to today · ~${Math.max(1, Math.round(script.split(' ').length / 150))} min listen`,
      articles: ranked,
      script,
      markdown: `# Commute Briefing\n\n${script}`,
    };
  }

  rank(article, openTopics) {
    const relevant = openTopics
      .map((topic) => ({ topic, sentence: firstSentenceContaining(article.text, this.topicClassifier.keywords(topic)) }))
      .find((match) => match.sentence);
    const background = this.topicClassifier.classify(`${article.title} ${article.text}`);
    const score = relevant ? 3 : background.length ? 1 : 0;
    return {
      id: article.id,
      title: article.title,
      meta: article.meta,
      score,
      whyToday: relevant ? `Relevant to "${this.topicClassifier.get(relevant.topic).label}" today.` : background.length ? `Background for "${this.topicClassifier.get(background[0]).label}".` : 'General industry context.',
      summary: article.text.split(/(?<=[.!?])\s+/).slice(0, 2).join(' '),
      sources: [article.ref],
    };
  }

  script(ranked, asOf) {
    const segments = ranked.map((article, index) =>
      `Item ${index + 1}: ${article.title}. ${article.summary} ${article.whyToday}`);
    const greeting = toMinutes(asOf) < 720 ? 'Good morning' : 'Good afternoon';
    return [`${greeting}. Here is your reading backlog as of ${asOf}, most relevant first.`, ...segments, 'That is everything. Nothing here needs a decision today.'].join('\n\n');
  }
}
