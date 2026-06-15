import { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';

import { API_BASE } from '../../config';

export default function NewMsgModal({ open, onClose }) {
  const { messages, startChatWith, user, students, teacherClassrooms, currentRole } = useApp();
  const [search, setSearch] = useState('');
  const [backendUsers, setBackendUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Fetch eligible users from backend when modal opens (gives us real MongoDB IDs)
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const token = localStorage.getItem('axion_token');
    fetch(`${API_BASE}/messages/users`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        if (data.users && Array.isArray(data.users)) {
          setBackendUsers(data.users);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Build contacts from backend users (real MongoDB IDs)
  const contacts = useMemo(() => {
    if (!open || !user) return [];

    return backendUsers.map(u => {
      const roleUpper = (u.role || '').toUpperCase();
      let aColor = 'var(--surface2)', aText = 'var(--text2)';
      if (roleUpper === 'TEACHER') { aColor = 'var(--sky-pale)'; aText = 'var(--sky)'; }
      else if (roleUpper === 'PARENT') { aColor = 'var(--coral-pale)'; aText = 'var(--coral)'; }
      else if (roleUpper === 'ADMIN') { aColor = 'var(--primary-pale)'; aText = 'var(--primary)'; }
      return {
        id: u.id,
        email: u.email || '',
        name: u.name || (u.email || '').split('@')[0],
        role: roleUpper,
        avi: (u.name || u.email || 'U').substring(0, 2).toUpperCase(),
        aColor,
        aText,
      };
    });
  }, [open, backendUsers, user]);

  // Build a set of IDs + emails that already have threads
  const existingContactIds = useMemo(() => {
    const ids = new Set();
    const emails = new Set();
    const currentUserId = user?.id;
    const currentUserEmail = (user?.email || '').toLowerCase();
    for (const m of messages) {
      const parts = m.participants || m.participantIds || [];
      const hasCurrentUser = parts.includes(currentUserId)
        || Object.values(m.participantEmails || {}).some(e => e.toLowerCase() === currentUserEmail);
      if (!hasCurrentUser) continue;
      for (const p of parts) {
        if (p !== currentUserId) ids.add(p);
      }
      for (const [pid, email] of Object.entries(m.participantEmails || {})) {
        if (pid !== currentUserId && email) emails.add(email.toLowerCase());
      }
    }
    return { ids, emails };
  }, [messages, user]);

  // Exclude contacts who already have a conversation
  const eligible = contacts.filter(c => {
    if (existingContactIds.ids.has(c.id)) return false;
    if (c.email && existingContactIds.emails.has(c.email.toLowerCase())) return false;
    return true;
  });

  const filtered = search
    ? eligible.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase()))
    : eligible;

  if (!open) return null;

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <div className="modal-title" style={{ marginBottom: 14 }}>New Message</div>
        <input
          ref={inputRef}
          className="msg-input"
          placeholder="Search..."
          style={{ width: '100%', marginBottom: 12, borderRadius: 10 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>
              Loading contacts...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>
              {search ? 'No users found.' : 'No available contacts.'}
            </div>
          ) : filtered.map(u => (
            <div
              key={u.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background .12s' }}
              onClick={() => { startChatWith(u.id, u.name, u.role, u.email); onClose(); }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.aColor, color: u.aText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                {u.avi}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
                  {u.role === 'TEACHER' ? 'Teacher' : u.role === 'PARENT' ? 'Parent' : u.role === 'ADMIN' ? 'Admin' : u.role}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer" style={{ marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
