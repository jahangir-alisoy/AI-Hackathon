import fs from 'node:fs';
import path from 'node:path';

export class OutboxRepository {
  constructor(filePath) {
    this.filePath = filePath;
  }

  list() {
    if (!fs.existsSync(this.filePath)) return [];
    return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
  }

  add(entry) {
    const entries = [...this.list(), entry];
    this.save(entries);
    return entry;
  }

  clear() {
    this.save([]);
  }

  save(entries) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(entries, null, 2));
  }
}
