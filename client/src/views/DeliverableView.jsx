import { useApi } from '../useApi.js';
import { ApprovalPanel } from '../components/ApprovalPanel.jsx';
import { AiVersion } from '../components/AiVersion.jsx';
import { OnePagerBody } from './bodies/OnePagerBody.jsx';
import { DavrKitBody } from './bodies/DavrKitBody.jsx';
import { PressBody } from './bodies/PressBody.jsx';
import { BriefingBody } from './bodies/BriefingBody.jsx';

const BODIES = {
  'one-pager': OnePagerBody,
  'davr-kit': DavrKitBody,
  press: PressBody,
  briefing: BriefingBody,
};

const APPROVAL_LABELS = {
  'one-pager': 'Approve & send to Richard',
  'davr-kit': 'Approve follow-up to Bekzod & Dilnoza',
  press: 'Approve statement for Jordan to send',
  briefing: 'Save briefing',
};

export const DeliverableView = ({ type, asOf, onDecided }) => {
  const deliverable = useApi(`/deliverables/${type}?asOf=${asOf}`);
  if (deliverable.loading) return <div className="muted">StandIn is drafting…</div>;
  if (deliverable.error) return <div className="error">{deliverable.error}</div>;
  const data = deliverable.data;
  const Body = BODIES[type];
  return (
    <div className="deliverable">
      <div className="stack">
        <header>
          <h2 className="doc-title">{data.title}</h2>
          <p className="muted">{data.subtitle}</p>
          {data.aiError && <p className="error small">Claude was unavailable ({data.aiError}); showing the rule-based draft.</p>}
        </header>
        <Body data={data} />
        {data.ai && <AiVersion ai={data.ai} />}
      </div>
      <ApprovalPanel
        type={type}
        asOf={asOf}
        label={APPROVAL_LABELS[type]}
        initialContent={type === 'davr-kit' ? data.followUp : data.ai?.markdown ?? data.markdown}
        onDecided={onDecided}
      />
    </div>
  );
};
