export default function NotifPanel({ open, onClose, items }) {
  if (!open) return null;
  return (
    <div className="notif-panel">
      <div className="notif-panel-title">Notifications</div>
      {(items || []).length === 0 ? (
        <div className="empty-hint">You are all caught up.</div>
      ) : (
        <ul className="notif-list">
          {items.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
      <button type="button" className="btn-ghost btn-sm notif-close" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
