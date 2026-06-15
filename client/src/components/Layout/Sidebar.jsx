import { useRef, useState } from 'react';
import { NAV_DEFS, useApp } from '../../contexts/AppContext';
import { LayoutDashboard, Users, Video, Trophy, MessageSquare, ClipboardList, Star, CreditCard, ClipboardCheck, Notebook, LogOut, Circle } from 'lucide-react';

const getAvatarKey = (email) => email ? `axion_avatar_${email.replace(/[^a-zA-Z0-9]/g, '_')}` : 'axion_user_avatar';

function NavIcon({ name }) {
  const icons = { LayoutDashboard, Users, Video, Trophy, MessageSquare, ClipboardList, Star, CreditCard, ClipboardCheck, Notebook };
  const Icon = icons[name] || Circle;
  return <Icon size={18} />;
}

export default function Sidebar({ open, onClose }) {
  const { currentRole, currentPage, setCurrentPage, user, logout, roleConfig, navTo, hasAssignedClasses, getTeacherClassName } = useApp();
  const fileRef = useRef(null);
  const AVATAR_KEY = getAvatarKey(user?.email);
  const [avatarSrc, setAvatarSrc] = useState(() => localStorage.getItem(AVATAR_KEY));

  const pages = roleConfig ? roleConfig.pages : [];
  const themeColors = { admin: { bg: 'var(--primary-pale)', col: 'var(--primary)' }, teacher: { bg: 'var(--sky-pale)', col: 'var(--sky)' }, parent: { bg: 'var(--coral-pale)', col: 'var(--coral)' } };
  const tc = themeColors[currentRole] || themeColors.admin;

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      localStorage.setItem(AVATAR_KEY, dataUrl);
      setAvatarSrc(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  let lastSection = '';
  const navItems = pages.map(pid => {
    const d = NAV_DEFS[pid];
    if (!d) return null;
    const showLabel = d.section !== lastSection;
    lastSection = d.section;
    return { pid, ...d, showLabel };
  }).filter(Boolean);

  return (
    <>
      {open && <div className="sidebar-overlay open" onClick={onClose} />}
      <div className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-wordmark">Axi<span>on</span></div>
          <div className="sidebar-school">{currentRole === 'teacher' ? (hasAssignedClasses(user?.email) ? getTeacherClassName(user?.email) : 'Not Assigned') : 'School'}</div>
        </div>
        <div className="sidebar-nav">
          {navItems.map(item => (
            <div key={item.pid}>
              {item.showLabel && <div className="nav-section-label">{item.section}</div>}
              <div
                className={`nav-item${currentPage === item.pid ? ' active' : ''}`}
                onClick={() => { setCurrentPage(item.pid); onClose?.(); }}
              >
                <span className="ni"><NavIcon name={item.icon} /></span>
                {item.label}
              </div>
            </div>
          ))}
        </div>
        <div className="sidebar-footer" style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px',
            borderRadius: 10, transition: 'all .15s', position: 'relative',
            background: tc.bg,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: tc.col, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0, position: 'relative', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
              onClick={() => fileRef.current?.click()} title="Change photo">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, borderRadius: '50%' }}
                  onError={() => { localStorage.removeItem(AVATAR_KEY); setAvatarSrc(null); }} />
              ) : null}
              <span style={{ position: 'relative', zIndex: 1, lineHeight: 1 }}>{!avatarSrc ? (user?.name?.substring(0, 2).toUpperCase() || roleConfig?.avi || 'AD') : ''}</span>
            </div>
            <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{user?.name || roleConfig?.name || 'User'}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: tc.col, marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: tc.col, display: 'inline-block' }} />
                {user ? currentRole.charAt(0).toUpperCase() + currentRole.slice(1) : roleConfig?.role || 'User'}
              </div>
            </div>
          </div>
          <button onClick={logout}
            style={{
              marginTop: 8, width: '100%', padding: '8px 10px', border: 'none', background: 'transparent',
              borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: 600, color: 'var(--text3)', fontFamily: "'Nunito',sans-serif",
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--coral-pale)'; e.currentTarget.style.color = 'var(--coral)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)'; }}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
