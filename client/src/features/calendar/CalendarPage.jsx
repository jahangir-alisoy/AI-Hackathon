import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Button } from '../../components/Button.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { ChannelIcon } from '../../components/Badges.jsx';
import { useResource } from '../../lib/useResource.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { CHANNELS } from '../../lib/vocabulary.js';
import { minutesToClock, zoned } from '../../lib/format.js';
import { DAY_END, DAY_START, HOUR_HEIGHT, assignLanes, dayLabel, position, shiftDays, todayKey, toIsoInZone, weekDays } from './calendarMath.js';
import { EventModal } from './EventModal.jsx';

const SOURCES = ['events', 'slack', 'email', 'system'];
const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, index) => DAY_START + index * 60);

const PILL_HEIGHT = 22;

const stackMessages = (messages, laneCount) => {
  const laneBottoms = Array(laneCount).fill(-Infinity);
  return [...messages].sort((a, b) => a.startMinutes - b.startMinutes).map((message) => {
    const top = position(message.startMinutes, message.startMinutes + 10).top;
    const free = laneBottoms.findIndex((bottom) => bottom <= top);
    const lane = free === -1 ? laneBottoms.indexOf(Math.min(...laneBottoms)) : free;
    laneBottoms[lane] = top + PILL_HEIGHT;
    return { ...message, top, lane };
  });
};

const DayColumn = ({ dateKey, items, nowMinutes, isToday, wide, onEvent, onMessage, onEmpty }) => {
  const events = assignLanes(items.filter((item) => item.kind === 'event'));
  const messageLanes = wide ? 3 : 1;
  const messages = stackMessages(items.filter((item) => item.kind === 'message'), messageLanes);
  const eventArea = wide ? 'calc(100% - 300px)' : 'calc(100% - 26px)';
  return (
    <div
      className="cal-day"
      style={{ height: ((DAY_END - DAY_START) / 60) * HOUR_HEIGHT }}
      onDoubleClick={(click) => {
        if (click.target !== click.currentTarget) return;
        const minutes = DAY_START + Math.floor((click.nativeEvent.offsetY / HOUR_HEIGHT) * 2) * 30;
        onEmpty(dateKey, minutes);
      }}
    >
      {HOURS.map((hour) => <div key={hour} className="cal-day__line" style={{ top: ((hour - DAY_START) / 60) * HOUR_HEIGHT }} />)}
      {isToday && nowMinutes >= DAY_START && nowMinutes <= DAY_END && <div className="cal-now" style={{ top: ((nowMinutes - DAY_START) / 60) * HOUR_HEIGHT }} />}
      {events.map((event) => (
        <button
          key={event.id}
          className={`cal-event ${event.movedFrom ? 'cal-event--moved' : ''} ${event.endMinutes - event.startMinutes < 45 ? 'cal-event--short' : ''}`}
          style={{ ...position(event.startMinutes, event.endMinutes), left: `calc(${eventArea} * ${event.lane / event.lanes} + 4px)`, width: `calc(${eventArea} / ${event.lanes} - 6px)` }}
          onClick={() => onEvent(event)}
          title={event.title}
        >
          <strong>{event.title}</strong>
          <span>{minutesToClock(event.startMinutes)}–{minutesToClock(event.endMinutes)}{event.location ? ` · ${event.location}` : ''}</span>
        </button>
      ))}
      {messages.map((message) => (
        <button
          key={message.id}
          className={`cal-message cal-message--${message.source} cal-message--${message.priority} ${wide ? 'cal-message--pill' : ''}`}
          style={wide ? { top: message.top, right: 4 + (messageLanes - 1 - message.lane) * 98 } : { top: message.top }}
          onClick={() => onMessage(message)}
          title={`${message.from}: ${message.title}`}
          aria-label={`${CHANNELS[message.source].label} from ${message.from}: ${message.title}`}
        >
          <ChannelIcon channel={message.source} size={11} />
          {wide && <span>{message.from.split(' ')[0]}</span>}
        </button>
      ))}
    </div>
  );
};

