export class ClaudeReplyGenerator {
  name = 'claude';

  constructor(llmClient) {
    this.llmClient = llmClient;
  }

  isAvailable(settings) {
    return settings.ai.useClaude && this.llmClient.isEnabled();
  }

  generate(message, { settings, instruction, previous }) {
    const system = [
      `You write replies on behalf of ${settings.ceoName}, CEO of ${settings.company}.`,
      `Channel: ${message.channel}. ${message.channel === 'slack' ? 'Keep it to one to three short sentences, no greeting line, no signature.' : 'Write a short, warm, professional email reply with a greeting and a sign-off as ' + settings.ceoName + '.'}`,
      'Never invent facts, numbers or commitments that are not in the message. If a decision is needed, acknowledge and say when the CEO will decide.',
      'Return only the reply text.',
    ].join('\n');
    const prompt = [
      `From: ${message.from.name}${message.from.title ? ` (${message.from.title})` : ''}`,
      message.subject ? `Subject: ${message.subject}` : '',
      `Message:\n${message.body}`,
      `Triage: ${message.classification.priority} priority, ${message.classification.category}.`,
      previous ? `The CEO did not like this draft, write a clearly different one:\n${previous}` : '',
      instruction ? `CEO instruction: ${instruction}` : '',
    ].filter(Boolean).join('\n\n');
    return this.llmClient.complete(system, prompt, { effort: 'low' });
  }
}
