export default function StatCard({ label, value, children }) {
  return (
    <div className="card stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value title-font">{children ?? value}</div>
    </div>
  );
}
