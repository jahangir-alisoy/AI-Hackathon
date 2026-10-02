import { Sources } from '../components/Sources.jsx';

const DAY_START = 8 * 60 + 30;
const DAY_END = 17 * 60;
const PX_PER_MIN = 1.4;
const minutes = (clock) => {
  const [h, m] = clock.split(':').map(Number);
  return h * 60 + m;
};

const assignLanes = (meetings) => {
  const laneEnds = [];
  return meetings.map((meeting) => {
    const lane = laneEnds.findIndex((end) => end <= minutes(meeting.start));
    const index = lane === -1 ? laneEnds.length : lane;
    laneEnds[index] = minutes(meeting.end);
    return { ...meeting, lane: index };
  });
};

const Timeline = ({ meetings, overlapIds }) => {
  const placed = assignLanes(meetings);
  const lanes = Math.max(1, ...placed.map((meeting) => meeting.lane + 1));
  const hours = [];
  for (let m = 9 * 60; m <= DAY_END; m += 60) hours.push(m);
  return (
    <div className="timeline" style={{ height: (DAY_END - DAY_START) * PX_PER_MIN }}>
      {hours.map((hour) => (
        <div key={hour} className="hour" style={{ top: (hour - DAY_START) * PX_PER_MIN }}>{`${hour / 60}:00`}</div>
      ))}
      {placed.map((meeting) => (
        <div
          key={meeting.id}
          className={`slot ${overlapIds.has(meeting.id) ? 'slot-overlap' : ''} ${meeting.movedFrom ? 'slot-moved' : ''}`}
          style={{
            top: (minutes(meeting.start) - DAY_START) * PX_PER_MIN,
            height: Math.max(18, (minutes(meeting.end) - minutes(meeting.start)) * PX_PER_MIN - 2),
            left: `calc(48px + ${(meeting.lane * 100) / lanes}% - ${(meeting.lane * 48) / lanes}px)`,
            width: `calc(${100 / lanes}% - ${48 / lanes}px - 4px)`,
          }}
          title={`${meeting.start}–${meeting.end} ${meeting.title}`}
        >
          <strong>{meeting.start}</strong> {meeting.title}
          {meeting.movedFrom && <em> (moved from {meeting.movedFrom})</em>}
        </div>
      ))}
    </div>
  );
};

export const CalendarView = ({ calendar }) => {
  const overlapIds = new Set(calendar.overlaps.flatMap((overlap) => [overlap.first.id, overlap.second.id]));
  return (
    <div className="calendar-layout">
      <section>
        <h2>Fixed calendar</h2>
        <Timeline meetings={calendar.meetings} overlapIds={overlapIds} />
      </section>
      <section className="stack">
        <div>
          <h2>What StandIn fixed</h2>
          <ul className="list">
            {calendar.changes.map((change) => (
              <li key={change.description} className="list-row column">
                <span>{change.description}</span>
                <Sources sources={change.sources} />
              </li>
            ))}
            {calendar.changes.length === 0 && <li className="muted">No changes yet.</li>}
          </ul>
        </div>
        <div>
          <h2>Overlaps → suggestions</h2>
          <ul className="list">
            {calendar.overlaps.map((overlap) => (
              <li key={`${overlap.first.id}-${overlap.second.id}`} className="list-row column">
                <span className="small muted">{overlap.first.start} {overlap.first.title} ⟷ {overlap.second.start} {overlap.second.title} · {overlap.minutes} min</span>
                <span>{overlap.suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
        {[...calendar.lateMeetings, ...calendar.shortenings].length > 0 && (
          <div>
            <h2>Rethink these</h2>
            <ul className="list">
              {[...calendar.lateMeetings, ...calendar.shortenings].map((item) => (
                <li key={item.suggestion} className="list-row column warn-row">
                  <span>{item.suggestion}</span>
                  <Sources sources={item.sources} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {calendar.piggybacks.length > 0 && (
          <div>
            <h2>Close it in a meeting you already have</h2>
            <ul className="list">
              {calendar.piggybacks.map((item) => <li key={item.suggestion} className="list-row">{item.suggestion}</li>)}
            </ul>
          </div>
        )}
        <div>
          <h2>Free slots</h2>
          <ul className="list">
            {calendar.gaps.map((gap) => (
              <li key={gap.start} className="list-row">
                <span><strong>{gap.start}–{gap.end}</strong> ({gap.minutes} min)</span>
                <span className="muted small">{gap.useFor.length ? `Use for: ${gap.useFor.join(', ')}` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};
