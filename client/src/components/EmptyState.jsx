export const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="empty">
    {Icon && <Icon size={28} strokeWidth={1.5} aria-hidden="true" />}
    <strong>{title}</strong>
    {text && <p>{text}</p>}
    {action}
  </div>
);
