import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { MessageSquare, AlertTriangle, CalendarX, Megaphone, Activity, Bell, UtensilsCrossed, Bed, Star, X, Check } from 'lucide-react';
import { requestJSON } from '../api';
import { API_BASE, SOCKET_URL } from '../config';

const TYPE_ICONS = {
  complaint: { icon: AlertTriangle, color: '#ef4444' },
  daily_log: { icon: UtensilsCrossed, color: '#4CAF96' },
  activity: { icon: Activity, color: '#6366f1' },
  attendance: { icon: CalendarX, color: '#f59e0b' },
  observation: { icon: Star, color: '#8b5cf6' },
  message: { icon: MessageSquare, color: '#06b6d4' },
  notice: { icon: Megaphone, color: '#ec4899' },
  behavior: { icon: Activity, color: '#f97316' },
};

export default function NotificationPanel({ open, onClose, onNavigate }) {
  const { user, refreshNotifCount, openModal } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!open || !user) return;
    requestJSON(`${API_BASE}/notifications`).then(res => {
      if (res && res.items) {
        setNotifications(res.items);
        setUnread(res.unread || 0);
      }
    }).catch(() => {});
  }, [open, user]);

  useEffect(() => {
    if (!user) return;
    try {
      const io = require('socket.io-client');
      const socket = io(SOCKET_URL);
      socketRef.current = socket;
      socket.emit('identify', user.id, user.email);
      socket.on('notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnread(prev => prev + 1);
      });
      return () => { socket.disconnect(); };
    } catch (e) {
    }
  }, [user]);

  const markOneRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    await requestJSON(`${API_BASE}/notifications/${notifId}/read`, { method: 'PATCH' }).catch(() => {});
    refreshNotifCount();
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
    await requestJSON(`${API_BASE}/notifications/read-all`, { method: 'POST' }).catch(() => {});
    refreshNotifCount();
  };

  const handleClick = (n) => {
    if (!n.read) markOneRead(n.id);
    if (n.type === 'notice') {
      if (openModal) openModal('noticeDetail', { title: n.title, body: n.body });
    } else if (n.link && onNavigate) {
      onNavigate(n.link.replace('/', ''));
    }
    if (onClose) onClose();
  };

  const clearAllRead = async () => {
    setNotifications(prev => prev.filter(n => !n.read));
    await requestJSON(`${API_BASE}/notifications/clear-read`, { method: 'DELETE' }).catch(() => {});
  };

  const deleteOneNotif = async (notifId, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    await requestJSON(`${API_BASE}/notifications/${notifId}`, { method: 'DELETE' }).catch(() => {});
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className={`notif-panel${open ? ' open' : ''}`} onClick={e => e.stopPropagation()}>
      <div className="notif-panel-header">
        <div className="notif-panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bell size={15} /> Notifications
          {unread > 0 && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: 'var(--primary)', color: '#fff', fontWeight: 800 }}>{unread}</span>}
        </div>
        {notifications.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }} onClick={markAllAsRead}>
              Mark all read
            </span>
            <span style={{ fontSize: 12, color: '#888', cursor: 'pointer', fontWeight: 600, opacity: 0.6 }} onClick={clearAllRead}>
              Clear read
            </span>
          </div>
        )}
      </div>
      <div id="notif-list">
        {notifications.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>
            You're all caught up ✓
          </div>
        ) : notifications.map(n => {
          const meta = TYPE_ICONS[n.type] || { icon: Bell, color: '#888' };
          const Icon = meta.icon;
          const isUnread = !n.read;
          return (
            <div key={n.id}
              className={`notif-item${isUnread ? ' notif-unread' : ''}`}
              onClick={() => handleClick(n)}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: meta.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={14} style={{ color: meta.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="notif-item-title">{n.title}</div>
                  {n.body && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>}
                  <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {isUnread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />}
                  <X size={12} style={{ color: '#ccc', cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s' }}
                    className="notif-delete"
                    onClick={(e) => deleteOneNotif(n.id, e)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
