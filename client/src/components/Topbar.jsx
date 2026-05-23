import NotifPanel from './NotifPanel.jsx';

export default function Topbar({
  title,
  subtitle,
  role,
  onHamburger,
  onCta,
  notifOpen,
  onToggleNotif,
  notifItems,
}) {
  let ctaLabel = 'Action';
  if (['head_admin', 'school_admin', 'admin'].includes(role)) ctaLabel = 'Register Student';
  if (role === 'teacher') ctaLabel = 'Award Points';
  if (role === 'parent') ctaLabel = 'File Complaint';

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar-hamburger"
        aria-label="Open menu"
        onClick={onHamburger}
      >
        ☰
      </button>
      <div className="topbar-titles">
        <div className="topbar-title">{title}</div>
        <div className="topbar-sub">{subtitle}</div>
      </div>
      <div className="topbar-actions">
        <div className="notif-wrap">
          <button
            type="button"
            className="notif-btn"
            aria-label="Notifications"
            onClick={onToggleNotif}
          >
            🔔
            <span className="notif-dot" />
          </button>
          <NotifPanel
            open={notifOpen}
            onClose={onToggleNotif}
            items={notifItems}
          />
        </div>
        <button type="button" className="btn-primary btn-sm" onClick={onCta}>
          {ctaLabel}
        </button>
      </div>
    </header>
  );
}
