const RESCHEDULE = /\b(push|pushed|pushing|move|moved|moving|reschedul\w*)\b[^.]*\b(\d{1,2}:\d{2}|\d{1,2}\s?(am|pm))/i;

export class SchedulingDetector {
  detect(message) {
    return RESCHEDULE.test(`${message.subject} ${message.body}`)
      ? { priority: 'normal', category: 'Scheduling', reason: 'Schedule change request' }
      : null;
  }
}
