import { useRef, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { AlertTriangle, ThumbsUp, Trash2 } from 'lucide-react';
import { queueSyncToDB } from '../../utils/dbSync';

function getStudentAvatar(studentId) {
  try { return JSON.parse(localStorage.getItem('axion_student_avatars'))?.[studentId] || null; } catch { return null; }
}

function setStudentAvatar(studentId, dataUrl) {
  try {
    const all = JSON.parse(localStorage.getItem('axion_student_avatars')) || {};
    if (dataUrl) all[studentId] = dataUrl;
    else delete all[studentId];
    localStorage.setItem('axion_student_avatars', JSON.stringify(all));
    queueSyncToDB('axion_student_avatars', all);
  } catch {}
}

function getBehaviourEntries(studentId) {
  try { return JSON.parse(localStorage.getItem('axion_behaviour_entries'))?.filter(e => e.studentId === studentId) || []; } catch { return []; }
}

function getDayScores(studentId) {
  const entries = getBehaviourEntries(studentId);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const scores = dayNames.map((_, di) => {
    const d = new Date(today);
    d.setDate(d.getDate() - mondayOffset + di);
    const dateStr = d.toISOString().slice(0, 10);
    const dayEntries = entries.filter(e => e.date === dateStr);
    const base = dayEntries.reduce((sum, e) => sum + (e.ptsDelta || 0), 0);
    return { score: Math.max(40, Math.min(100, 80 + base * 2)), entries: dayEntries };
  });
  return scores;
}

export default function StudentDetailModal({ open, onClose }) {
  const { students, currentStudentFilter, openModal, showToast, deleteStudent, submitEditStudent, getAllClasses } = useApp();
  const fileRef = useRef(null);
  const [avatarKey, setAvatarKey] = useState(0);
  const [showTimeline, setShowTimeline] = useState(null);
  const [changingClass, setChangingClass] = useState(false);
  const [newClass, setNewClass] = useState('');

  const allClasses = getAllClasses();

  if (!open) return null;

  const student = students.find(s => s.id === currentStudentFilter) || students[0];
  if (!student) return null;

  const avatarSrc = getStudentAvatar(student.id);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setStudentAvatar(student.id, ev.target.result);
      setAvatarKey(k => k + 1);
      showToast('Photo updated');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removePhoto = () => {
    setStudentAvatar(student.id, null);
    setAvatarKey(k => k + 1);
    showToast('Photo removed');
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const dayScores = getDayScores(student.id);
  const avg = Math.round(dayScores.reduce((a, b) => a.score + b.score, 0) / 5);
  const perfLabel = avg >= 90 ? 'Excellent' : avg >= 70 ? 'Good' : 'Needs Attention';

  const handleDelete = () => {
    if (window.confirm(`Remove ${student.name}? This cannot be undone.`)) {
      deleteStudent(student.id, student.name);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 520, padding: 0, overflow: 'hidden' }}>
        <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
        <div style={{ background: `linear-gradient(135deg,${student.bg || 'var(--primary)'} 0%,${(student.bg || 'var(--primary)')}dd 100%)`, padding: '24px 28px 20px', textAlign: 'center', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.2)', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>X</button>
          <div onClick={() => fileRef.current?.click()} style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', color: student.col || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, margin: '0 auto 8px', cursor: 'pointer', overflow: 'hidden', position: 'relative' }} title="Click to upload photo">
            {avatarSrc ? <img src={avatarSrc} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : student.init}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 9, padding: '2px 0', fontWeight: 700 }}>Edit</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{student.name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{student.class} · Age {student.age}</div>
        </div>
        <div style={{ padding: 20 }}>
          {avatarSrc && (
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <span onClick={removePhoto} style={{ fontSize: 11, color: 'var(--coral)', cursor: 'pointer', fontWeight: 600 }}>Remove photo</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { val: student.pts, label: 'Points' },
              { val: `#${student.rank}`, label: 'Rank' },
              { val: student.class, label: 'Class' },
              { val: `${student.pct}%`, label: 'Behavior' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '10px 4px', background: 'var(--surface2)', borderRadius: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .6, color: 'var(--text3)', marginBottom: 10 }}>Weekly Behavior <span style={{ fontWeight: 600, color: 'var(--text3)', textTransform: 'none' }}>— click a day for details</span></div>
          {days.map((d, i) => {
            const ds = dayScores[i];
            const hasEntries = ds.entries.length > 0;
            return (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: hasEntries ? 'pointer' : 'default' }} onClick={() => hasEntries ? setShowTimeline(showTimeline === i ? null : i) : null}>
                <div style={{ width: 28, fontSize: 12, fontWeight: 700, color: 'var(--text3)' }}>{d}</div>
                <div className="stu-bar-wrap" style={{ flex: 1, height: 8 }}>
                  <div className="stu-bar" style={{ width: `${ds.score}%`, background: ds.score >= 85 ? 'var(--primary)' : ds.score >= 60 ? 'var(--sky)' : 'var(--coral)' }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: ds.score >= 85 ? 'var(--primary)' : ds.score >= 60 ? 'var(--sky)' : 'var(--coral)', minWidth: 32, textAlign: 'right' }}>{ds.score}%</div>
              </div>
            );
          })}
          {showTimeline !== null && dayScores[showTimeline]?.entries.length > 0 && (
            <div style={{ marginTop: 8, marginBottom: 10, padding: 10, background: 'var(--surface2)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', marginBottom: 6 }}>{days[showTimeline]} — Behaviour Timeline</div>
              {dayScores[showTimeline].entries.map((e, ei) => (
                <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
                  {e.ptsDelta > 0 ? <ThumbsUp size={14} style={{ color: '#16a34a', flexShrink: 0 }} /> : <AlertTriangle size={14} style={{ color: '#dc2626', flexShrink: 0 }} />}
                  <span style={{ flex: 1 }}>{e.description}</span>
                  <span style={{ color: e.ptsDelta > 0 ? '#16a34a' : '#dc2626', fontWeight: 800 }}>{e.ptsDelta > 0 ? '+' : ''}{e.ptsDelta}</span>
                  <span style={{ color: 'var(--text3)', fontSize: 10 }}>{e.time}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 12, padding: 10, background: 'var(--primary-pale)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--primary)', textAlign: 'center' }}>
            Weekly Average: {avg}% — {perfLabel}
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Class</div>
              {changingClass ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <select className="form-select-m" value={newClass} onChange={e => setNewClass(e.target.value)}
                    style={{ flex: 1, fontSize: 12, padding: '4px 8px' }}>
                    {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button className="btn btn-sm" style={{ fontSize: 11, padding: '4px 10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => {
                      if (newClass && newClass !== student.class) {
                        submitEditStudent(student.id, { className: newClass });
                        showToast(`${student.name} moved to ${newClass}`);
                      }
                      setChangingClass(false);
                    }}>Save</button>
                  <button className="btn btn-sm" style={{ fontSize: 11, padding: '4px 10px', background: 'none', color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => setChangingClass(false)}>Cancel</button>
                </div>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => { setNewClass(student.class); setChangingClass(true); }}>
                  {student.class}
                  <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>Change</span>
                </div>
              )}
            </div>
          </div>
          {student.parentName && (
            <div style={{ marginTop: 10, padding: 12, background: 'var(--surface2)', borderRadius: 10, fontSize: 13 }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Parent / Guardian</div>
              <div style={{ color: 'var(--text2)', fontWeight: 600 }}>{student.parentName}{student.parentEmail ? ` · ${student.parentEmail}` : ''}</div>
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ padding: '14px 20px', justifyContent: 'space-between' }}>
          <button className="btn btn-sm" onClick={handleDelete} style={{ background: 'var(--coral-pale)', color: 'var(--coral)', border: '1.5px solid var(--coral)', fontWeight: 800, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Trash2 size={14} /> Remove Student</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => openModal('editStudent')}>Edit Student</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
