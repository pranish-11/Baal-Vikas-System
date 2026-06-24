import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { ClipboardCheck, Calendar, CheckCircle2, Clock, XCircle, CalendarOff, Save, Layers, RefreshCw } from 'lucide-react';

const STATUSES = {
  present: { label: 'Present', icon: CheckCircle2, color: '#22c55e', bg: '#f0fdf4', border: '#22c55e' },
  late: { label: 'Late', icon: Clock, color: '#f97316', bg: '#fff7ed', border: '#f97316' },
  absent: { label: 'Absent', icon: XCircle, color: '#ef4444', bg: '#fef2f2', border: '#ef4444' },
  leave: { label: 'Leave', icon: CalendarOff, color: '#3b82f6', bg: '#eff6ff', border: '#3b82f6' },
};

export default function AttendanceModal({ open, onClose, data }) {
  const { students, attendanceData, todayStr, saveAttendance, currentRole, user, getTeacherClassrooms } = useApp();
  const dateStr = data?.date || todayStr();
  const [draft, setDraft] = useState({});

  useEffect(() => {
    if (open) {
      setDraft({ ...(attendanceData[dateStr] || {}) });
    }
  }, [open, dateStr, attendanceData]);

  const setStatus = (studentId, status) => {
    setDraft(prev => ({ ...prev, [studentId]: prev[studentId] === status ? null : status }));
  };

  const markAll = (status) => {
    const newDraft = {};
    visibleStudents.forEach(s => { newDraft[s.id] = status; });
    setDraft(newDraft);
  };

  const resetAll = () => setDraft({});

  const teacherAssigned = currentRole === 'teacher' ? getTeacherClassrooms(user?.email) : null;
  let visibleStudents = students;
  if (teacherAssigned) visibleStudents = students.filter(s => teacherAssigned.includes(s.class));

  const vals = Object.values(draft);
  const present = vals.filter(v => v === 'present').length;
  const late = vals.filter(v => v === 'late').length;
  const absent = vals.filter(v => v === 'absent').length;
  const leave = vals.filter(v => v === 'leave').length;
  const unmarked = visibleStudents.length - present - late - absent - leave;

  const classGroups = useMemo(() => {
    const groups = {};
    visibleStudents.forEach(s => {
      const cls = s.class || 'Unassigned';
      if (!groups[cls]) groups[cls] = [];
      groups[cls].push(s);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [visibleStudents]);

  if (!open) return null;

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 560, padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ background: 'var(--primary)', padding: '20px 24px 16px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.18)', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardCheck size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Mark Attendance</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginTop: 1 }}>
                <Calendar size={11} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
                {new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { label: `${present} Present`, count: present, key: 'present', color: '#22c55e' },
              { label: `${late} Late`, count: late, key: 'late', color: '#f97316' },
              { label: `${absent} Absent`, count: absent, key: 'absent', color: '#ef4444' },
              { label: `${leave} Leave`, count: leave, key: 'leave', color: '#3b82f6' },
            ].map(s => s.count > 0 && (
              <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 14, background: s.color + '30', color: '#fff', fontSize: 11, fontWeight: 800 }}>
                {s.label}
              </span>
            ))}
            {unmarked > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 14, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 800 }}>
                {unmarked} Unmarked
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)' }}>Quick:</span>
          {Object.entries(STATUSES).map(([k, v]) => (
            <button key={k} onClick={() => markAll(k)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: v.bg, color: v.color, border: `1.5px solid ${v.border}`, borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
              <v.icon size={11} /> All {v.label}
            </button>
          ))}
          <button onClick={resetAll}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--surface)', color: 'var(--text3)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
            <RefreshCw size={11} /> Reset
          </button>
        </div>

        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '12px 16px', background: 'var(--bg)' }}>
          {currentRole === 'admin' ? (
            classGroups.map(([cls, classStudents]) => (
              <div key={cls} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 2px', marginBottom: 4, position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
                  <Layers size={13} style={{ color: 'var(--lavender)' }} />
                  <span style={{ fontSize: 11, fontWeight: 800 }}>{cls}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{classStudents.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {classStudents.map(s => {
                    const current = draft[s.id] || null;
                    return (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'var(--surface)', border: '1.5px solid var(--border)', transition: 'all .12s' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.bg || 'var(--primary-pale)', color: s.col || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{s.init}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>{s.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{s.class}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {['present', 'late', 'absent', 'leave'].map(st => {
                            const m = STATUSES[st];
                            const active = current === st;
                            const Icon = m.icon;
                            return (
                              <button key={st} onClick={() => setStatus(s.id, st)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 2, padding: '4px 7px', borderRadius: 6,
                                  fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
                                  border: `1.5px solid ${active ? m.border : 'var(--border)'}`,
                                  background: active ? m.bg : 'var(--surface2)',
                                  color: active ? m.color : 'var(--text3)',
                                  transition: 'all .12s',
                                }}>
                                <Icon size={9} />{m.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            visibleStudents.map(s => {
              const current = draft[s.id] || null;
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'var(--surface)', border: '1.5px solid var(--border)', marginBottom: 4, transition: 'all .12s' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.bg || 'var(--primary-pale)', color: s.col || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{s.init}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{s.class}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {['present', 'late', 'absent', 'leave'].map(st => {
                      const m = STATUSES[st];
                      const active = current === st;
                      const Icon = m.icon;
                      return (
                        <button key={st} onClick={() => setStatus(s.id, st)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 2, padding: '4px 7px', borderRadius: 6,
                            fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
                            border: `1.5px solid ${active ? m.border : 'var(--border)'}`,
                            background: active ? m.bg : 'var(--surface2)',
                            color: active ? m.color : 'var(--text3)',
                            transition: 'all .12s',
                          }}>
                          <Icon size={9} />{m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '12px 18px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>
            {unmarked < visibleStudents.length ? `${present + late} attending · ${absent} absent` : 'No students marked yet'}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button onClick={() => saveAttendance(dateStr, draft)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, fontFamily: "'Nunito',sans-serif", cursor: 'pointer', boxShadow: '0 2px 8px rgba(46,125,107,0.25)' }}>
            <Save size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
