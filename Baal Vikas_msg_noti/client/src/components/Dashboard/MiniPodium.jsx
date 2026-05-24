import { useApp } from '../../contexts/AppContext';
import { Crown } from 'lucide-react';

export default function MiniPodium() {
  const { students } = useApp();
  const top3 = students.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]];
  const sizes = [44, 56, 38];
  const heights = [44, 64, 32];
  const podColors = ['#8A9BAA', 'var(--gold)', '#C07B45'];

  if (!students.length) {
    return <div className="podium-wrap"><div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>No students enrolled yet</div></div>;
  }

  return (
    <div className="podium-wrap">
      {order.map((s, i) => {
        if (!s) {
          return (
            <div key={i} className="podium-item" style={{ opacity: 0.3, justifyContent: 'flex-end' }}>
              <div className="pod-base" style={{ height: heights[i], background: podColors[i] }}>-</div>
            </div>
          );
        }
        const sz = sizes[i];
        return (
          <div key={s.id} className="podium-item">
            <div className="pod-avi" style={{ width: sz, height: sz, fontSize: Math.round(sz * 0.3), background: s.bg || 'var(--primary-pale)', borderColor: podColors[i], color: s.col || 'var(--primary)', position: 'relative' }}>
              {s.init}
              {s.rank === 1 && <div className="pod-crown"><Crown size={16} /></div>}
            </div>
            <div className="pod-name">{s.name.split(' ')[0]}</div>
            <div className="pod-pts">{s.pts} pts</div>
            <div className="pod-base" style={{ height: heights[i], background: podColors[i] }}>{s.rank}</div>
          </div>
        );
      })}
    </div>
  );
}

export function MiniLBList() {
  const { students } = useApp();
  const list = students.slice(3, 6);

  if (!list.length) {
    return <div style={{ padding: '12px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>No students yet</div>;
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      {list.map(s => (
        <div key={s.id} className="lb-row">
          <div className="lb-rank">{s.rank}</div>
          <div className="lb-avi" style={{ background: s.bg || 'var(--primary-pale)', color: s.col || 'var(--primary)' }}>{s.init}</div>
          <div className="lb-info">
            <div className="lb-name">{s.name}</div>
            <div className="lb-class">{s.class}</div>
          </div>
          <div className="lb-pts">{s.pts}</div>
        </div>
      ))}
    </div>
  );
}
