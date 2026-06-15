import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { requestJSON } from '../api';
import { API_BASE } from '../config';
import {
  CalendarDays, Users, Clock, XCircle, CalendarOff,
  ChevronLeft, ChevronRight, CheckCircle2, UserCheck, UserX, Info,
  BarChart3, PieChart, Filter
} from 'lucide-react';

const STATUS_COLORS = {
  present: '#22c55e',
  late: '#f97316',
  absent: '#ef4444',
  leave: '#a855f7',
};

const STATUS_BG = {
  present: '#22c55e18',
  late: '#f9731618',
  absent: '#ef444418',
  leave: '#a855f718',
};

const STATUS_LABELS = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  leave: 'Leave',
};

function Tooltip({ text, children }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help', gap: 3 }}
      title={text}>
      {children}
      <Info size={12} style={{ color: 'var(--text3)', opacity: 0.45 }} />
    </span>
  );
}

function CalendarHeatmap({ data, month, year, selectedDate, onSelectDate }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dateStr, status: data[dateStr] || null });
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, maxWidth: 260 }}>
      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(s => (
        <div key={s} style={{
          fontSize: 10, fontWeight: 800, textAlign: 'center', padding: '2px 0',
          color: 'var(--text3)',
        }}>{s}</div>
      ))}
      {cells.map((cell, i) => {
        if (!cell) return <div key={i} />;
        const { dateStr, status } = cell;
        const dayNum = Number(dateStr.split('-')[2]);
        const isSel = dateStr === selectedDate;
        const isToday = dateStr === new Date().toISOString().slice(0, 10);
        return (
          <div key={i} onClick={() => onSelectDate(dateStr)}
            style={{
              width: '100%', aspectRatio: 1, borderRadius: 6, display: 'flex',
              alignItems: 'center', justifyContent: 'center', position: 'relative',
              fontSize: 10, fontWeight: isSel || isToday ? 800 : 700,
              background: isSel ? 'var(--primary)' : status ? STATUS_COLORS[status] : 'transparent',
              color: (isSel || status) ? '#fff' : (isToday ? 'var(--primary)' : 'var(--text3)'),
              opacity: status || isSel ? 1 : 0.55,
              cursor: 'pointer', transition: 'all .15s',
              border: isToday && !isSel ? '2px solid var(--primary)' : 'none',
            }}
            title={`${dateStr}: ${status ? STATUS_LABELS[status] : 'No record'}`}
          >
            {dayNum}
            {status && (
              <div style={{
                position: 'absolute', bottom: 1, right: 2, width: 4, height: 4,
                borderRadius: '50%', background: 'rgba(255,255,255,0.6)',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DailyBarChart({ dailyCounts }) {
  if (!dailyCounts || dailyCounts.length === 0) return null;
  const maxVal = Math.max(...dailyCounts.map(d => d.total), 1);
  const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 130, padding: '4px 0' }}>
        {dailyCounts.map(d => {
          const dt = new Date(d.date + 'T00:00:00');
          const dow = dt.getDay();
          const dayName = DAY_ABBR[dow];
          const pH = (d.present / maxVal) * 100;
          const lH = (d.late / maxVal) * 100;
          const aH = (d.absent / maxVal) * 100;
          const leaveH = (d.leave / maxVal) * 100;
          const dayPct = d.total > 0 ? Math.round((d.present / d.total) * 100) : 0;
          return (
            <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 6, maxWidth: 34, position: 'relative' }}
              title={`${dayName}, ${d.date}\nPresent: ${d.present} (${dayPct}%)\nLate: ${d.late}\nAbsent: ${d.absent}\nLeave: ${d.leave}`}>
              <div style={{ position: 'relative', width: '100%', height: 100, borderRadius: 5, overflow: 'hidden', background: 'var(--surface2)' }}>
                {d.leave > 0 && <div style={{ height: `${leaveH}%`, background: STATUS_COLORS.leave, minHeight: 2, transition: 'height .3s', width: '100%', position: 'absolute', bottom: 0 }} />}
                {d.absent > 0 && <div style={{ height: `${aH}%`, background: STATUS_COLORS.absent, minHeight: 2, transition: 'height .3s', width: '100%', position: 'absolute', bottom: 0 }} />}
                {d.late > 0 && <div style={{ height: `${lH}%`, background: STATUS_COLORS.late, minHeight: 2, transition: 'height .3s', width: '100%', position: 'absolute', bottom: 0 }} />}
                {d.present > 0 && <div style={{ height: `${pH}%`, background: STATUS_COLORS.present, minHeight: 2, transition: 'height .3s', width: '100%', position: 'absolute', bottom: 0 }} />}
              </div>
              <span style={{ fontSize: 7, fontWeight: 800, color: 'var(--text3)', marginTop: 3, lineHeight: 1.1, textTransform: 'uppercase' }}>{dayName}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text2)', marginTop: 1, lineHeight: 1 }}>{d.date.slice(8)}</span>
              {d.total > 0 && (
                <span style={{ fontSize: 7, fontWeight: 800, color: dayPct >= 80 ? STATUS_COLORS.present : dayPct >= 50 ? STATUS_COLORS.late : STATUS_COLORS.absent, marginTop: 1, lineHeight: 1 }}>
                  {dayPct}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 6 }}>
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 9, height: 9, borderRadius: 3, background: v }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)' }}>{STATUS_LABELS[k]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyTrend({ dailyCounts }) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekDates = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }

  const weekData = weekDates.map(ds => dailyCounts.find(d => d.date === ds)).filter(Boolean);
  if (weekData.length === 0) return null;

  const totalPresent = weekData.reduce((s, d) => s + d.present, 0);
  const totalLate = weekData.reduce((s, d) => s + d.late, 0);
  const totalAbsent = weekData.reduce((s, d) => s + d.absent, 0);
  const totalLeave = weekData.reduce((s, d) => s + d.leave, 0);
  const totalMarked = totalPresent + totalLate + totalAbsent + totalLeave;
  const weekPct = totalMarked > 0 ? Math.round(((totalPresent + totalLate) / totalMarked) * 100) : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center', minWidth: 72 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: weekPct >= 80 ? STATUS_COLORS.present : weekPct >= 50 ? STATUS_COLORS.late : STATUS_COLORS.absent }}>{weekPct}%</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sun–Fri</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { label: 'Present', count: totalPresent, color: STATUS_COLORS.present, pct: totalMarked > 0 ? Math.round(totalPresent / totalMarked * 100) : 0 },
          { label: 'Late', count: totalLate, color: STATUS_COLORS.late, pct: totalMarked > 0 ? Math.round(totalLate / totalMarked * 100) : 0 },
          { label: 'Absent', count: totalAbsent, color: STATUS_COLORS.absent, pct: totalMarked > 0 ? Math.round(totalAbsent / totalMarked * 100) : 0 },
          { label: 'Leave', count: totalLeave, color: STATUS_COLORS.leave, pct: totalMarked > 0 ? Math.round(totalLeave / totalMarked * 100) : 0 },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '6px 10px', borderRadius: 8, background: s.color + '0d', minWidth: 48 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text3)' }}>{s.label}</div>
            <div style={{ fontSize: 8, fontWeight: 600, color: s.color, opacity: 0.7 }}>{s.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DateDetailPanel({ dateStr, attendanceData, filteredStudents }) {
  if (!dateStr) return null;
  const dayRec = attendanceData[dateStr] || {};
  const hasData = Object.keys(dayRec).length > 0;

  const counts = { present: 0, late: 0, absent: 0, leave: 0 };
  filteredStudents.forEach(s => {
    const st = dayRec[s.id];
    if (st === 'present') counts.present++;
    else if (st === 'late') counts.late++;
    else if (st === 'absent') counts.absent++;
    else if (st === 'leave') counts.leave++;
  });
  const marked = counts.present + counts.late + counts.absent + counts.leave;
  const attendanceRate = marked > 0 ? Math.round(((counts.present + counts.late) / marked) * 100) : 0;

  const statusItems = [
    { key: 'present', icon: CheckCircle2, count: counts.present },
    { key: 'late', icon: Clock, count: counts.late },
    { key: 'absent', icon: XCircle, count: counts.absent },
    { key: 'leave', icon: CalendarOff, count: counts.leave },
  ];

  const dateDisplay = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const isToday = dateStr === new Date().toISOString().slice(0, 10);

  const absentStudents = filteredStudents.filter(s => dayRec[s.id] === 'absent' || dayRec[s.id] === 'late');

  return (
    <div style={{
      marginTop: 12, padding: 14, borderRadius: 10,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      animation: 'fadeUp .25s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarDays size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 800 }}>
            {dateDisplay}
            {isToday && <span style={{ marginLeft: 6, padding: '1px 8px', borderRadius: 10, background: 'var(--primary)', color: '#fff', fontSize: 9, fontWeight: 800, verticalAlign: 'middle' }}>TODAY</span>}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {marked > 0 && (
            <>
              <Tooltip text={`${counts.present + counts.late} attended out of ${marked} marked records`}>
                <span style={{ fontSize: 12, fontWeight: 800, color: attendanceRate >= 80 ? STATUS_COLORS.present : STATUS_COLORS.absent }}>
                  {attendanceRate}%
                </span>
              </Tooltip>
            </>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>
            {marked}/{filteredStudents.length} marked
          </span>
        </div>
      </div>

      {!hasData ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>
          <CalendarOff size={24} style={{ marginBottom: 6, opacity: 0.3 }} />
          <div>No attendance recorded for this date</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {statusItems.map(s => s.count > 0 && (
              <span key={s.key} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 20,
                background: STATUS_COLORS[s.key] + '18',
                color: STATUS_COLORS[s.key], fontSize: 12, fontWeight: 800,
              }} title={`${s.count} ${s.key} (${marked > 0 ? Math.round(s.count / marked * 100) : 0}%)`}>
                <s.icon size={12} /> {s.count} {STATUS_LABELS[s.key]}
              </span>
            ))}
          </div>

          {absentStudents.length > 0 && (
            <div style={{ marginBottom: 10, fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>
              Students needing attention ({absentStudents.length}):
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredStudents.map(s => {
              const st = dayRec[s.id];
              if (!st) return null;
              const isGood = st === 'present' || st === 'late';
              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 10px', borderRadius: 8,
                  background: st === 'absent' ? '#fff1f2' : st === 'late' ? '#fffbeb' : 'transparent',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: s.bg || 'var(--primary-pale)', color: s.col || 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, flexShrink: 0,
                  }}>{s.init}</div>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>{s.name}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 800,
                    color: isGood ? STATUS_COLORS.present : STATUS_COLORS.absent,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {isGood ? <UserCheck size={12} /> : <UserX size={12} />}
                    {STATUS_LABELS[st] || st}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function AttendanceReportsPage() {
  const { attendanceData, setAttendanceData, students, currentRole, user, getTeacherClassrooms, hasAssignedClasses } = useApp();

  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [classFilter, setClassFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(now.toISOString().slice(0, 10));

  const classrooms = useMemo(() => {
    const set = new Set(students.map(s => s.class).filter(Boolean));
    return [...set].sort();
  }, [students]);

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

  useEffect(() => {
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    const monthStr = `${selYear}-${String(selMonth).padStart(2, '0')}`;
    const datesToFetch = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${monthStr}-${String(d).padStart(2, '0')}`;
      if (!attendanceData[ds]) datesToFetch.push(ds);
    }
    const fetchBatch = async () => {
      for (const ds of datesToFetch.slice(0, 10)) {
        try {
          const res = await requestJSON(`${API_BASE}/attendance?date=${ds}`);
          if (res && res.records && Object.keys(res.records).length > 0) {
            setAttendanceData(prev => ({ ...prev, [ds]: res.records }));
          }
        } catch {
          // silently skip — data will be fetched on next view
        }
      }
    };
    if (datesToFetch.length > 0) fetchBatch();
  }, [selYear, selMonth, setAttendanceData, attendanceData]);

  const { dailyCounts, summary, studentRows, calendarData } = useMemo(() => {
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    const monthKeys = [];
    const dc = [];
    const cal = {};
    let totPresent = 0, totLate = 0, totAbsent = 0, totLeave = 0, totDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selYear}-${String(selMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      monthKeys.push(dateStr);
      const dayRec = attendanceData[dateStr] || {};
      let p = 0, la = 0, ab = 0, lv = 0;
      filteredStudents.forEach(s => {
        const st = dayRec[s.id];
        if (st === 'present') p++;
        else if (st === 'late') la++;
        else if (st === 'absent') ab++;
        else if (st === 'leave') lv++;
      });
      const statuses = filteredStudents.map(s => dayRec[s.id]).filter(Boolean);
      const counts = { present: 0, late: 0, absent: 0, leave: 0 };
      statuses.forEach(st => { if (counts[st] !== undefined) counts[st]++; });
      let dominant = null, maxC = 0;
      Object.entries(counts).forEach(([k, v]) => { if (v > maxC) { maxC = v; dominant = k; } });
      cal[dateStr] = dominant;
      if (statuses.length > 0) totDays++;
      totPresent += p; totLate += la; totAbsent += ab; totLeave += lv;
      dc.push({ date: dateStr, present: p, late: la, absent: ab, leave: lv, total: p + la + ab + lv });
    }

    const totalMarked = totPresent + totLate + totAbsent + totLeave;
    const summary = {
      totDays, totPresent, totLate, totAbsent, totLeave, totalMarked,
      presentRate: totalMarked > 0 ? ((totPresent / totalMarked) * 100).toFixed(1) : '0',
      absentRate: totalMarked > 0 ? ((totAbsent / totalMarked) * 100).toFixed(1) : '0',
      lateRate: totalMarked > 0 ? ((totLate / totalMarked) * 100).toFixed(1) : '0',
      leaveRate: totalMarked > 0 ? ((totLeave / totalMarked) * 100).toFixed(1) : '0',
      overallRate: totalMarked > 0 ? Math.round(((totPresent + totLate) / totalMarked) * 100) : 0,
    };

    const sRows = filteredStudents.map(s => {
      let p = 0, la = 0, ab = 0, lv = 0, total = 0;
      monthKeys.forEach(dateStr => {
        const st = attendanceData[dateStr]?.[s.id];
        if (st === 'present') { p++; total++; }
        else if (st === 'late') { la++; total++; }
        else if (st === 'absent') { ab++; total++; }
        else if (st === 'leave') { lv++; total++; }
      });
      return { ...s, p, la, ab, lv, total, rate: total > 0 ? ((p / total) * 100).toFixed(0) : '-' };
    });
    sRows.sort((a, b) => (b.p / (b.total || 1)) - (a.p / (a.total || 1)));

    return { monthDates: monthKeys, dailyCounts: dc, summary, studentRows: sRows, calendarData: cal };
  }, [selYear, selMonth, attendanceData, filteredStudents]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <BarChart3 size={20} style={{ color: 'var(--primary)' }} />
        Attendance Reports
      </div>
      <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 20 }}>
        Daily, weekly, and monthly attendance trends for {currentRole === 'parent' ? 'your child' : 'your classroom'}
      </div>

      <div style={{
        display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 8, padding: '4px' }}>
          <button onClick={goBack} style={{ width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}><ChevronLeft size={14} /></button>
          <span style={{ fontSize: 13, fontWeight: 800, minWidth: 120, textAlign: 'center' }}>{monthNames[selMonth - 1]} {selYear}</span>
          <button onClick={goForward} style={{ width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}><ChevronRight size={14} /></button>
        </div>
        {currentRole !== 'parent' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={13} style={{ color: 'var(--text3)' }} />
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, fontWeight: 600, outline: 'none' }}>
              <option value="">All Classes</option>
              {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <button onClick={() => { const t = new Date().toISOString().slice(0, 10); setSelectedDate(t); const d = new Date(); setSelMonth(d.getMonth() + 1); setSelYear(d.getFullYear()); }}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--primary)', background: 'var(--primary-pale)', color: 'var(--primary)', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
          <CalendarDays size={13} /> Today
        </button>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={13} />
          {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} tracked
        </div>
      </div>

      <div style={{
        marginBottom: 20, padding: '18px 22px', borderRadius: 12,
        background: 'linear-gradient(135deg, var(--primary) 0%, #3b82c4 100%)', color: '#fff',
        boxShadow: '0 4px 16px rgba(46,125,107,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.8 }}>Overall Attendance</div>
            <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.1 }}>{summary.overallRate}%</div>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>
              <Tooltip text={`${summary.totPresent} present, ${summary.totLate} late, ${summary.totAbsent} absent, ${summary.totLeave} leave — ${summary.totalMarked} total records`}>
                {monthNames[selMonth - 1]} {selYear}
              </Tooltip>
              <span style={{ margin: '0 6px' }}>·</span>
              {summary.totalMarked} records
            </div>
          </div>
          <WeeklyTrend dailyCounts={dailyCounts} />
        </div>
      </div>

      <div className="att-summary-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Present', value: summary.totPresent, color: STATUS_COLORS.present, icon: CheckCircle2, rate: summary.presentRate + '%', tooltip: 'Student was present for the full day' },
          { label: 'Late', value: summary.totLate, color: STATUS_COLORS.late, icon: Clock, rate: summary.lateRate + '%', tooltip: 'Student arrived after scheduled start time' },
          { label: 'Absent', value: summary.totAbsent, color: STATUS_COLORS.absent, icon: XCircle, rate: summary.absentRate + '%', tooltip: 'Student was not present at all' },
          { label: 'Leave', value: summary.totLeave, color: STATUS_COLORS.leave, icon: CalendarOff, rate: summary.leaveRate + '%', tooltip: 'Student was on approved leave' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="att-summary-card"
              title={`${card.value} ${card.label.toLowerCase()} — ${card.rate} of ${summary.totalMarked} total records`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: STATUS_BG[card.label.toLowerCase()] || (card.color + '18'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} style={{ color: card.color }} />
                </div>
                <span className="att-summary-label">{card.label}</span>
                <Tooltip text={card.tooltip} />
              </div>
              <div className="att-summary-value" style={{ color: card.color }}>{card.value}</div>
              <div className="att-summary-pct">{card.rate}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, marginBottom: 20, alignItems: 'start' }}>
        <div className="att-calendar-wrap">
          <div className="att-calendar-title">
            <CalendarDays size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            {monthNames[selMonth - 1]} {selYear}
          </div>
          <CalendarHeatmap
            data={calendarData}
            month={selMonth}
            year={selYear}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
        <div className="att-calendar-wrap">
          <div className="att-calendar-title">
            <BarChart3 size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            Daily Breakdown
          </div>
          <DailyBarChart dailyCounts={dailyCounts} />
        </div>
      </div>

      <div className="att-calendar-wrap" style={{ marginBottom: 20, padding: 0 }}>
        <DateDetailPanel
          dateStr={selectedDate}
          attendanceData={attendanceData}
          filteredStudents={filteredStudents}
        />
      </div>

      <div className="att-table-wrap">
        <div className="att-table-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PieChart size={14} style={{ color: 'var(--primary)' }} />
            Student Performance
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>
            <Tooltip text={`Sorted by attendance rate descending. ${summary.totDays} days with data this month.`}>
              {studentRows.length} students
            </Tooltip>
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="att-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th style={{ color: STATUS_COLORS.present }}>P</th>
                <th style={{ color: STATUS_COLORS.late }}>L</th>
                <th style={{ color: STATUS_COLORS.absent }}>A</th>
                <th style={{ color: STATUS_COLORS.leave }}>LV</th>
                <th title="Total number of days with a record">Total</th>
                <th title="Attendance rate = (Present) / (Total marked days)">Rate</th>
              </tr>
            </thead>
            <tbody>
              {studentRows.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                  <td style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: s.bg || 'var(--primary-pale)', color: s.col || 'var(--primary)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontWeight: 800,
                    }}>{s.init}</div>
                    {s.name}
                  </td>
                  <td style={{ color: 'var(--text3)' }}>{s.class}</td>
                  <td style={{ color: STATUS_COLORS.present, fontWeight: 700 }}>{s.p}</td>
                  <td style={{ color: STATUS_COLORS.late, fontWeight: 700 }}>{s.la}</td>
                  <td style={{ color: STATUS_COLORS.absent, fontWeight: 700 }}>{s.ab}</td>
                  <td style={{ color: STATUS_COLORS.leave, fontWeight: 700 }}>{s.lv}</td>
                  <td style={{ fontWeight: 600 }}>{s.total}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} title={`${s.name}: ${s.p} present, ${s.la} late, ${s.ab} absent, ${s.lv} leave out of ${s.total} days`}>
                      <span className="att-bar">
                        <span className="att-bar-fill" style={{ width: `${s.rate !== '-' ? s.rate : 0}%`, background: STATUS_COLORS.present }} />
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{s.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}