export default function LeaderboardRow({
  rank,
  student,
  onAward,
  maxPoints,
}) {
  const pts = student.periodPoints ?? student.points ?? 0;
  const pct = maxPoints ? Math.min(100, (pts / maxPoints) * 100) : 0;
  return (
    <div className="leaderboard-row">
      <div className="title-font lb-rank-num">{rank}</div>
      <div>
        <div className="lb-row">
          <div
            className="lb-avatar"
            style={{
              background: student.avatarBg || 'var(--primary-pale)',
              color: student.avatarColor || 'var(--primary)',
            }}
          >
            {student.initials}
          </div>
          <div>
            <div className="lb-name">
              {student.firstName} {student.lastName}
            </div>
            <div className="lb-meta">
              {student.classroom} · Age {student.age}
            </div>
            <div className="lb-bar">
              <div className="lb-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
      <div className="title-font lb-pts-num">{pts}</div>
      <button
        type="button"
        className="btn-secondary btn-sm"
        onClick={(e) => {
          e.stopPropagation();
          onAward?.(student._id);
        }}
      >
        ± Points
      </button>
    </div>
  );
}
