import { useRef, useState } from 'react';
import { NAV_DEFS, useApp } from '../../contexts/AppContext';
import { LayoutDashboard, Users, Video, Trophy, MessageSquare, ClipboardList, School, Star, CreditCard, ClipboardCheck, Circle } from 'lucide-react';

const getAvatarKey = (email) => email ? `axion_avatar_${email.replace(/[^a-zA-Z0-9]/g, '_')}` : 'axion_user_avatar';

function NavIcon({ name }) {
  const icons = { LayoutDashboard, Users, Video, Trophy, MessageSquare, ClipboardList, School, Star, CreditCard, ClipboardCheck };
  const Icon = icons[name] || Circle;
  return <Icon size={18} />;
}

export default function Sidebar({ open, onClose }) {
  const { currentRole, currentPage, setCurrentPage, user, logout, roleConfig, navTo } = useApp();
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
          <div className="sidebar-school">{roleConfig?.school || 'Sunrise Montessori'}</div>
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
        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avi" style={{ background: tc.bg, color: tc.col, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              onClick={() => fileRef.current?.click()} title="Change profile picture">
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                user?.name?.substring(0, 2).toUpperCase() || roleConfig?.avi || 'AD'
              )}
            </div>
            <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
            <div>
              <div className="user-info-name">{user?.name || roleConfig?.name || 'Admin User'}</div>
              <div className="user-info-role">{user ? currentRole.charAt(0).toUpperCase() + currentRole.slice(1) : roleConfig?.role || 'Administrator'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </div>
    </>
  );
}
