export const streamRoute = (bus) => (request, response) => {
  response.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });
  response.write(': connected\n\n');
  const unsubscribe = bus.subscribe((event) => response.write(`data: ${JSON.stringify(event)}\n\n`));
  const heartbeat = setInterval(() => response.write(': ping\n\n'), 25_000);
  request.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
};
