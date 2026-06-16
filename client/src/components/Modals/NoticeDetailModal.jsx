import { Megaphone } from 'lucide-react';

export default function NoticeDetailModal({ open, onClose, data }) {
  if (!open) return null;
  const { title, body } = data || {};
  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ec489915', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Megaphone size={18} style={{ color: '#ec4899' }} />
          </div>
          <div>
            <div className="modal-title" style={{ marginBottom: 0 }}>Announcement</div>
          </div>
        </div>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{title || 'Untitled'}</div>
        {body && <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{body}</div>}
        <div className="modal-footer" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
