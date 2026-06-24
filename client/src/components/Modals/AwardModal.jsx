import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { ThumbsUp, AlertTriangle } from 'lucide-react';

const POINT_OPTIONS = [5, 10, 15, 20];

export default function AwardModal({ open, onClose }) {
  const { students, submitAward } = useApp();
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [type, setType] = useState('positive');
  const [selectedPoints, setSelectedPoints] = useState(10);
  const [customPoints, setCustomPoints] = useState('');
  const [useCustomPoints, setUseCustomPoints] = useState(false);
  const [description, setDescription] = useState('');

  const ptsDelta = useCustomPoints ? (parseInt(customPoints) || 0) : selectedPoints;
  const effectiveDelta = type === 'positive' ? ptsDelta : -ptsDelta;

  if (!open) return null;

  const selectedStudent = students.find(s => s.id === studentId);
  const currentPts = selectedStudent?.pts || 0;

  const submit = () => {
    if (!description.trim()) return;
    if (effectiveDelta === 0) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    submitAward({
      studentId: student.id,
      points: effectiveDelta,
      source: 'Award Points',
      description: description.trim(),
    });
    setDescription('');
    setUseCustomPoints(false);
    setCustomPoints('');
    setSelectedPoints(10);
    onClose();
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 480, padding: 0, overflow: 'hidden' }}>
        <div style={{ background: type === 'positive' ? 'linear-gradient(135deg,#16a34a 0%,#22c55e 100%)' : 'linear-gradient(135deg,#dc2626 0%,#ef4444 100%)', padding: '20px 24px 18px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.25)', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>{type === 'positive' ? <ThumbsUp size={20} /> : <AlertTriangle size={20} />} Award Points</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Give or deduct points — affects total score</div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--gold-pale)', fontSize: 13, fontWeight: 800, color: 'var(--gold)', marginBottom: 14, textAlign: 'center' }}>
            Points: {currentPts}
          </div>
          <div className="form-group-m">
            <label className="form-label-m">Student</label>
            <select className="form-select-m" value={studentId} onChange={e => setStudentId(e.target.value)}>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.class}</option>)}
            </select>
          </div>
          <div className="form-group-m">
            <label className="form-label-m">Type</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <div onClick={() => setType('positive')} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: `2.5px solid ${type === 'positive' ? '#16a34a' : '#d1d5db'}`, background: type === 'positive' ? '#f0fdf4' : '#fff', textAlign: 'center', cursor: 'pointer', fontWeight: 800, fontSize: 14, color: type === 'positive' ? '#16a34a' : '#6b7280', transition: 'all .15s' }}>
                <ThumbsUp size={18} style={{ display: 'block', margin: '0 auto 4px' }} /> Award
              </div>
              <div onClick={() => setType('negative')} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: `2.5px solid ${type === 'negative' ? '#dc2626' : '#d1d5db'}`, background: type === 'negative' ? '#fef2f2' : '#fff', textAlign: 'center', cursor: 'pointer', fontWeight: 800, fontSize: 14, color: type === 'negative' ? '#dc2626' : '#6b7280', transition: 'all .15s' }}>
                <AlertTriangle size={18} style={{ display: 'block', margin: '0 auto 4px' }} /> Deduct
              </div>
            </div>
          </div>
          <div className="form-group-m">
            <label className="form-label-m">Points</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {POINT_OPTIONS.map(p => {
                const active = !useCustomPoints && selectedPoints === p;
                const isPos = type === 'positive';
                return (
                  <div key={p} onClick={() => { setSelectedPoints(p); setUseCustomPoints(false); }}
                    style={{ padding: '10px 18px', borderRadius: 10, border: `2px solid ${active ? (isPos ? '#16a34a' : '#dc2626') : '#e5e7eb'}`, background: active ? (isPos ? '#f0fdf4' : '#fef2f2') : '#fff', cursor: 'pointer', transition: 'all .12s', fontWeight: 900, fontSize: 16, color: active ? (isPos ? '#16a34a' : '#dc2626') : '#6b7280', minWidth: 56, textAlign: 'center' }}>
                    {isPos ? '+' : '-'}{p}
                  </div>
                );
              })}
              <div onClick={() => setUseCustomPoints(true)}
                style={{ padding: '10px 18px', borderRadius: 10, border: `2px solid ${useCustomPoints ? (type === 'positive' ? '#16a34a' : '#dc2626') : '#e5e7eb'}`, background: useCustomPoints ? (type === 'positive' ? '#f0fdf4' : '#fef2f2') : '#fff', cursor: 'pointer', transition: 'all .12s', fontWeight: 800, fontSize: 13, color: useCustomPoints ? (type === 'positive' ? '#16a34a' : '#dc2626') : '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                Custom
              </div>
            </div>
            {useCustomPoints && (
              <input className="form-input-m" type="number" value={customPoints} onChange={e => setCustomPoints(e.target.value)} placeholder="Enter points..." min="1" style={{ width: '100%' }} />
            )}
          </div>
          <div className="form-group-m">
            <label className="form-label-m">Description</label>
            <textarea className="form-textarea-m" style={{ minHeight: 70 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Excellent class participation / Disrupted circle time..." />
          </div>
          <div style={{ padding: '8px 14px', borderRadius: 8, background: type === 'positive' ? '#f0fdf4' : '#fef2f2', fontSize: 12, fontWeight: 700, color: type === 'positive' ? '#16a34a' : '#dc2626', marginTop: 4 }}>
            {effectiveDelta > 0 ? '+' : ''}{effectiveDelta} pts · total will be {Math.max(0, currentPts + effectiveDelta)}
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '14px 24px' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} style={{ background: type === 'positive' ? '#16a34a' : '#dc2626', borderColor: type === 'positive' ? '#16a34a' : '#dc2626' }}>{type === 'positive' ? 'Award Points' : 'Deduct Points'}</button>
        </div>
      </div>
    </div>
  );
}
