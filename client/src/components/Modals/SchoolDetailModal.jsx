import { useApp } from '../../contexts/AppContext';

export default function SchoolDetailModal({ open, onClose }) {
  const { schools, openModal } = useApp();

  if (!open) return null;

  const school = schools[0];
  if (!school) return null;

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 480, padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,var(--primary) 0%,var(--primary-light) 100%)', padding: '22px 24px 18px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.2)', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>{school.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginTop: 4 }}>{school.location || 'Location not set'}</div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Classrooms', val: school.rooms || '—' },
              { label: 'Teachers', val: school.teachers || '—' },
              { label: 'Students', val: school.students || '—' },
              { label: 'Cameras', val: '2' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {school.principalName && <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>Principal</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{school.principalName}</div>
            {school.contactEmail && <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{school.contactEmail}</div>}
          </div>}
          {school.phone && <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>Phone</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{school.phone}</div>
          </div>}
          {school.address && <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>Address</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{school.address}</div>
          </div>}
        </div>
        <div className="modal-footer" style={{ padding: '14px 20px' }}>
          <button className="btn btn-ghost" onClick={() => openModal('editSchool')}>✎ Edit School</button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
