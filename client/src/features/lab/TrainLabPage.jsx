import { useState } from 'react';
import { GraduationCap, MessageSquareReply, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Button } from '../../components/Button.jsx';
import { Toggle } from '../../components/Toggle.jsx';
import { TagInput } from '../../components/TagInput.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { CategoryBadge, PriorityBadge } from '../../components/Badges.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { RuleEditor } from './RuleEditor.jsx';
import { TemplateEditor } from './TemplateEditor.jsx';
import { TestBench } from './TestBench.jsx';

const TABS = [
  { value: 'rules', label: 'Rules' },
  { value: 'replies', label: 'Auto-replies' },
  { value: 'people', label: 'People' },
  { value: 'test', label: 'Try it' },
];

const describeCondition = (condition) => `${condition.field} ${condition.operator} “${condition.value}”`;

const Row = ({ title, detail, children, enabled, onToggle, onEdit, onDelete, label }) => (
  <li className={`row ${enabled ? '' : 'is-disabled'}`}>
    <div className="row__main">
      <strong>{title}</strong>
      {detail && <span className="row__detail">{detail}</span>}
      {children}
    </div>
    <div className="row__actions">
      <Toggle checked={enabled} onChange={onToggle} label={<span className="sr-only">{label} enabled</span>} />
      <button className="icon-btn" aria-label={`Edit ${label}`} onClick={onEdit}><Pencil size={15} /></button>
      <button className="icon-btn" aria-label={`Delete ${label}`} onClick={onDelete}><Trash2 size={15} /></button>
    </div>
  </li>
);

export const TrainLabPage = () => {
  const { settings, update } = useSettings();
  const [tab, setTab] = useState('rules');
  const rules = useResource('/rules', { refreshOn: ['rules.'] });
  const templates = useResource('/templates', { refreshOn: ['templates.'] });
  const [editingRule, setEditingRule] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const templateName = (id) => templates.data?.find((template) => template.id === id)?.name;
  const version = `${rules.data?.map((rule) => `${rule.id}${rule.enabled}`).join()}${settings?.vipSenders?.join()}${settings?.blockedSenders?.join()}`;

  const saveRule = async (rule, patch) => { await api.put(`/rules/${rule.id}`, { ...rule, ...patch }); rules.reload(); };
  const deleteRule = async (rule) => { if (window.confirm(`Delete “${rule.name}”?`)) { await api.delete(`/rules/${rule.id}`); rules.reload(); } };
  const saveTemplate = async (template, patch) => { await api.put(`/templates/${template.id}`, { ...template, ...patch }); templates.reload(); };
  const deleteTemplate = async (template) => { if (window.confirm(`Delete “${template.name}”?`)) { await api.delete(`/templates/${template.id}`); templates.reload(); } };

  if (!settings) return null;

  const action = {
    rules: <Button variant="primary" icon={Plus} onClick={() => setEditingRule({})}>New rule</Button>,
    replies: <Button variant="primary" icon={Plus} onClick={() => setEditingTemplate({})}>New reply</Button>,
  }[tab];

  return (
    <div className="page page--narrow">
      <PageHeader title="Train Lab" actions={action} />
      <Segmented label="Section" value={tab} onChange={setTab} options={TABS} />

      {tab === 'rules' && (
        rules.data?.length === 0
          ? <EmptyState icon={GraduationCap} title="No rules yet" />
          : <ul className="rows">
              {rules.data?.map((rule) => (
                <Row
                  key={rule.id}
                  label="rule"
                  title={rule.name}
                  detail={`When ${rule.conditions.map(describeCondition).join(rule.match === 'any' ? ' or ' : ' and ')}`}
                  enabled={rule.enabled}
                  onToggle={() => saveRule(rule, { enabled: !rule.enabled })}
                  onEdit={() => setEditingRule(rule)}
                  onDelete={() => deleteRule(rule)}
                >
                  <span className="row__tags">
                    {rule.actions.priority && <PriorityBadge priority={rule.actions.priority} />}
                    {rule.actions.category && <CategoryBadge category={rule.actions.category} />}
                    {rule.actions.autoReplyTemplateId && <span className="tag tag--accent"><MessageSquareReply size={12} /> {templateName(rule.actions.autoReplyTemplateId) ?? 'Auto-reply'}</span>}
                  </span>
                </Row>
              ))}
            </ul>
      )}

      {tab === 'replies' && (
        <>
          <div className="panel">
            <Toggle checked={settings.autoReply.enabled} onChange={(enabled) => update({ autoReply: { enabled } })} label="Send auto-replies" />
          </div>
          <ul className="rows">
            {templates.data?.map((template) => (
              <Row
                key={template.id}
                label="reply"
                title={template.name}
                detail={template.body}
                enabled={template.enabled}
                onToggle={() => saveTemplate(template, { enabled: !template.enabled })}
                onEdit={() => setEditingTemplate(template)}
                onDelete={() => deleteTemplate(template)}
              />
            ))}
          </ul>
        </>
      )}

      {tab === 'people' && (
        <div className="panel form">
          <div className="field">
            <span className="field__label">VIP — always more important</span>
            <TagInput values={settings.vipSenders} onChange={(vipSenders) => update({ vipSenders })} placeholder="Add a name" />
          </div>
          <div className="field">
            <span className="field__label">Blocked — always noise</span>
            <TagInput values={settings.blockedSenders} onChange={(blockedSenders) => update({ blockedSenders })} placeholder="Add a name or address" />
          </div>
        </div>
      )}

      {tab === 'test' && <div className="panel"><TestBench version={version} /></div>}

      {editingRule && <RuleEditor initial={editingRule} onClose={() => setEditingRule(null)} onSaved={() => rules.reload()} />}
      {editingTemplate && <TemplateEditor initial={editingTemplate} onClose={() => { setEditingTemplate(null); templates.reload(); }} />}
    </div>
  );
};
