const HEADER = /^[A-Z0-9"][A-Z0-9 '’&\-—,.:;"/]+(\s\(.*\))?$/;

export class SectionedTextParser {
  parse(text) {
    const sections = [];
    let current = { title: '', lines: [] };
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trimEnd();
      if (this.isHeader(line)) {
        sections.push(current);
        current = { title: line.trim(), lines: [] };
        continue;
      }
      current.lines.push(line);
    }
    sections.push(current);
    return sections.filter((section) => section.title || section.lines.some((line) => line.trim()));
  }

  isHeader(line) {
    const trimmed = line.trim();
    return trimmed.length >= 4 && /[A-Z]{3}/.test(trimmed) && HEADER.test(trimmed);
  }
}

export const findSection = (sections, prefix) =>
  sections.find((section) => section.title.toUpperCase().startsWith(prefix.toUpperCase())) ?? { title: prefix, lines: [] };

export const toItems = (lines, { numberedOnly = false } = {}) => {
  const items = [];
  let collecting = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      collecting = false;
      continue;
    }
    const marker = line.match(numberedOnly ? /^\d+\.\s+(.*)$/ : /^(?:-|\d+\.)\s+(.*)$/);
    if (marker) {
      items.push(marker[1]);
      collecting = true;
    } else if (collecting || (!numberedOnly && items.length === 0)) {
      if (items.length && collecting) items[items.length - 1] += ` ${line}`;
      else if (!numberedOnly) {
        items.push(line);
        collecting = true;
      }
    }
  }
  return items;
};
