import { findSection, toItems } from './SectionedTextParser.js';

const SUBSECTION = /^---\s*(.*?)\s*---$/;

export class BoardNotesParser {
  parse(sections, ref) {
    const rawNotes = findSection(sections, 'RAW NOTES');
    const groups = [];
    for (const line of rawNotes.lines) {
      const header = line.trim().match(SUBSECTION);
      if (header) groups.push({ section: header[1], lines: [] });
      else if (groups.length) groups[groups.length - 1].lines.push(line);
    }
    return groups.flatMap((group) => toItems(group.lines).map((text) => ({ section: group.section, text })))
      .map((fact, index) => ({ id: `note-${index + 1}`, ref, ...fact }));
  }
}
