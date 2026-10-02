const CHANNEL = /^#(\S+)/;
const MESSAGE = /^\[(\d{2}:\d{2})\]\s+([^:(]+?)(?:\s*\(([^)]*)\))?:\s*(.*)$/;

export class SlackReader {
  read(text) {
    const messages = [];
    let channel = 'general';
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      const channelMatch = line.match(CHANNEL);
      if (channelMatch) {
        channel = channelMatch[1];
        continue;
      }
      const messageMatch = line.match(MESSAGE);
      if (messageMatch) {
        messages.push(this.toEvent(messages.length + 1, channel, messageMatch));
        continue;
      }
      if (line && messages.length) {
        messages[messages.length - 1].body += ` ${line}`;
      }
    }
    return messages;
  }

  toEvent(sequence, channel, [, time, actor, role, body]) {
    return {
      id: `slack-${sequence}`,
      ref: `Slack ${time} #${channel}`,
      source: 'slack',
      channel,
      time,
      actor: actor.trim(),
      role: role ?? '',
      subject: '',
      body,
    };
  }
}
