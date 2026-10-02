import { GLOSSARY_TRANSLATIONS } from '../config/glossaryTranslations.js';
import { findSection, toItems } from '../sources/SectionedTextParser.js';
import { bulletList, sourceTag } from './markdown.js';

const GLOSSARY_ENTRY = /^"([^"]+)"\s*[—-]\s*(.*)$/;
const BLOCKING = /(unsigned|to be confirmed|pending|not been reviewed|shifted)/i;

export class DavrCallKitGenerator {
  type = 'davr-kit';

  generate(world) {
    const brief = world.scenario.documents.davrBrief;
    const outstanding = toItems(findSection(brief.sections, 'OUTSTANDING ITEMS').lines);
    const keyTerms = toItems(findSection(brief.sections, 'KEY TERMS').lines);
    const attendees = toItems(findSection(brief.sections, 'ATTENDEES').lines);
    const glossary = this.glossary(findSection(brief.sections, 'GLOSSARY').lines);
    const decision = this.decision(world, outstanding);
    const guardrails = this.guardrails(world, outstanding, attendees);
    const talkingPoints = keyTerms.map((term) => `Confirm: ${term}`);
    const followUp = this.followUp(keyTerms);
    const kit = {
      type: this.type,
      title: 'Davr Bank Call Kit — Day-1 Sign-off',
      subtitle: `Prepared ${world.asOf} · call at 10:30 · interpreter cancelled`,
      decision,
      attendees,
      outstanding,
      guardrails,
      talkingPoints,
      glossary,
      followUp,
      sources: [brief.ref],
    };
    return { ...kit, markdown: this.markdown(kit) };
  }

  decision(world, outstanding) {
    const request = [...world.events].reverse().find((event) => event.topics.includes('davr') && /prefer|reschedule/i.test(event.body));
    const blockers = outstanding.filter((item) => BLOCKING.test(item));
    const options = [
      { key: 'A', label: 'Proceed at 10:30 in simple English', detail: 'Share the glossary and agenda in writing before the call, speak slowly, confirm every point in a written recap afterwards.' },
      { key: 'B', label: 'Short alignment call now, sign-off later', detail: 'Use 15 minutes for non-binding updates; move legal and financial sign-off to a rescheduled call with an interpreter.' },
    ];
    return {
      question: request ? request.body : 'Proceed with the call or reschedule?',
      askedBy: request?.actor ?? null,
      options,
      recommendation: blockers.length ? 'B' : 'A',
      reason: blockers.length
        ? `${blockers.length} item(s) are not ready for a binding sign-off: ${blockers.map((item) => item.split(' — ')[0].split('(')[0].trim()).join('; ')}.`
        : 'Nothing is blocking a sign-off; simple English with written support is enough.',
      humanOnly: 'You decide. StandIn drafts the reply to Bekzod either way.',
      sources: request ? [request.ref] : [],
    };
  }

  guardrails(world, outstanding, attendees) {
    const rails = [];
    const dsaAsks = world.needsYou.find((card) => card.topic === 'davr')?.asks.filter((ask) => /dsa|signature|signed/i.test(ask.summary)) ?? [];
    if (dsaAsks.length) {
      rails.push({ text: `The DSA is still unsigned on our side — only you can sign it; do it before the call (asked ${dsaAsks.length}×).`, sources: dsaAsks.map((ask) => ask.ref) });
    }
    for (const finding of world.findings.filter((candidate) => candidate.kind === 'related-reading' && /data|regulat/i.test(candidate.detail))) {
      rails.push({ text: `Regulation: ${finding.detail}`, sources: finding.sources });
    }
    const termChanges = world.corrections.filter((correction) => correction.topics.includes('davr'));
    const shifted = outstanding.find((item) => /shifted/i.test(item));
    if (termChanges.length || shifted) {
      rails.push({
        text: 'Terms have shifted since the board deck — agree in principle only; nothing is final until legal confirms in writing.',
        sources: [...termChanges.map((correction) => correction.event.ref), world.scenario.refs.davrBrief],
      });
    }
    if (attendees.some((item) => /english/i.test(item))) {
      rails.push({ text: 'Bekzod and Dilnoza struggle with fast legal/financial English: one topic at a time, short sentences, share the glossary on screen.', sources: [world.scenario.refs.davrBrief] });
    }
    return rails;
  }

  glossary(lines) {
    return toItems(lines).map((item) => item.match(GLOSSARY_ENTRY)).filter(Boolean).map(([, term, definition]) => ({
      term,
      definition,
      ...(GLOSSARY_TRANSLATIONS[term.toLowerCase()] ?? { uz: '', ru: '' }),
    }));
  }

  followUp(keyTerms) {
    return [
      'Dear Bekzod, dear Dilnoza,',
      '',
      'Thank you for today’s call. A short written summary, so nothing is lost without an interpreter:',
      '',
      ...keyTerms.map((term) => `- ${term} — [agreed / still open]`),
      '',
      'Nothing above is final until our legal teams confirm it in writing. We will send an Uzbek version as well.',
      '',
      'Best regards',
    ].join('\n');
  }

  markdown(kit) {
    return [
      `# ${kit.title}`,
      `_${kit.subtitle}_`,
      `\n## Decision for you\n${kit.decision.question}${sourceTag(kit.decision.sources)}`,
      bulletList(kit.decision.options.map((option) => `**${option.key}. ${option.label}** — ${option.detail}`)),
      `\n**StandIn recommends ${kit.decision.recommendation}.** ${kit.decision.reason}`,
      `\n## Guardrails\n${bulletList(kit.guardrails.map((rail) => `${rail.text}${sourceTag(rail.sources)}`))}`,
      `\n## Talking points\n${bulletList(kit.talkingPoints)}`,
      `\n## Glossary (EN / UZ / RU)\n${bulletList(kit.glossary.map((entry) => `**${entry.term}** — ${entry.definition} · UZ: ${entry.uz} · RU: ${entry.ru}`))}`,
      `\n## Follow-up email draft\n${kit.followUp}`,
    ].join('\n');
  }
}
