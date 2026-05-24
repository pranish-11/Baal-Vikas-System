import { Trophy, Award, Medal, Star } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const TIER_ICONS = { gold: Trophy, silver: Award, bronze: Medal };

export default function LeaderboardRow({ student, maxPts }) {
  const { awardedRewards, openModal, setCurrentStudentFilter } = useApp();
  const pct = Math.min(100, Math.round((student.pts / maxPts) * 100));
  const barColor = student.rank === 1 ? 'var(--gold)' : student.rank === 2 ? '#8A9BAA' : student.rank === 3 ? '#C07B45' : 'var(--primary)';
  const studentRewards = awardedRewards.filter(r => r.studentId === student.id);

  return (
    <div className="lb-row">
      <div className="lb-rank">{student.rank}</div>
      <div className="lb-avi" style={{ background: student.bg || 'var(--primary-pale)', color: student.col || 'var(--primary)' }}>
        {student.init}
      </div>
      <div className="lb-info">
        <div className="lb-name">{student.name}</div>
        <div className="lb-class">{student.class} · Age {student.age}</div>
      </div>
      <div className="lb-bar-wrap"><div className="lb-bar" style={{ width: `${pct}%`, background: barColor }} /></div>
      <div className="lb-pts" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{student.pts}</span>
        {studentRewards.length > 0 && (
          <div style={{ display: 'flex', gap: 2 }}>
            {studentRewards.slice(0, 3).map(r => (
              <span key={r.id} title={`${r.label}: ${r.note}`} style={{ fontSize: 13, cursor: 'default', display: 'flex' }}>{(() => { const I = TIER_ICONS[r.tier] || Trophy; return <I size={14} style={{ color: r.color }} />; })()}</span>
            ))}
            {studentRewards.length > 3 && <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--text3)' }}>+{studentRewards.length - 3}</span>}
          </div>
        )}
      </div>
      <button onClick={() => { setCurrentStudentFilter(student.id); openModal('award'); }} style={{ background: 'var(--primary-pale)', border: 'none', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Award points">
        <Star size={14} />
      </button>
    </div>
  );
}
