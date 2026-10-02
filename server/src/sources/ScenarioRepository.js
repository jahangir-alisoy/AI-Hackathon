import fs from 'node:fs';
import path from 'node:path';
import { SCENARIO_FILES } from '../config/scenarioFiles.js';
import { toMinutes } from '../domain/time.js';
import { XlsxTableReader } from './XlsxTableReader.js';
import { CalendarReader } from './CalendarReader.js';
import { InboxReader } from './InboxReader.js';
import { SlackReader } from './SlackReader.js';
import { SectionedTextParser } from './SectionedTextParser.js';
import { BoardNotesParser } from './BoardNotesParser.js';
import { ReadingBacklogParser } from './ReadingBacklogParser.js';

export class ScenarioRepository {
  constructor(dataDir, files = SCENARIO_FILES) {
    this.dataDir = dataDir;
    this.files = files;
    this.scenario = null;
  }

  load() {
    this.scenario ??= this.readAll();
    return this.scenario;
  }

  withFullNames(slack, inbox) {
    const fullNames = [...new Set(inbox.map((event) => event.actor))];
    return slack.map((event) => {
      const matches = fullNames.filter((name) => name.split(' ')[0] === event.actor);
      return matches.length === 1 ? { ...event, actor: matches[0] } : event;
    });
  }

  readAll() {
    const tableReader = new XlsxTableReader();
    const textParser = new SectionedTextParser();
    const filePath = (key) => path.join(this.dataDir, this.files[key]);
    const readText = (key) => fs.readFileSync(filePath(key), 'utf8');
    const document = (key) => ({ ref: this.files[key], sections: textParser.parse(readText(key)) });

    const inbox = new InboxReader(tableReader).read(filePath('inbox'));
    const slack = this.withFullNames(new SlackReader().read(readText('slack')), inbox);
    const boardChair = document('boardChair');

    return {
      calendar: new CalendarReader(tableReader).read(filePath('calendar'), this.files.calendar),
      events: [...inbox, ...slack].sort((a, b) => toMinutes(a.time) - toMinutes(b.time)),
      documents: {
        davrBrief: document('davrBrief'),
        journalist: document('journalist'),
        boardChair,
      },
      notes: new BoardNotesParser().parse(boardChair.sections, boardChair.ref),
      articles: new ReadingBacklogParser().parse(readText('readingBacklog'), this.files.readingBacklog),
      refs: {
        calendar: this.files.calendar,
        davrBrief: this.files.davrBrief,
        journalist: this.files.journalist,
        boardChair: this.files.boardChair,
        readingBacklog: this.files.readingBacklog,
      },
    };
  }
}
