const partsFormatter = new Map();

const formatterFor = (timeZone) => {
  if (!partsFormatter.has(timeZone)) {
    partsFormatter.set(timeZone, new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }));
  }
  return partsFormatter.get(timeZone);
};

export const zoned = (iso, timeZone) => {
  const parts = Object.fromEntries(formatterFor(timeZone).formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
  return { dateKey: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
};

export const formatTime = (iso, timeZone) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(iso));

export const formatDay = (iso, timeZone) =>
  new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone }).format(new Date(iso));

export const formatRelative = (iso) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

export const greeting = (timeZone) => {
  const hour = Math.floor(zoned(new Date().toISOString(), timeZone).minutes / 60);
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');

export const clockToMinutes = (clock) => {
  const [hours, minutes] = clock.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToClock = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
