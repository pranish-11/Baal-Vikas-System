import { Crown } from 'lucide-react';

export default function Podium({ list }) {
  const top3 = list.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]];
  const sizes = [52, 64, 44];
  const heights = [52, 72, 38];
  const podColors = ['#8A9BAA', 'var(--gold)', '#C07B45'];

  return (
    <div className="podium-wrap">
      {order.map((s, i) => {
        if (!s) return (
          <div key={i} className="podium-item" style={{ opacity: 0.3, justifyContent: 'flex-end' }}>
            <div className="pod-base" style={{ height: heights[i], background: podColors[i] }}>-</div>
          </div>
        );
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
