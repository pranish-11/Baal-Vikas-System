import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { CheckCircle2 } from 'lucide-react';

export default function ComplaintsPage() {
  const { complaints, currentRole, openModal, resolveComplaint, escalateComplaint, escalatedIds, user, hasAssignedClasses } = useApp();
  const [filter, setFilter] = useState('all');

  if (currentRole === 'teacher' && !hasAssignedClasses(user?.email)) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text3)', opacity: 0.3 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <p>You must be assigned to a class by the admin to access this feature.</p>
      </div>
    );
  }

  const counts = {
    all: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    'in-progress': complaints.filter(c => c.status === 'in-progress').length,
    escalated: complaints.filter(c => c.status === 'escalated').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'escalated', label: 'Escalated' },
    { key: 'resolved', label: 'Resolved' },
  ];

  const list = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <div key={t.key} className={`complaint-filter-chip${filter === t.key ? ' active' : ''}`} onClick={() => setFilter(t.key)}>
              {counts[t.key] > 0 ? `${t.label} (${counts[t.key]})` : t.label}
            </div>
          ))}
        </div>
        {currentRole === 'parent' && (
          <button className="btn btn-primary btn-sm" onClick={() => openModal('complaint')}>+ File Complaint</button>
        )}
      </div>
      <div id="complaints-list">
        {list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><CheckCircle2 size={48} style={{ color: 'var(--primary)' }} /></div>
            <p>No complaints in this category.</p>
          </div>
        ) : list.map(c => {
          const isResolved = c.status === 'resolved';
          const isEscalated = escalatedIds.has(c.id) || c.status === 'escalated';
          const isParent = currentRole === 'parent';
          const replyCount = c.replies ? c.replies.length : 0;

          return (
            <div key={c.id} className="complaint-card">
              <div className="c-icon">{c.icon}</div>
              <div className="c-body">
                <div className="c-title">{c.title}</div>
                <div className="c-desc">{c.desc}</div>
                <div className="c-meta">
                  <span className={`badge badge-${c.status}`} style={{ color: c.status === 'open' ? 'var(--sky)' : c.status === 'in-progress' ? '#7C3AED' : c.status === 'escalated' ? '#dc2626' : 'var(--primary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.status === 'open' ? 'var(--sky)' : c.status === 'in-progress' ? '#7C3AED' : c.status === 'escalated' ? '#dc2626' : 'var(--primary)', display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }}></span>
                    {c.status === 'open' ? 'Open' : c.status === 'in-progress' ? 'In Progress' : c.status === 'escalated' ? 'Escalated' : 'Resolved'}
                  </span>
                  <span className={`badge badge-${c.type}`}>{c.type.charAt(0).toUpperCase() + c.type.slice(1)}</span>
                  <span className={`badge badge-${c.priority}`}>{c.priority.charAt(0).toUpperCase() + c.priority.slice(1)}</span>
                  {c.student && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{c.student}</span>}
                  <span className="text-muted">· {c.by} · {c.time}</span>
                </div>
                <div className="c-actions">
                  <button className="btn btn-sm" style={{ background: 'var(--primary-pale)', color: 'var(--primary)', border: '1.5px solid var(--primary)', fontWeight: 800, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}
                    onClick={() => openModal('ticketDetail', { complaintId: c.id })}>
                    View Complaint{replyCount > 0 ? ` (${replyCount})` : ''}
                  </button>
                  {isParent ? (
                    !isResolved && (
                      isEscalated
                        ? <button className="btn btn-sm" disabled style={{ background: 'var(--coral-pale)', color: 'var(--coral)', border: '1.5px solid var(--coral)', fontWeight: 800, opacity: 0.8, cursor: 'default', padding: '6px 14px', borderRadius: 8 }}>Escalated</button>
                        : <button className="btn btn-sm" style={{ background: '#fff7ed', color: '#c2410c', border: '1.5px solid #fb923c', fontWeight: 800, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}
                            onClick={() => escalateComplaint(c.id)}>Escalate</button>
                    )
                  ) : (
                    !isResolved && (
                      <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#15803d', border: '1.5px solid #16a34a', fontWeight: 800, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}
                        onClick={() => resolveComplaint(c.id)}><CheckCircle2 size={14} style={{ marginRight: 4 }} /> Resolve</button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
