import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { AlertTriangle, ThumbsUp } from 'lucide-react';
import { queueSyncToDB } from '../../utils/dbSync';

const POINT_OPTIONS = [2, 5, 10, 15, 20];

export default function AddBehaviourModal({ open, onClose }) {
  const { students, setStudents, activities, setActivities, showToast } = useApp();
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [type, setType] = useState('positive');
  const [selectedPoints, setSelectedPoints] = useState(5);
  const [customPoints, setCustomPoints] = useState('');
  const [useCustomPoints, setUseCustomPoints] = useState(false);
  const [description, setDescription] = useState('');

  const ptsDelta = useCustomPoints ? (parseInt(customPoints) || 0) : selectedPoints;
  const effectiveDelta = type === 'positive' ? ptsDelta : -ptsDelta;
  const pctDelta = effectiveDelta;

  if (!open) return null;

  const submit = () => {
    if (!description.trim()) { showToast('Please describe the behaviour'); return; }
    if (effectiveDelta === 0) { showToast('Points cannot be 0'); return; }
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    student.pts = Math.max(0, Math.min(200, (student.pts || 0) + effectiveDelta));
    student.pct = Math.max(0, Math.min(100, (student.pct || 0) + pctDelta));
    setStudents([...students]);
    const entry = {
      id: 'beh-' + Date.now(), studentId: student.id, studentName: student.name,
      type, description: description.trim(),
      ptsDelta: effectiveDelta, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().slice(0, 10),
    };
    const stored = JSON.parse(localStorage.getItem('axion_behaviour_entries') || '[]');
    stored.unshift(entry);
    localStorage.setItem('axion_behaviour_entries', JSON.stringify(stored));
    queueSyncToDB('axion_behaviour_entries', stored);
    const act = { id: 'act-' + Date.now(), title: `${type === 'positive' ? 'Positive' : 'Behaviour'} update: ${student.name}`, desc: description.trim(), time: 'Just now', timeLabel: 'Just now' };
    setActivities([act, ...activities]);
    showToast(`${effectiveDelta > 0 ? '+' : ''}${effectiveDelta} pts logged`);
    setDescription('');
    setUseCustomPoints(false);
    setCustomPoints('');
    setSelectedPoints(5);
    onClose();
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 480, padding: 0, overflow: 'hidden' }}>
        <div style={{ background: type === 'positive' ? 'linear-gradient(135deg,#16a34a 0%,#22c55e 100%)' : 'linear-gradient(135deg,#dc2626 0%,#ef4444 100%)', padding: '20px 24px 18px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.25)', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>{type === 'positive' ? <ThumbsUp size={20} /> : <AlertTriangle size={20} />} Log Behaviour</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Record student behaviour — affects points and behaviour score</div>
        </div>
        <div style={{ padding: '20px 24px' }}>
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
                <ThumbsUp size={18} style={{ display: 'block', margin: '0 auto 4px' }} /> Positive
              </div>
              <div onClick={() => setType('negative')} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: `2.5px solid ${type === 'negative' ? '#dc2626' : '#d1d5db'}`, background: type === 'negative' ? '#fef2f2' : '#fff', textAlign: 'center', cursor: 'pointer', fontWeight: 800, fontSize: 14, color: type === 'negative' ? '#dc2626' : '#6b7280', transition: 'all .15s' }}>
                <AlertTriangle size={18} style={{ display: 'block', margin: '0 auto 4px' }} /> Negative
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
            <textarea className="form-textarea-m" style={{ minHeight: 70 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Helped a friend with cleanup / Disrupted circle time..." />
          </div>
          <div style={{ padding: '8px 14px', borderRadius: 8, background: type === 'positive' ? '#f0fdf4' : '#fef2f2', fontSize: 12, fontWeight: 700, color: type === 'positive' ? '#16a34a' : '#dc2626', marginTop: 4 }}>
            {effectiveDelta > 0 ? '+' : ''}{effectiveDelta} pts · {pctDelta > 0 ? '+' : ''}{pctDelta}% behaviour
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '14px 24px' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} style={{ background: type === 'positive' ? '#16a34a' : '#dc2626', borderColor: type === 'positive' ? '#16a34a' : '#dc2626' }}>Log Behaviour</button>
        </div>
      </div>
    </div>
  );
}
