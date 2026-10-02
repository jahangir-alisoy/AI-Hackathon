import { useEffect, useState } from 'react';
import { Sources } from '../../components/Sources.jsx';

const speechAvailable = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export const BriefingBody = ({ data }) => {
  const [playing, setPlaying] = useState(false);
  const script = data.ai?.markdown ?? data.script;

  useEffect(() => () => speechAvailable() && window.speechSynthesis.cancel(), []);

  const toggle = () => {
    if (!speechAvailable()) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 1.05;
    utterance.onend = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  };

  return (
    <div className="stack">
      <button className="primary big" onClick={toggle} disabled={!speechAvailable()}>
        {playing ? '■ Stop' : '▶ Play briefing'}
      </button>
      {data.articles.map((article, index) => (
        <article key={article.id} className="card">
          <header className="card-head">
            <h3>{index + 1}. {article.title}</h3>
            <span className={`badge ${article.score >= 3 ? 'badge-urgent' : 'badge-later'}`}>{article.whyToday}</span>
          </header>
          <p>{article.summary}</p>
          <p className="muted small">{article.meta}</p>
          <Sources sources={article.sources} />
        </article>
      ))}
    </div>
  );
};
