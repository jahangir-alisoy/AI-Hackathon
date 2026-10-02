import { TRIAGE_PHRASES } from '../../../scenario/config/triageRules.js';
import { FraudDetector } from './FraudDetector.js';
import { NoiseDetector } from './NoiseDetector.js';
import { BlockedSenderDetector } from './BlockedSenderDetector.js';
import { UrgencyDetector } from './UrgencyDetector.js';
import { DeadlineDetector } from './DeadlineDetector.js';
import { SchedulingDetector } from './SchedulingDetector.js';
import { PhraseDetector } from './PhraseDetector.js';

export const createDetectors = () => [
  new FraudDetector(),
  new NoiseDetector(),
  new BlockedSenderDetector(),
  new UrgencyDetector(),
  new DeadlineDetector(),
  new PhraseDetector({ phrases: TRIAGE_PHRASES.approveDraft, priority: 'high', category: 'Approval', label: 'Waiting for your approval' }),
  new PhraseDetector({ phrases: TRIAGE_PHRASES.ceoDecision, priority: 'high', category: 'Decision', label: 'Needs your decision' }),
  new SchedulingDetector(),
  new PhraseDetector({ phrases: TRIAGE_PHRASES.later, priority: 'low', category: 'Later', label: 'Not for today' }),
];
