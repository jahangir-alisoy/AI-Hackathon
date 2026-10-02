export class EmailAdapter {
  channel = 'email';

  status() {
    return { connected: false, mode: 'simulated', detail: 'Email replies are stored in StandIn; connect SMTP/Outlook to deliver them' };
  }

  async send(message) {
    return { delivery: 'simulated', to: message.from.handle ?? message.from.name, detail: `Reply to ${message.from.name} stored in Sent` };
  }
}
