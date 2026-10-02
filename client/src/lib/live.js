const listeners = new Set();
let source = null;

const connect = () => {
  if (source || typeof EventSource === 'undefined') return;
  source = new EventSource('/api/stream');
  source.onmessage = (event) => {
    const parsed = JSON.parse(event.data);
    listeners.forEach((listener) => listener(parsed));
  };
  source.onerror = () => {
    source.close();
    source = null;
    setTimeout(connect, 3000);
  };
};

export const subscribeLive = (listener) => {
  connect();
  listeners.add(listener);
  return () => listeners.delete(listener);
};