export const CalendarPage = () => {
  const { timeZone } = useSettings();
  const navigate = useNavigate();
  const [view, setView] = useState('day');
  const [dateKey, setDateKey] = useState(() => todayKey(timeZone));
  const [sources, setSources] = useState(['events', 'slack', 'email']);
  const [editing, setEditing] = useState(null);
  const feed = useResource(`/calendar/feed?sources=${SOURCES.join(',')}`, { refreshOn: ['event.', 'message.'] });

  const days = view === 'day' ? [dateKey] : weekDays(dateKey);
  const nowZoned = zoned(new Date().toISOString(), timeZone);
  const byDay = useMemo(() => {
    const grouped = Object.fromEntries(days.map((day) => [day, []]));
    for (const item of feed.data?.items ?? []) {
      if (!sources.includes(item.source)) continue;
      const start = zoned(item.start, timeZone);
      if (!grouped[start.dateKey]) continue;
      grouped[start.dateKey].push({ ...item, startMinutes: start.minutes, endMinutes: item.end ? zoned(item.end, timeZone).minutes : start.minutes });
    }
    return grouped;
  }, [feed.data, sources, days.join(), timeZone]);

  const toggleSource = (source) => setSources(sources.includes(source) ? sources.filter((item) => item !== source) : [...sources, source]);
  const newEvent = (day = dateKey, minutes = 9 * 60) => setEditing({
    title: '',
    start: toIsoInZone(day, minutesToClock(minutes), timeZone),
    end: toIsoInZone(day, minutesToClock(minutes + 30), timeZone),
  });
  const title = view === 'day' ? dayLabel(dateKey, { weekday: 'long', month: 'long', day: 'numeric' }) : `${dayLabel(days[0], { month: 'short', day: 'numeric' })} – ${dayLabel(days[6], { month: 'short', day: 'numeric' })}`;

  return (
    <div className="page page--wide">
      <PageHeader title="Calendar" actions={<Button variant="primary" icon={Plus} onClick={() => newEvent()}>New event</Button>} />
      <div className="cal-toolbar">
        <div className="cal-nav">
          <Button size="sm" onClick={() => setDateKey(todayKey(timeZone))}>Today</Button>
          <button className="icon-btn" aria-label="Previous" onClick={() => setDateKey(shiftDays(dateKey, view === 'day' ? -1 : -7))}><ChevronLeft size={18} /></button>
          <button className="icon-btn" aria-label="Next" onClick={() => setDateKey(shiftDays(dateKey, view === 'day' ? 1 : 7))}><ChevronRight size={18} /></button>
          <h2 className="cal-title">{title}</h2>
        </div>
        <div className="cal-filters" role="group" aria-label="Show sources">
          {SOURCES.map((source) => (
            <button key={source} className={`source-toggle source-toggle--${source} ${sources.includes(source) ? 'is-on' : ''}`} onClick={() => toggleSource(source)} aria-pressed={sources.includes(source)}>
              <ChannelIcon channel={source} size={13} /> {CHANNELS[source].label}
            </button>
          ))}
        </div>
        <Segmented label="View" value={view} onChange={setView} options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]} />
      </div>

      <div className={`cal cal--${view}`}>
        <div className="cal__head">
          <div className="cal__gutter" />
          {days.map((day) => (
            <div key={day} className={`cal__day-head ${day === nowZoned.dateKey ? 'is-today' : ''}`}>{dayLabel(day)}</div>
          ))}
        </div>
        <div className="cal__body">
          <div className="cal__gutter">
            {HOURS.map((hour) => <span key={hour} style={{ top: ((hour - DAY_START) / 60) * HOUR_HEIGHT }}>{minutesToClock(hour)}</span>)}
          </div>
          {days.map((day) => (
            <DayColumn
              key={day}
              dateKey={day}
              items={byDay[day] ?? []}
              isToday={day === nowZoned.dateKey}
              wide={view === 'day'}
              nowMinutes={nowZoned.minutes}
              onEvent={setEditing}
              onMessage={(message) => navigate(`/inbox/${message.source}/${message.id}`)}
              onEmpty={newEvent}
            />
          ))}
        </div>
      </div>

      {editing && <EventModal event={editing} onClose={() => setEditing(null)} />}
    </div>
  );
};
