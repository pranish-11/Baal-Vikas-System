import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { requestJSON } from '../api';
import { API_BASE } from '../config';
import { ChevronLeft, ChevronRight, Users, CalendarDays, Filter, CheckCircle2, Clock, XCircle, CalendarOff } from 'lucide-react';

const COLORS = {
  present: 'var(--primary)',
  absent: '#ef4444',
  late: '#f97316',
  leave: '#3b82f6',
};

const SEG_ORDER = ['present', 'late', 'absent', 'leave'];
const LABELS = { present: 'Present', absent: 'Absent', late: 'Late', leave: 'Leave' };
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const todayGlobal = new Date().toISOString().slice(0, 10);

function TrendChart({ data, todayStr, viewMode, onBarClick }) {
  const days = data.map(d => {
    const dayPct = d.total > 0 ? Math.round((d.present / d.total) * 100) : 0;
    const dt = new Date(d.date + 'T00:00:00');
    return { ...d, dayPct, dayLabel: DAY_ABBR[dt.getDay()], dateNum: dt.getDate(), monthLabel: dt.toLocaleDateString('en', { month: 'short' }), isToday: d.date === todayStr, dateStr: d.date };
  });

  const avgPct = days.length > 0 ? Math.round(days.reduce((s, d) => s + d.dayPct, 0) / days.length) : 0;
  const highCount = days.filter(d => d.dayPct >= 80).length;
  const lowCount = days.filter(d => d.dayPct < 50).length;
  const maxVal = Math.max(...days.map(d => d.dayPct), 10);

  const pill = (val, lbl, bg, clr) => (
    <div key={lbl} style={{ padding: '5px 12px', borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 900, color: clr }}>{val}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: clr }}>{lbl}</span>
    </div>
  );

  const DayBar = ({ day, onClick }) => {
    if (!day) return <div style={{ flex: '0 0 auto', width: 36 }} />;
    const h = (day.dayPct / maxVal) * 120;
    const barColor = day.dayPct >= 80 ? '#22c55e' : day.dayPct >= 50 ? '#eab308' : '#ef4444';
    return (
      <div onClick={() => onClick?.(day.dateStr)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', width: 36, cursor: 'pointer', position: 'relative' }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: barColor, marginBottom: 2, lineHeight: 1.1 }}>{day.dayPct}%</span>
        <div style={{ width: 22, height: 120, borderRadius: 4, background: `${barColor}18`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${h}%`, background: `linear-gradient(to top, ${barColor}, ${barColor}dd)`, borderRadius: 3, transition: 'height .2s' }} />
          
        </div>
        <span style={{ fontSize: 9, fontWeight: day.isToday ? 900 : 700, color: day.isToday ? 'var(--primary)' : 'var(--text2)', marginTop: 3, lineHeight: 1.1 }}>{day.dateNum}</span>
        <span style={{ fontSize: 7, fontWeight: 700, color: 'var(--text3)', lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: 0.3 }}>{day.dayLabel}</span>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {pill(`${avgPct}%`, 'Avg Attendance', 'var(--primary-pale)', 'var(--primary)')}
        {pill(highCount, 'Days ≥ 80%', '#f0fdf4', '#16a34a')}
        {pill(lowCount, 'Days < 50%', '#fef2f2', '#dc2626')}
      </div>

      {viewMode === 'weekly' ? (
        /* Weekly: 6 bars Sun–Fri */
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 150, padding: '4px 0', position: 'relative' }}>
          {[0, 25, 50, 75, 100].map(t => (
            <div key={t} style={{ position: 'absolute', left: 0, right: 0, top: `${100 - t}%`, height: 1, background: '#f3f4f6', zIndex: 0 }} />
          ))}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(lbl => {
            const day = days.find(d => d.dayLabel === lbl);
            return <DayBar key={lbl} day={day} onClick={onBarClick} />;
          })}
        </div>
      ) : (
        /* Monthly: one bar per day in a wrapping grid */
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, rowGap: 8, justifyContent: 'flex-start', minHeight: 140 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, rowGap: 8 }}>
            {days.map(day => <DayBar key={day.dateStr} day={day} onClick={onBarClick} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniCalendar({ attendanceData, students, selectedDate, onSelectDate }) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();

  const dateStats = useMemo(() => {
    const map = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRec = attendanceData[ds] || {};
      let present = 0, late = 0, absent = 0, leave = 0;
      students.forEach(s => {
        const st = dayRec[s.id];
        if (st === 'present') present++;
        else if (st === 'late') late++;
        else if (st === 'absent') absent++;
        else if (st === 'leave') leave++;
      });
      map[ds] = { present, late, absent, leave, total: present + late + absent + leave };
    }
    return map;
  }, [calYear, calMonth, attendanceData, students]);

  return (
    <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--primary), #1b5e50)', padding: '12px 14px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else { setCalMonth(calMonth - 1); } }}
            style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .12s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>‹</button>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: -0.2 }}>{new Date(calYear, calMonth).toLocaleString('default', { month: 'long' })} {calYear}</div>
          <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else { setCalMonth(calMonth + 1); } }}
            style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .12s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center' }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)', padding: '2px 0' }}>{d}</div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, padding: '6px 8px 4px', background: 'var(--surface)' }}>
        {Array.from({ length: firstDay }).map((_, idx) => <div key={`e${idx}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSel = ds === selectedDate;
          const isToday = ds === todayStr;
          const stats = dateStats[ds];
          const marked = stats && stats.total > 0;
          const allPresent = marked && stats.absent === 0 && stats.late === 0 && stats.leave === 0;
          const hasAbsent = marked && stats.absent > 0;
          const dotColor = hasAbsent ? COLORS.absent : allPresent ? COLORS.present : marked ? COLORS.late : null;
          return (
            <div key={day} onClick={() => onSelectDate(ds)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 8,
              background: isSel ? 'var(--primary)' : isToday ? 'var(--primary-pale)' : 'transparent',
              color: isSel ? '#fff' : isToday ? 'var(--primary)' : 'var(--text)',
              fontSize: 11, fontWeight: isSel || isToday ? 900 : 700,
              cursor: 'pointer', border: isToday && !isSel ? '2px solid var(--primary)' : 'none',
              transition: 'background .12s', margin: '0 auto', position: 'relative',
            }}>
              {day}
              {dotColor && <div style={{ position: 'absolute', bottom: 2, width: 5, height: 5, borderRadius: '50%', background: dotColor }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AttendanceReportsPage() {
  const { attendanceData, setAttendanceData, students, currentRole, user, getTeacherClassrooms, hasAssignedClasses, selectedAttendanceDate: selectedDate, setSelectedAttendanceDate: setSelectedDate } = useApp();

  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [classFilter, setClassFilter] = useState('');
  const [viewMode, setViewMode] = useState('weekly');
  const [selectedStudentDate, setSelectedStudentDate] = useState(null);
  const todayStr = now.toISOString().slice(0, 10);
  const detailDate = selectedDate || todayStr;

  const classrooms = useMemo(() => [...new Set(students.map(s => s.class).filter(Boolean))].sort(), [students]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (currentRole === 'parent') {
      const child = students.find(s => s.parentEmail === user?.email || s.parentName === user?.name);
      list = child ? [child] : [];
    } else if (currentRole === 'teacher') {
      const assigned = getTeacherClassrooms(user?.email);
      if (assigned.length > 0) list = students.filter(s => assigned.includes(s.class));
      else list = [];
    }
    if (classFilter) list = list.filter(s => s.class === classFilter);
    return list;
  }, [students, currentRole, user, classFilter, getTeacherClassrooms]);

  const detailData = useMemo(() => {
    const dayRec = attendanceData[detailDate] || {};
    let present = 0, late = 0, absent = 0, leave = 0;
    filteredStudents.forEach(s => {
      const st = dayRec[s.id];
      if (st === 'present') present++;
      else if (st === 'late') late++;
      else if (st === 'absent') absent++;
      else if (st === 'leave') leave++;
    });
    return { present, late, absent, leave, marked: present + late + absent + leave, total: filteredStudents.length };
  }, [detailDate, attendanceData, filteredStudents]);

  const studentBreakdown = useMemo(() => {
    if (!selectedStudentDate) return null;
    const dayRec = attendanceData[selectedStudentDate] || {};
    const list = [];
    filteredStudents.forEach(s => {
      const status = dayRec[s.id] || 'unmarked';
      list.push({ id: s.id, name: s.name, class: s.class, status });
    });
    return list;
  }, [selectedStudentDate, attendanceData, filteredStudents]);

  const { dailyCounts } = useMemo(() => {
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    const dc = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selYear}-${String(selMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRec = attendanceData[dateStr] || {};
      let p = 0, la = 0, ab = 0, lv = 0;
      filteredStudents.forEach(s => {
        const st = dayRec[s.id];
        if (st === 'present') p++;
        else if (st === 'late') la++;
        else if (st === 'absent') ab++;
        else if (st === 'leave') lv++;
      });
      dc.push({ date: dateStr, present: p, late: la, absent: ab, leave: lv, total: p + la + ab + lv });
    }
    return { dailyCounts: dc };
  }, [selYear, selMonth, attendanceData, filteredStudents]);

  useEffect(() => {
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    const monthStr = `${selYear}-${String(selMonth).padStart(2, '0')}`;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${monthStr}-${String(d).padStart(2, '0')}`;
      if (!attendanceData[ds]) {
        requestJSON(`${API_BASE}/attendance?date=${ds}`).then(res => {
          if (res && res.records && Object.keys(res.records).length > 0) {
            setAttendanceData(prev => ({ ...prev, [ds]: res.records }));
          }
        }).catch(() => {});
      }
    }
  }, [selYear, selMonth]);

  useEffect(() => { setSelectedStudentDate(null); }, [viewMode, selYear, selMonth]);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const goBack = () => { if (selMonth === 1) { setSelMonth(12); setSelYear(selYear - 1); } else { setSelMonth(selMonth - 1); } };
  const goForward = () => { if (selMonth === 12) { setSelMonth(1); setSelYear(selYear + 1); } else { setSelMonth(selMonth + 1); } };

  if (currentRole === 'parent' && filteredStudents.length === 0) {
    return (
      <div>
        <div className="page-title">Attendance Reports</div>
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          <Users size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
          <div style={{ fontSize: 13, fontWeight: 700 }}>No child linked to your account.</div>
        </div>
      </div>
    );
  }

  if (currentRole === 'teacher' && !hasAssignedClasses(user?.email)) {
    return (
      <div>
        <div className="page-title">Attendance Reports</div>
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>You must be assigned to a class by the admin to access this feature.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary-pale), #e8f5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(46,125,107,0.12)' }}>
            <CalendarDays size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.3 }}>Attendance</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginTop: 1 }}>{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Month Navigator */}
          <div style={{ display: 'flex', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <button onClick={goBack} style={{ padding: '7px 11px', border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text2)', transition: 'background .12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              <ChevronLeft size={14} />
            </button>
            <div style={{ padding: '7px 14px', fontSize: 13, fontWeight: 800, background: '#fff', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', color: 'var(--text)', minWidth: 100, textAlign: 'center', letterSpacing: -0.2 }}>
              {new Date(selYear, selMonth - 1).toLocaleString('default', { month: 'short' })} {selYear}
            </div>
            <button onClick={goForward} style={{ padding: '7px 11px', border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text2)', transition: 'background .12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {['weekly', 'monthly'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding: '7px 14px', border: 'none', cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
                fontSize: 12, fontWeight: 800, letterSpacing: -0.1,
                background: viewMode === m ? 'var(--primary)' : '#fff',
                color: viewMode === m ? '#fff' : 'var(--text3)',
                transition: 'all .12s',
                borderRight: m === 'weekly' ? '1px solid var(--border)' : 'none',
              }}>{m === 'weekly' ? 'Week' : 'Month'}</button>
            ))}
          </div>

          {/* Class Filter */}
          {currentRole !== 'parent' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <Filter size={13} style={{ color: 'var(--text3)', flexShrink: 0 }} />
              <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
                style={{ padding: '2px 0', border: 'none', background: 'transparent', fontSize: 11, fontWeight: 700, outline: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <option value="">All Classes</option>
                {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Today's Attendance */}
      {(() => {
        const dayRec = attendanceData[todayStr] || {};
        const todayPresent = filteredStudents.filter(s => dayRec[s.id] === 'present').length;
        const todayLate = filteredStudents.filter(s => dayRec[s.id] === 'late').length;
        const todayAbsent = filteredStudents.filter(s => dayRec[s.id] === 'absent').length;
        const todayLeave = filteredStudents.filter(s => dayRec[s.id] === 'leave').length;
        const todayMarked = todayPresent + todayLate + todayAbsent + todayLeave;
        const todayPct = filteredStudents.length ? Math.round(((todayPresent + todayLate) / filteredStudents.length) * 100) : 0;
        return (
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
              <svg width="54" height="54" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--surface2)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke={todayPct >= 80 ? 'var(--primary)' : todayPct >= 50 ? '#eab308' : '#ef4444'} strokeWidth="3" strokeDasharray={`${todayPct * 0.97} 97`} strokeLinecap="round" transform="rotate(-90 18 18)" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: todayPct >= 80 ? 'var(--primary)' : todayPct >= 50 ? '#ca8a04' : '#dc2626' }}>{todayPct}%</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Today's Attendance</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.present, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} /> {todayPresent}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.late, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {todayLate}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.absent, display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={12} /> {todayAbsent}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.leave, display: 'flex', alignItems: 'center', gap: 4 }}><CalendarOff size={12} /> {todayLeave}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>· {todayMarked}/{filteredStudents.length} marked</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Main Grid */}
      <div className="att-report-grid stagger-enter">
        <div className="chart-card" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)' }}>
              {viewMode === 'weekly' ? 'Weekly Trend' : 'Monthly Overview'}
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 10 }}>
            {viewMode === 'weekly' ? 'Sun–Fri this week' : `${new Date(selYear, selMonth - 1).toLocaleString('default', { month: 'long' })} ${selYear}`}
          </div>
          {(() => {
            const chartData = viewMode === 'weekly'
              ? (() => { const wd = []; for (let i = 0; i < 6; i++) { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); wd.push(d.toISOString().slice(0, 10)); } return wd.map(ds => dailyCounts.find(d => d.date === ds)).filter(Boolean); })()
              : dailyCounts.filter(d => d.total > 0);
            if (chartData.length === 0) return <div style={{ padding: 30, textAlign: 'center', color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>No records for this period.</div>;
            const totalP = chartData.reduce((s, d) => s + d.present, 0);
            const totalA = chartData.reduce((s, d) => s + d.absent, 0);
            const totalL = chartData.reduce((s, d) => s + d.late, 0);
            const totalLv = chartData.reduce((s, d) => s + d.leave, 0);
            const totalAll = chartData.reduce((s, d) => s + d.total, 0);
            const pct = totalAll ? Math.round(((totalP + totalL) / totalAll) * 100) : 0;
            return (
              <>
                <TrendChart data={chartData} todayStr={todayStr} viewMode={viewMode} onBarClick={setSelectedStudentDate} />
                {/* Student breakdown for selected bar day */}
                {studentBreakdown && (() => {
                  const total = studentBreakdown.length;
                  const present = studentBreakdown.filter(s => s.status === 'present').length;
                  const late = studentBreakdown.filter(s => s.status === 'late').length;
                  const absent = studentBreakdown.filter(s => s.status === 'absent').length;
                  const leave = studentBreakdown.filter(s => s.status === 'leave').length;
                  const unmarked = studentBreakdown.filter(s => s.status === 'unmarked').length;
                  return (
                    <div style={{ marginTop: 12, background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CalendarDays size={14} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontSize: 13, fontWeight: 800 }}>
                            {selectedStudentDate === todayStr ? "Today" : new Date(selectedStudentDate + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>{total} students</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          {present > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.present }}>✓{present}</span>}
                          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.late }}>⏱{late}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.absent }}>✕{absent}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.leave }}>📅{leave}</span>
                          {unmarked > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)' }}>—{unmarked}</span>}
                          <button onClick={() => setSelectedStudentDate(null)} style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 11, fontWeight: 700, color: 'var(--text3)', cursor: 'pointer' }}>Close</button>
                        </div>
                      </div>
                      <div style={{ maxHeight: 200, overflowY: 'auto', padding: '2px 4px' }}>
                        {studentBreakdown.map(s => {
                          const statusColor = s.status === 'present' ? COLORS.present : s.status === 'late' ? COLORS.late : s.status === 'absent' ? COLORS.absent : s.status === 'leave' ? COLORS.leave : '#d1d5db';
                          const statusIcon = s.status === 'present' ? <CheckCircle2 size={11} /> : s.status === 'late' ? <Clock size={11} /> : s.status === 'absent' ? <XCircle size={11} /> : s.status === 'leave' ? <CalendarOff size={11} /> : null;
                          return (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', borderBottom: '1px solid var(--border)', background: '#fff' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--text2)', flexShrink: 0 }}>
                                  {s.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{s.name}</div>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)' }}>{s.class}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: `${statusColor}10`, fontSize: 11, fontWeight: 700, color: statusColor }}>
                                {statusIcon} {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginTop: 10, padding: '10px 14px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: pct >= 80 ? '#16a34a' : pct >= 50 ? '#ca8a04' : '#dc2626' }}>{pct}%</div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    {[
                      { label: totalP, color: COLORS.present, icon: <CheckCircle2 size={11} /> },
                      { label: totalL, color: COLORS.late, icon: <Clock size={11} /> },
                      { label: totalA, color: COLORS.absent, icon: <XCircle size={11} /> },
                      { label: totalLv, color: COLORS.leave, icon: <CalendarOff size={11} /> },
                    ].map((item, i) => (
                      <span key={i} style={{ fontSize: 11, fontWeight: 700, color: item.color, display: 'flex', alignItems: 'center', gap: 3 }}>{item.icon} {item.label}</span>
                    ))}
                    <span style={{ width: 1, height: 14, background: 'var(--border)', display: 'inline-block' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>{totalP + totalL + totalA + totalLv}/{totalAll} marked</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 10 }}>
                  {Object.entries(COLORS).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: v }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'capitalize' }}>{LABELS[k]}</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MiniCalendar
            attendanceData={attendanceData}
            students={filteredStudents}
            selectedDate={selectedDate}
            onSelectDate={ds => { setSelectedDate(ds); setSelectedStudentDate(ds); }}
          />
          <div style={{
            background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={13} style={{ color: 'var(--primary)' }} />
              {detailDate === todayStr ? "Today's Stats" : new Date(detailDate + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            {detailData.marked === 0 ? (
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', padding: '10px 0', textAlign: 'center' }}>No records for this date.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', borderRadius: 8, background: COLORS.present + '10' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.present, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={11} /> Present</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: COLORS.present }}>{detailData.present}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', borderRadius: 8, background: COLORS.late + '10' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.late, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> Late</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: COLORS.late }}>{detailData.late}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', borderRadius: 8, background: COLORS.absent + '10' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.absent, display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={11} /> Absent</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: COLORS.absent }}>{detailData.absent}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', borderRadius: 8, background: COLORS.leave + '10' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.leave, display: 'flex', alignItems: 'center', gap: 4 }}><CalendarOff size={11} /> Leave</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: COLORS.leave }}>{detailData.leave}</span>
                </div>
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>
                  <span>Total marked</span>
                  <span>{detailData.marked}/{detailData.total}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}