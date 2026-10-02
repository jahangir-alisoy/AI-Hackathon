import { useState } from 'react';
import { GraduationCap, MessageSquareReply, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Toggle } from '../../components/Toggle.jsx';
import { TagInput } from '../../components/TagInput.jsx';
import { CategoryBadge, PriorityBadge } from '../../components/Badges.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { RuleEditor } from './RuleEditor.jsx';
import { TemplateEditor } from './TemplateEditor.jsx';
import { TestBench } from './TestBench.jsx';

const describeCondition = (condition) => `${condition.field} ${condition.operator} “${condition.value}”`;

export const TrainLabPage = () => {
  const { settings, update } = useSettings();
  const rules = useResource('/rules', { refreshOn: ['rules.'] });
  const templates = useResource('/templates', { refreshOn: ['templates.'] });
  const [editingRule, setEditingRule] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const templateName = (id) => templates.data?.find((template) => template.id === id)?.name;
  const version = `${rules.data?.map((rule) => `${rule.id}${rule.enabled}`).join()}${settings?.vipSenders?.join()}${settings?.blockedSenders?.join()}`;

  const toggleRule = async (rule) => {
    await api.put(`/rules/${rule.id}`, { ...rule, enabled: !rule.enabled });
    rules.reload();
  };
  const deleteRule = async (rule) => {
    if (!window.confirm(`Delete “${rule.name}”?`)) return;
    await api.delete(`/rules/${rule.id}`);
    rules.reload();
  };
  const toggleTemplate = async (template) => {
    await api.put(`/templates/${template.id}`, { ...template, enabled: !template.enabled });
    templates.reload();
  };
  const deleteTemplate = async (template) => {
    if (!window.confirm(`Delete “${template.name}”?`)) return;
    await api.delete(`/templates/${template.id}`);
    templates.reload();
  };

  if (!settings) return null;

  return (
    <div className="page">
      <PageHeader
        title="AI Train Lab"
        subtitle="StandIn ranks every message in three layers: built-in functions (or Claude), then your rules, then your manual corrections. Teach it here."
        actions={<Button variant="primary" icon={Plus} onClick={() => setEditingRule({})}>New rule</Button>}
      />

      <Card title="Try it" className="card--bench">
        <TestBench version={version} />
      </Card>

      <Card title="Your rules" action={<span className="muted small">Applied top to bottom; later rules win</span>}>
        {rules.data?.length === 0 && <EmptyState icon={GraduationCap} title="No rules yet" text="Open any message and press “Teach StandIn”." />}
        <ul className="rule-list">
          {rules.data?.map((rule) => (
            <li key={rule.id} className={`rule ${rule.enabled ? '' : 'is-disabled'}`}>
              <div className="rule__main">
                <strong>{rule.name}</strong>
                <span className="rule__when">When {rule.conditions.map(describeCondition).join(rule.match === 'any' ? ' or ' : ' and ')}</span>
                <span className="rule__then">
                  {rule.actions.priority && <PriorityBadge priority={rule.actions.priority} />}
                  {rule.actions.category && <CategoryBadge category={rule.actions.category} />}
                  {rule.actions.tag && <span className="tag">{rule.actions.tag}</span>}
                  {rule.actions.autoReplyTemplateId && <span className="tag tag--accent"><MessageSquareReply size={12} /> {templateName(rule.actions.autoReplyTemplateId) ?? 'auto-reply'}</span>}
                  <span className="muted small">{rule.hits ?? 0} hits</span>
                </span>
              </div>
              <div className="rule__actions">
                <Toggle checked={rule.enabled} onChange={() => toggleRule(rule)} label={<span className="sr-only">Enabled</span>} />
                <button className="icon-btn" aria-label="Edit rule" onClick={() => setEditingRule(rule)}><Pencil size={16} /></button>
                <button className="icon-btn" aria-label="Delete rule" onClick={() => deleteRule(rule)}><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="lab-grid">
        <Card title="Auto-replies" action={<Button size="sm" icon={Plus} onClick={() => setEditingTemplate({})}>New</Button>}>
          <Toggle
            checked={settings.autoReply.enabled}
            onChange={(enabled) => update({ autoReply: { enabled } })}
            label="Send auto-replies"
            description="When off, matching rules only log what they would have sent."
          />
          <ul className="template-list">
            {templates.data?.map((template) => (
              <li key={template.id} className={`template ${template.enabled ? '' : 'is-disabled'}`}>
                <div className="template__head">
                  <strong>{template.name}</strong>
                  <span className="muted small">{template.channel === 'any' ? 'Any channel' : template.channel}</span>
                  <div className="rule__actions">
                    <Toggle checked={template.enabled} onChange={() => toggleTemplate(template)} label={<span className="sr-only">Enabled</span>} />
                    <button className="icon-btn" aria-label="Edit template" onClick={() => setEditingTemplate(template)}><Pencil size={16} /></button>
                    <button className="icon-btn" aria-label="Delete template" onClick={() => deleteTemplate(template)}><Trash2 size={16} /></button>
                  </div>
                </div>
                <p className="template__body">{template.body}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="People">
          <div className="form">
            <div className="field">
              <span className="field__label">VIP senders</span>
              <TagInput values={settings.vipSenders} onChange={(vipSenders) => update({ vipSenders })} placeholder="Add a name and press Enter" />
              <span className="field__hint">Raised one level (up to High).</span>
            </div>
            <div className="field">
              <span className="field__label">Blocked senders</span>
              <TagInput values={settings.blockedSenders} onChange={(blockedSenders) => update({ blockedSenders })} placeholder="Name, address or domain" />
              <span className="field__hint">Always ranked Noise / Low.</span>
            </div>
            <Toggle
              checked={settings.ai.classifyNewMessages}
              onChange={(classifyNewMessages) => update({ ai: { classifyNewMessages } })}
              label="Use Claude for new messages"
              description={settings.integrations?.claude?.connected ? 'Claude ranks first; your rules still apply on top.' : 'Add ANTHROPIC_API_KEY to enable. Functions are used meanwhile.'}
              disabled={!settings.integrations?.claude?.connected}
            />
          </div>
        </Card>
      </div>

      {editingRule && <RuleEditor initial={editingRule} onClose={() => setEditingRule(null)} onSaved={() => rules.reload()} />}
      {editingTemplate && <TemplateEditor initial={editingTemplate} onClose={() => { setEditingTemplate(null); templates.reload(); }} />}
    </div>
  );
};
