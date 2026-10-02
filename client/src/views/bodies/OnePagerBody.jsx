import { Sources } from '../../components/Sources.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

export const OnePagerBody = ({ data }) => (
  <article className="card paper">
    {data.sections.filter((section) => section.lines.length).map((section) => (
      <section key={section.heading}>
        <h3>{section.heading}</h3>
        <ul className="lines">
          {section.lines.map((line) => (
            <li key={line.text} className={`line line-${line.status}`}>
              <div className="line-text">
                {line.status !== 'CURRENT' && <StatusBadge status={line.status} />} {line.text}
              </div>
              {line.notes.map((note) => <div key={note} className="note">{note}</div>)}
              <Sources sources={line.sources} />
            </li>
          ))}
        </ul>
      </section>
    ))}
  </article>
);
