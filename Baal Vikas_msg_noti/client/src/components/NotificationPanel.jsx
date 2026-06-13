import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { MessageSquare, AlertTriangle, CreditCard, CalendarX, Megaphone } from 'lucide-react';
import { queueSyncToDB } from '../utils/dbSync';

export default function NotificationPanel({ open, onClose, onNavigate }) {
  const { messages, setMessages, setNotificationDot, complaints, activities, fees, students, attendanceData, currentRole, announcements, user } = useApp();
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('axion_read_notifs') || '[]')); } catch { return new Set(); }
  });

  const notifs = [];

  // Announcements — filter by target role
  announcements.forEach(a => {
    if (a.targetRole === 'all' || a.targetRole === currentRole || a.targetRole === 'both') {
      notifs.push({ id: a.id, icon: Megaphone, iconColor: 'var(--primary)', title: a.title, sub: `${a.by} · ${a.time}`, unread: true, action: () => {} });
    }
  });

  // Unread incoming messages
  messages.forEach(m => {
    if (m.chat?.length > 0) {
      const lastMsg = m.chat[m.chat.length - 1];
      if (lastMsg.from === 'in') {
        notifs.push({ id: 'msg-' + m.id, icon: MessageSquare, iconColor: 'var(--sky)', title: `New message from ${m.sender}`, sub: `${m.role} · ${lastMsg.time}`, unread: true, action: () => { onNavigate('messages'); } });
      }
    }
  });

  // Open complaints
  complaints.forEach(c => {
    if (c.status === 'open') {
      notifs.push({ id: 'comp-' + c.id, icon: AlertTriangle, iconColor: 'var(--coral)', title: c.title, sub: `Open complaint · ${c.time}`, unread: true, action: () => onNavigate('complaints') });
    }
  });

  // Overdue fees
  fees.forEach(f => {
    if (f.status === 'overdue') {
      notifs.push({ id: 'fee-' + f.id, icon: CreditCard, iconColor: '#dc2626', title: `Fee overdue: ${f.title}`, sub: `$${f.balance.toFixed(2)} outstanding · ${f.studentName || ''}`, unread: true, action: () => onNavigate('fees') });
    } else if (f.status === 'pending' && f.dueDate) {
      const due = new Date(f.dueDate + 'T00:00:00');
      const weekAway = new Date();
      weekAway.setDate(weekAway.getDate() + 7);
      if (due <= weekAway) {
        notifs.push({ id: 'fee-due-' + f.id, icon: CreditCard, iconColor: 'var(--gold)', title: `Fee due soon: ${f.title}`, sub: `Due ${f.dueDate} · $${f.balance.toFixed(2)} remaining`, unread: true, action: () => onNavigate('fees') });
      }
    }
  });

  // Absent students today
  const today = new Date().toISOString().slice(0, 10);
  const rec = attendanceData[today] || {};
  students.forEach(s => {
    if (rec[s.id] === 'absent') {
      notifs.push({ id: 'absent-' + s.id, icon: CalendarX, iconColor: '#e11d48', title: `${s.name} is absent today`, sub: `${s.class} · marked absent`, unread: true, action: () => onNavigate('students') });
    }
  });

  notifs.sort((a, b) => (a.unread && !readIds.has(a.id) ? 0 : 1) - (b.unread && !readIds.has(b.id) ? 0 : 1));

  const unreadCount = notifs.filter(n => n.unread && !readIds.has(n.id)).length;

  useEffect(() => {
    if (open && unreadCount > 0) {
      const allIds = new Set([...readIds, ...notifs.filter(n => n.unread).map(n => n.id)]);
      setReadIds(allIds);
      try { localStorage.setItem('axion_read_notifs', JSON.stringify([...allIds])); queueSyncToDB('axion_read_notifs', [...allIds]); } catch {}
    }
  }, [open]);

  const handleClick = (id) => {
    const newIds = new Set([...readIds, id]);
    setReadIds(newIds);
    try { localStorage.setItem('axion_read_notifs', JSON.stringify([...newIds])); queueSyncToDB('axion_read_notifs', [...newIds]); } catch {}
    const n = notifs.find(x => x.id === id);
    if (n?.action) n.action();
    onClose();
  };

  const markAllRead = () => {
    const allIds = new Set(notifs.map(n => n.id));
    setReadIds(allIds);
    try { localStorage.setItem('axion_read_notifs', JSON.stringify([...allIds])); queueSyncToDB('axion_read_notifs', [...allIds]); } catch {}
    
    // Clear the notification dot immediately by tricking local storage / app context
    if (typeof setNotificationDot === 'function') setNotificationDot(false);
    
    // Actually set all messages to read
    if (typeof setMessages === 'function') {
      setMessages(messages.map(m => ({ ...m, unread: false })));
    }
    
    // Close the panel
    onClose();
  };

  return (
    <div className={`notif-panel${open ? ' open' : ''}`} onClick={e => e.stopPropagation()}>
      <div className="notif-panel-header">
        <div className="notif-panel-title">Notifications</div>
        {notifs.length > 0 && <span style={{ fontSize: 12, color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }} onClick={markAllRead}>Mark all read</span>}
      </div>
      <div id="notif-list">
        {notifs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>
            You're all caught up ✓
          </div>
        ) : notifs.map(n => {
          const isUnread = n.unread && !readIds.has(n.id);
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              className={`notif-item${isUnread ? ' notif-unread' : ''}`}
              onClick={() => handleClick(n.id)}
            >
              <div className="notif-item-title">
                <Icon size={14} style={{ color: n.iconColor, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
                {n.title}
              </div>
              <div className="notif-item-sub">{n.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
