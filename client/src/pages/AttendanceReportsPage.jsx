import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import {
  CalendarDays, TrendingUp, Users, Clock, XCircle, CalendarOff,
  ChevronLeft, ChevronRight, CheckCircle2, UserCheck, UserX
} from 'lucide-react';

const STATUS_COLORS = {
  present: '#16a34a',
  late: '#f59e0b',
  absent: '#e11d48',
  leave: '#7c3aed',
};

const STATUS_COLORS_CSS = {
  present: 'var(--primary)',
  late: 'var(--gold)',
  absent: 'var(--coral)',
  leave: 'var(--lavender)',
};

const STATUS_LABELS = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  leave: 'Leave',
};

function CalendarHeatmap({ data, month, year, selectedDate, onSelectDate, attendanceData, filteredStudents }) {
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
      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((s, i) => (
        <div key={s} style={{
          fontSize: 10, fontWeight: 800, textAlign: 'center', padding: '2px 0',
          color: i === 0 || i === 6 ? 'var(--coral)' : 'var(--text3)',
        }}>{s}</div>
      ))}
      {cells.map((cell, i) => {
        if (!cell) return <div key={i} />;
        const { dateStr, status } = cell;
        const dayNum = Number(dateStr.split('-')[2]);
        const d = new Date(year, month - 1, dayNum);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const isSel = dateStr === selectedDate;
        const isToday = dateStr === new Date().toISOString().slice(0, 10);
        const hasData = !!status;
        return (
          <div key={i} onClick={() => onSelectDate(dateStr)}
            style={{
              width: '100%', aspectRatio: 1, borderRadius: 6, display: 'flex',
              alignItems: 'center', justifyContent: 'center', position: 'relative',
              fontSize: 10, fontWeight: isSel || isToday ? 800 : 700,
              background: isSel ? 'var(--primary)' : hasData ? STATUS_COLORS[status] : (isWeekend ? 'var(--surface2)' : 'transparent'),
              color: (isSel || hasData) ? '#fff' : (isToday ? 'var(--primary)' : 'var(--text3)'),
              opacity: hasData || isSel ? 1 : (isWeekend ? 0.35 : 0.55),
              cursor: 'pointer', transition: 'all .15s',
              border: isToday && !isSel ? '2px solid var(--primary)' : 'none',
            }}
            onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = hasData ? STATUS_COLORS[status] : 'var(--primary-pale)'; }}
            onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = hasData ? STATUS_COLORS[status] : (isWeekend ? 'var(--surface2)' : 'transparent'); }}
          >
            {dayNum}
          </div>
        );
      })}
    </div>
  );
}

function DailyBarChart({ dailyCounts }) {
  if (!dailyCounts || dailyCounts.length === 0) return null;
  const maxVal = Math.max(...dailyCounts.map(d => d.total), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 110, padding: '4px 0' }}>
      {dailyCounts.map((d, i) => {
        const pH = (d.present / maxVal) * 100;
        const lH = (d.late / maxVal) * 100;
        const aH = (d.absent / maxVal) * 100;
        const leaveH = (d.leave / maxVal) * 100;
        return (
          <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 6, maxWidth: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column-reverse', width: '100%', height: 100, borderRadius: 4, overflow: 'hidden', background: 'var(--surface2)' }}>
              {d.leave > 0 && <div style={{ height: `${leaveH}%`, background: STATUS_COLORS.leave, minHeight: 1, transition: 'height .3s' }} title={`${d.date}: ${d.leave} left`} />}
              {d.absent > 0 && <div style={{ height: `${aH}%`, background: STATUS_COLORS.absent, minHeight: 1, transition: 'height .3s' }} title={`${d.date}: ${d.absent} absent`} />}
              {d.late > 0 && <div style={{ height: `${lH}%`, background: STATUS_COLORS.late, minHeight: 1, transition: 'height .3s' }} title={`${d.date}: ${d.late} late`} />}
              {d.present > 0 && <div style={{ height: `${pH}%`, background: STATUS_COLORS.present, minHeight: 1, transition: 'height .3s' }} title={`${d.date}: ${d.present} present`} />}
            </div>
            <span style={{ fontSize: 8, fontWeight: 600, color: 'var(--text3)', marginTop: 2, lineHeight: 1 }}>{d.date.slice(8)}</span>
          </div>
        );
      })}
    </div>
  );
}

