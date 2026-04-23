import { NavLink } from 'react-router-dom';

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/students', label: 'Students', icon: '👧' },
  { to: '/detection', label: 'Detection', icon: '📷' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { to: '/messages', label: 'Messages', icon: '💬' },
  { to: '/complaints', label: 'Complaints', icon: '📣' },
  { to: '/schools', label: 'Schools', icon: '🏫' },
];

const teacherLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/students', label: 'Students', icon: '👧' },
  { to: '/detection', label: 'Detection', icon: '📷' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { to: '/messages', label: 'Messages', icon: '💬' },
  { to: '/complaints', label: 'Complaints', icon: '📣' },
];

const parentLinks = [
  { to: '/my-child', label: 'My Child', icon: '👨‍👩‍👧' },
  { to: '/messages', label: 'Messages', icon: '💬' },
  { to: '/complaints', label: 'Complaints', icon: '📣' },
];

export default function Sidebar({
  role,
  user,
  onLogout,
  open,
  onCloseOverlay,
  unreadMessages,
  openComplaints,
}) {
  const links =
    role === 'admin'
      ? adminLinks
      : role === 'teacher'
        ? teacherLinks
        : parentLinks;

  return (
    <>
      <aside className={`sidebar${open ? ' is-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">Axion</div>
          <div className="sidebar-brand-sub">Montessori Management</div>
        </div>
        <nav className="sidebar-nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
              onClick={() => onCloseOverlay?.()}
            >
              <span>{l.icon}</span>
              <span>{l.label}</span>
              {l.to === '/messages' && unreadMessages > 0 ? (
                <span className="sidebar-badge">{unreadMessages}</span>
              ) : null}
              {l.to === '/complaints' && openComplaints > 0 ? (
                <span className="sidebar-badge">{openComplaints}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-pill">
            <div className="user-avatar">{user?.avatarInitials}</div>
            <div>
              <div className="user-meta-name">{user?.name}</div>
              <div className="user-meta-role">{user?.role}</div>
            </div>
          </div>
          <button type="button" className="btn-ghost btn-sm sidebar-signout" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </aside>
      <div
        className={`sidebar-overlay${open ? ' is-open' : ''}`}
        role="presentation"
        onClick={onCloseOverlay}
      />
    </>
  );
}
