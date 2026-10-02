import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioRepository } from '../src/scenario/sources/ScenarioRepository.js';
import { createWorldStateBuilder } from '../src/scenario/engine/createWorldStateBuilder.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const builder = createWorldStateBuilder(new ScenarioRepository(root));
const at = (asOf) => builder.build(asOf);
const titles = (world) => world.findings.map((finding) => finding.title);

test('reads every scenario source', () => {
  const world = at('23:59');
  assert.equal(world.scenario.calendar.length, 17);
  assert.equal(world.events.filter((event) => event.source === 'inbox').length, 33);
  assert.equal(world.events.filter((event) => event.source === 'slack').length, 15);
  assert.equal(world.scenario.articles.length, 5);
});

test('flags the fake IT security email as phishing and nothing else', () => {
  const flagged = at('16:10').triage.filter((item) => item.category === 'SECURITY_RISK').map((item) => item.ref);
  assert.deepEqual(flagged, ['Inbox #1']);
});

test('removes duplicate 1:1 entries and keeps 09:45', () => {
  const marcus = at('16:10').calendar.meetings.filter((meeting) => meeting.title.includes('Marcus'));
  assert.equal(marcus.length, 1);
  assert.equal(marcus[0].start, '09:45');
});

test('moves the TechCorp call to 11:15 only after Lena announced it', () => {
  const techCorp = (asOf) => at(asOf).calendar.meetings.find((meeting) => meeting.title === 'Customer Escalation - TechCorp');
  assert.equal(techCorp('10:30').start, '11:00');
  assert.equal(techCorp('10:45').start, '11:15');
  assert.equal(techCorp('10:45').end, '12:00');
});

test('marks the v4 cost-to-income ratio for verification', () => {
  const fact = at('16:10').facts.find((candidate) => candidate.text.includes('cost-to-income'));
  assert.equal(fact.status, 'VERIFY');
  assert.ok(titles(at('16:10')).includes('v4 replaced by v5'));
});

test('treats TechCorp as resolved after 12:05', () => {
  const world = at('12:10');
  assert.ok(world.resolutions.has('techcorp'));
  assert.ok(!world.needsYou.some((card) => card.topic === 'techcorp'));
  assert.ok(at('11:00').needsYou.some((card) => card.topic === 'techcorp'));
});

test('warns that the press sync is after the reporter deadline', () => {
  assert.ok(titles(at('13:30')).includes('"Press/Comms Sync re: Journalist Inquiry" is after its deadline'));
});

test('detects that the Comms default send misses the 16:00 deadline', () => {
  const action = at('16:50').defaultActions.find((candidate) => candidate.topic === 'press');
  assert.equal(action.at, '17:00');
  assert.equal(action.deadline, '16:00');
  assert.equal(action.lateBy, 60);
});

test('links the Uzbek data rules article to the Davr Bank work', () => {
  const reading = at('10:10').findings.filter((finding) => finding.kind === 'related-reading');
  assert.ok(reading.some((finding) => finding.sources.includes('07_reading_backlog.txt #1')));
});

test('flags Davr Bank facts after the CFO correction', () => {
  const davrFacts = at('16:10').facts.filter((fact) => fact.topics.includes('davr'));
  assert.ok(davrFacts.length > 0);
  assert.ok(davrFacts.every((fact) => fact.status === 'VERIFY'));
});

test('builds the needs-you queue for the afternoon', () => {
  const topics = at('16:10').needsYou.map((card) => card.topic);
  assert.deepEqual([...topics].sort(), ['davr', 'hiring', 'onepager', 'press']);
});

test('marks a topic done once the CEO approves its deliverable', () => {
  const world = builder.build('16:10', new Set(['onepager']));
  assert.ok(!world.needsYou.some((card) => card.topic === 'onepager'));
  assert.equal(world.deadlines.find((deadline) => deadline.topic === 'onepager').status, 'done');
});
