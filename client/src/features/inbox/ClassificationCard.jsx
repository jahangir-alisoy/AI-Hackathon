import { useState } from 'react';
import { Bot, Cpu, GraduationCap, RotateCcw, Sparkles, Star, User } from 'lucide-react';
import { CategoryBadge, PriorityBadge, Tag } from '../../components/Badges.jsx';
import { Button } from '../../components/Button.jsx';
import { Select } from '../../components/Fields.jsx';
import { CATEGORIES, PRIORITIES, PRIORITY_LABELS, REASON_LABELS } from '../../lib/vocabulary.js';
import { RuleEditor } from '../lab/RuleEditor.jsx';

const REASON_ICONS = { detector: Cpu, rule: GraduationCap, vip: Star, ai: Sparkles, ceo: User };

export const ClassificationCard = ({ message, onOverride, onReclassify, claudeReady }) => {
  const [teaching, setTeaching] = useState(false);
  const { classification, override } = message;

  return (
    <section className="classification">
      <header className="classification__header">
        <span className="classification__title"><Bot size={16} /> How StandIn ranked this</span>
        <span className="muted small">{classification.base?.engine === 'claude' ? 'Claude' : 'Functions'} + your rules</span>
      </header>
      <div className="classification__verdict">
        <PriorityBadge priority={classification.priority} />
        <CategoryBadge category={classification.category} />
        {classification.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
        {classification.deadline && <Tag>Deadline {classification.deadline}</Tag>}
      </div>
      <ul className="reasons">
        {classification.reasons.map((reason, index) => {
          const Icon = REASON_ICONS[reason.source] ?? Cpu;
          return (
            <li key={index} className={`reason reason--${reason.source}`}>
              <Icon size={14} aria-hidden="true" />
              <span className="reason__source">{REASON_LABELS[reason.source]}</span>
              <span>{reason.text}</span>
            </li>
          );
        })}
      </ul>
      <div className="classification__controls">
        <span className="small muted">Not right?</span>
        <Select
          aria-label="Set priority"
          value={override?.priority ?? ''}
          onChange={(event) => onOverride({ ...override, priority: event.target.value || null })}
          options={[{ value: '', label: 'Priority: automatic' }, ...PRIORITIES.map((value) => ({ value, label: `Priority: ${PRIORITY_LABELS[value]}` }))]}
        />
        <Select
          aria-label="Set category"
          value={override?.category ?? ''}
          onChange={(event) => onOverride({ ...override, category: event.target.value || null })}
          options={[{ value: '', label: 'Category: automatic' }, ...CATEGORIES.map((value) => ({ value, label: `Category: ${value}` }))]}
        />
        {override && <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => onOverride(null)}>Reset</Button>}
        <Button size="sm" variant="secondary" icon={GraduationCap} onClick={() => setTeaching(true)}>Teach StandIn</Button>
        {claudeReady && <Button size="sm" variant="ghost" icon={Sparkles} onClick={onReclassify}>Ask Claude</Button>}
      </div>
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