function DateDetailPanel({ dateStr, attendanceData, students, filteredStudents }) {
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
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>
          {marked}/{filteredStudents.length} marked
        </span>
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
              }}>
                <s.icon size={12} /> {s.count} {STATUS_LABELS[s.key]}
              </span>
            ))}
          </div>

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
  const { attendanceData, students, currentRole, user, getTeacherClassrooms } = useApp();

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
      if (assigned) list = students.filter(s => assigned.includes(s.class));
    }
    if (classFilter) list = list.filter(s => s.class === classFilter);
    return list;
  }, [students, currentRole, user, classFilter, getTeacherClassrooms]);

  const { monthDates, dailyCounts, summary, studentRows, calendarData } = useMemo(() => {
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
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const goBack = () => { if (selMonth === 1) { setSelMonth(12); setSelYear(selYear - 1); } else { setSelMonth(selMonth - 1); } };
  const goForward = () => { if (selMonth === 12) { setSelMonth(1); setSelYear(selYear + 1); } else { setSelMonth(selMonth + 1); } };

  if (currentRole === 'parent' && filteredStudents.length === 0) {
    return (
      <div>
        <div className="page-title">Attendance Reports</div>
        <div className="att-table-wrap" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          <Users size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
          <div style={{ fontSize: 13, fontWeight: 700 }}>No child linked to your account.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Attendance Reports</div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
        background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 8, padding: '4px 4px' }}>
          <button onClick={goBack} style={{ width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}><ChevronLeft size={14} /></button>
          <span style={{ fontSize: 13, fontWeight: 800, minWidth: 120, textAlign: 'center' }}>{monthNames[selMonth - 1]} {selYear}</span>
          <button onClick={goForward} style={{ width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}><ChevronRight size={14} /></button>
        </div>
        {currentRole !== 'parent' && (
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, fontWeight: 600, outline: 'none' }}>
            <option value="">All Classes</option>
            {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <button onClick={() => { const t = new Date().toISOString().slice(0, 10); setSelectedDate(t); const d = new Date(); setSelMonth(d.getMonth() + 1); setSelYear(d.getFullYear()); }}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--primary)', background: 'var(--primary-pale)', color: 'var(--primary)', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
          <CalendarDays size={13} /> Today
        </button>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} · {summary.totDays} days
        </div>
      </div>

      {/* Summary cards */}
      <div className="att-summary-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Present', value: summary.totPresent, color: STATUS_COLORS.present, icon: TrendingUp, rate: summary.presentRate + '% attendance' },
          { label: 'Late', value: summary.totLate, color: STATUS_COLORS.late, icon: Clock, rate: summary.totLate > 0 ? ((summary.totLate / summary.totalMarked) * 100).toFixed(1) + '%' : '0%' },
          { label: 'Absent', value: summary.totAbsent, color: STATUS_COLORS.absent, icon: XCircle, rate: summary.absentRate + '% absentee' },
          { label: 'Leave', value: summary.totLeave, color: STATUS_COLORS.leave, icon: CalendarOff, rate: summary.totLeave > 0 ? ((summary.totLeave / summary.totalMarked) * 100).toFixed(1) + '%' : '0%' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="att-summary-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: card.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} style={{ color: card.color }} />
                </div>
                <span className="att-summary-label">{card.label}</span>
              </div>
              <div className="att-summary-value" style={{ color: card.color }}>{card.value}</div>
              <div className="att-summary-pct">{card.rate}</div>
            </div>
          );
        })}
      </div>

      {/* Calendar + Chart row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, marginBottom: 20, alignItems: 'start' }}>
        <div className="att-calendar-wrap">
          <div className="att-calendar-title">
            <CalendarDays size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            {monthNames[selMonth - 1]} {selYear}
          </div>
          <div className="att-legend">
            {Object.entries(STATUS_COLORS).map(([k, v]) => (
              <div key={k} className="att-legend-item">
                <div className="att-legend-dot" style={{ background: v }} />
                {STATUS_LABELS[k]}
              </div>
            ))}
          </div>
          <CalendarHeatmap
            data={calendarData}
            month={selMonth}
            year={selYear}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            attendanceData={attendanceData}
            filteredStudents={filteredStudents}
          />
        </div>
        <div className="att-calendar-wrap">
          <div className="att-calendar-title">
            <TrendingUp size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            Daily Breakdown
          </div>
          <DailyBarChart dailyCounts={dailyCounts} />
        </div>
      </div>

      {/* Selected date detail — separated so calendar doesn't resize */}
      <div className="att-calendar-wrap" style={{ marginBottom: 20, padding: 0 }}>
        <DateDetailPanel
          dateStr={selectedDate}
          attendanceData={attendanceData}
          students={students}
          filteredStudents={filteredStudents}
        />
      </div>

      {/* Per-student table */}
      <div className="att-table-wrap">
        <div className="att-table-header">
          <span>Student Breakdown</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>{studentRows.length} students</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="att-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th style={{ color: STATUS_COLORS.present }}>Present</th>
                <th style={{ color: STATUS_COLORS.late }}>Late</th>
                <th style={{ color: STATUS_COLORS.absent }}>Absent</th>
                <th style={{ color: STATUS_COLORS.leave }}>Leave</th>
                <th>Total</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {studentRows.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : 'var(--surface2)' }}>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td style={{ color: 'var(--text3)' }}>{s.class}</td>
                  <td style={{ color: STATUS_COLORS.present, fontWeight: 700 }}>{s.p}</td>
                  <td style={{ color: STATUS_COLORS.late, fontWeight: 700 }}>{s.la}</td>
                  <td style={{ color: STATUS_COLORS.absent, fontWeight: 700 }}>{s.ab}</td>
                  <td style={{ color: STATUS_COLORS.leave, fontWeight: 700 }}>{s.lv}</td>
                  <td style={{ fontWeight: 600 }}>{s.total}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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