export const Card = ({ title, action, children, className = '' }) => (
  <section className={`card ${className}`}>
    {(title || action) && (
      <header className="card__header">
        {title && <h2 className="card__title">{title}</h2>}
        {action}
      </header>
    )}
    {children}
  </section>
);
