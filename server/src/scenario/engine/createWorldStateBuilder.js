import { TOPICS } from '../config/topics.js';
import { TopicClassifier } from './TopicClassifier.js';
import { PhishingDetector } from './PhishingDetector.js';
import { ChangeIntentParser } from './ChangeIntentParser.js';
import { CalendarResolver } from './CalendarResolver.js';
import { TriageClassifier } from './TriageClassifier.js';
import { ResolutionTracker } from './ResolutionTracker.js';
import { CorrectionTracker } from './CorrectionTracker.js';
import { DeadlineRadar } from './DeadlineRadar.js';
import { NeedsYouBuilder } from './NeedsYouBuilder.js';
import { MeetingPrioritizer } from './MeetingPrioritizer.js';
import { ScheduleAdvisor } from './ScheduleAdvisor.js';
import { FactAnnotator } from './FactAnnotator.js';
import { WorldStateBuilder } from './WorldStateBuilder.js';
import { PhishingFinding } from './findings/PhishingFinding.js';
import { SupersededVersionFinding } from './findings/SupersededVersionFinding.js';
import { CorrectionFinding } from './findings/CorrectionFinding.js';
import { ResolvedRiskFinding } from './findings/ResolvedRiskFinding.js';
import { DeadlineConflictFinding } from './findings/DeadlineConflictFinding.js';
import { CalendarFinding } from './findings/CalendarFinding.js';
import { AtRiskMeetingFinding } from './findings/AtRiskMeetingFinding.js';
import { ChaserFinding } from './findings/ChaserFinding.js';
import { RelatedReadingFinding } from './findings/RelatedReadingFinding.js';
import { AssistantOutFinding } from './findings/AssistantOutFinding.js';

export const createWorldStateBuilder = (repository) => {
  const topicClassifier = new TopicClassifier(TOPICS);
  return new WorldStateBuilder({
    repository,
    topicClassifier,
    phishingDetector: new PhishingDetector(),
    intentParser: new ChangeIntentParser(),
    calendarResolver: new CalendarResolver(),
    triageClassifier: new TriageClassifier(),
    resolutionTracker: new ResolutionTracker(),
    correctionTracker: new CorrectionTracker(),
    deadlineRadar: new DeadlineRadar(topicClassifier),
    needsYouBuilder: new NeedsYouBuilder(topicClassifier),
    scheduleAdvisor: new ScheduleAdvisor({ prioritizer: new MeetingPrioritizer(), topicClassifier }),
    factAnnotator: new FactAnnotator(topicClassifier),
    findingDetectors: [
      new PhishingFinding(),
      new DeadlineConflictFinding(topicClassifier),
      new SupersededVersionFinding(),
      new CorrectionFinding(topicClassifier),
      new AtRiskMeetingFinding(topicClassifier),
      new RelatedReadingFinding(topicClassifier),
      new ResolvedRiskFinding(topicClassifier),
      new ChaserFinding(),
      new CalendarFinding(),
      new AssistantOutFinding(),
    ],
  });
};
