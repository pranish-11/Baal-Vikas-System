export default function ActivityItem({ type, title, subtitle, time }) {
  const dot =
    type === 'detection' ? 'det' : type === 'message' ? 'msg' : 'comp';
  return (
    <div className="activity-item">
      <div className={`activity-dot ${dot}`} />
      <div>
        <div className="activity-title">{title}</div>
        <div className="activity-sub">{subtitle}</div>
        <div className="activity-time">{time}</div>
      </div>
    </div>
  );
}
