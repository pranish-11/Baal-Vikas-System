import { useState, useRef, useEffect } from 'react';
import { ClipboardCheck, Calendar, CheckCircle2, Clock, XCircle, CalendarOff, MinusCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const C = {
  present: '#22c55e',
  absent: '#ef4444',
  late: '#f97316',
  leave: '#3b82f6',
};

export default function AttendanceBar({ visibleStudents: propStudents }) {
  const { students: allStudents, attendanceData, openModal, selectedAttendanceDate: selectedDate, setSelectedAttendanceDate: setSelectedDate } = useApp();
  const students = propStudents || allStudents;
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const attRef = useRef(null);
  const calRef = useRef(null);

  const dateStr = selectedDate;
  const rec = attendanceData[dateStr] || {};
  const total = students.length;
  const present = students.filter(s => rec[s.id] === 'present').length;
  const late = students.filter(s => rec[s.id] === 'late').length;
  const absent = students.filter(s => rec[s.id] === 'absent').length;
  const leave = students.filter(s => rec[s.id] === 'leave').length;
  const unmarked = total - present - late - absent - leave;
  const marked = present + late + absent + leave;
  const pct = marked > 0 ? Math.round(((present + late) / marked) * 100) : 0;

  const isToday = dateStr === new Date().toISOString().slice(0, 10);
  const label = isToday ? 'Today' : new Date(dateStr + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const handleClick = (e) => {
      if (calRef.current && !calRef.current.contains(e.target) && attRef.current && !attRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const statusPct = (count) => marked > 0 ? Math.round((count / marked) * 100) : 0;

  return (
    <div style={{ position: 'relative', zIndex: showCalendar ? 20 : undefined }}>
      <div className="card mb-20" id="attendance-bar-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', gap: 12, flexWrap: 'wrap' }}>
          <div ref={attRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ClipboardCheck size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>Attendance</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <Calendar size={11} style={{ color: 'var(--text3)' }} />
                <button id="attendance-date-btn" onClick={() => setShowCalendar(v => !v)}
                  style={{ border: 'none', outline: 'none', fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'transparent', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                  {label}
                </button>
              </div>
            </div>
          </div>

          <div className="att-summary">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: pct >= 80 ? C.present : pct >= 50 ? C.late : C.absent }}>{pct}%</span>
              <span className="att-pill" style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 16,
                background: C.present + '15', color: C.present, fontSize: 11, fontWeight: 800, border: '1px solid ' + C.present + '30',
              }}>
                <CheckCircle2 size={10} />{present} <span style={{ fontWeight: 600, opacity: 0.6 }}>({statusPct(present)}%)</span>
              </span>
              <span className="att-pill" style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 16,
                background: C.late + '15', color: C.late, fontSize: 11, fontWeight: 800, border: '1px solid ' + C.late + '30',
              }}>
                <Clock size={10} />{late} <span style={{ fontWeight: 600, opacity: 0.6 }}>({statusPct(late)}%)</span>
              </span>
              <span className="att-pill" style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 16,
                background: C.absent + '15', color: C.absent, fontSize: 11, fontWeight: 800, border: '1px solid ' + C.absent + '30',
              }}>
                <XCircle size={10} />{absent} <span style={{ fontWeight: 600, opacity: 0.6 }}>({statusPct(absent)}%)</span>
              </span>
              <span className="att-pill" style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 16,
                background: C.leave + '15', color: C.leave, fontSize: 11, fontWeight: 800, border: '1px solid ' + C.leave + '30',
              }}>
                <CalendarOff size={10} />{leave} <span style={{ fontWeight: 600, opacity: 0.6 }}>({statusPct(leave)}%)</span>
              </span>
            </div>
            <div className="att-mark-wrap">
              <button className="att-mark-btn" onClick={() => openModal('attendance', { date: selectedDate })}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, fontFamily: "'Nunito',sans-serif", cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(46,125,107,0.25)' }}>
                <ClipboardCheck size={14} /> Mark
              </button>
            </div>
          </div>
        </div>
      </div>
      {showCalendar && (
        <div ref={calRef} id="attendance-calendar-dropdown" style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 9999, background: 'var(--surface)', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)', padding: 0, overflow: 'hidden', width: 300,
          border: '1px solid var(--border)', marginTop: 6,
        }}>
          <div style={{ background: 'var(--primary)', padding: '14px 16px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else { setCalMonth(calMonth - 1); } }}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{new Date(calYear, calMonth).toLocaleString('default', { month: 'long' })} {calYear}</div>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else { setCalMonth(calMonth + 1); } }}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center' }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.65)', padding: '2px 0' }}>{d}</div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, padding: '8px 10px 4px', background: 'var(--surface)' }}>
            {Array.from({ length: firstDay }).map((_, idx) => <div key={`e${idx}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSel = ds === selectedDate;
              const isToday = ds === new Date().toISOString().slice(0, 10);
              const dayRec = attendanceData[ds];
              const vals = dayRec ? Object.values(dayRec).filter(Boolean) : [];
              const hasAbsent = vals.includes('absent');
              const allPresent = vals.length > 0 && vals.every(s => s === 'present');
              const dotColor = hasAbsent ? C.absent : allPresent ? C.present : vals.length > 0 ? C.late : null;
              return (
                <div key={day} onClick={() => { setSelectedDate(ds); setShowCalendar(false); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, borderRadius: 8,
                    background: isSel ? 'var(--primary)' : isToday ? 'var(--primary-pale)' : 'transparent',
                    color: isSel ? '#fff' : isToday ? 'var(--primary)' : 'var(--text)',
                    fontSize: 11, fontWeight: isSel || isToday ? 900 : 700,
                    cursor: 'pointer', border: isToday && !isSel ? '2px solid var(--primary)' : 'none',
                    boxShadow: isToday && !isSel ? '0 0 0 3px rgba(46,125,107,0.15)' : 'none',
                    transition: 'background .12s', margin: '0 auto', position: 'relative',
                  }}>
                  {day}
                  {dotColor && <div style={{ position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: '50%', background: dotColor }} />}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px 10px', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => { const t = new Date().toISOString().slice(0, 10); setSelectedDate(t); setCalMonth(new Date().getMonth()); setCalYear(new Date().getFullYear()); setShowCalendar(false); }}
              style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-pale)', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>Today</button>
            <button onClick={() => setShowCalendar(false)} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
