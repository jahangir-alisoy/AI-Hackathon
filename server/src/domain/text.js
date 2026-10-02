export const eventText = (event) => `${event.subject ?? ''} ${event.body ?? ''}`.trim();

export const summarize = (event, length = 140) => {
  const text = event.subject || event.body || '';
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
};

export const firstSentenceContaining = (text, keywords) => {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.find((sentence) => keywords.some((keyword) => sentence.toLowerCase().includes(keyword))) ?? null;
};

export const includesAny = (text, phrases) => {
  const lower = text.toLowerCase();
  return phrases.find((phrase) => lower.includes(phrase)) ?? null;
};
