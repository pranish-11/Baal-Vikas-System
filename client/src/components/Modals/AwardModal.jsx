import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

const QUICK_PTS = [5, 10, 15, 20];

export default function AwardModal({ open, onClose }) {
  const { students, submitAward } = useApp();
  const [student, setStudent] = useState(students[0]?.name || '');
  const [points, setPoints] = useState(5);
  const [custom, setCustom] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [description, setDescription] = useState('');

  if (!open) return null;

  const submit = () => {
    if (!description.trim()) return;
    const pts = useCustom ? (parseInt(custom) || 0) : points;
    if (pts === 0) return;
    submitAward({
      studentId: students.find(s => s.name === student)?.id,
      points: pts,
      source: 'Award Points',
      description: description.trim(),
    });
    setDescription('');
    setCustom('');
    setUseCustom(false);
    setPoints(5);
    onClose();
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 400, padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,var(--primary) 0%,#6366f1 100%)', padding: '16px 20px 14px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(255,255,255,0.2)', border: 'none', width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', fontSize: 12, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Award Points</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginTop: 1 }}>Give points for positive behaviour</div>
        </div>
        <div style={{ padding: '14px 20px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select className="form-select-m" value={student} onChange={e => setStudent(e.target.value)} style={{ fontSize: 12, padding: '6px 10px' }}>
            {students.map(s => <option key={s.id}>{s.name}</option>)}
          </select>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 4 }}>Points</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {QUICK_PTS.map(p => (
                <div key={p} onClick={() => { setPoints(p); setUseCustom(false); }}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${!useCustom && points === p ? 'var(--primary)' : '#e5e7eb'}`, background: !useCustom && points === p ? 'var(--primary-pale)' : '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 15, textAlign: 'center', color: !useCustom && points === p ? 'var(--primary)' : '#6b7280', transition: 'all .1s' }}>
                  +{p}
                </div>
              ))}
              <div onClick={() => setUseCustom(true)}
                style={{ padding: '8px 12px', borderRadius: 8, border: `2px solid ${useCustom ? 'var(--primary)' : '#e5e7eb'}`, background: useCustom ? 'var(--primary-pale)' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: useCustom ? 'var(--primary)' : '#6b7280', display: 'flex', alignItems: 'center' }}>
                Custom
              </div>
            </div>
            {useCustom && (
              <input className="form-input-m" type="number" value={custom} onChange={e => setCustom(e.target.value)} placeholder="Enter points" min="1" style={{ width: '100%', fontSize: 12, padding: '6px 10px', marginTop: 6 }} />
            )}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 4 }}>Why?</div>
            <textarea className="form-textarea-m" style={{ minHeight: 52, fontSize: 12, padding: '6px 10px' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Excellent class participation" />
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '10px 20px', marginTop: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: 12 }}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submit} style={{ fontSize: 12 }}>Award Points</button>
        </div>
      </div>
    </div>
  );
}
