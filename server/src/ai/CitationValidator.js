const CITATION = /\[([^\]]+)\]/g;
const LOOKS_LIKE_SOURCE = /^(Inbox #\d+|Slack \d{2}:\d{2}.*|0\d_.+)$/;

export class CitationValidator {
  validate(text, knownRefs) {
    const cited = [...text.matchAll(CITATION)].map((match) => match[1].trim()).filter((ref) => LOOKS_LIKE_SOURCE.test(ref));
    const unknown = [...new Set(cited.filter((ref) => !knownRefs.has(ref)))];
    return { cited: new Set(cited).size, unknown };
  }
}
