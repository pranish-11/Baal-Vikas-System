import { useRef, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Trash2 } from 'lucide-react';

export default function StudentDetailModal({ open, onClose }) {
  const { students, currentStudentFilter, openModal, showToast, deleteStudent, submitEditStudent, getAllClasses } = useApp();
  const [changingClass, setChangingClass] = useState(false);
  const [newClass, setNewClass] = useState('');

  const allClasses = getAllClasses();

  if (!open) return null;

  const student = students.find(s => s.id === currentStudentFilter) || students[0];
  if (!student) return null;

  const handleDelete = () => {
    if (window.confirm(`Remove ${student.name}? This cannot be undone.`)) {
      deleteStudent(student.id, student.name);
      onClose();
    }
  };

  const mainClass = student.class.includes('—') ? student.class.split('—')[1]?.trim() || student.class : student.class;

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 480, padding: 0 }}>
        <div style={{ background: `linear-gradient(135deg,${student.bg || 'var(--primary)'} 0%,${(student.bg || 'var(--primary)')}dd 100%)`, padding: '24px 28px 20px', textAlign: 'center', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'rgba(255,255,255,0.25)', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>X</button>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', color: student.col || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, margin: '0 auto 10px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {student.init}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{student.name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: 2 }}>{mainClass} · Age {student.age}</div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { val: student.pts, label: 'Points', col: 'var(--primary)' },
              { val: `#${student.rank}`, label: 'Rank', col: 'var(--gold)' },
              { val: `${student.pct}%`, label: 'Behavior', col: 'var(--sky)' },
              { val: `${student.pct}%`, label: 'Weekly Avg', col: 'var(--coral)' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.col }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Class</div>
              {changingClass ? (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <select className="form-select-m" value={newClass} onChange={e => setNewClass(e.target.value)}
                    style={{ flex: 1, fontSize: 12, padding: '4px 8px' }}>
                    {allClasses.map(c => <option key={c} value={c}>{c.includes('—') ? c.split('—')[1]?.trim() || c : c}</option>)}
                  </select>
                  <button style={{ fontSize: 11, padding: '4px 10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => { if (newClass && newClass !== student.class) { submitEditStudent(student.id, { className: newClass }); showToast(`Moved to ${newClass.includes('—') ? newClass.split('—')[1]?.trim() || newClass : newClass}`); } setChangingClass(false); }}>Save</button>
                </div>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}
                  onClick={() => { setNewClass(student.class); setChangingClass(true); }}>
                  {mainClass}
                  <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>Change</span>
                </div>
              )}
            </div>
            {student.parentName && (
              <div style={{ flex: 1, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Parent</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{student.parentName}</div>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '14px 24px', justifyContent: 'space-between', marginTop: 0, borderTop: '1px solid var(--border)' }}>
          <button onClick={handleDelete} style={{ background: 'var(--coral-pale)', color: 'var(--coral)', border: '1.5px solid var(--coral)', fontWeight: 700, padding: '8px 18px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><Trash2 size={14} /> Remove</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => openModal('editStudent')} style={{ fontSize: 13, fontWeight: 600 }}>Edit</button>
            <button className="btn btn-primary btn-sm" onClick={onClose} style={{ fontSize: 13 }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
