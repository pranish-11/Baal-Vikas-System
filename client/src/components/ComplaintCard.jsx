function statusBadge(status) {
  if (status === 'open') return 'badge badge-open';
  if (status === 'pending') return 'badge badge-pending';
  return 'badge badge-resolved';
}

export default function ComplaintCard({ complaint, onResolve }) {
  const stu = complaint.studentId;
  const filer = complaint.filedBy;
  const studentName = stu
    ? `${stu.firstName} ${stu.lastName}`
    : '—';
  return (
    <div className="card complaint-card">
      <div className="lb-row complaint-head-row">
        <span className="complaint-icon">📋</span>
        <div className="complaint-head-main">
          <div className="complaint-subject">{complaint.subject}</div>
          <div className="complaint-desc">{complaint.description}</div>
        </div>
      </div>
      <div className="complaint-badges">
        <span className={statusBadge(complaint.status)}>{complaint.status}</span>
        <span className="badge badge-type">{complaint.filedByType}</span>
        <span className="badge badge-priority">{complaint.priority}</span>
        <span className="badge badge-student">{studentName}</span>
        <span className="badge badge-filer">{filer?.name || '—'}</span>
        <span className="badge badge-time">
          {new Date(complaint.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="lb-row complaint-actions">
        <button type="button" className="btn-ghost btn-sm">
          Reply
        </button>
        <button type="button" className="btn-ghost btn-sm">
          Escalate
        </button>
        {complaint.status !== 'resolved' ? (
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => onResolve?.(complaint._id)}
          >
            Resolve
          </button>
        ) : null}
      </div>
    </div>
  );
}
