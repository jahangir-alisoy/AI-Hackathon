export const toMinutes = (clock) => {
  const [hours, minutes] = clock.split(':').map(Number);
  return hours * 60 + minutes;
};

export const fromMinutes = (total) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

export const normalizeClock = (clock) => {
  const [hours, minutes] = clock.split(':').map(Number);
  const businessHours = hours < 7 ? hours + 12 : hours;
  return fromMinutes(businessHours * 60 + minutes);
};

export const fromMeridiem = (hour, minute, meridiem) => {
  const base = Number(hour) % 12;
  const hours = meridiem.toLowerCase() === 'pm' ? base + 12 : base;
  return fromMinutes(hours * 60 + Number(minute || 0));
};

export const minutesBetween = (from, to) => toMinutes(to) - toMinutes(from);

export const isAtOrBefore = (clock, limit) => toMinutes(clock) <= toMinutes(limit);

export const isValidClock = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value ?? '');
