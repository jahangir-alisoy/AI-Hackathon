export const Tabs = ({ tabs, active, onSelect, badges }) => (
  <nav className="tabs">
    {tabs.map((tab) => (
      <button key={tab.key} className={tab.key === active ? 'tab active' : 'tab'} onClick={() => onSelect(tab.key)}>
        {tab.label}
        {badges[tab.key] ? <span className="tab-badge">{badges[tab.key]}</span> : null}
      </button>
    ))}
  </nav>
);
