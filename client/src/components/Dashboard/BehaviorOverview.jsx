import { useApp } from '../../contexts/AppContext';

export default function BehaviorOverview({ onNavigate, studentsList }) {
  const { students: allStudents } = useApp();
  const students = studentsList || allStudents;

  if (!students.length) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Behavior Overview</div>
          <span className="card-action" onClick={() => onNavigate('students')}>See all students →</span>
        </div>
        <div className="card-body">
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>No student data yet.</div>
        </div>
      </div>
    );
  }

  const excellent = students.filter(s => s.pct >= 80).length;
  const fair = students.filter(s => s.pct >= 50 && s.pct < 80).length;
  const attention = students.filter(s => s.pct < 50).length;
  const total = students.length;

  const bars = [
    { label: 'Excellent behavior', count: excellent, pct: Math.round((excellent / total) * 100), color: '#16a34a' },
    { label: 'Fair behavior', count: fair, pct: Math.round((fair / total) * 100), color: '#eab308' },
    { label: 'Needs attention', count: attention, pct: Math.round((attention / total) * 100), color: '#e11d48' },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Behavior Overview</div>
        <span className="card-action" onClick={() => onNavigate('students')}>See all students →</span>
      </div>
      <div className="card-body">
        {bars.map((b, i) => (
          <div key={i} style={{ marginBottom: 14, borderRadius: 10, padding: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
              <span>{b.label}</span>
              <span style={{ color: b.color }}>{b.count} student{b.count !== 1 ? 's' : ''}</span>
            </div>
            <div className="stu-bar-wrap" style={{ height: 8 }}>
              <div className="stu-bar" style={{ width: `${b.pct || 0}%`, background: b.color, minWidth: b.pct > 0 ? '32px' : 0 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
