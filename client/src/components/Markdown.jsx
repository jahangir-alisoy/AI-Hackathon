const inline = (text, keyPrefix) => {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\])/g).filter(Boolean);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('_') && part.endsWith('_')) return <em key={key}>{part.slice(1, -1)}</em>;
    if (part.startsWith('[')) return <span key={key} className="source-ref">{part.slice(1, -1)}</span>;
    return part;
  });
};

export const Markdown = ({ text }) => {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((line, index) => {
    const key = `l${index}`;
    if (/^\s*-\s+/.test(line)) {
      list ??= [];
      list.push(<li key={key}>{inline(line.replace(/^\s*-\s+/, ''), key)}</li>);
      return;
    }
    if (list) {
      blocks.push(<ul key={`u${index}`}>{list}</ul>);
      list = null;
    }
    if (line.startsWith('# ')) blocks.push(<h2 key={key}>{inline(line.slice(2), key)}</h2>);
    else if (line.startsWith('## ')) blocks.push(<h3 key={key}>{inline(line.slice(3), key)}</h3>);
    else if (line.startsWith('> ')) blocks.push(<blockquote key={key}>{inline(line.slice(2), key)}</blockquote>);
    else if (line.trim()) blocks.push(<p key={key}>{inline(line, key)}</p>);
  });
  if (list) blocks.push(<ul key="u-end">{list}</ul>);
  return <div className="prose">{blocks}</div>;
};
