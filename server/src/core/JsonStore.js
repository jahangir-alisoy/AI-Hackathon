import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

class JsonCollection {
  constructor(store, name) {
    this.store = store;
    this.name = name;
  }

  get items() {
    this.store.data[this.name] ??= [];
    return this.store.data[this.name];
  }

  all() {
    return [...this.items];
  }

  find(predicate) {
    return this.items.filter(predicate);
  }

  get(id) {
    return this.items.find((item) => item.id === id) ?? null;
  }

  insert(document) {
    const created = { id: randomUUID(), ...document };
    this.items.push(created);
    this.store.persist();
    return created;
  }

  update(id, patch) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    this.items[index] = { ...this.items[index], ...patch, id };
    this.store.persist();
    return this.items[index];
  }

  remove(id) {
    const before = this.items.length;
    this.store.data[this.name] = this.items.filter((item) => item.id !== id);
    this.store.persist();
    return this.items.length < before;
  }

  clear() {
    this.store.data[this.name] = [];
    this.store.persist();
  }
}

export class JsonStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = filePath && fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};
    this.batching = false;
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) this.collections.set(name, new JsonCollection(this, name));
    return this.collections.get(name);
  }

  getValue(key) {
    return this.data[key];
  }

  setValue(key, value) {
    this.data[key] = value;
    this.persist();
  }

  batch(work) {
    this.batching = true;
    try {
      return work();
    } finally {
      this.batching = false;
      this.persist();
    }
  }

  async batchAsync(work) {
    this.batching = true;
    try {
      return await work();
    } finally {
      this.batching = false;
      this.persist();
    }
  }

  reset() {
    this.data = {};
    this.persist();
  }

  persist() {
    if (this.batching || !this.filePath) return;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }
}
