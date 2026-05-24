import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';

const STATUS_COLORS = {
  present: '#2ed573',
  late: '#ffa502',
  absent: '#ff4757',
  leave: '#a55eea',
};

const STATUS_LABELS = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  leave: 'Leave',
};

function CalendarHeatmap({ data, month, year }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push(data[dateStr] || null);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, maxWidth: 280 }}>
      {['Su','Mo','Tu','We','Th','Fr','Sa'].map(s => (
        <div key={s} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textAlign: 'center', padding: 2 }}>{s}</div>
      ))}
      {cells.map((val, i) => (
        <div key={i} style={{
          width: '100%', aspectRatio: 1, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700,
          background: !val ? 'var(--surface2)' : STATUS_COLORS[val] || 'var(--surface2)',
          color: val ? '#fff' : 'var(--text3)',
          opacity: val ? 1 : 0.4,
        }}>
          {i >= firstDay ? i - firstDay + 1 : ''}
        </div>
      ))}
    </div>
  );
}

function DailyBarChart({ dailyCounts }) {
  if (!dailyCounts || dailyCounts.length === 0) return null;
  const maxVal = Math.max(...dailyCounts.map(d => d.total), 1);
  const barW = Math.max(6, Math.min(20, 400 / dailyCounts.length));

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, padding: '0 4px' }}>
      {dailyCounts.map((d, i) => {
        const pH = (d.present / maxVal) * 100;
        const lH = (d.late / maxVal) * 100;
        const aH = (d.absent / maxVal) * 100;
        const leaveH = (d.leave / maxVal) * 100;
        return (
          <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: barW }}>
            <div style={{ display: 'flex', flexDirection: 'column-reverse', width: '100%', height: 110, borderRadius: 3, overflow: 'hidden', background: 'var(--surface2)' }}>
              {d.leave > 0 && <div style={{ height: `${leaveH}%`, background: STATUS_COLORS.leave, minHeight: 1 }} title={`${d.date}: ${d.leave} left`} />}
              {d.absent > 0 && <div style={{ height: `${aH}%`, background: STATUS_COLORS.absent, minHeight: 1 }} title={`${d.date}: ${d.absent} absent`} />}
              {d.late > 0 && <div style={{ height: `${lH}%`, background: STATUS_COLORS.late, minHeight: 1 }} title={`${d.date}: ${d.late} late`} />}
              {d.present > 0 && <div style={{ height: `${pH}%`, background: STATUS_COLORS.present, minHeight: 1 }} title={`${d.date}: ${d.present} present`} />}
            </div>
            <span style={{ fontSize: 8, color: 'var(--text3)', marginTop: 2, transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
              {d.date.slice(8)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AttendanceReportsPage() {
  const { attendanceData, students, currentRole, user, getTeacherClassrooms } = useApp();

  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [classFilter, setClassFilter] = useState('');

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
    if (classFilter) {
      list = list.filter(s => s.class === classFilter);
    }
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
      // Determine overall day status for calendar (most common status)
      const statuses = filteredStudents.map(s => dayRec[s.id]).filter(Boolean);
      const counts = { present: 0, late: 0, absent: 0, leave: 0 };
      statuses.forEach(st => { if (counts[st] !== undefined) counts[st]++; });
      let dominant = null;
      let maxC = 0;
      Object.entries(counts).forEach(([k, v]) => { if (v > maxC) { maxC = v; dominant = k; } });
      cal[dateStr] = dominant;

      if (statuses.length > 0) totDays++;
      totPresent += p;
      totLate += la;
      totAbsent += ab;
      totLeave += lv;
      dc.push({ date: dateStr, present: p, late: la, absent: ab, leave: lv, total: p + la + ab + lv });
    }

    const totalMarked = totPresent + totLate + totAbsent + totLeave;
    const summary = {
      totDays,
      totPresent,
      totLate,
      totAbsent,
      totLeave,
      totalMarked,
      presentRate: totDays > 0 ? ((totPresent / (totPresent + totLate + totAbsent + totLeave)) * 100).toFixed(1) : '0',
      absentRate: totDays > 0 ? ((totAbsent / (totPresent + totLate + totAbsent + totLeave)) * 100).toFixed(1) : '0',
    };

    // Per-student rows
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

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  if (currentRole === 'parent' && filteredStudents.length === 0) {
    return (
      <div>
        <div className="page-title">Attendance Reports</div>
        <div className="complain-card" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          No child linked to your account.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Attendance Reports</div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text1)', fontSize: 13, fontWeight: 600 }}>
          {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text1)', fontSize: 13, fontWeight: 600 }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {currentRole !== 'parent' && (
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text1)', fontSize: 13, fontWeight: 600 }}>
            <option value="">All Classrooms</option>
            {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <div style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>
          {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} · {summary.totDays} days with data
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Present', value: summary.totPresent, color: STATUS_COLORS.present, rate: summary.presentRate + '%' },
          { label: 'Late', value: summary.totLate, color: STATUS_COLORS.late, rate: summary.totLate > 0 ? ((summary.totLate / summary.totalMarked) * 100).toFixed(1) + '%' : '0%' },
          { label: 'Absent', value: summary.totAbsent, color: STATUS_COLORS.absent, rate: summary.absentRate + '%' },
          { label: 'Leave', value: summary.totLeave, color: STATUS_COLORS.leave, rate: summary.totLeave > 0 ? ((summary.totLeave / summary.totalMarked) * 100).toFixed(1) + '%' : '0%' },
        ].map(card => (
          <div key={card.label} className="complain-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{card.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: card.color, margin: '4px 0' }}>{card.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{card.rate} of total</div>
          </div>
        ))}
      </div>

      {/* Calendar + Chart row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, marginBottom: 20, alignItems: 'center' }}>
        <div className="complain-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>{monthNames[selMonth - 1]} {selYear}</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            {Object.entries(STATUS_COLORS).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: 'var(--text3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: v }} />
                {STATUS_LABELS[k]}
              </div>
            ))}
          </div>
          <CalendarHeatmap data={calendarData} month={selMonth} year={selYear} />
        </div>
        <div className="complain-card" style={{ padding: 16, overflowX: 'auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>Daily Breakdown</div>
          <DailyBarChart dailyCounts={dailyCounts} />
        </div>
      </div>

      {/* Per-student table */}
      <div className="complain-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>
          Student Breakdown ({studentRows.length} students)
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Student</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Class</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: STATUS_COLORS.present, whiteSpace: 'nowrap' }}>Present</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: STATUS_COLORS.late, whiteSpace: 'nowrap' }}>Late</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: STATUS_COLORS.absent, whiteSpace: 'nowrap' }}>Absent</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: STATUS_COLORS.leave, whiteSpace: 'nowrap' }}>Leave</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Total</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {studentRows.map((s, i) => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface2)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>{s.name}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text3)' }}>{s.class}</td>
                  <td style={{ padding: '8px 12px', color: STATUS_COLORS.present, fontWeight: 700 }}>{s.p}</td>
                  <td style={{ padding: '8px 12px', color: STATUS_COLORS.late, fontWeight: 700 }}>{s.la}</td>
                  <td style={{ padding: '8px 12px', color: STATUS_COLORS.absent, fontWeight: 700 }}>{s.ab}</td>
                  <td style={{ padding: '8px 12px', color: STATUS_COLORS.leave, fontWeight: 700 }}>{s.lv}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{s.total}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 50, height: 6, borderRadius: 3, background: 'var(--surface2)', overflow: 'hidden' }}>
                        <div style={{ width: `${s.rate !== '-' ? s.rate : 0}%`, height: '100%', borderRadius: 3, background: STATUS_COLORS.present }} />
                      </div>
                      <span style={{ fontWeight: 700 }}>{s.rate}%</span>
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
