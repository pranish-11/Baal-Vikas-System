import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { School, Check, BookOpen, Users } from 'lucide-react';
import { requestJSON } from '../../api';
import { API_BASE } from '../../config';

export default function AssignClassModal({ open, onClose }) {
  const { students, teacherClassrooms, saveTeacherClassrooms } = useApp();
  const [selTeacher, setSelTeacher] = useState('');
  const [teachers, setTeachers] = useState([]);

  // Fetch teachers from the backend so all devices see the full list
  useEffect(() => {
    if (!open) return;
    requestJSON(`${API_BASE}/users?role=TEACHER`)
      .then(res => {
        if (res && res.users) {
          const entries = res.users.map(u => [u.email, u.name || u.email]);
          setTeachers(entries.sort(([, a], [, b]) => a.localeCompare(b)));
        }
      })
      .catch(() => {
        // Fallback to saved profiles in localStorage if API fails
        try {
          const profiles = JSON.parse(localStorage.getItem('axion_saved_profiles')) || [];
          const map = {};
          profiles.forEach(p => {
            if (p.role === 'teacher' && p.email) map[p.email] = p.name || p.email;
          });
          setTeachers(Object.entries(map).sort(([, a], [, b]) => a.localeCompare(b)));
        } catch {}
      });
  }, [open]);

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
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--lavender-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={18} style={{ color: 'var(--lavender)' }} />
          </div>
          <div>
            <div className="modal-title" style={{ marginBottom: 2 }}>Assign Classrooms</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>Select a teacher and choose their classrooms</div>
          </div>
        </div>

        <div className="form-group-m">
          <label className="form-label-m">Teacher</label>
          {teachers.length === 0 ? (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--sky-pale)', fontSize: 12, color: 'var(--sky)', fontWeight: 600, border: '1px solid rgba(74,140,196,0.2)' }}>
              No teacher accounts found. Teachers must log in at least once to appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'var(--border2) transparent' }}>
              {teachers.map(([email, name]) => {
                const active = email === selTeacher;
                return (
                  <div key={email} onClick={() => setSelTeacher(email)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
                      cursor: 'pointer', transition: 'all .15s',
                      background: active ? 'var(--sky-pale)' : '#fff',
                      border: `1.5px solid ${active ? 'var(--sky)' : 'var(--border)'}`,
                    }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'var(--sky-pale)', color: 'var(--sky)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, flexShrink: 0,
                    }}>
                      {(name || email).substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: active ? 800 : 700, color: active ? 'var(--sky)' : 'var(--text)' }}>{name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{email}</div>
                    </div>
                    {active && <Check size={14} style={{ color: 'var(--sky)', flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selTeacher && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 }}>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <School size={13} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
                Classrooms
              </div>
              <button className="btn btn-sm btn-primary" onClick={setAll} style={{ fontSize: 11, padding: '5px 12px' }}>All</button>
              <button className="btn btn-sm btn-ghost" onClick={clearAll} style={{ fontSize: 11, padding: '5px 12px' }}>Clear</button>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, background: 'var(--surface2)', padding: '4px 10px', borderRadius: 6 }}>
                {currentAssignments.length}/{classrooms.length}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'var(--border2) transparent' }}>
              {classrooms.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>
                  No classrooms available. Create classes first in Manage Classes.
                </div>
              ) : classrooms.map(cls => {
                const checked = currentAssignments.includes(cls);
                const count = students.filter(s => s.class === cls).length;
                return (
                  <div key={cls} onClick={() => toggleClass(cls)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10,
                      cursor: 'pointer', transition: 'all .15s',
                      background: checked ? 'var(--primary-pale)' : '#fff',
                      border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                    }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6,
                      border: `2px solid ${checked ? 'var(--primary)' : 'var(--text3)'}`,
                      background: checked ? 'var(--primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      transition: 'all .15s',
                    }}>
                      {checked && <Check size={12} strokeWidth={3} style={{ color: '#fff' }} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: checked ? 'rgba(46,125,107,0.12)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <School size={14} style={{ color: checked ? 'var(--primary)' : 'var(--text3)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: checked ? 800 : 600, color: checked ? 'var(--primary)' : 'var(--text)' }}>{cls}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3)', fontWeight: 600, flexShrink: 0 }}>
                      <Users size={12} />
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="modal-footer" style={{ marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '9px 20px' }}>Done</button>
        </div>
      </div>
    </div>
  );
}
