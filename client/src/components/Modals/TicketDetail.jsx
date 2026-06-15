import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function TicketDetail({ open, onClose, data }) {
  const { complaints, currentRole, user, resolveComplaint, escalateComplaint, submitTicketReply } = useApp();
  const [replyText, setReplyText] = useState('');

  if (!open) return null;

  const active = data?.complaintId
    ? complaints.find(c => c.id === data.complaintId)
    : complaints.find(c => c.status !== 'resolved') || complaints[0];
  if (!active) return null;

  const handleReply = () => {
    if (!replyText.trim()) return;
    submitTicketReply(active.id, replyText.trim());
    setReplyText('');
  };

  const isStaff = currentRole === 'teacher' || currentRole === 'admin';
  const isResolved = active.status === 'resolved';

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 560, padding: 0, overflow: 'hidden' }}>
        <div style={{ background: active.priority === 'high' ? 'linear-gradient(135deg,var(--coral) 0%,#e05a5a 100%)' : 'linear-gradient(135deg,var(--primary) 0%,var(--primary-light) 100%)', padding: '20px 24px 16px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.2)', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 26 }}>{active.icon}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{active.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginTop: 2 }}>{active.by} · {active.time}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <span className={`badge badge-${active.status}`}>{active.status}</span>
            <span className={`badge badge-${active.priority}`}>{active.priority}</span>
            <span className={`badge badge-${active.type}`}>{active.type}</span>
            {active.student && <span className="badge badge-general" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> {active.student}</span>}
          </div>
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(() => {
            const isMe = currentRole === 'parent' ? true : active.by === user?.name;
            const align = isMe ? 'flex-end' : 'flex-start';
            const bg = isMe ? 'var(--primary)' : '#fff';
            const color = isMe ? '#fff' : 'var(--text)';
            const radius = isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px';
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: align }}>
                <div style={{ maxWidth: '75%', padding: '8px 14px', background: bg, color: color, borderRadius: radius, boxShadow: isMe ? '0 1px 2px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.07)', fontSize: 13, fontWeight: 600, lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {active.desc}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 2, padding: '0 4px' }}>{active.by} · {active.time}</div>
              </div>
            );
          })()}
          {(!active.replies || active.replies.length === 0) ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600, padding: 20 }}>No replies yet. Be the first to respond.</div>
          ) : active.replies.map((r, i) => {
            const isMe = currentRole === 'parent' ? r.authorRole === 'parent' : r.authorRole === 'teacher' || r.authorRole === 'admin';
            const prevR = active.replies[i - 1];
            const senderChanged = i > 0 && (prevR.authorRole === r.authorRole) === false;
            const nextR = active.replies[i + 1];
            const isLastInGroup = !nextR || nextR.authorRole !== r.authorRole;
            const bubbleBg = isMe ? 'var(--primary)' : '#fff';
            const bubbleColor = isMe ? '#fff' : 'var(--text)';
            const bubbleRadius = isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px';
            const align = isMe ? 'flex-end' : 'flex-start';
            return (
              <div key={r.id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: align, marginTop: senderChanged ? 8 : 0 }}>
                <div style={{ maxWidth: '70%', padding: '8px 12px', background: bubbleBg, color: bubbleColor, borderRadius: bubbleRadius, boxShadow: isMe ? '0 1px 2px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.07)', fontSize: 13, fontWeight: 600, lineHeight: 1.45, wordBreak: 'break-word' }}>
                  {r.text}
                </div>
                {isLastInGroup && <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 2, padding: '0 4px' }}>{r.authorName} · {r.time}</div>}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
          {!isResolved ? (
            <>
              <input className="form-input-m" style={{ flex: 1 }} placeholder="Type your message..." value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }} />
              <button className="btn btn-primary btn-sm" onClick={handleReply}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
              {!isStaff && (
                <button className="btn btn-sm" style={{ background: '#fff7ed', color: '#c2410c', border: '1.5px solid #fb923c', fontWeight: 800, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => { escalateComplaint(active.id); }}>Escalate</button>
              )}
              {isStaff && (
                <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#15803d', border: '1.5px solid #16a34a', fontWeight: 800, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => { resolveComplaint(active.id); }}>Resolve</button>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '6px 0', width: '100%' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>Complaint Resolved</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>This ticket is closed</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
