import { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function AssignClassModal({ open, onClose }) {
  const { students, teacherClassrooms, saveTeacherClassrooms } = useApp();
  const [selTeacher, setSelTeacher] = useState('');

  const teachers = useMemo(() => {
    const map = {};
    try {
      const profiles = JSON.parse(localStorage.getItem('axion_saved_profiles')) || [];
      profiles.forEach(p => {
        if (p.role === 'teacher' && p.email) map[p.email] = p.name || p.email;
      });
    } catch {}
    return Object.entries(map).sort(([, a], [, b]) => a.localeCompare(b));
  }, []);

  const classrooms = [...new Set(students.map(s => s.class).filter(Boolean))].sort();

  if (!open) return null;

  const currentAssignments = teacherClassrooms[selTeacher] || [];

  const toggleClass = (cls) => {
    const updated = { ...teacherClassrooms };
    const list = [...(updated[selTeacher] || [])];
    const idx = list.indexOf(cls);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(cls);
    if (list.length === 0) delete updated[selTeacher];
    else updated[selTeacher] = list;
    saveTeacherClassrooms(updated);
  };

  const setAll = () => {
    const updated = { ...teacherClassrooms };
    updated[selTeacher] = [...classrooms];
    saveTeacherClassrooms(updated);
  };

  const clearAll = () => {
    const updated = { ...teacherClassrooms };
    delete updated[selTeacher];
    saveTeacherClassrooms(updated);
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 460 }}>
        <div className="modal-title" style={{ marginBottom: 14 }}>Assign Classrooms to Teachers</div>

        <div className="form-group-m">
          <label className="form-label-m">Teacher</label>
          <select className="form-select-m" value={selTeacher} onChange={e => setSelTeacher(e.target.value)}>
            <option value="">Select a teacher...</option>
            {teachers.map(([email, name]) => (
              <option key={email} value={email}>{name} ({email})</option>
            ))}
          </select>
          {teachers.length === 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>No teacher accounts found. Teachers must log in at least once to appear here.</div>
          )}
        </div>

        {selTeacher && (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <button className="btn btn-sm btn-primary" onClick={setAll}>All Classrooms</button>
              <button className="btn btn-sm btn-ghost" onClick={clearAll}>Clear</button>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', fontWeight: 600, alignSelf: 'center' }}>
                {currentAssignments.length} / {classrooms.length} assigned
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {classrooms.map(cls => {
                const checked = currentAssignments.includes(cls);
                return (
                  <div key={cls} onClick={() => toggleClass(cls)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: checked ? 'var(--primary-pale)' : 'var(--surface2)', border: `1.5px solid ${checked ? 'var(--primary)' : 'transparent'}`, transition: 'all .1s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? 'var(--primary)' : 'var(--text3)'}`, background: checked ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: checked ? 800 : 600, color: checked ? 'var(--primary)' : 'var(--text1)' }}>{cls}</div>
                    <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
                      {students.filter(s => s.class === cls).length} students
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="modal-footer" style={{ marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
