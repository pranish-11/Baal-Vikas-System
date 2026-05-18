export default function ChatPane({
  thread,
  currentUserId,
  draft,
  onDraftChange,
  onSend,
}) {
  return (
    <div className="chat-pane">
      <div className="chat-scroll">
        {(thread || []).map((m) => {
          const sid = m.senderId?._id ?? m.senderId;
          const mine = String(sid) === String(currentUserId);
          return (
            <div
              key={m._id}
              className={`bubble ${mine ? 'out' : 'in'}`}
            >
              <div>{m.text}</div>
              <div className="bubble-time">
                {new Date(m.timestamp).toLocaleString()}
              </div>
            </div>
          );
        })}
        {!thread?.length ? (
          <div className="empty-hint">Select a conversation to view messages.</div>
        ) : null}
      </div>
      <div className="chat-input-row">
        <input
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
  );
}
