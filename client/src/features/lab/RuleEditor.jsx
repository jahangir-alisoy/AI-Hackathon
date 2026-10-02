import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';
import { Field, Input, Select } from '../../components/Fields.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { useToast } from '../../lib/ToastContext.jsx';
import { CATEGORIES, PRIORITIES, PRIORITY_LABELS } from '../../lib/vocabulary.js';

const FIELD_LABELS = { any: 'Anything', sender: 'Sender', subject: 'Subject', body: 'Message text', channel: 'Channel', category: 'Category (as ranked)', priority: 'Priority (as ranked)' };
const OPERATOR_LABELS = { contains: 'contains', equals: 'is', startsWith: 'starts with', regex: 'matches regex' };

const EMPTY_RULE = {
  name: '',
  match: 'all',
  enabled: true,
  conditions: [{ field: 'any', operator: 'contains', value: '' }],
  actions: { priority: '', category: '', tag: '', autoReplyTemplateId: '' },
};

export const RuleEditor = ({ initial, onClose, onSaved }) => {
  const notify = useToast();
  const templates = useResource('/templates');
  const [rule, setRule] = useState({ ...EMPTY_RULE, ...initial, actions: { ...EMPTY_RULE.actions, ...initial?.actions } });
  const [error, setError] = useState(null);

  const setCondition = (index, patch) => setRule({ ...rule, conditions: rule.conditions.map((condition, i) => (i === index ? { ...condition, ...patch } : condition)) });
  const setAction = (patch) => setRule({ ...rule, actions: { ...rule.actions, ...patch } });

  const save = async () => {
    setError(null);
    const payload = {
      ...rule,
      actions: Object.fromEntries(Object.entries(rule.actions).map(([key, value]) => [key, value || null])),
    };
    try {
      const saved = rule.id ? await api.put(`/rules/${rule.id}`, payload) : await api.post('/rules', payload);
      notify({ tone: 'success', title: rule.id ? 'Rule updated' : 'StandIn learned a new rule', text: 'All messages were re-ranked.' });
      onSaved?.(saved);
      onClose();
    } catch (failure) {
      setError(failure.message);
    }
  };

  return (
    <Modal
      wide
      title={rule.id ? 'Edit rule' : 'Teach StandIn a rule'}
      onClose={onClose}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save rule</Button>
        </>
      )}
    >
      <div className="form">
        <Field label="Rule name"><Input value={rule.name} onChange={(event) => setRule({ ...rule, name: event.target.value })} placeholder="e.g. Davr Bank is always urgent" /></Field>
        <div className="rule-section">
          <div className="rule-section__head">
            <strong>When a message matches</strong>
            <Segmented label="Match" value={rule.match} onChange={(match) => setRule({ ...rule, match })} options={[{ value: 'all', label: 'all conditions' }, { value: 'any', label: 'any condition' }]} />
          </div>
          {rule.conditions.map((condition, index) => (
            <div key={index} className="condition">
              <Select aria-label="Field" value={condition.field} onChange={(event) => setCondition(index, { field: event.target.value })} options={Object.entries(FIELD_LABELS).map(([value, label]) => ({ value, label }))} />
              <Select aria-label="Operator" value={condition.operator} onChange={(event) => setCondition(index, { operator: event.target.value })} options={Object.entries(OPERATOR_LABELS).map(([value, label]) => ({ value, label }))} />
              <Input aria-label="Value" value={condition.value} onChange={(event) => setCondition(index, { value: event.target.value })} placeholder="value" />
              <button className="icon-btn" aria-label="Remove condition" disabled={rule.conditions.length === 1} onClick={() => setRule({ ...rule, conditions: rule.conditions.filter((_, i) => i !== index) })}><X size={16} /></button>
            </div>
          ))}
          <Button size="sm" variant="ghost" icon={Plus} onClick={() => setRule({ ...rule, conditions: [...rule.conditions, { field: 'any', operator: 'contains', value: '' }] })}>Add condition</Button>
        </div>
        <div className="rule-section">
          <div className="rule-section__head"><strong>Then</strong></div>
          <div className="form__row form__row--4">
            <Field label="Set priority"><Select value={rule.actions.priority ?? ''} onChange={(event) => setAction({ priority: event.target.value })} options={[{ value: '', label: 'Keep' }, ...PRIORITIES.map((value) => ({ value, label: PRIORITY_LABELS[value] }))]} /></Field>
            <Field label="Set category"><Select value={rule.actions.category ?? ''} onChange={(event) => setAction({ category: event.target.value })} options={[{ value: '', label: 'Keep' }, ...CATEGORIES]} /></Field>
            <Field label="Add tag"><Input value={rule.actions.tag ?? ''} onChange={(event) => setAction({ tag: event.target.value })} placeholder="optional" /></Field>
            <Field label="Auto-reply with"><Select value={rule.actions.autoReplyTemplateId ?? ''} onChange={(event) => setAction({ autoReplyTemplateId: event.target.value })} options={[{ value: '', label: 'No auto-reply' }, ...(templates.data ?? []).map((template) => ({ value: template.id, label: template.name }))]} /></Field>
          </div>
        </div>
        {error && <p className="form__error">{error}</p>}
      </div>
    </Modal>
  );
};
