import { useState, useEffect } from 'react';
import { Users, Trash2, Shield, UserCheck, AlertCircle, X } from 'lucide-react';
import { requestJSON } from '../../api';
import { API_BASE } from '../../config';

export default function UserManagementModal({ open, onClose }) {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await requestJSON(`${API_BASE}/users`);
      setUserList(data.users || []);
    } catch {
      setError('Failed to load users. Backend may be offline.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchUsers();
  }, [open]);

  const handleDelete = async (user) => {
    if (!window.confirm(`Remove ${user.name} (${user.role.toLowerCase()})? This cannot be undone.`)) return;
    setDeleting(user.id);
    try {
      await requestJSON(`${API_BASE}/users/${user.id}`, { method: 'DELETE' });
      setUserList(prev => prev.filter(u => u.id !== user.id));
    } catch (e) {
      setError(e.message || 'Failed to delete user');
    }
    setDeleting(null);
  };

  if (!open) return null;

  const teachers = userList.filter(u => u.role === 'TEACHER');
  const parents = userList.filter(u => u.role === 'PARENT');

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 520, padding: 0, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Manage Accounts</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{teachers.length} teacher(s) · {parents.length} parent(s)</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--coral-pale)', color: 'var(--coral)', borderRadius: 10, fontSize: 12, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14, fontWeight: 600 }}>Loading accounts...</div>
          ) : userList.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14, fontWeight: 600 }}>No teacher or parent accounts found.</div>
          ) : (
            <>
              {teachers.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text3)', marginBottom: 8, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Shield size={14} style={{ color: 'var(--sky)' }} /> Teachers
                  </div>
                  {teachers.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10, marginBottom: 6, border: '1px solid var(--border)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--sky-pale)', color: 'var(--sky)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{u.email}</div>
                      </div>
                      <button onClick={() => handleDelete(u)} disabled={deleting === u.id}
                        style={{ background: 'var(--coral-pale)', color: 'var(--coral)', border: '1px solid var(--coral)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, opacity: deleting === u.id ? 0.5 : 1 }}>
                        <Trash2 size={13} /> {deleting === u.id ? '...' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {parents.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text3)', marginBottom: 8, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UserCheck size={14} style={{ color: 'var(--coral)' }} /> Parents
                  </div>
                  {parents.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10, marginBottom: 6, border: '1px solid var(--border)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--coral-pale)', color: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{u.email}</div>
                      </div>
                      <button onClick={() => handleDelete(u)} disabled={deleting === u.id}
                        style={{ background: 'var(--coral-pale)', color: 'var(--coral)', border: '1px solid var(--coral)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, opacity: deleting === u.id ? 0.5 : 1 }}>
                        <Trash2 size={13} /> {deleting === u.id ? '...' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer" style={{ padding: '12px 24px', marginTop: 0, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
