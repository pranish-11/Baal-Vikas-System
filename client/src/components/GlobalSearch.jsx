import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Search, Users, MessageSquare, ClipboardList, CreditCard, X } from 'lucide-react';

export default function GlobalSearch({ open, onClose }) {
  const { students, messages, complaints, fees, navTo } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ students: [], messages: [], complaints: [], fees: [] });
  const inputRef = useRef(null);

  useEffect(() => { if (open) { setTimeout(() => inputRef.current?.focus(), 100); } }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults({ students: [], messages: [], complaints: [], fees: [] }); return; }
    const q = query.toLowerCase();
    setResults({
      students: students.filter(s => s.name.toLowerCase().includes(q) || s.class.toLowerCase().includes(q) || (s.parentName || '').toLowerCase().includes(q)),
      messages: messages.filter(m => m.sender?.toLowerCase().includes(q) || m.preview?.toLowerCase().includes(q) || m.chat?.some(c => c.text?.toLowerCase().includes(q))),
      complaints: complaints.filter(c => c.title?.toLowerCase().includes(q) || c.desc?.toLowerCase().includes(q) || c.student?.toLowerCase().includes(q)),
      fees: fees.filter(f => f.studentName?.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)),
    });
  }, [query, students, messages, complaints, fees]);

  const handleSelect = (type, id) => {
    if (type === 'students') { onClose(); return; }
    if (type === 'messages') { navTo('messages'); onClose(); return; }
    if (type === 'complaints') { navTo('complaints'); onClose(); return; }
    if (type === 'fees') { navTo('fees'); onClose(); return; }
  };

  const sections = [
    { key: 'students', icon: Users, color: 'var(--primary)', label: 'Students', items: results.students.slice(0, 5), render: s => `${s.name} — ${s.class}` },
    { key: 'messages', icon: MessageSquare, color: 'var(--sky)', label: 'Messages', items: results.messages.slice(0, 5), render: m => `${m.sender || 'Unknown'}: ${(m.preview || '').slice(0, 40)}` },
    { key: 'complaints', icon: ClipboardList, color: 'var(--coral)', label: 'Complaints', items: results.complaints.slice(0, 5), render: c => c.title },
    { key: 'fees', icon: CreditCard, color: '#B07D0F', label: 'Fees', items: results.fees.slice(0, 5), render: f => `${f.studentName || 'Unknown'} — ${f.description || f.status}` },
  ];

  if (!open) return null;

  const total = sections.reduce((s, sec) => s + sec.items.length, 0);

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) { setQuery(''); onClose(); } }}>
      <div className="modal-box" style={{ maxWidth: 520, padding: 0, overflow: 'hidden', marginTop: '10vh' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Search size={18} style={{ color: 'var(--text3)', flexShrink: 0 }} />
          <input ref={inputRef} className="form-input-m" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, background: 'transparent' }}
            placeholder="Search students, messages, complaints, fees..." value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setQuery(''); onClose(); } }} />
          {query && <X size={16} style={{ color: 'var(--text3)', cursor: 'pointer', flexShrink: 0 }} onClick={() => setQuery('')} />}
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '8px 0' }}>
          {!query ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>Type to search across students, messages, complaints, and fees</div>
          ) : total === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>No results found for "{query}"</div>
          ) : sections.map(sec => {
            if (sec.items.length === 0) return null;
            const Icon = sec.icon;
            return (
              <div key={sec.key}>
                <div style={{ padding: '8px 20px 4px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .6, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={12} style={{ color: sec.color }} /> {sec.label} ({results[sec.key].length})
                </div>
                {sec.items.map((item, i) => (
                  <div key={i} className="nav-item" style={{ padding: '8px 20px 8px 44px', cursor: 'pointer', borderRadius: 0, fontSize: 13, fontWeight: 600 }}
                    onClick={() => handleSelect(sec.key, item.id)}>
                    {sec.render(item)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
