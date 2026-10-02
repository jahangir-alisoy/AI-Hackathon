import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';
import { Field, Input, Textarea } from '../../components/Fields.jsx';
import { api } from '../../lib/api.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { minutesToClock, zoned } from '../../lib/format.js';
import { toIsoInZone } from './calendarMath.js';

export const EventModal = ({ event, onClose }) => {
  const { timeZone } = useSettings();
  const start = zoned(event.start, timeZone);
  const end = zoned(event.end, timeZone);
  const [form, setForm] = useState({
    title: event.title ?? '',
    date: start.dateKey,
    startClock: minutesToClock(start.minutes),
    endClock: minutesToClock(end.minutes),
    location: event.location ?? '',
    attendees: (event.attendees ?? []).join(', '),
    notes: event.notes ?? '',
  });
  const [error, setError] = useState(null);
  const set = (key) => (change) => setForm({ ...form, [key]: change.target.value });

  const save = async () => {
    const payload = {
      title: form.title,
      start: toIsoInZone(form.date, form.startClock, timeZone),
      end: toIsoInZone(form.date, form.endClock, timeZone),
      location: form.location,
      attendees: form.attendees.split(',').map((name) => name.trim()).filter(Boolean),
      notes: form.notes,
    };
    try {
      if (event.id) await api.put(`/calendar/events/${event.id}`, payload);
      else await api.post('/calendar/events', payload);
      onClose();
    } catch (failure) {
      setError(failure.message);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${event.title}”?`)) return;
    await api.delete(`/calendar/events/${event.id}`);
    onClose();
  };

  return (
    <Modal
      title={event.id ? 'Edit event' : 'New event'}
      onClose={onClose}
      footer={(
        <>
          {event.id ? <Button variant="ghost" icon={Trash2} onClick={remove}>Delete</Button> : <span />}
          <span className="modal__footer-right">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save}>Save</Button>
          </span>
        </>
      )}
    >
      <div className="form">
        <Field label="Title"><Input value={form.title} onChange={set('title')} autoFocus /></Field>
        <div className="form__row form__row--3">
          <Field label="Date"><Input type="date" value={form.date} onChange={set('date')} /></Field>
          <Field label="Start"><Input type="time" value={form.startClock} onChange={set('startClock')} /></Field>
          <Field label="End"><Input type="time" value={form.endClock} onChange={set('endClock')} /></Field>
        </div>
        <div className="form__row">
          <Field label="Location"><Input value={form.location} onChange={set('location')} /></Field>
          <Field label="Attendees" hint="Comma separated"><Input value={form.attendees} onChange={set('attendees')} /></Field>
        </div>
        <Field label="Notes"><Textarea rows={3} value={form.notes} onChange={set('notes')} /></Field>
        {event.status && event.id && <p className="muted small">Status: {event.status}</p>}
        {error && <p className="form__error">{error}</p>}
      </div>
    </Modal>
  );
};
