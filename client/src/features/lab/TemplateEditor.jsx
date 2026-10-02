import { useState } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';
import { Field, Input, Select, Textarea } from '../../components/Fields.jsx';
import { api } from '../../lib/api.js';

export const TemplateEditor = ({ initial, onClose }) => {
  const [template, setTemplate] = useState({ name: '', channel: 'any', body: '', enabled: true, ...initial });
  const [error, setError] = useState(null);
  const set = (key) => (event) => setTemplate({ ...template, [key]: event.target.value });

  const save = async () => {
    try {
      if (template.id) await api.put(`/templates/${template.id}`, template);
      else await api.post('/templates', template);
      onClose();
    } catch (failure) {
      setError(failure.message);
    }
  };

  return (
    <Modal
      title={template.id ? 'Edit reply' : 'New reply'}
      onClose={onClose}
      footer={(<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save</Button></>)}
    >
      <div className="form">
        <div className="form__row">
          <Field label="Name"><Input value={template.name} onChange={set('name')} /></Field>
          <Field label="Channel"><Select value={template.channel} onChange={set('channel')} options={[{ value: 'any', label: 'Any channel' }, { value: 'slack', label: 'Slack only' }, { value: 'email', label: 'Email only' }]} /></Field>
        </div>
        <Field label="Message" hint="Use {{firstName}} for the sender’s name">
          <Textarea rows={6} value={template.body} onChange={set('body')} />
        </Field>
        {error && <p className="form__error">{error}</p>}
      </div>
    </Modal>
  );
};
