import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Button } from '../../components/Button.jsx';
import { Field, Input } from '../../components/Fields.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { Toggle } from '../../components/Toggle.jsx';
import { api } from '../../lib/api.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { useToast } from '../../lib/ToastContext.jsx';

const Section = ({ title, children }) => (
  <section className="settings-section">
    <h2>{title}</h2>
    <div className="settings-section__body">{children}</div>
  </section>
);

export const SettingsPage = () => {
  const { settings, update, reload } = useSettings();
  const notify = useToast();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (settings) setProfile({ ceoName: settings.ceoName, assistantName: settings.assistantName, company: settings.company, scenarioTime: settings.scenarioTime });
  }, [settings?.ceoName, settings?.assistantName, settings?.company, settings?.scenarioTime]);

  if (!settings || !profile) return null;
  const claude = settings.integrations?.claude?.connected;
  const changed = ['ceoName', 'assistantName', 'company'].some((key) => profile[key] !== settings[key]);

  const save = async (patch) => {
    try {
      await update(patch);
      notify({ tone: 'success', title: 'Saved' });
    } catch (error) {
      notify({ tone: 'urgent', title: 'Could not save', text: error.message });
    }
  };

  const reset = async () => {
    if (!window.confirm('Reset all data to the scenario?')) return;
    await api.post('/admin/reset');
    await reload();
    notify({ tone: 'success', title: 'Demo data restored' });
  };

  return (
    <div className="page page--narrow">
      <PageHeader title="Settings" />

      <Section title="Profile">
        <div className="form__row">
          <Field label="Your name"><Input value={profile.ceoName} onChange={(event) => setProfile({ ...profile, ceoName: event.target.value })} /></Field>
          <Field label="Assistant name"><Input value={profile.assistantName} onChange={(event) => setProfile({ ...profile, assistantName: event.target.value })} /></Field>
        </div>
        <Field label="Company"><Input value={profile.company} onChange={(event) => setProfile({ ...profile, company: event.target.value })} /></Field>
        {changed && <div><Button variant="primary" onClick={() => save({ ceoName: profile.ceoName, assistantName: profile.assistantName, company: profile.company })}>Save</Button></div>}
      </Section>

      <Section title="Appearance">
        <Segmented
          label="Theme"
          value={settings.theme}
          onChange={(theme) => update({ theme })}
          options={[{ value: 'system', label: 'System', icon: Monitor }, { value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }]}
        />
      </Section>

      <Section title="Automation">
        <Toggle checked={settings.autoReply.enabled} onChange={(enabled) => update({ autoReply: { enabled } })} label="Auto-replies" />
        <Toggle checked={claude && settings.ai.useClaude} onChange={(useClaude) => update({ ai: { useClaude, classifyNewMessages: useClaude } })} label="Use Claude" description={claude ? null : 'Add ANTHROPIC_API_KEY to .env to enable'} disabled={!claude} />
      </Section>

      <Section title="Demo">
        <Field label="Briefings time">
          <Input type="time" value={profile.scenarioTime} onChange={(event) => setProfile({ ...profile, scenarioTime: event.target.value })} onBlur={() => profile.scenarioTime !== settings.scenarioTime && save({ scenarioTime: profile.scenarioTime })} />
        </Field>
        <div><Button variant="danger" onClick={reset}>Reset demo data</Button></div>
      </Section>
    </div>
  );
};
