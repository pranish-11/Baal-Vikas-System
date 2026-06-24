import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { requestJSON } from '../api';
import { API_BASE } from '../config';
import { ChevronLeft, ChevronRight, Users, CalendarDays, Filter, CheckCircle2, Clock, XCircle, CalendarOff } from 'lucide-react';

const C = {
  present: '#22c55e',
  absent: '#ef4444',
  late: '#f97316',
  leave: '#3b82f6',
};

const SEG_ORDER = ['present', 'late', 'absent', 'leave'];

const LABELS = { present: 'Present', absent: 'Absent', late: 'Late', leave: 'Leave' };

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const todayGlobal = new Date().toISOString().slice(0, 10);

function WeekChart({ dailyCounts, weekStart, label }) {
  const dates = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const chartData = dates.map(ds => dailyCounts.find(d => d.date === ds)).filter(Boolean);
  if (chartData.length === 0) return (
    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>
      No data {label}
    </div>
  );
  return <BarChart data={chartData} todayStr={todayGlobal} />;
}

function MonthChart({ dailyCounts }) {
  const chartData = dailyCounts.filter(d => d.total > 0);
  if (chartData.length === 0) return (
    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>
      No data this month
    </div>
  );
  return <BarChart data={chartData} todayStr={todayGlobal} />;
}

