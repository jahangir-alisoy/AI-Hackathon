import { useEffect, useState } from 'react';
import { CategoryBadge, PriorityBadge, Tag } from '../../components/Badges.jsx';
import { Field, Input, Select, Textarea } from '../../components/Fields.jsx';
import { api } from '../../lib/api.js';
import { REASON_LABELS } from '../../lib/vocabulary.js';

export const TestBench = ({ version }) => {
  const [sample, setSample] = useState({ channel: 'slack', from: 'Dilnoza Rashidova', handle: '', subject: '', body: 'Can we finalise the Davr Bank rebranding window today?' });
  const [result, setResult] = useState(null);
  const set = (key) => (event) => setSample({ ...sample, [key]: event.target.value });

  useEffect(() => {
    const timer = setTimeout(() => {
      api.post('/rules/test', sample).then(setResult).catch(() => setResult(null));
    }, 250);
    return () => clearTimeout(timer);
  }, [sample, version]);

  return (
    <div className="bench">
      <div className="form">
        <div className="form__row">
          <Field label="Channel"><Select value={sample.channel} onChange={set('channel')} options={[{ value: 'slack', label: 'Slack' }, { value: 'email', label: 'Email' }, { value: 'system', label: 'System' }]} /></Field>
          <Field label="From"><Input value={sample.from} onChange={set('from')} /></Field>
        </div>
        <div className="form__row">
          <Field label="Sender address"><Input value={sample.handle} onChange={set('handle')} placeholder="optional, e.g. alerts@unknown.net" /></Field>
          <Field label="Subject"><Input value={sample.subject} onChange={set('subject')} /></Field>
        </div>
        <Field label="Message"><Textarea rows={4} value={sample.body} onChange={set('body')} /></Field>
      </div>
      <div className="bench__result" aria-live="polite">
        <span className="muted small">StandIn would rank it</span>
        {result && (
          <>
            <div className="classification__verdict">
              <PriorityBadge priority={result.priority} />
              <CategoryBadge category={result.category} />
              {result.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
            </div>
            <ul className="reasons">
              {result.reasons.map((reason, index) => (
                <li key={index} className={`reason reason--${reason.source}`}>
                  <span className="reason__source">{REASON_LABELS[reason.source]}</span>
                  <span>{reason.text}</span>
                </li>
              ))}
            </ul>
            {result.autoReplyTemplateId && <p className="small">Would trigger an auto-reply.</p>}
          </>
        )}
      </div>
    </div>
  );
};
