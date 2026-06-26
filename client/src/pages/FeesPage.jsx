import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { CreditCard, DollarSign, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp, History, User, Calendar } from 'lucide-react';

export default function FeesPage() {
  const { fees, students, currentRole, openModal, deleteFeeRecord, loadFeesData } = useApp();
  const [filter, setFilter] = useState('all');
  const [expandedPayments, setExpandedPayments] = useState(null);

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'partial', label: 'Partial' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'paid', label: 'Paid' },
  ];

  const counts = {
    all: fees.length,
    pending: fees.filter(f => f.status === 'pending').length,
    partial: fees.filter(f => f.status === 'partial').length,
    overdue: fees.filter(f => f.status === 'overdue').length,
    paid: fees.filter(f => f.status === 'paid').length,
  };

  const list = filter === 'all' ? fees : fees.filter(f => f.status === filter);

  const total = fees.reduce((s, f) => s + f.amount, 0);
  const collected = fees.reduce((s, f) => s + f.amountPaid, 0);
  const outstanding = total - collected;
  const overdueCount = fees.filter(f => f.status === 'overdue').length;
  const paidCount = fees.filter(f => f.status === 'paid').length;
  const unpaidCount = fees.filter(f => f.status !== 'paid').length;

  const isStaff = currentRole === 'admin' || currentRole === 'teacher';
  const isAdmin = currentRole === 'admin';

  return (
    <>
      {currentRole === 'parent' ? (
        <div id="fees-parent-banner" style={{ marginBottom: 18 }}>
          <div style={{ background: 'linear-gradient(135deg,var(--primary) 0%,var(--primary-light) 100%)', borderRadius: 'var(--radius-xl)', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CreditCard size={22} style={{ color: '#fff' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>My Fee Summary</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginTop: 2 }}>{fees.length} fee record{fees.length !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>${outstanding.toFixed(0)}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>Outstanding</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{paidCount}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>Paid</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{overdueCount}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>Overdue</div></div>
            </div>
          </div>
        </div>
      ) : (
        <div id="fees-summary-row" className="fees-summary-grid stagger-enter">
          {[
            { icon: DollarSign, bg: 'var(--primary-pale)', val: `$${total.toFixed(0)}`, label: 'Total Fees', tag: `${fees.length} records`, tagClass: 'tag-green' },
            { icon: CheckCircle2, bg: '#f0fdf4', val: `$${collected.toFixed(0)}`, label: 'Collected', tag: `${paidCount} paid`, tagClass: 'tag-green' },
            { icon: Clock, bg: 'var(--sky-pale)', val: `$${outstanding.toFixed(0)}`, label: 'Outstanding', tag: `${unpaidCount} unpaid`, tagClass: 'tag-blue' },
            { icon: AlertTriangle, bg: 'var(--coral-pale)', val: String(overdueCount), label: 'Overdue', tag: overdueCount > 0 ? 'Needs attention' : 'All on time', tagClass: overdueCount > 0 ? 'tag-red' : 'tag-green' },
          ].map((s, i) => {
            const FI = s.icon;
            return (
            <div key={i} className="stat-card" style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ background: s.bg }}><FI size={18} /></div>
              <div className="stat-value">{s.val}</div>
              <div className="stat-label">{s.label}</div>
              <span className={`stat-tag ${s.tagClass}`}>{s.tag}</span>
            </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <div key={t.key} className={`complaint-filter-chip${filter === t.key ? ' active' : ''}`} onClick={() => setFilter(t.key)}>
              {counts[t.key] > 0 ? `${t.label} (${counts[t.key]})` : t.label}
            </div>
          ))}
        </div>
        {isStaff && (
          <button className="btn btn-primary btn-sm" onClick={() => openModal('addFee')}>+ Add Fee</button>
        )}
      </div>

      <div id="fees-list">
        {list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><CreditCard size={48} style={{ color: 'var(--primary)' }} /></div>
            <p>No fee records yet.</p>
          </div>
        ) : list.map(f => {
          const sc = {
            paid: { bg: '#f0fdf4', col: '#15803d', border: '#16a34a', label: 'Paid' },
            pending: { bg: 'var(--sky-pale)', col: 'var(--sky)', border: 'var(--sky)', label: 'Pending' },
            partial: { bg: '#fffbeb', col: '#92600A', border: '#F4A929', label: 'Partial' },
            overdue: { bg: 'var(--coral-pale)', col: 'var(--coral)', border: 'var(--coral)', label: 'Overdue' },
          }[f.status] || { bg: 'var(--sky-pale)', col: 'var(--sky)', border: 'var(--sky)', label: 'Pending' };
          const pct = f.amount > 0 ? Math.min(100, Math.round((f.amountPaid / f.amount) * 100)) : 0;
          const barColor = f.status === 'paid' ? '#16a34a' : f.status === 'overdue' ? 'var(--coral)' : f.status === 'partial' ? '#F4A929' : 'var(--sky)';

          return (
            <div key={f.id} className="complaint-card" style={{ marginBottom: 12 }}>
              <div className="c-icon" style={{ background: sc.bg, color: sc.col, border: `1.5px solid ${sc.border}`, flexShrink: 0, width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={18} />
              </div>
              <div className="c-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="c-title">{f.title}</div>
                    <div className="c-desc" style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {f.studentName && <span><User size={11} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 2 }} />{f.studentName}</span>}
                      {f.studentClass && <span style={{ color: 'var(--text3)' }}>·</span>}
                      {f.studentClass && <span>{f.studentClass}</span>}
                    </div>
                    {f.description && <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginTop: 4 }}>{f.description}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 900 }}>${f.amount.toFixed(2)}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'capitalize' }}>{f.term}</div>
                  </div>
                </div>
                <div style={{ margin: '10px 0 4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 5 }}>
                    <span>Paid: <strong style={{ color: '#15803d' }}>${f.amountPaid.toFixed(2)}</strong></span>
                    <span>Balance: <strong style={{ color: f.balance > 0 ? sc.col : '#15803d' }}>${f.balance.toFixed(2)}</strong> ({pct}%)</span>
                  </div>
                  <div style={{ height: 7, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 10, transition: 'width .5s ease' }} />
                  </div>
                </div>
                <div className="c-meta" style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: sc.bg, color: sc.col, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                  {f.dueDate && <span style={{ fontSize: 12, fontWeight: 700, color: f.status === 'overdue' ? 'var(--coral)' : 'var(--text3)' }}><Calendar size={11} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: 2 }} />Due: {f.dueDate}</span>}
                  {f.paidAt && <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}><CheckCircle2 size={11} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: 2 }} />Paid: {new Date(f.paidAt).toLocaleDateString()}</span>}
                  {f.payments?.length > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                      onClick={() => setExpandedPayments(expandedPayments === f.id ? null : f.id)}>
                      <History size={11} /> {f.payments.length} payment{f.payments.length > 1 ? 's' : ''} {expandedPayments === f.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </span>
                  )}
                </div>
                {expandedPayments === f.id && f.payments?.length > 0 && (
                  <div style={{ marginTop: 8, padding: 10, background: 'var(--surface2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .6 }}>Payment History</div>
                    {f.payments.map((p, pi) => (
                      <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, fontWeight: 600, color: 'var(--text2)', borderTop: pi > 0 ? '1px solid var(--border)' : 'none', marginTop: pi > 0 ? 4 : 0, paddingTop: pi > 0 ? 6 : 0 }}>
                        <DollarSign size={14} style={{ color: '#15803d', flexShrink: 0 }} />
                        <span style={{ fontWeight: 800, color: '#15803d' }}>${p.amount.toFixed(2)}</span>
                        <span style={{ flex: 1 }}>{p.note}</span>
                        <span style={{ color: 'var(--text3)', fontSize: 10 }}>{new Date(p.date).toLocaleDateString()} by {p.by}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {isStaff && f.status !== 'paid' && <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#15803d', border: '1.5px solid #16a34a', fontWeight: 800, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all .15s' }} onClick={() => openModal('recordPayment')} onMouseEnter={e => { e.currentTarget.style.background = '#15803d'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#15803d'; e.currentTarget.style.transform = 'translateY(0)'; }}><DollarSign size={14} style={{ marginRight: 4 }} /> Record Payment</button>}
                  {isStaff && f.status !== 'paid' && f.parentEmail && <button className="btn btn-sm" style={{ background: '#fffbeb', color: '#92600A', border: '1.5px solid #F4A929', fontWeight: 800, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all .15s' }} onClick={() => openModal('sendReminder')} onMouseEnter={e => { e.currentTarget.style.background = '#F4A929'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fffbeb'; e.currentTarget.style.color = '#92600A'; e.currentTarget.style.transform = 'translateY(0)'; }}><AlertTriangle size={14} style={{ marginRight: 4 }} /> Remind Parent</button>}
                  {isAdmin && <button className="btn btn-sm" style={{ background: '#fff1f2', color: '#be123c', border: '1.5px solid #e11d48', fontWeight: 800, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all .15s' }} onClick={() => deleteFeeRecord(f.id)} onMouseEnter={e => { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#be123c'; e.currentTarget.style.transform = 'translateY(0)'; }}><Clock size={14} style={{ marginRight: 4 }} /> Delete</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
