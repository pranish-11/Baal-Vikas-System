function tierClass(bp) {
  if (bp >= 70) return 'behavior-tier-excellent';
  if (bp >= 45) return 'behavior-tier-good';
  return 'behavior-tier-attention';
}

function rankDisplay(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export default function StudentCard({ student, onClick }) {
  const bp = student.behaviorPercent ?? 0;
  const tier = tierClass(bp);
  return (
    <button
      type="button"
      className="student-card"
      onClick={() => onClick?.(student)}
    >
      <div className="student-card-head">
        <div
          className="sc-avatar"
          style={{
            background: student.avatarBg || 'var(--primary-pale)',
            color: student.avatarColor || 'var(--primary)',
          }}
        >
          {student.initials}
        </div>
        <div className="rank-badge title-font">{rankDisplay(student.rank)}</div>
      </div>
      <div className="sc-name">
        {student.firstName} {student.lastName}
      </div>
      <div className="sc-meta">{student.classroom}</div>
      <div className="sc-meta">Age {student.age}</div>
      <div className={`behavior-bar ${tier}`}>
        <div
          className="behavior-bar-fill"
          style={{ width: `${Math.min(100, bp)}%` }}
        />
      </div>
      <span className="points-chip">{student.points ?? 0} pts</span>
    </button>
  );
}
