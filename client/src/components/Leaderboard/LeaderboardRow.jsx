import { Star } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function LeaderboardRow({ student, maxPts }) {
  const { openModal, setCurrentStudentFilter } = useApp();
  const pct = Math.min(100, Math.round((student.pts / maxPts) * 100));
  const barColor = student.rank === 1 ? 'var(--gold)' : student.rank === 2 ? '#8A9BAA' : student.rank === 3 ? '#C07B45' : 'var(--primary)';

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
      <div className="lb-pts">{student.pts}</div>
      <button onClick={() => { setCurrentStudentFilter(student.id); openModal('award'); }} style={{ background: 'var(--primary-pale)', border: 'none', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Award points">
        <Star size={14} />
      </button>
    </div>
  );
}
