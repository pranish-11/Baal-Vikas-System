import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function SetChildModal({ open, onClose }) {
  const { students, selectedChildId, selectMyChild } = useApp();
  const [search, setSearch] = useState('');

  if (!open) return null;

  const filtered = search ? students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())) : students;

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <div className="modal-title">👶 Set Your Child</div>
        <div className="form-group-m">
          <label className="form-label-m">Search Students</label>
          <input className="form-input-m" placeholder="Type to search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(s => {
            const isSelected = s.id === selectedChildId;
            return (
              <div key={s.id} onClick={() => { selectMyChild(s.id); onClose(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: isSelected ? 'var(--primary-pale)' : 'transparent', border: isSelected ? '2px solid var(--primary)' : '2px solid transparent', transition: 'all .12s' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.bg || 'var(--primary-pale)', color: s.col || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{s.init}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{s.class}</div>
                </div>
                {isSelected && <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>✓</div>}
              </div>
            );
          })}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
