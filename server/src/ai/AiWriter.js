import { SYSTEM_PROMPT, TASK_PROMPTS } from './prompts.js';

export class AiWriter {
  constructor({ llmClient, citationValidator }) {
    this.llmClient = llmClient;
    this.citationValidator = citationValidator;
  }

  isEnabled() {
    return this.llmClient.isEnabled();
  }

  async write(draft, knownRefs) {
    const task = TASK_PROMPTS[draft.type];
    const markdown = await this.llmClient.complete(SYSTEM_PROMPT, `${task}\n\nDraft:\n\n${draft.markdown}`);
    return { markdown, citations: this.citationValidator.validate(markdown, knownRefs), model: this.llmClient.model };
  }
}
