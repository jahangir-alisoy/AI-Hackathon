import { eventText } from '../../shared/text.js';
import { isAtOrBefore } from '../../shared/time.js';

export class WorldStateBuilder {
  constructor({
    repository,
    topicClassifier,
    phishingDetector,
    intentParser,
    calendarResolver,
    triageClassifier,
    resolutionTracker,
    correctionTracker,
    deadlineRadar,
    needsYouBuilder,
    scheduleAdvisor,
    factAnnotator,
    findingDetectors,
  }) {
    Object.assign(this, {
      repository,
      topicClassifier,
      phishingDetector,
      intentParser,
      calendarResolver,
      triageClassifier,
      resolutionTracker,
      correctionTracker,
      deadlineRadar,
      needsYouBuilder,
      scheduleAdvisor,
      factAnnotator,
      findingDetectors,
    });
  }

  build(asOf, approvedTopics = new Set()) {
    const scenario = this.repository.load();
    const events = scenario.events
      .filter((event) => isAtOrBefore(event.time, asOf))
      .map((event) => ({ ...event, topics: this.topicClassifier.classify(`${eventText(event)} ${event.channel ? `#${event.channel}` : ''}`) }));
    const phishing = new Map(events.map((event) => [event.id, this.phishingDetector.assess(event)]).filter(([, result]) => result));
    const calendar = this.calendarResolver.resolve(scenario.calendar, this.intentParser.parse(events));
    const triage = this.triageClassifier.classify(events, { phishing, handledEventIds: calendar.handledEventIds });
    const triageById = new Map(triage.map((item) => [item.id, item]));
    const resolutions = this.resolutionTracker.track(events);
    const corrections = this.correctionTracker.track(events);
    const { deadlines, defaultActions } = this.deadlineRadar.build({
      events,
      triageById,
      calendarDeadlines: calendar.deadlines,
      resolutions,
      approvedTopics,
      asOf,
    });
    const needsYou = this.needsYouBuilder.build({ triage, deadlines, resolutions, approvedTopics });
    const schedule = this.scheduleAdvisor.advise({ calendar, resolutions, needsYou, deadlines, asOf });
    const facts = this.factAnnotator.annotate(scenario.notes, { events, corrections, resolutions });
    const context = {
      asOf,
      scenario,
      events,
      phishing,
      calendar,
      triage,
      resolutions,
      corrections,
      deadlines,
      defaultActions,
      needsYou,
      schedule,
      facts,
      articles: scenario.articles,
    };
    const findings = this.findingDetectors.flatMap((detector) => detector.detect(context));
    return { ...context, findings, knownRefs: this.knownRefs(scenario, events) };
  }

  knownRefs(scenario, events) {
    return new Set([
      ...events.map((event) => event.ref),
      ...scenario.calendar.map((entry) => entry.ref),
      ...scenario.articles.map((article) => article.ref),
      ...Object.values(scenario.refs),
    ]);
  }
}
