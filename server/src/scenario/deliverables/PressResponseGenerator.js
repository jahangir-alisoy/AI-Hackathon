import { findSection, toItems } from '../sources/SectionedTextParser.js';
import { bulletList, sourceTag } from './markdown.js';

export class PressResponseGenerator {
  type = 'press';

  generate(world) {
    const document = world.scenario.documents.journalist;
    const questions = toItems(findSection(document.sections, 'FULL EMAIL').lines, { numberedOnly: true });
    const facts = toItems(findSection(document.sections, 'INTERNAL CONTEXT').lines);
    const deadline = world.deadlines.find((candidate) => candidate.topic === 'press') ?? null;
    const defaultAction = world.defaultActions.find((action) => action.topic === 'press') ?? null;
    const lateMeeting = world.schedule.lateMeetings.find((late) => late.topic === 'press') ?? null;
    const pack = {
      type: this.type,
      title: 'Press Response — TechInsight (Sam Reyes)',
      subtitle: deadline ? `Reporter deadline ${deadline.due} · status: ${deadline.status}` : 'No reporter request yet',
      deadline,
      warnings: this.warnings(deadline, defaultAction, lateMeeting),
      questions,
      facts,
      statement: this.statement(),
      guardrails: [
        'Do not repeat or confirm the 15% figure.',
        'Do not speculate about future restructuring.',
        'Only Jordan sends to the reporter, after your approval.',
      ],
      sources: [document.ref, ...(deadline?.sources ?? [])],
    };
    return { ...pack, markdown: this.markdown(pack) };
  }

  warnings(deadline, defaultAction, lateMeeting) {
    const warnings = [];
    if (deadline?.softDue) warnings.push({ text: `Comms needs your decision by ${deadline.softDue} to hit the ${deadline.due} deadline comfortably.`, sources: deadline.sources });
    if (lateMeeting) warnings.push({ text: lateMeeting.suggestion, sources: lateMeeting.sources });
    if (defaultAction?.lateBy) warnings.push({ text: `${defaultAction.actor} plans to send at ${defaultAction.at} unless you object — ${defaultAction.lateBy} min after the deadline. The story may run without our comment.`, sources: [defaultAction.source] });
    if (deadline?.status === 'missed') warnings.push({ text: 'The reporter deadline has passed — approve now and ask Jordan to send immediately with a request to update the story.', sources: deadline.sources });
    return warnings;
  }

  statement() {
    return 'ABB Super Bank is not planning layoffs. Last month we announced an internal reorganization that changed how some of our teams are structured; it did not reduce headcount. We continue to invest in our people and in our digital banking services.';
  }

  markdown(pack) {
    return [
      `# ${pack.title}`,
      `_${pack.subtitle}_`,
      pack.warnings.length ? `\n## Warnings\n${bulletList(pack.warnings.map((warning) => `${warning.text}${sourceTag(warning.sources)}`))}` : '',
      `\n## What the reporter asks\n${bulletList(pack.questions)}`,
      `\n## What is true (internal)\n${bulletList(pack.facts)}`,
      `\n## Draft statement\n> ${pack.statement}`,
      `\n## Guardrails\n${bulletList(pack.guardrails)}`,
    ].filter(Boolean).join('\n');
  }
}
