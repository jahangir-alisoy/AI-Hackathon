import Anthropic from '@anthropic-ai/sdk';

export const DEFAULT_MODEL = 'claude-opus-5-5';

export class LlmClient {
  constructor({ model = DEFAULT_MODEL, env = process.env } = {}) {
    this.model = model;
    this.env = env;
    this.client = null;
  }

  isEnabled() {
    return Boolean(this.env.ANTHROPIC_API_KEY || this.env.ANTHROPIC_AUTH_TOKEN) && this.env.STANDIN_AI !== 'off';
  }

  async complete(system, prompt, { effort = 'medium' } = {}) {
    return this.text(await this.request(system, prompt, { effort }));
  }

  async completeJson(system, prompt, schema) {
    const response = await this.request(system, prompt, { effort: 'low', format: { type: 'json_schema', schema } });
    return JSON.parse(this.text(response));
  }

  async request(system, prompt, { effort, format }) {
    this.client ??= new Anthropic();
    const response = await this.client.beta.messages.create({
      model: this.model,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: format ? { effort, format } : { effort },
      system,
      messages: [{ role: 'user', content: prompt }],
    });
    if (response.stop_reason === 'refusal') throw new Error('The model declined this request');
    return response;
  }

  text(response) {
    return response.content.filter((block) => block.type === 'text').map((block) => block.text).join('\n').trim();
  }
}
