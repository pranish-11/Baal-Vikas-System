import { useApp } from '../../contexts/AppContext';
import { Calendar, DollarSign } from 'lucide-react';

export default function ActivityFeed({ onNavigate }) {
  const { currentRole, students, attendanceData, fees, user, getTeacherClassrooms } = useApp();

  // Filter students by teacher's assigned classrooms
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
    const present = studs.filter(s => rec[s.id] === 'present' || rec[s.id] === 'late').length;
    const absent = studs.filter(s => rec[s.id] === 'absent').length;
    const leave = studs.filter(s => rec[s.id] === 'leave').length;
    const unmarked = studs.filter(s => !rec[s.id]).length;
    return { name, count: studs.length, present, absent, leave, unmarked, students: studs };
  });

  if (currentRole === 'parent') {
    const child = visibleStudents[0] || students[0];
    if (!child) return null;
    const todayRec = rec[child.id];
    return (
      <div className="card mb-20">
        <div className="card-header">
          <div className="card-title">Today's Summary</div>
        </div>
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
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--coral)' }}>#{child.rank || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-20">
      <div className="card-header">
        <div className="card-title">Classrooms</div>
        <span className="card-action" onClick={() => onNavigate('students')}>Manage students →</span>
      </div>
      <div className="card-body" style={{ padding: '12px 20px' }}>
        {classList.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>No classrooms set up yet.</div>
        ) : classList.map(cls => {
          const absentFees = fees.filter(f => f.status === 'overdue' && cls.students.some(s => s.name === f.studentName)).length;
          return (
            <div key={cls.name} style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: 'var(--surface2)', cursor: 'pointer' }} onClick={() => onNavigate('students')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{cls.name}</div>
                <span className="badge badge-general">{cls.count} student{cls.count > 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {cls.present > 0 && <span className="badge badge-resolved">✓ {cls.present} present</span>}
                {cls.absent > 0 && <span className="badge badge-escalated">✕ {cls.absent} absent</span>}
                {cls.leave > 0 && <span className="badge badge-pending"><Calendar size={11} style={{ marginRight: 2 }} /> {cls.leave} on leave</span>}
                {cls.unmarked > 0 && <span className="badge badge-general" style={{ background: 'var(--surface)', color: 'var(--text3)' }}>{cls.unmarked} not marked</span>}
                {absentFees > 0 && <span className="badge badge-escalated"><DollarSign size={11} style={{ marginRight: 2 }} /> {absentFees} overdue</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
