import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { TOPICS } from './config/topics.js';
import { ScenarioRepository } from './sources/ScenarioRepository.js';
import { createWorldStateBuilder } from './engine/createWorldStateBuilder.js';
import { TopicClassifier } from './engine/TopicClassifier.js';
import { TodayPresenter } from './engine/TodayPresenter.js';
import { OnePagerGenerator } from './deliverables/OnePagerGenerator.js';
import { DavrCallKitGenerator } from './deliverables/DavrCallKitGenerator.js';
import { PressResponseGenerator } from './deliverables/PressResponseGenerator.js';
import { ReadingBriefingGenerator } from './deliverables/ReadingBriefingGenerator.js';
import { DeliverableService } from './deliverables/DeliverableService.js';
import { LlmClient } from './ai/LlmClient.js';
import { CitationValidator } from './ai/CitationValidator.js';
import { AiWriter } from './ai/AiWriter.js';
import { OutboxRepository } from './approval/OutboxRepository.js';
import { ApprovalService } from './approval/ApprovalService.js';
import { createRouter } from './http/createRouter.js';

export const createApp = ({ dataDir, outboxFile, clientDir, llmClient = new LlmClient() }) => {
  const topicClassifier = new TopicClassifier(TOPICS);
  const deliverableService = new DeliverableService({
    generators: [
      new OnePagerGenerator(),
      new DavrCallKitGenerator(),
      new PressResponseGenerator(),
      new ReadingBriefingGenerator(topicClassifier),
    ],
    aiWriter: new AiWriter({ llmClient, citationValidator: new CitationValidator() }),
  });

  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', createRouter({
    worldStateBuilder: createWorldStateBuilder(new ScenarioRepository(dataDir)),
    todayPresenter: new TodayPresenter(),
    deliverableService,
    approvalService: new ApprovalService(new OutboxRepository(outboxFile)),
  }));

  if (clientDir && fs.existsSync(clientDir)) {
    app.use(express.static(clientDir));
    app.get(/^\/(?!api).*/, (request, response) => response.sendFile(path.join(clientDir, 'index.html')));
  }
  return app;
};
