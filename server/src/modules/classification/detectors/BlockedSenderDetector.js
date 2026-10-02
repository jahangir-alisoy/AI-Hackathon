export class BlockedSenderDetector {
  detect(message, { settings }) {
    const blocked = settings.blockedSenders.find((name) =>
      `${message.from.name} ${message.from.handle ?? ''}`.toLowerCase().includes(name.toLowerCase()));
    return blocked ? { priority: 'low', category: 'Noise', reason: `Sender is on your blocked list (${blocked})` } : null;
  }
}
