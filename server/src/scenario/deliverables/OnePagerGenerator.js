import { findSection, toItems } from '../sources/SectionedTextParser.js';
import { bulletList, sourceTag } from './markdown.js';

const RISK = /(attrition|debt|competitive|pressure|risk|unsigned|pending|cancelled|shifted|outage)/i;
const EXCLUDED_FROM_BOARD_NOTES = new Set(['onepager', 'davr']);

export class OnePagerGenerator {
  type = 'one-pager';

  generate(world) {
    const lines = world.facts.map((fact) => this.toLine(fact));
    const sections = [
      { heading: 'Highlights', lines: lines.filter((line) => line.group === 'highlight') },
      { heading: 'Risks', lines: lines.filter((line) => line.group === 'risk') },
      { heading: 'Davr Bank Integration', lines: lines.filter((line) => line.group === 'davr') },
      { heading: 'What the Board Should Know', lines: this.boardNotes(world) },
    ];
    const verifyCount = sections.flatMap((section) => section.lines).filter((line) => line.status === 'VERIFY').length;
    const title = 'Q3 One-Pager — ABB Super Bank';
    const subtitle = `For Richard Voss · draft as of ${world.asOf} · ${verifyCount} line(s) need verification before sending`;
    return { type: this.type, title, subtitle, sections, verifyCount, markdown: this.markdown(title, subtitle, sections) };
  }

  toLine(fact) {
    const group = fact.topics.includes('davr') ? 'davr' : RISK.test(fact.text) ? 'risk' : 'highlight';
    return {
      text: fact.text,
      status: fact.status,
      notes: fact.annotations.map((annotation) => annotation.text),
      sources: [fact.ref, ...fact.annotations.flatMap((annotation) => annotation.sources)],
      group,
    };
  }

  boardNotes(world) {
    const press = world.needsYou.find((card) => card.topic === 'press');
    const pressFact = toItems(findSection(world.scenario.documents.journalist.sections, 'INTERNAL').lines)[0];
    const pressLine = press && pressFact ? [{
      text: `Media: TechInsight is asking about a rumored ~15% layoff. ${pressFact}`,
      status: 'CURRENT',
      notes: [`Response status: ${press.deadline?.status === 'done' ? 'sent' : 'awaiting CEO approval'}`],
      sources: [world.scenario.refs.journalist, ...press.asks.map((ask) => ask.ref)],
    }] : [];
    const otherLines = world.needsYou
      .filter((card) => !EXCLUDED_FROM_BOARD_NOTES.has(card.topic) && card.topic !== 'press')
      .map((card) => ({
        text: `${card.label}: ${card.asks[card.asks.length - 1].summary}`,
        status: 'CURRENT',
        notes: [],
        sources: card.asks.map((ask) => ask.ref),
      }));
    return [...pressLine, ...otherLines];
  }

  markdown(title, subtitle, sections) {
    const render = (line) => {
      const flag = line.status === 'VERIFY' ? '**[VERIFY]** ' : '';
      const notes = line.notes.length ? ` _(${line.notes.join('; ')})_` : '';
      return `${flag}${line.text}${notes}${sourceTag(line.sources)}`;
    };
    return [
      `# ${title}`,
      `_${subtitle}_`,
      ...sections.filter((section) => section.lines.length).map((section) => `\n## ${section.heading}\n${bulletList(section.lines.map(render))}`),
    ].join('\n');
  }
}
