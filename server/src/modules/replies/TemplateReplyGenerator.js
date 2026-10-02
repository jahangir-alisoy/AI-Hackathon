const VARIANTS = {
  Decision: [
    'Hi {first}, thanks — I’ve seen this. I’ll come back to you with a decision before {deadline}.',
    'Hi {first}, understood. Give me until {deadline} and I’ll confirm the way forward.',
    'Thanks {first}. This is on my list for today; I’ll reply properly before {deadline}.',
  ],
  Approval: [
    'Hi {first}, thanks for drafting this. I’m reviewing it now and will approve or send edits before {deadline}.',
    'Thanks {first} — please hold until I’ve signed off. You’ll have my answer before {deadline}.',
    'Hi {first}, looks close. I’ll send my approval or comments before {deadline}.',
  ],
  Scheduling: [
    'Hi {first}, that works for me — see you then.',
    'Thanks {first}, confirmed. I’ve updated my calendar.',
    'Works for me, {first}. Thanks for the heads up.',
  ],
  FYI: [
    'Thanks {first}, noted.',
    'Thanks for the update, {first}.',
    'Got it, {first} — thanks for keeping me posted.',
  ],
  Later: [
    'Thanks {first}, I’ll pick this up later this week.',
    'Noted, {first}. I’ll get to this by Friday.',
    'Thanks {first} — not today, but it’s on my list.',
  ],
  Noise: [
    'Thanks for reaching out — we’ll pass for now.',
    'Thank you, not at this time.',
    'Thanks, no action needed on our side.',
  ],
  Fraud: [
    'Forwarding to IT Security for review — please do not reply to this sender.',
    'Reported to IT Security as suspected phishing.',
    'Flagged as phishing; IT Security will follow up.',
  ],
};

export class TemplateReplyGenerator {
  name = 'templates';

  async generate(message, { settings, version }) {
    const variants = VARIANTS[message.classification.category] ?? VARIANTS.FYI;
    const text = variants[version % variants.length]
      .replace('{first}', message.from.name.split(' ')[0])
      .replace('{deadline}', message.classification.deadline ? message.classification.deadline : 'end of day');
    return `${text}\n\n— ${settings.ceoName}`;
  }
}
