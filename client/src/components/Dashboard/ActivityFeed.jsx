import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { CalendarOff, Users, CircleCheckBig, Timer, XCircle, ArrowRight } from 'lucide-react';

export default function ActivityFeed({ onNavigate }) {
  const { currentRole, students, attendanceData, user, getTeacherClassrooms } = useApp();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);

  let visibleStudents = students;
  if (currentRole === 'teacher') {
    const assigned = getTeacherClassrooms(user?.email);
    if (assigned) visibleStudents = students.filter(s => assigned.includes(s.class));
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const rec = attendanceData[dateStr] || {};

  const classes = {};
  visibleStudents.forEach(s => {
    if (!classes[s.class]) classes[s.class] = [];
    classes[s.class].push(s);
  });

  const classList = Object.entries(classes).map(([name, studs]) => {
    const present = studs.filter(s => rec[s.id] === 'present').length;
    const late = studs.filter(s => rec[s.id] === 'late').length;
    const absent = studs.filter(s => rec[s.id] === 'absent').length;
    const leave = studs.filter(s => rec[s.id] === 'leave').length;
    const unmarked = studs.filter(s => !rec[s.id]).length;
    return { name, count: studs.length, present, late, absent, leave, unmarked, students: studs };
  });

  const totalPresent = classList.reduce((s, c) => s + c.present, 0);
  const totalLate = classList.reduce((s, c) => s + c.late, 0);
  const totalAbsent = classList.reduce((s, c) => s + c.absent, 0);
  const totalLeave = classList.reduce((s, c) => s + c.leave, 0);
  const totalUnmarked = classList.reduce((s, c) => s + c.unmarked, 0);
  const attendancePct = visibleStudents.length ? Math.round(((totalPresent + totalLate) / visibleStudents.length) * 100) : 0;

  if (currentRole === 'parent') {
    const email = user?.email || '';
    const myChildren = students.filter(s => s.parentEmail && s.parentEmail.toLowerCase() === email.toLowerCase());

    if (myChildren.length === 0) {
      return (
        <div className="card mb-20">
          <div className="card-header">
            <div className="card-title">Today's Summary</div>
          </div>
          <div className="card-body" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)' }}>No child linked to this account.</div>
          </div>
        </div>
      );
    }

    const safeIdx = Math.min(selectedChildIdx, myChildren.length - 1);
    const child = myChildren[safeIdx];
    const todayRec = rec[child.id];
    const childRank = students.filter(s => (s.pts || 0) > (child.pts || 0)).length + 1;

    return (
      <div className="card mb-20">
        <div className="card-header">
          <div className="card-title">Today's Summary</div>
        </div>
        {myChildren.length > 1 && (
          <div style={{ display: 'flex', gap: 4, padding: '0 20px', marginBottom: 8 }}>
            {myChildren.map((c, i) => (
              <div key={c.id} onClick={() => setSelectedChildIdx(i)} style={{
                padding: '4px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: i === safeIdx ? 'var(--primary)' : 'var(--surface2)',
                color: i === safeIdx ? '#fff' : 'var(--text2)',
              }}>{c.name}</div>
            ))}
          </div>
        )}
        <div className="card-body" style={{ padding: '12px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: child.bg || 'var(--primary-pale)', color: child.col || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>{child.init}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{child.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{child.class}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--primary-pale)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>Status Today</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>{todayRec === 'present' ? 'Present' : todayRec === 'late' ? 'Late' : todayRec === 'absent' ? 'Absent' : todayRec === 'leave' ? 'On Leave' : 'Not marked'}</div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--gold-pale)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>Points</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>{child.pts || 0}</div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--sky-pale)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>Behavior Score</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--sky)' }}>{child.pct || 0}%</div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--coral-pale)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>Class Rank</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--coral)' }}>#{childRank}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-20">
      <div className="card-header">
        <div className="card-title">Attendance Overview</div>
        <span className="card-action" onClick={() => onNavigate('students')}>Manage students →</span>
      </div>
      <div className="card-body" style={{ padding: '16px 20px' }}>
        {/* Summary row */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
            <CircleCheckBig size={14} /> {totalPresent} Present
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#eab308' }}>
            <Timer size={14} /> {totalLate} Late
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#ef4444' }}>
            <XCircle size={14} /> {totalAbsent} Absent
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>
            <CalendarOff size={13} /> {totalLeave} Leave
          </div>
          {totalUnmarked > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text3)' }}>
              {totalUnmarked} Unmarked
            </div>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{attendancePct}% attendance</div>
        </div>

        {classList.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>No classrooms set up yet.</div>
        ) : classList.map(cls => {
          const clsPct = cls.count ? Math.round(((cls.present + cls.late) / cls.count) * 100) : 0;
          return (
            <div key={cls.name} style={{ marginBottom: 10, padding: '12px 14px', borderRadius: 10, background: 'var(--surface2)', cursor: 'pointer', transition: 'all .15s' }}
              onClick={() => onNavigate('students')}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-pale)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={13} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{cls.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>{cls.count} students</span>
                  <ArrowRight size={12} style={{ color: 'var(--text3)' }} />
                </div>
              </div>
              {/* Mini bar */}
              <div style={{ height: 5, borderRadius: 3, background: '#e5e7eb', display: 'flex', overflow: 'hidden', gap: 1 }}>
                {cls.present > 0 && <div style={{ flex: cls.present, background: 'var(--primary)', borderRadius: 2 }} />}
                {cls.late > 0 && <div style={{ flex: cls.late, background: '#eab308', borderRadius: 2 }} />}
                {cls.absent > 0 && <div style={{ flex: cls.absent, background: '#ef4444', borderRadius: 2 }} />}
                {cls.leave > 0 && <div style={{ flex: cls.leave, background: '#3b82f6', borderRadius: 2 }} />}
                {cls.unmarked > 0 && <div style={{ flex: cls.unmarked, background: '#d1d5db', borderRadius: 2 }} />}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)' }}>{cls.present} present</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#eab308' }}>{cls.late} late</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>{cls.absent} absent</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6' }}>{cls.leave} leave</span>
                {cls.unmarked > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)' }}>{cls.unmarked} pending</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}