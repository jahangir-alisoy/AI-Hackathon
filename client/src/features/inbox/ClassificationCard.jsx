import { useState } from 'react';
import { ChevronDown, GraduationCap, RotateCcw, Sparkles } from 'lucide-react';
import { CategoryBadge, PriorityBadge } from '../../components/Badges.jsx';
import { Button } from '../../components/Button.jsx';
import { Select } from '../../components/Fields.jsx';
import { CATEGORIES, PRIORITIES, PRIORITY_LABELS, REASON_LABELS } from '../../lib/vocabulary.js';
import { RuleEditor } from '../lab/RuleEditor.jsx';

const mainReason = (reasons) =>
  [...reasons].reverse().find((reason) => ['ceo', 'rule', 'ai'].includes(reason.source)) ?? reasons[0];

export const ClassificationCard = ({ message, onOverride, onReclassify, claudeReady }) => {
  const [open, setOpen] = useState(false);
  const [teaching, setTeaching] = useState(false);
  const { classification, override } = message;
  const reason = mainReason(classification.reasons);

  return (
    <section className={`verdict ${open ? 'is-open' : ''}`}>
      <button className="verdict__summary" onClick={() => setOpen(!open)} aria-expanded={open}>
        <PriorityBadge priority={classification.priority} />
        <CategoryBadge category={classification.category} />
        <span className="verdict__reason">{reason?.text}</span>
        <ChevronDown size={16} className="verdict__chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="verdict__details">
          <ul className="reasons">
            {classification.reasons.map((item, index) => (
              <li key={index} className={`reason reason--${item.source}`}>
                <span className="reason__source">{REASON_LABELS[item.source]}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
          <div className="verdict__controls">
            <Select
              aria-label="Priority"
              value={override?.priority ?? ''}
              onChange={(event) => onOverride({ ...override, priority: event.target.value || null })}
              options={[{ value: '', label: 'Priority: auto' }, ...PRIORITIES.map((value) => ({ value, label: PRIORITY_LABELS[value] }))]}
            />
            <Select
              aria-label="Category"
              value={override?.category ?? ''}
              onChange={(event) => onOverride({ ...override, category: event.target.value || null })}
              options={[{ value: '', label: 'Category: auto' }, ...CATEGORIES]}
            />
            {override && <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => onOverride(null)}>Reset</Button>}
            <span className="verdict__spacer" />
            {claudeReady && <Button size="sm" variant="ghost" icon={Sparkles} onClick={onReclassify}>Ask Claude</Button>}
            <Button size="sm" icon={GraduationCap} onClick={() => setTeaching(true)}>Make a rule</Button>
          </div>
        </div>
      )}
      {teaching && (
        <RuleEditor
          initial={{
            name: `Messages from ${message.from.name}`,
            match: 'all',
            conditions: [{ field: 'sender', operator: 'contains', value: message.from.handle?.includes('@') ? message.from.handle.split('@')[1] : message.from.name }],
            actions: { priority: override?.priority ?? classification.priority, category: override?.category ?? classification.category, tag: '', autoReplyTemplateId: '' },
            createdFrom: message.id,
          }}
          onClose={() => setTeaching(false)}
        />
      )}
    </section>
  );
};
