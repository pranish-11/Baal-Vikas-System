import { useApp } from '../../contexts/AppContext';
import { TrendingUp } from 'lucide-react';

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

  const avgPct = total ? Math.round(students.reduce((s, x) => s + (x.pct || 0), 0) / total) : 0;
  const avgColor = avgPct >= 80 ? 'var(--primary)' : avgPct >= 50 ? '#eab308' : '#e11d48';

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Behavior Overview</div>
        <span className="card-action" onClick={() => onNavigate('students')}>See all students →</span>
      </div>
      <div className="card-body" style={{ padding: '16px 20px' }}>
        {/* Average Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${avgColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} style={{ color: avgColor }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: avgColor }}>{avgPct}%</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Average Behavior Score</div>
          </div>
        </div>

        {/* Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#f0fdf4' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
            <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#166534' }}>Excellent</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#16a34a' }}>{excellent}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a' }}>/{total}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#fefce8' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }} />
            <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#713f12' }}>Fair</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#a16207' }}>{fair}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#a16207' }}>/{total}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#fff1f2' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e11d48' }} />
            <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#881337' }}>Needs Attention</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#be123c' }}>{attention}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#be123c' }}>/{total}</div>
          </div>
        </div>

        {/* Stacked bar */}
        {total > 0 && (
          <div style={{ marginTop: 12, height: 6, borderRadius: 3, background: '#e5e7eb', display: 'flex', overflow: 'hidden', gap: 1 }}>
            {excellent > 0 && <div style={{ flex: excellent, background: '#16a34a', borderRadius: 2 }} />}
            {fair > 0 && <div style={{ flex: fair, background: '#eab308', borderRadius: 2 }} />}
            {attention > 0 && <div style={{ flex: attention, background: '#e11d48', borderRadius: 2 }} />}
          </div>
        )}
      </div>
    </div>
  );
}