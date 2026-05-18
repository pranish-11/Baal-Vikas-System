export default function Podium({ students }) {
  const top = students?.slice(0, 3) || [];
  const order = [top[1], top[0], top[2]];
  const slots = [
    { data: order[0], cls: 'silver', label: '2' },
    { data: order[1], cls: 'gold', label: '1', crown: true },
    { data: order[2], cls: 'bronze', label: '3' },
  ];
  return (
    <div className="podium">
      {slots.map((s, i) => (
        <div className="podium-slot" key={i}>
          <div className={`podium-block ${s.cls}`}>
            {s.crown ? <div className="podium-crown">👑</div> : null}
            <div className="title-font podium-rank-num">{s.label}</div>
          </div>
          <div className="podium-name">
            {s.data
              ? `${s.data.firstName} ${s.data.lastName?.[0]}.`
              : '—'}
          </div>
          <div className="podium-pts">
            {s.data ? `${s.data.periodPoints ?? s.data.points ?? 0} pts` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
