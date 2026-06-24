import { NAV_DEFS, useApp } from '../../contexts/AppContext';
import { Bell, UserPlus, Star, FileWarning, Megaphone, Search } from 'lucide-react';

const SUBTITLES = {
  dashboard: 'School overview',
  students: 'Student management',
  detection: '',
  leaderboard: 'Points ranking',
  messages: 'Communication hub',
  complaints: 'All complaints',
  myChild: 'Your child\'s progress',
};

export default function Topbar({ onOpenSidebar, onOpenModal, onToggleNotif, notifCount, onOpenSearch }) {
  const { currentPage, roleConfig, currentRole, openModal } = useApp();
  const d = NAV_DEFS[currentPage];
  const title = d?.label || currentPage;
  const sub = SUBTITLES[currentPage] || '';

  const ctaLabels = { admin: 'Register Student', teacher: 'Award Points', parent: 'File Complaint' };
  const ctaIcons = { admin: UserPlus, teacher: Star, parent: FileWarning };
  const CtaIcon = ctaIcons[currentRole] || UserPlus;
  const ctaText = ctaLabels[currentRole] || 'Add Entry';

  return (
    <div className="topbar">
      <button className="mobile-toggle" onClick={onOpenSidebar}>☰</button>
      <div style={{ flex: 1 }}>
        <div className="topbar-title">{title}</div>
        <div className="topbar-sub">{sub}</div>
      </div>
      <div className="topbar-actions">
        <div className="icon-btn" onClick={onOpenSearch} title="Search">
          <Search size={20} />
        </div>
        <div className="icon-btn" onClick={onToggleNotif} title="Notifications">
          <Bell size={20} />
          {notifCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              minWidth: 18, height: 18, borderRadius: 9,
              background: '#ef4444', color: '#fff',
              fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #fff',
              boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
            }}>
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          )}
        </div>
        {(currentRole === 'admin' || currentRole === 'teacher') && (
          <button className="btn btn-sm" style={{ background: 'var(--coral-pale)', color: 'var(--coral)', border: '1.5px solid var(--coral)', fontWeight: 800, marginRight: 6 }}
            onClick={() => openModal('announcement')}>
            <Megaphone size={14} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: 4 }} />
            Notice
          </button>
        )}
        <button className="btn btn-primary btn-sm" onClick={onOpenModal}>
          <CtaIcon size={16} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: 6 }} />
          {ctaText}
        </button>
      </div>
    </div>
  );
}
