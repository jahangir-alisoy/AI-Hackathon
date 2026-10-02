import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Field, Input } from '../../components/Fields.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { Toggle } from '../../components/Toggle.jsx';
import { api } from '../../lib/api.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { useToast } from '../../lib/ToastContext.jsx';

const Status = ({ connected, label }) => <span className={`status ${connected ? 'status--on' : ''}`}><span className="status__dot" />{label}</span>;

export const SettingsPage = () => {
  const { settings, update, reload } = useSettings();
  const notify = useToast();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (settings) setProfile({ ceoName: settings.ceoName, assistantName: settings.assistantName, company: settings.company, scenarioTime: settings.scenarioTime });
  }, [settings?.ceoName, settings?.assistantName, settings?.company, settings?.scenarioTime]);

  if (!settings || !profile) return null;
  const integrations = settings.integrations ?? {};
  const webhook = `${window.location.origin}/api/integrations/slack/events`;

  const save = async (patch) => {
    try {
      await update(patch);
      notify({ tone: 'success', title: 'Saved' });
    } catch (error) {
      notify({ tone: 'urgent', title: 'Could not save', text: error.message });
    }
  };

  const reset = async () => {
    if (!window.confirm('Reset all messages, rules, templates and events to the scenario data?')) return;
    await api.post('/admin/reset');
    await reload();
    notify({ tone: 'success', title: 'Demo data restored' });
  };

  return (
    <div className="page page--narrow">
      <PageHeader title="Settings" />

      <Card title="Profile">
        <div className="form">
          <div className="form__row">
            <Field label="Your name"><Input value={profile.ceoName} onChange={(event) => setProfile({ ...profile, ceoName: event.target.value })} /></Field>
            <Field label="Assistant name"><Input value={profile.assistantName} onChange={(event) => setProfile({ ...profile, assistantName: event.target.value })} /></Field>
          </div>
          <Field label="Company"><Input value={profile.company} onChange={(event) => setProfile({ ...profile, company: event.target.value })} /></Field>
          <div><Button variant="primary" onClick={() => save({ ceoName: profile.ceoName, assistantName: profile.assistantName, company: profile.company })}>Save profile</Button></div>
        </div>
      </Card>

      <Card title="Appearance">
        <Segmented
          label="Theme"
          value={settings.theme}
          onChange={(theme) => update({ theme })}
          options={[{ value: 'system', label: 'System', icon: Monitor }, { value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }]}
        />
      </Card>

      <Card title="AI & automation">
        <div className="form">
          <Toggle checked={settings.ai.useClaude} onChange={(useClaude) => update({ ai: { useClaude } })} label="Use Claude when available" description="For drafting replies and ranking new messages. Built-in functions are used otherwise." disabled={!integrations.claude?.connected} />
          <Toggle checked={settings.ai.classifyNewMessages} onChange={(classifyNewMessages) => update({ ai: { classifyNewMessages } })} label="Rank new messages with Claude" disabled={!integrations.claude?.connected} />
          <Toggle checked={settings.autoReply.enabled} onChange={(enabled) => update({ autoReply: { enabled } })} label="Send auto-replies" description="Rules in the Train Lab can answer messages automatically with your templates." />
        </div>
      </Card>

      <Card title="Connections">
        <ul className="integrations">
          <li>
            <div><strong>Claude</strong><p className="muted small">{integrations.claude?.connected ? `Connected · ${integrations.claude.model}` : 'Set ANTHROPIC_API_KEY on the server and restart.'}</p></div>
            <Status connected={integrations.claude?.connected} label={integrations.claude?.connected ? 'Connected' : 'Not configured'} />
          </li>
          <li>
            <div>
              <strong>Slack</strong>
              <p className="muted small">{integrations.slack?.detail}</p>
              <p className="muted small">Events URL: <code>{webhook}</code> · needs SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN and a public URL.</p>
            </div>
            <Status connected={integrations.slack?.connected} label={integrations.slack?.connected ? 'Live' : 'Simulated'} />
          </li>
          <li>
            <div><strong>Email</strong><p className="muted small">{integrations.email?.detail}</p></div>
            <Status connected={integrations.email?.connected} label="Simulated" />
          </li>
          <li>
            <div><strong>System notifications</strong><p className="muted small">{integrations.system?.detail}</p></div>
            <Status connected label="Local" />
          </li>
        </ul>
      </Card>

      <Card title="Scenario & data">
        <div className="form">
          <Field label="Briefings as of" hint="Simulated clock used by the Briefings page.">
            <Input type="time" value={profile.scenarioTime} onChange={(event) => setProfile({ ...profile, scenarioTime: event.target.value })} onBlur={() => save({ scenarioTime: profile.scenarioTime })} />
          </Field>
          <p className="muted small">Times are shown in {settings.timeZone}.</p>
          <div><Button variant="danger" onClick={reset}>Reset demo data</Button></div>
        </div>
      </Card>
    </div>
  );
};
