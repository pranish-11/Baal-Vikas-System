import { useState } from 'react';

export default function ChatPane({
  thread,
  currentUserId,
  draft,
  onDraftChange,
  attachment,
  onAttachmentChange,
  onSend,
  onEdit,
  onDelete,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const handleEditStart = (m) => {
    setEditingId(m._id);
    setEditText(m.text);
  };

  const handleEditSave = () => {
    onEdit(editingId, editText);
    setEditingId(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onAttachmentChange(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="chat-pane" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {(thread || []).map((m) => {
          const sid = m.senderId?._id ?? m.senderId;
          const mine = String(sid) === String(currentUserId);
          const isEditing = editingId === m._id;

          return (
            <div
              key={m._id}
              className={`bubble ${mine ? 'out' : 'in'}`}
              style={{ marginBottom: '1rem', position: 'relative' }}
            >
              {isEditing ? (
                <div>
                  <input
                    className="form-input"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={{ marginBottom: '0.5rem', color: '#000' }}
                  />
                  <button type="button" className="btn-primary btn-sm" onClick={handleEditSave}>Save</button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <div>{m.text}</div>
                  {m.attachment && (
                    <div style={{ marginTop: '0.5rem' }}>
                      {m.attachment.startsWith('data:image/') ? (
                        <img src={m.attachment} alt="attachment" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                      ) : (
                        <a href={m.attachment} download="attachment" style={{ textDecoration: 'underline' }}>Download Attachment</a>
                      )}
                    </div>
                  )}
                  {m.edited && <div style={{ fontSize: '0.7rem', fontStyle: 'italic', opacity: 0.7 }}>(Edited)</div>}
                  <div className="bubble-time">
                    {new Date(m.timestamp).toLocaleString()}
                  </div>
                  {mine && !isEditing && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', justifyContent: 'flex-end' }}>
                      <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'inherit', opacity: 0.8 }} onClick={() => handleEditStart(m)}>✏️</button>
                      <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'inherit', opacity: 0.8 }} onClick={() => onDelete(m._id)}>🗑️</button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
        {!thread?.length ? (
          <div className="empty-hint">Select a conversation to view messages.</div>
        ) : null}
      </div>
      <div className="chat-input-row" style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        {attachment && (
          <div style={{ padding: '0.5rem', background: 'var(--surface2)', borderRadius: 'var(--radius)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem' }}>Attachment ready</span>
            <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => onAttachmentChange('')}>❌</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ cursor: 'pointer', fontSize: '1.25rem', padding: '0.5rem' }}>
            📎
            <input type="file" style={{ display: 'none' }} onChange={handleFileChange} />
          </label>
          <input
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Type a message..."
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSend?.();
            }}
          />
          <button type="button" className="btn-primary" onClick={onSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
