export const Sources = ({ sources }) =>
  sources?.length ? (
    <div className="sources">
      {[...new Set(sources)].map((source) => <span key={source} className="source">{source}</span>)}
    </div>
  ) : null;
