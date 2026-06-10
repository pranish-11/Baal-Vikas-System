import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function TeacherSummaryModal({ open, onClose }) {
  const { students, currentRole, user, getTeacherClassrooms } = useApp();
  const [selStudent, setSelStudent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [activities, setActivities] = useState('');
  const [observations, setObservations] = useState('');
  const [mood, setMood] = useState('good');
  const [generated, setGenerated] = useState('');
  const allSummariesRef = useRef({});

  const classStudents = currentRole === 'teacher'
    ? (() => {
        const assigned = getTeacherClassrooms(user?.email);
        return assigned ? students.filter(s => assigned.includes(s.class)) : students;
      })()
    : students;

  useEffect(() => {
    if (open) {
      setSelStudent('');
      setDate(new Date().toISOString().slice(0, 10));
      setActivities('');
      setObservations('');
      setMood('good');
      setGenerated('');
    }
  }, [open]);

  const generateSummary = () => {
    const student = students.find(s => s.id === selStudent);
    if (!student) return;
    const today = date || 'today';
    const moodText = mood === 'great' ? 'had a wonderful day' : mood === 'good' ? 'had a good day' : mood === 'okay' ? 'had an okay day' : 'had a challenging day';
    let text = `${student.name} ${moodText} on ${today}.`;
    if (activities) text += ` Activities: ${activities}.`;
    if (observations) text += ` Observations: ${observations}.`;
    text += ` Overall, ${student.name} is showing ${student.pct >= 80 ? 'excellent' : student.pct >= 50 ? 'fair' : 'needs attention'} behavior in class.`;
    setGenerated(text);
  };

  const saveSummary = () => {
    if (!selStudent || !generated) return;
    if (!allSummariesRef.current[selStudent]) allSummariesRef.current[selStudent] = [];
    allSummariesRef.current[selStudent].unshift({ date: date || 'Unknown', summary: generated, timestamp: Date.now() });
    onClose();
  };

  const allSummaries = allSummariesRef.current;

  if (!open) return null;

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <div className="modal-title" style={{ marginBottom: 14 }}>Daily Observation Summary</div>

        <div className="form-group-m">
          <label className="form-label-m">Student</label>
          <select className="form-select-m" value={selStudent} onChange={e => setSelStudent(e.target.value)}>
            <option value="">Select a student...</option>
            {classStudents.map(s => <option key={s.id} value={s.id}>{s.name} — {s.class}</option>)}
          </select>
        </div>

        <div className="form-group-m">
          <label className="form-label-m">Date</label>
          <input className="form-input-m" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="form-group-m">
          <label className="form-label-m">Day Rating</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: 'great', label: 'Great', color: 'var(--primary)' },
              { key: 'good', label: 'Good', color: 'var(--sky)' },
              { key: 'okay', label: 'Okay', color: 'var(--gold-pale)' },
              { key: 'tough', label: 'Tough', color: 'var(--coral)' },
            ].map(r => (
              <div key={r.key} onClick={() => setMood(r.key)}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: mood === r.key ? r.color : 'var(--surface2)', color: mood === r.key ? '#fff' : 'var(--text3)', transition: 'all .12s' }}>
                {r.label}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group-m">
          <label className="form-label-m">Activities (what the student worked on)</label>
          <textarea className="form-textarea-m" rows={2} value={activities} onChange={e => setActivities(e.target.value)} placeholder="Reading, math, art project..." />
        </div>

        <div className="form-group-m">
          <label className="form-label-m">Observations (behavior, participation, notes)</label>
          <textarea className="form-textarea-m" rows={2} value={observations} onChange={e => setObservations(e.target.value)} placeholder="Social interactions, focus, notable moments..." />
        </div>

        {selStudent && (
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={generateSummary}>
            Generate Summary
          </button>
        )}

        {generated && (
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--primary-pale)', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Generated Summary</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text1)' }}>{generated}</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={saveSummary}>Save Summary</button>
          </div>
        )}

        {selStudent && allSummaries[selStudent]?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Previous Summaries</div>
            {allSummaries[selStudent].slice(0, 5).map((s, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--surface2)', marginBottom: 4, fontSize: 12, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: 'var(--text2)', marginBottom: 2 }}>{s.date}</div>
                {s.summary}
              </div>
            ))}
          </div>
        )}

        <div className="modal-footer" style={{ marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
