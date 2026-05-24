import { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, X, Layers } from 'lucide-react';

export default function ManageClassesModal({ open, onClose }) {
  const { students, teacherClassrooms, getAllClasses, addClass, removeClass } = useApp();
  const [newClassName, setNewClassName] = useState('');

  const classes = useMemo(() => {
    const map = {};
    getAllClasses().forEach(cls => {
      const count = students.filter(s => s.class === cls).length;
      map[cls] = { count };
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [getAllClasses, students]);

  if (!open) return null;

  const getAssignedTeacher = (cls) => {
    const entries = Object.entries(teacherClassrooms);
    const found = entries.find(([, classrooms]) => classrooms && classrooms.includes(cls));
    return found ? found[0] : null;
  };

  const getTeacherName = (email) => {
    try {
      const profiles = JSON.parse(localStorage.getItem('axion_saved_profiles')) || [];
      const p = profiles.find(pr => pr.email === email);
      return p ? p.name : email;
    } catch { return email; }
  };

  const handleAdd = () => {
    addClass(newClassName);
    setNewClassName('');
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <div className="modal-title" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Layers size={20} style={{ color: 'var(--lavender)' }} /> Manage Classes
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="form-input-m" value={newClassName} onChange={e => setNewClassName(e.target.value)}
            placeholder="Enter new class name..." style={{ flex: 1 }}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} />
          <button className="btn btn-sm btn-primary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            <Plus size={14} /> Add Class
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
          {classes.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>No classes yet. Add one above.</div>
          ) : classes.map(([cls, data]) => {
            const teacherEmail = getAssignedTeacher(cls);
            const teacherName = teacherEmail ? getTeacherName(teacherEmail) : null;
            return (
              <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--surface2)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--lavender-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Layers size={16} style={{ color: 'var(--lavender)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{cls}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
                    {data.count} student{data.count !== 1 ? 's' : ''}
                    {teacherName ? ` · Assigned: ${teacherName}` : ''}
                  </div>
                </div>
                {data.count === 0 && (
                  <button onClick={() => removeClass(cls)} style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', padding: 4, opacity: 0.6 }} title="Remove empty class">
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, padding: 12, background: 'var(--primary-pale)', borderRadius: 10, fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
          To add students to a class, use the "Edit Student" option in a student's detail view and select the class from the dropdown.
        </div>

        <div className="modal-footer" style={{ marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