function BarChart({ data, todayStr }) {
  const maxVal = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, padding: '8px 0' }}>
      {data.map(d => {
        const dt = new Date(d.date + 'T00:00:00');
        const dow = dt.getDay();
        const dayName = DAY_ABBR[dow];
        const dayPct = d.total > 0 ? Math.round((d.present / d.total) * 100) : 0;
        const isTodayBar = d.date === todayStr;
        const segments = [];
        let bot = 0;
        SEG_ORDER.forEach(k => {
          const v = d[k];
          if (v > 0) {
            const h = (v / maxVal) * 100;
            segments.push({ key: k, h, bot, color: C[k] });
            bot += h;
          }
        });
        return (
          <div key={d.date} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0,
            position: 'relative',
          }} title={`${dayName} ${d.date.slice(5)}${isTodayBar ? ' (Today)' : ''}\nPresent: ${d.present} (${dayPct}%)\nLate: ${d.late}\nAbsent: ${d.absent}\nLeave: ${d.leave}`}>
            <div style={{
              position: 'relative', width: '100%', maxWidth: 36, height: 100, borderRadius: 6,
              overflow: 'hidden', background: 'var(--surface2)',
              ...(isTodayBar ? {
                boxShadow: '0 0 0 3px var(--primary), 0 0 18px rgba(46,125,107,0.5)',
                border: '2px solid var(--primary)',
              } : {}),
            }}>
              {segments.map(seg => (
                <div key={seg.key} style={{
                  height: `${seg.h}%`, background: seg.color,
                  minHeight: seg.h > 0 ? 2 : 0,
                  width: '100%', position: 'absolute', bottom: `${seg.bot}%`,
                  transition: 'height 0.2s ease',
                }} />
              ))}
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: isTodayBar ? 'var(--primary)' : 'var(--text3)', marginTop: 4, lineHeight: 1.2 }}>{dayName} {d.date.slice(8)}</span>
          </div>
        );
      })}
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
      const total = present + late + absent + leave;
      map[ds] = { present, late, absent, leave, total };
    }
    return map;
  }, [calYear, calMonth, attendanceData, students]);

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      overflow: 'hidden',
    }}>
      <div style={{ background: 'var(--primary)', padding: '12px 14px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else { setCalMonth(calMonth - 1); } }}
            style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{new Date(calYear, calMonth).toLocaleString('default', { month: 'long' })} {calYear}</div>
          <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else { setCalMonth(calMonth + 1); } }}
            style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center' }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.65)', padding: '2px 0' }}>{d}</div>
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
          const dotColor = hasAbsent ? C.absent : allPresent ? C.present : marked ? C.late : null;
          return (
            <div key={day} onClick={() => onSelectDate(ds)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 8,
                background: isSel ? 'var(--primary)' : isToday ? 'var(--primary-pale)' : 'transparent',
                color: isSel ? '#fff' : isToday ? 'var(--primary)' : 'var(--text)',
                fontSize: 11, fontWeight: isSel || isToday ? 900 : 700,
                cursor: 'pointer', border: isToday && !isSel ? '2px solid var(--primary)' : 'none',
                boxShadow: isToday && !isSel ? '0 0 0 3px rgba(46,125,107,0.15)' : isSel ? '0 2px 8px rgba(46,125,107,0.3)' : 'none',
                transition: 'background .12s', margin: '0 auto', position: 'relative',
              }}>
              {day}
              {dotColor && <div style={{ position: 'absolute', bottom: 1, width: 4, height: 4, borderRadius: '50%', background: dotColor }} />}
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
  const todayStr = now.toISOString().slice(0, 10);
  const detailDate = selectedDate || todayStr;

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

  const todayData = useMemo(() => {
    const dayRec = attendanceData[todayStr] || {};
    let present = 0, late = 0, absent = 0, leave = 0;
    filteredStudents.forEach(s => {
      const st = dayRec[s.id];
      if (st === 'present') present++;
      else if (st === 'late') late++;
      else if (st === 'absent') absent++;
      else if (st === 'leave') leave++;
    });
    return { present, late, absent, leave, marked: present + late + absent + leave, total: filteredStudents.length };
  }, [todayStr, attendanceData, filteredStudents]);

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

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const goBack = () => { if (selMonth === 1) { setSelMonth(12); setSelYear(selYear - 1); } else { setSelMonth(selMonth - 1); } };
  const goForward = () => { if (selMonth === 12) { setSelMonth(1); setSelYear(selYear + 1); } else { setSelMonth(selMonth + 1); } };

  const isDetailToday = detailDate === todayStr;

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
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <CalendarDays size={20} style={{ color: 'var(--primary)' }} />
        Attendance Reports
      </div>

      <div style={{
        display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center',
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 8, padding: '4px' }}>
          <button onClick={goBack} style={{ width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}><ChevronLeft size={14} /></button>
          <span style={{ fontSize: 13, fontWeight: 800, minWidth: 120, textAlign: 'center' }}>{monthNames[selMonth - 1]} {selYear}</span>
          <button onClick={goForward} style={{ width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}><ChevronRight size={14} /></button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface2)', borderRadius: 8, padding: 3 }}>
          <button onClick={() => setViewMode('weekly')} style={{
            padding: '5px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
            fontSize: 11, fontWeight: 800, background: viewMode === 'weekly' ? '#fff' : 'transparent',
            color: viewMode === 'weekly' ? 'var(--primary)' : 'var(--text3)',
            boxShadow: viewMode === 'weekly' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}>Weekly</button>
          <button onClick={() => setViewMode('monthly')} style={{
            padding: '5px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
            fontSize: 11, fontWeight: 800, background: viewMode === 'monthly' ? '#fff' : 'transparent',
            color: viewMode === 'monthly' ? 'var(--primary)' : 'var(--text3)',
            boxShadow: viewMode === 'monthly' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}>Monthly</button>
        </div>

        {currentRole !== 'parent' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={13} style={{ color: 'var(--text3)' }} />
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, fontWeight: 600, outline: 'none' }}>
              <option value="">All Classes</option>
              {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={13} />
          {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap',
        background: 'var(--primary-pale)', border: '1px solid ' + C.present + '30', borderRadius: 'var(--radius)',
        padding: '12px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.present + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={18} style={{ color: C.present }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Today's Attendance</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)' }}>{new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginLeft: 'auto' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.present, display: 'flex', alignItems: 'center', gap: 3 }}>
            <CheckCircle2 size={12} /> {todayData.present} Present
          </span>
          {todayData.late > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: C.late, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={12} /> {todayData.late} Late
            </span>
          )}
          <span style={{ fontSize: 12, fontWeight: 700, color: C.absent, display: 'flex', alignItems: 'center', gap: 3 }}>
            <XCircle size={12} /> {todayData.absent} Absent
          </span>
          {todayData.leave > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: C.leave, display: 'flex', alignItems: 'center', gap: 3 }}>
              <CalendarOff size={12} /> {todayData.leave} Leave
            </span>
          )}
          {todayData.marked === 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>No records yet</span>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>
            · {todayData.marked}/{todayData.total} marked
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', marginBottom: 4 }}>
            {viewMode === 'weekly' ? 'Weekly Trend (Sun–Fri)' : `Monthly Overview — ${monthNames[selMonth - 1]}`}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>
            {viewMode === 'weekly' ? 'Current week' : 'All days with records this month'}
          </div>
          {viewMode === 'weekly' ? (
            <WeekChart dailyCounts={dailyCounts} weekStart={weekStart} label="this week" />
          ) : (
            <MonthChart dailyCounts={dailyCounts} />
          )}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 8 }}>
            {Object.entries(C).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: 3, background: v }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)' }}>{LABELS[k]}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <MiniCalendar
            attendanceData={attendanceData}
            students={filteredStudents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <div style={{
            marginTop: 12, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            padding: '12px 14px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={14} />
              {isDetailToday ? "Today's Stats" : new Date(detailDate + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            {detailData.marked === 0 ? (
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', padding: '8px 0' }}>No attendance records for this date.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: 6, background: C.present + '12' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.present, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={11} /> Present</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: C.present }}>{detailData.present}</span>
                </div>
                {detailData.late > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: 6, background: C.late + '12' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.late, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> Late</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: C.late }}>{detailData.late}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: 6, background: C.absent + '12' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.absent, display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={11} /> Absent</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: C.absent }}>{detailData.absent}</span>
                </div>
                {detailData.leave > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: 6, background: C.leave + '12' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.leave, display: 'flex', alignItems: 'center', gap: 4 }}><CalendarOff size={11} /> Leave</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: C.leave }}>{detailData.leave}</span>
                  </div>
                )}
                <div style={{ marginTop: 4, paddingTop: 6, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>
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
