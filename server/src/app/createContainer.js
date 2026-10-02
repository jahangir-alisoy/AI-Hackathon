import { JsonStore } from '../core/JsonStore.js';
import { EventBus } from '../core/EventBus.js';
import { TOPICS } from '../scenario/config/topics.js';
import { ScenarioRepository } from '../scenario/sources/ScenarioRepository.js';
import { createWorldStateBuilder } from '../scenario/engine/createWorldStateBuilder.js';
import { TopicClassifier } from '../scenario/engine/TopicClassifier.js';
import { TodayPresenter } from '../scenario/engine/TodayPresenter.js';
import { OnePagerGenerator } from '../scenario/deliverables/OnePagerGenerator.js';
import { DavrCallKitGenerator } from '../scenario/deliverables/DavrCallKitGenerator.js';
import { PressResponseGenerator } from '../scenario/deliverables/PressResponseGenerator.js';
import { ReadingBriefingGenerator } from '../scenario/deliverables/ReadingBriefingGenerator.js';
import { DeliverableService } from '../scenario/deliverables/DeliverableService.js';
import { LlmClient } from '../modules/ai/LlmClient.js';
import { AiWriter } from '../modules/ai/AiWriter.js';
import { CitationValidator } from '../modules/ai/CitationValidator.js';
import { ApprovalService } from '../modules/briefings/ApprovalService.js';
import { OutboxRepository } from '../modules/briefings/OutboxRepository.js';
import { SettingsService } from '../modules/settings/SettingsService.js';
import { RuleService } from '../modules/rules/RuleService.js';
import { RuleMatcher } from '../modules/rules/RuleMatcher.js';
import { TemplateService } from '../modules/templates/TemplateService.js';
import { ActivityLog } from '../modules/activity/ActivityLog.js';
import { createDetectors } from '../modules/classification/detectors/createDetectors.js';
import { ClassificationEngine } from '../modules/classification/ClassificationEngine.js';
import { ClaudeClassifier } from '../modules/classification/ClaudeClassifier.js';
import { MessageService } from '../modules/messages/MessageService.js';
import { SlackClient } from '../modules/channels/SlackClient.js';
import { SlackAdapter } from '../modules/channels/SlackAdapter.js';
import { EmailAdapter } from '../modules/channels/EmailAdapter.js';
import { SystemAdapter } from '../modules/channels/SystemAdapter.js';
import { ChannelGateway } from '../modules/channels/ChannelGateway.js';
import { SlackSignatureVerifier } from '../modules/channels/SlackSignatureVerifier.js';
import { SlackEventsService } from '../modules/channels/SlackEventsService.js';
import { IngestionService } from '../modules/channels/IngestionService.js';
import { TemplateReplyGenerator } from '../modules/replies/TemplateReplyGenerator.js';
import { ClaudeReplyGenerator } from '../modules/replies/ClaudeReplyGenerator.js';
import { ReplyService } from '../modules/replies/ReplyService.js';
import { AutoReplyService } from '../modules/replies/AutoReplyService.js';
import { EventService } from '../modules/calendar/EventService.js';
import { CalendarFeed } from '../modules/calendar/CalendarFeed.js';
import { OverviewService } from '../modules/overview/OverviewService.js';
import { ScenarioSeeder } from '../modules/seed/ScenarioSeeder.js';

export const createContainer = ({ dataDir, storeFile, outboxFile, llmClient = new LlmClient(), slackClient = new SlackClient(), slackVerifier = new SlackSignatureVerifier() }) => {
  const store = new JsonStore(storeFile);
  const bus = new EventBus();
  const settingsService = new SettingsService({ store, bus });
  const ruleService = new RuleService({ store, bus });
  const templateService = new TemplateService({ store, bus });
  const activityLog = new ActivityLog({ store, bus });
  const classificationEngine = new ClassificationEngine({
    detectors: createDetectors(),
    ruleMatcher: new RuleMatcher(),
    ruleService,
    templateService,
    settingsService,
    aiClassifier: new ClaudeClassifier(llmClient),
  });
  const messageService = new MessageService({ store, bus, classificationEngine, ruleService, activityLog });
  const gateway = new ChannelGateway([new SlackAdapter(slackClient), new EmailAdapter(), new SystemAdapter()]);
  const autoReplyService = new AutoReplyService({ settingsService, templateService, activityLog });
  const replyService = new ReplyService({
    messageService,
    settingsService,
    gateway,
    claudeGenerator: new ClaudeReplyGenerator(llmClient),
    templateGenerator: new TemplateReplyGenerator(),
    activityLog,
  });
  autoReplyService.attach(replyService);
  const ingestionService = new IngestionService({ messageService, autoReplyService, settingsService, activityLog });
  const eventService = new EventService({ store, bus });
  const repository = new ScenarioRepository(dataDir);
  const worldStateBuilder = createWorldStateBuilder(repository);
  const topicClassifier = new TopicClassifier(TOPICS);

  return {
    store,
    bus,
    llmClient,
    settingsService,
    ruleService,
    templateService,
    activityLog,
    classificationEngine,
    messageService,
    gateway,
    replyService,
    ingestionService,
    eventService,
    calendarFeed: new CalendarFeed({ eventService, messageService }),
    overviewService: new OverviewService({ messageService, eventService, activityLog, settingsService, gateway, llmClient }),
    slackEventsService: new SlackEventsService({ verifier: slackVerifier, slackClient, ingestionService }),
    seeder: new ScenarioSeeder({ store, worldStateBuilder, ingestionService, eventService, ruleService, templateService }),
    worldStateBuilder,
    todayPresenter: new TodayPresenter(),
    deliverableService: new DeliverableService({
      generators: [new OnePagerGenerator(), new DavrCallKitGenerator(), new PressResponseGenerator(), new ReadingBriefingGenerator(topicClassifier)],
      aiWriter: new AiWriter({ llmClient, citationValidator: new CitationValidator() }),
    }),
    approvalService: new ApprovalService(new OutboxRepository(outboxFile)),
  };
};
