export class DeliverableService {
  constructor({ generators, aiWriter }) {
    this.generators = new Map(generators.map((generator) => [generator.type, generator]));
    this.aiWriter = aiWriter;
    this.cache = new Map();
  }

  types() {
    return [...this.generators.keys()];
  }

  has(type) {
    return this.generators.has(type);
  }

  mode() {
    return this.aiWriter.isEnabled() ? 'ai' : 'template';
  }

  async get(type, world) {
    const draft = this.generators.get(type).generate(world);
    if (!this.aiWriter.isEnabled()) return { ...draft, mode: 'template' };
    const key = `${type}@${world.asOf}@${draft.markdown.length}`;
    try {
      if (!this.cache.has(key)) this.cache.set(key, await this.aiWriter.write(draft, world.knownRefs));
      return { ...draft, mode: 'ai', ai: this.cache.get(key) };
    } catch (error) {
      return { ...draft, mode: 'template', aiError: error.message };
    }
  }

  clearCache() {
    this.cache.clear();
  }
}
