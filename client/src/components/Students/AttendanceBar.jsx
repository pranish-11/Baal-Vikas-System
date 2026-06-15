import { useState, useRef, useEffect } from 'react';
import { ClipboardCheck, Calendar, CheckCircle2, Clock, XCircle, CalendarOff, MinusCircle, TrendingUp } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

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

  const toggleCalendar = () => setShowCalendar(v => !v);

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

  return (
    <div style={{ position: 'relative', zIndex: showCalendar ? 20 : undefined }}>
      <div className="card mb-20" id="attendance-bar-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', gap: 16, flexWrap: 'wrap' }}>
          <div ref={attRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ClipboardCheck size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Attendance</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <Calendar size={12} style={{ color: 'var(--text3)' }} />
                <button id="attendance-date-btn" onClick={toggleCalendar}
                  style={{ border: 'none', outline: 'none', fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'transparent', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                  {label}
                </button>
              </div>
            </div>
          </div>
          <div id="attendance-summary-bar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {!total || !marked ? (
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>No attendance recorded yet</span>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 4 }}>
                  <TrendingUp size={14} style={{ color: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f97316' : '#ef4444' }} />
                  <span style={{ fontSize: 14, fontWeight: 900, color: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f97316' : '#ef4444' }}>{pct}%</span>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: '#f0fdf4', color: '#15803d', fontSize: 12, fontWeight: 800, border: '1.5px solid #22c55e' }}>
                  <CheckCircle2 size={12} />{present} <span style={{ fontWeight: 600, opacity: 0.7 }}>({marked > 0 ? Math.round(present / marked * 100) : 0}%)</span>
                </span>
                {late > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: '#fff7ed', color: '#9a3412', fontSize: 12, fontWeight: 800, border: '1.5px solid #f97316' }}>
                  <Clock size={12} />{late} <span style={{ fontWeight: 600, opacity: 0.7 }}>({marked > 0 ? Math.round(late / marked * 100) : 0}%)</span>
                </span>}
                {absent > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: '#fef2f2', color: '#991b1b', fontSize: 12, fontWeight: 800, border: '1.5px solid #ef4444' }}>
                  <XCircle size={12} />{absent} <span style={{ fontWeight: 600, opacity: 0.7 }}>({marked > 0 ? Math.round(absent / marked * 100) : 0}%)</span>
                </span>}
                {leave > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: '#faf5ff', color: '#6b21a8', fontSize: 12, fontWeight: 800, border: '1.5px solid #a855f7' }}>
                  <CalendarOff size={12} />{leave} <span style={{ fontWeight: 600, opacity: 0.7 }}>({marked > 0 ? Math.round(leave / marked * 100) : 0}%)</span>
                </span>}
                {unmarked > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: 'var(--surface2)', color: 'var(--text3)', fontSize: 12, fontWeight: 800, border: '1.5px solid var(--border)' }}>
                  <MinusCircle size={12} />{unmarked} Unmarked
                </span>}
              </>
            )}
            <button onClick={() => openModal('attendance', { date: selectedDate })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, fontFamily: "'Nunito',sans-serif", cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(46,125,107,0.25)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#256b59'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <ClipboardCheck size={15} /> Mark Attendance
            </button>
          </div>
        </div>
      </div>
      {showCalendar && (
        <div ref={calRef} id="attendance-calendar-dropdown" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999, background: 'var(--surface)', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', padding: 0, overflow: 'hidden', width: 308, border: '1px solid var(--border)', marginTop: 8 }}>
          <div style={{ background: 'linear-gradient(135deg,var(--primary) 0%,var(--primary-light) 100%)', padding: '16px 18px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else { setCalMonth(calMonth - 1); } }} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{new Date(calYear, calMonth).toLocaleString('default', { month: 'long' })} {calYear}</div>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else { setCalMonth(calMonth + 1); } }} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center' }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.65)', padding: '2px 0' }}>{d}</div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, padding: '10px 12px 6px', background: 'var(--surface)' }}>
            {Array.from({ length: firstDay }).map((_, idx) => <div key={`e${idx}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const mm = ((calMonth + 1) < 10 ? '0' : '') + (calMonth + 1);
              const dd = (day < 10 ? '0' : '') + day;
              const ds = `${calYear}-${mm}-${dd}`;
              const isSel = ds === selectedDate;
              const isToday = ds === new Date().toISOString().slice(0, 10);

              const dayRec = attendanceData[ds];
              const statusesForDay = dayRec ? Object.values(dayRec).filter(Boolean) : [];
              const hasAbsent = statusesForDay.includes('absent');
              const allPresent = statusesForDay.length > 0 && statusesForDay.every(s => s === 'present');
              const barColor = hasAbsent ? '#ef4444' : allPresent ? '#22c55e' : statusesForDay.length > 0 ? '#f97316' : null;

              return (
                <div key={day} onClick={() => { setSelectedDate(ds); setShowCalendar(false); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: 8,
                    background: isSel ? 'var(--primary)' : 'transparent',
                    color: isSel ? '#fff' : isToday ? 'var(--primary)' : 'var(--text)',
                    fontSize: 12, fontWeight: isSel ? 900 : isToday ? 900 : 700,
                    cursor: 'pointer', border: isToday && !isSel ? '2px solid var(--primary)' : 'none',
                    transition: 'background .12s', margin: '0 auto', position: 'relative',
                  }}
                  title={`${ds}: ${statusesForDay.length} records${hasAbsent ? ' (has absentees)' : ''}`}>
                  {day}
                  {barColor && (
                    <div style={{ position: 'absolute', bottom: 3, width: 5, height: 5, borderRadius: '50%', background: barColor }} />
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px 12px', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => { const t = new Date().toISOString().slice(0, 10); setSelectedDate(t); setCalMonth(new Date().getMonth()); setCalYear(new Date().getFullYear()); setShowCalendar(false); }}
              style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-pale)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>Today</button>
            <button onClick={() => setShowCalendar(false)} style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}