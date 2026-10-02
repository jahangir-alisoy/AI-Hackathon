import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Markdown } from '../../components/Markdown.jsx';
import { Textarea } from '../../components/Fields.jsx';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { useToast } from '../../lib/ToastContext.jsx';

const TYPES = [
  { value: 'caught', label: 'Caught for you' },
  { value: 'one-pager', label: 'Q3 one-pager' },
  { value: 'davr-kit', label: 'Davr call kit' },
  { value: 'press', label: 'Press response' },
  { value: 'briefing', label: 'Audio briefing' },
];

const Findings = ({ asOf }) => {
  const today = useResource(`/briefings/today?asOf=${asOf}`);
  return (
    <ul className="findings">
      {today.data?.findings.map((finding) => (
        <li key={`${finding.kind}-${finding.title}`} className={`finding finding--${finding.severity}`}>
          <strong>{finding.title}</strong>
          <p>{finding.detail}</p>
          <span className="finding__sources">{finding.sources.join(' · ')}</span>
        </li>
      ))}
    </ul>
  );
};

const Speaker = ({ text }) => {
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const toggle = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  };
  return <Button variant="primary" icon={playing ? Pause : Play} onClick={toggle} disabled={!('speechSynthesis' in window)}>{playing ? 'Stop' : 'Play briefing'}</Button>;
};

const Deliverable = ({ type, asOf }) => {
  const notify = useToast();
  const deliverable = useResource(`/briefings/deliverables/${type}?asOf=${asOf}`);
  const [text, setText] = useState('');
  const data = deliverable.data;
  useEffect(() => {
    if (data) setText(type === 'davr-kit' ? data.followUp : data.ai?.markdown ?? data.markdown);
  }, [data, type]);
  if (!data) return <p className="muted">Drafting…</p>;

  const decide = async (decision) => {
    await api.post(`/briefings/approve/${type}`, { decision, content: text, asOf });
    notify({ tone: 'success', title: decision === 'approved' ? 'Approved' : 'Rejected', text: 'Recorded in the briefings outbox.' });
  };

  return (
    <div className="briefing">
      <Card className="briefing__doc">
        {type === 'briefing' && <Speaker text={data.ai?.markdown ?? data.script} />}
        <Markdown text={data.ai?.markdown ?? data.markdown} />
      </Card>
      <Card title="Your decision" className="briefing__approval">
        <Textarea rows={14} value={text} onChange={(event) => setText(event.target.value)} />
        <div className="composer__actions">
          <Button variant="ghost" onClick={() => decide('rejected')}>Reject</Button>
          <Button variant="primary" onClick={() => decide('approved')}>Approve</Button>
        </div>
      </Card>
    </div>
  );
};

export const BriefingsPage = () => {
  const { settings } = useSettings();
  const [type, setType] = useState('caught');
  const asOf = settings?.scenarioTime ?? '16:10';
  return (
    <div className="page page--wide">
      <PageHeader title="Briefings" />
      <Segmented label="Briefing" value={type} onChange={setType} options={TYPES} />
      {type === 'caught' ? <Findings asOf={asOf} /> : <Deliverable key={`${type}-${asOf}`} type={type} asOf={asOf} />}
    </div>
  );
};
