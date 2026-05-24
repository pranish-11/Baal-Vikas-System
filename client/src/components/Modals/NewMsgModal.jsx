import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { requestJSON } from '../../api';

const API_BASE = 'http://127.0.0.1:8011/api';

export default function NewMsgModal({ open, onClose }) {
  const { messages, startChatWith, currentRole, allEligibleUsers, setAllEligibleUsers, user } = useApp();
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 100);
      if (allEligibleUsers.length === 0) {
        requestJSON(`${API_BASE}/messages/users`).then(data => {
          setAllEligibleUsers(data.users || []);
        }).catch(() => {
          const mockByRole = {
            admin: [
              { id: 'anika_axion_edu', name: 'Ms. Anika Roy', role: 'TEACHER', avi: 'AR', aColor: 'var(--sky-pale)', aText: 'var(--sky)' },
              { id: 'lena_axion_edu', name: 'Mrs. Lena Kim', role: 'PARENT', avi: 'LK', aColor: 'var(--coral-pale)', aText: 'var(--coral)' },
            ],
            teacher: [
              { id: 'lena_axion_edu', name: 'Mrs. Lena Kim', role: 'PARENT', avi: 'LK', aColor: 'var(--coral-pale)', aText: 'var(--coral)' },
              { id: 'mei_axion_edu', name: 'Mrs. Mei Chen', role: 'PARENT', avi: 'MC', aColor: 'var(--coral-pale)', aText: 'var(--coral)' },
            ],
            parent: [
              { id: 'anika_axion_edu', name: 'Ms. Anika Roy', role: 'TEACHER', avi: 'AR', aColor: 'var(--sky-pale)', aText: 'var(--sky)' },
            ],
          };
          setAllEligibleUsers(mockByRole[currentRole] || mockByRole.admin);
        });
      }
    }
  }, [open, allEligibleUsers.length, setAllEligibleUsers]);

  if (!open) return null;

  const currentUserName = user?.name || '';
  const existingContactIds = new Set(messages.map(m => m.senderId || m.id));
  const existingNames = new Set(messages.map(m => m.sender));

  const eligible = allEligibleUsers.filter(u => {
    if (u.name === currentUserName) return false;
    if (existingContactIds.has(u.id)) return false;
    if (existingNames.has(u.name)) return false;
    return true;
  });

  const filtered = search
    ? eligible.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase()))
    : eligible;

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <div className="modal-title" style={{ marginBottom: 14 }}>New Message</div>
        <input ref={inputRef} className="msg-input" placeholder="Search by name or role..." style={{ width: '100%', marginBottom: 12, borderRadius: 10 }} value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>
              {search ? 'No users found.' : 'No available contacts.'}
            </div>
          ) : filtered.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background .12s' }}
onClick={() => { startChatWith(u.id, u.name, u.role); }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.aColor || 'var(--primary-pale)', color: u.aText || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{u.avi}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{u.role === 'TEACHER' ? 'Teacher' : u.role === 'PARENT' ? 'Parent' : u.role}</div>
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
