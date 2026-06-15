import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { FileWarning, Send, AlertTriangle, Info, ChevronDown } from 'lucide-react';

const PRIORITY_CONFIG = {
  Low: { icon: Info, bg: 'var(--primary-pale)', col: 'var(--primary)', border: '#16a34a' },
  Medium: { icon: AlertTriangle, bg: '#fffbeb', col: '#92600A', border: '#F4A929' },
  High: { icon: FileWarning, bg: '#fff1f2', col: '#be123c', border: '#e11d48' },
};

export default function ComplaintModal({ open, onClose }) {
  const { submitComplaint } = useApp();
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('High');
  const [details, setDetails] = useState('');
  const [showPriority, setShowPriority] = useState(false);

  if (!open) return null;

  const prio = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.High;
  const PrioIcon = prio.icon;
  const canSubmit = subject.trim() && details.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    submitComplaint({ subject: subject.trim(), priority, details: details.trim() });
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 480, padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ background: 'linear-gradient(135deg,var(--coral) 0%,#E8614A 100%)', padding: '24px 28px 18px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'rgba(255,255,255,0.18)', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileWarning size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>File a Complaint</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginTop: 2 }}>We'll review and respond promptly</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px 16px' }}>
          <div className="form-group-m">
            <label className="form-label-m" style={{ fontSize: 12 }}>Subject</label>
            <input className="form-input-m" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief subject line..." style={{ fontSize: 14, fontWeight: 600 }} />
          </div>

          <div className="form-group-m">
            <label className="form-label-m" style={{ fontSize: 12 }}>Priority</label>
            <div style={{ position: 'relative' }}>
              <div onClick={() => setShowPriority(!showPriority)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', cursor: 'pointer', background: prio.bg, transition: 'border-color .2s' }}>
                <PrioIcon size={16} style={{ color: prio.col }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: prio.col }}>{priority}</span>
                <ChevronDown size={15} style={{ color: prio.col, opacity: 0.6 }} />
              </div>
              {showPriority && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4, background: '#fff', borderRadius: 10, border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const sel = key === priority;
                    return (
                      <div key={key} onClick={() => { setPriority(key); setShowPriority(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', cursor: 'pointer', background: sel ? cfg.bg : 'transparent', transition: 'background .12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = cfg.bg} onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}>
                        <Icon size={15} style={{ color: cfg.col }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: cfg.col }}>{key}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="form-group-m">
            <label className="form-label-m" style={{ fontSize: 12 }}>Details</label>
            <textarea className="form-textarea-m" style={{ minHeight: 110, fontSize: 14, fontWeight: 600, lineHeight: 1.6 }} value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe the issue in detail..." />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: canSubmit ? 'var(--coral)' : 'var(--border)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, fontFamily: "'Nunito',sans-serif", cursor: canSubmit ? 'pointer' : 'default', transition: 'all .2s', opacity: canSubmit ? 1 : 0.6 }}>
            <Send size={15} /> Submit Complaint
          </button>
        </div>
      </div>
    </div>
  );
}
