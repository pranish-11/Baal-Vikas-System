export default function MessageList({
  conversations,
  search,
  onSearchChange,
  selectedId,
  onSelect,
}) {
  const q = search.toLowerCase();
  const filtered = (conversations || []).filter((c) => {
    const name = c.partner?.name || '';
    return name.toLowerCase().includes(q);
  });
  return (
    <div className="conv-list">
      <input
        className="conv-search"
        placeholder="Search conversations..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {filtered.map((c, idx) => {
        const id = c.partner?._id;
        const active = id && selectedId === id;
        return (
          <button
            type="button"
            key={id ? String(id) : `c-${idx}`}
            className={`conv-item${active ? ' active' : ''}`}
            onClick={() => onSelect?.(id)}
          >
            <div className="conv-item-name">{c.partner?.name}</div>
            <div className="conv-item-preview">
              {c.lastMessage?.text?.slice(0, 42)}
              {c.lastMessage?.text?.length > 42 ? '…' : ''}
            </div>
            {c.unreadCount > 0 ? (
              <div className="conv-unread-wrap">
                <span className="sidebar-badge">{c.unreadCount}</span>
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
