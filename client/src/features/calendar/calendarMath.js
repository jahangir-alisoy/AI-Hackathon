import { zoned } from '../../lib/format.js';

export const DAY_START = 7 * 60;
export const DAY_END = 20 * 60;
export const HOUR_HEIGHT = 76;

export const todayKey = (timeZone) => zoned(new Date().toISOString(), timeZone).dateKey;

export const shiftDays = (dateKey, days) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
};

export const weekDays = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const monday = shiftDays(dateKey, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => shiftDays(monday, index));
};

export const dayLabel = (dateKey, options = { weekday: 'short', day: 'numeric' }) =>
  new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' }).format(new Date(`${dateKey}T12:00:00Z`));

export const toIsoInZone = (dateKey, clock, timeZone) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = clock.split(':').map(Number);
  const guess = Date.UTC(year, month - 1, day, hours, minutes);
  const seen = zoned(new Date(guess).toISOString(), timeZone);
  const dayDiff = (Date.parse(`${seen.dateKey}T00:00:00Z`) - Date.parse(`${dateKey}T00:00:00Z`)) / 86_400_000;
  const drift = dayDiff * 1440 + seen.minutes - (hours * 60 + minutes);
  return new Date(guess - drift * 60_000).toISOString();
};

export const position = (startMinutes, endMinutes) => ({
  top: ((Math.max(startMinutes, DAY_START) - DAY_START) / 60) * HOUR_HEIGHT,
  height: Math.max(22, ((Math.min(endMinutes, DAY_END) - Math.max(startMinutes, DAY_START)) / 60) * HOUR_HEIGHT - 2),
});

export const assignLanes = (items) => {
  const sorted = [...items].sort((a, b) => a.startMinutes - b.startMinutes);
  const laneEnds = [];
  const placed = sorted.map((item) => {
    const free = laneEnds.findIndex((end) => end <= item.startMinutes);
    const lane = free === -1 ? laneEnds.length : free;
    laneEnds[lane] = item.endMinutes;
    return { ...item, lane };
  });
  return placed.map((item) => ({
    ...item,
    lanes: Math.max(1, ...placed.filter((other) => other.startMinutes < item.endMinutes && other.endMinutes > item.startMinutes).map((other) => other.lane + 1)),
  }));
};
