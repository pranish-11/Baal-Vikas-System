import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { ClipboardCheck, Calendar, CheckCircle2, Clock, XCircle, CalendarOff, Save, Layers, RefreshCw } from 'lucide-react';

export default function AttendanceModal({ open, onClose, data }) {
  const { students, attendanceData, todayStr, saveAttendance, currentRole, user, getTeacherClassrooms } = useApp();
  const dateStr = data?.date || todayStr();
  const [draft, setDraft] = useState({});

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft({ ...(attendanceData[dateStr] || {}) });
    }
  }, [open, dateStr, attendanceData]);

  const setStatus = (studentId, status) => {
    setDraft(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const newDraft = {};
    visibleStudents.forEach(s => { newDraft[s.id] = status; });
    setDraft(newDraft);
  };

  const resetAll = () => {
    setDraft({});
  };

  const statuses = {
    present: { label: 'Present', icon: CheckCircle2, bg: '#f0fdf4', col: '#15803d', border: '#22c55e' },
    late: { label: 'Late', icon: Clock, bg: '#fff7ed', col: '#9a3412', border: '#f97316' },
    absent: { label: 'Absent', icon: XCircle, bg: '#fef2f2', col: '#991b1b', border: '#ef4444' },
    leave: { label: 'Leave', icon: CalendarOff, bg: '#faf5ff', col: '#6b21a8', border: '#a855f7' },
  };

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

  const dateDisplay = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  if (!open) return null;

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 580, padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ background: 'linear-gradient(135deg,var(--primary) 0%,var(--primary-light) 100%)', padding: '24px 28px 20px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.18)', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardCheck size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>Mark Attendance</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginTop: 2 }}>
                <Calendar size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
                {dateDisplay}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, fontWeight: 800 }}>
              <CheckCircle2 size={12} />{present} Present
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: 'rgba(249,115,22,0.3)', color: '#fff', fontSize: 12, fontWeight: 800 }}>
              <Clock size={12} />{late} Late
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: 'rgba(239,68,68,0.3)', color: '#fff', fontSize: 12, fontWeight: 800 }}>
              <XCircle size={12} />{absent} Absent
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: 'rgba(168,85,247,0.3)', color: '#fff', fontSize: 12, fontWeight: 800 }}>
              <CalendarOff size={12} />{leave} Leave
            </span>
            {unmarked > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 800 }}>
                <span>—</span>{unmarked} Unmarked
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .6, color: 'var(--text3)', marginRight: 4 }}>Quick set:</span>
          {[
            { label: 'All Present', status: 'present', bg: '#f0fdf4', col: '#15803d', border: '#22c55e', icon: CheckCircle2 },
            { label: 'All Late', status: 'late', bg: '#fff7ed', col: '#9a3412', border: '#f97316', icon: Clock },
            { label: 'All Absent', status: 'absent', bg: '#fef2f2', col: '#991b1b', border: '#ef4444', icon: XCircle },
            { label: 'All Leave', status: 'leave', bg: '#faf5ff', col: '#6b21a8', border: '#a855f7', icon: CalendarOff },
          ].map(b => {
            const Icon = b.icon;
            return (
              <button key={b.status} onClick={() => markAll(b.status)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: b.bg, color: b.col, border: `1.5px solid ${b.border}`, borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", transition: 'all .15s' }}>
                <Icon size={13} /> {b.label}
              </button>
            );
          })}
          <button onClick={resetAll}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'var(--surface)', color: 'var(--text3)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
            <RefreshCw size={12} /> Reset
          </button>
        </div>

        <div style={{ maxHeight: 420, overflowY: 'auto', padding: '16px 20px', background: 'var(--bg)' }}>
          {currentRole === 'admin' ? (
            classGroups.map(([cls, classStudents]) => (
              <div key={cls} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 2px', marginBottom: 6, position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
                  <Layers size={14} style={{ color: 'var(--lavender)' }} />
                  <span style={{ fontSize: 12, fontWeight: 800 }}>{cls}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{classStudents.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {classStudents.map(s => {
                    const current = draft[s.id] || null;
                    const rowBg = current === 'absent' ? '#fef2f2' : current === 'late' ? '#fff7ed' : 'var(--surface)';
                    const leftAccent = current === 'absent' ? '#ef4444' : current === 'late' ? '#f97316' : current === 'present' ? '#22c55e' : 'transparent';
                    return (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: rowBg, border: '1.5px solid var(--border)', borderLeft: leftAccent !== 'transparent' ? `4px solid ${leftAccent}` : '1.5px solid var(--border)', transition: 'all .15s' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.bg || 'var(--primary-pale)', color: s.col || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{s.init}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{s.class}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {['present', 'late', 'absent', 'leave'].map(st => {
                            const m = statuses[st];
                            const active = current === st;
                            const Icon = m.icon;
                            return (
                              <button key={st} onClick={() => setStatus(s.id, st)}
                                style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 8px', borderRadius: 8, fontSize: 10, fontWeight: 800, cursor: 'pointer', transition: 'all .15s', fontFamily: "'Nunito',sans-serif", border: `1.5px solid ${active ? m.border : 'var(--border)'}`, background: active ? m.bg : 'var(--surface)', color: active ? m.col : 'var(--text3)', boxShadow: active ? `0 2px 6px ${m.border}55` : 'none' }}>
                                <Icon size={10} />{m.label}
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
              const rowBg = current === 'absent' ? '#fff8f8' : current === 'late' ? '#fffdf5' : 'var(--surface)';
              const leftAccent = current === 'absent' ? '#e11d48' : current === 'late' ? '#F4A929' : current === 'present' ? '#16a34a' : 'transparent';
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: rowBg, border: '1.5px solid var(--border)', borderLeft: leftAccent !== 'transparent' ? `4px solid ${leftAccent}` : '1.5px solid var(--border)', transition: 'all .15s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.bg || 'var(--primary-pale)', color: s.col || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{s.init}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{s.class}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {['present', 'late', 'absent', 'leave'].map(st => {
                      const m = statuses[st];
                      const active = current === st;
                      const Icon = m.icon;
                      return (
                        <button key={st} onClick={() => setStatus(s.id, st)}
                          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 8px', borderRadius: 8, fontSize: 10, fontWeight: 800, cursor: 'pointer', transition: 'all .15s', fontFamily: "'Nunito',sans-serif", border: `1.5px solid ${active ? m.border : 'var(--border)'}`, background: active ? m.bg : 'var(--surface)', color: active ? m.col : 'var(--text3)', boxShadow: active ? `0 2px 6px ${m.border}55` : 'none' }}>
                          <Icon size={10} />{m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>
            {unmarked < visibleStudents.length ? `${present + late} attending · ${absent} absent` : 'No students marked yet'}
          </div>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button onClick={() => saveAttendance(dateStr, draft)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, fontFamily: "'Nunito',sans-serif", cursor: 'pointer', transition: 'all .2s', boxShadow: '0 2px 8px rgba(46,125,107,0.25)' }}>
            <Save size={15} /> Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
}