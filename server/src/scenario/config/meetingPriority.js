export const MEETING_PRIORITY_RULES = [
  { pattern: /follow-up/i, score: 2 },
  { pattern: /board chair|board prep/i, score: 5 },
  { pattern: /customer escalation/i, score: 5 },
  { pattern: /davr/i, score: 5 },
  { pattern: /final round/i, score: 4 },
  { pattern: /press|journalist/i, score: 4 },
  { pattern: /interview/i, score: 3 },
  { pattern: /1:1|roadmap|product/i, score: 3 },
  { pattern: /sync|prep|marketing/i, score: 2 },
];

export const DEFAULT_MEETING_PRIORITY = 2;

export const WORKDAY = { start: '08:30', end: '17:00' };
