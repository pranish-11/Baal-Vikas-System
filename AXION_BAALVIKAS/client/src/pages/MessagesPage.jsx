import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { MessageCircle, Search, Paperclip, Send, Trash2, Pencil } from 'lucide-react';

import { API_BASE } from '../config';

export default function MessagesPage() {
  const { messages, setMessages, currentRole, openModal, sendMsg, setCurrentMsgId, currentMsgId, deleteConversation, user, editMessage, deleteMessage } = useApp();
  const myId = user?.id || (user?.email || '').replace(/[^a-z0-9]/gi, '_');
  const myEmailId = (user?.email || '').replace(/[^a-z0-9]/gi, '_');
  const myName = user?.name || '';
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [fileToSend, setFileToSend] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState('');
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const getContact = (m) => {
    const ids = m.participants || m.participantIds || [];
    // Use backend-provided myKnownIds; fall back to local computation
    const myKnown = m.myKnownIds ? new Set(m.myKnownIds) : new Set([myId, myEmailId]);
    const contactId = ids.find(id => !myKnown.has(id)) || m.senderId || '';
    return {
      name: m.participantNames?.[contactId] || m.sender || 'Unknown',
      role: m.participantRoles?.[contactId] || m.role || 'Contact',
      avi: m.participantAvis?.[contactId] || m.avi || '?',
      id: contactId,
      email: m.participantEmails?.[contactId] || m.contactEmail || '',
      aColor: m.participantRoles?.[contactId] === 'TEACHER' ? 'var(--sky-pale)' : m.participantRoles?.[contactId] === 'PARENT' ? 'var(--coral-pale)' : m.aColor || 'var(--primary-pale)',
      aText: m.participantRoles?.[contactId] === 'TEACHER' ? 'var(--sky)' : m.participantRoles?.[contactId] === 'PARENT' ? 'var(--coral)' : m.aText || 'var(--primary)',
    };
  };

  let pool = messages.filter(m => {
    const partIds = m.participants || m.participantIds || [];
    const myKnown = m.myKnownIds ? new Set(m.myKnownIds) : new Set([myId, myEmailId]);
    const isParticipant = partIds.some(id => myKnown.has(id));
    if (!isParticipant) return false;
    const c = getContact(m);
    if (currentRole === 'admin') return true;
    if (currentRole === 'teacher') return c.role === 'PARENT' || c.role === 'ADMIN';
    if (currentRole === 'parent') return c.role === 'TEACHER' || c.role === 'ADMIN';
    return false;
  });

  if (currentRole === 'admin' && filter !== 'all') {
    pool = pool.filter(m => getContact(m).role?.toUpperCase() === filter);
  }
  if (search) {
    const q = search.toLowerCase();
    pool = pool.filter(m => {
      const c = getContact(m);
      return c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q);
    });
  }

  useEffect(() => {
    if (!currentMsgId && pool.length > 0) setCurrentMsgId(pool[0].id);
  }, [currentMsgId, pool]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, currentMsgId]);

  // Poll for new messages every 10 seconds as a real-time fallback
  const pollRef = useRef(null);
  const refreshMessages = useCallback(() => {
    const token = localStorage.getItem('axion_token');
    if (!token) return;
    fetch(`${API_BASE}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const fresh = data.items || [];
        setMessages(prev => {
          const freshById = {};
          for (const f of fresh) freshById[f.id] = f;
          const merged = prev.filter(m => !m.id?.startsWith('msg-') || fresh.some(f => f.id === m.id));
          for (let i = 0; i < merged.length; i++) {
            const f = freshById[merged[i].id];
            if (f) merged[i] = f;
          }
          for (const f of fresh) {
            if (!merged.some(m => m.id === f.id)) merged.push(f);
          }
          return merged;
        });
      })
      .catch(() => {});
  }, [setMessages]);

  useEffect(() => {
    refreshMessages();
    pollRef.current = setInterval(refreshMessages, 10000);
    return () => clearInterval(pollRef.current);
  }, [refreshMessages]);

  const currentMsg = messages.find(m => m.id === currentMsgId);
  const currentContact = currentMsg ? getContact(currentMsg) : null;

  const switchMsg = (id) => {
    setCurrentMsgId(id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m));
    const token = localStorage.getItem('axion_token');
    if (token && !id?.startsWith('msg-')) {
      fetch(`${API_BASE}/messages/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  const handleSend = () => {
    if (!input.trim() && !fileToSend) return;
    const doSend = (text) => {
      sendMsg(text);
      setInput('');
      setFileToSend(null);
    };
    if (fileToSend) {
      const reader = new FileReader();
      reader.onload = (ev) => { sendMsg(input.trim(), { name: fileToSend.name, type: fileToSend.type, size: fileToSend.size, dataUrl: ev.target.result }); setInput(''); setFileToSend(null); };
      reader.readAsDataURL(fileToSend);
      return;
    }
    doSend(input.trim());
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="msg-layout">
        <div className="msg-list">
          <div className="msg-list-header" style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
                <input className="msg-search" placeholder="Search..." style={{ flex: 1, paddingLeft: 30, width: '100%' }} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openModal('newMsg')} style={{ padding: '0 12px' }}>+</button>
            </div>
            {currentRole === 'admin' && (
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ key: 'all', label: 'All' }, { key: 'TEACHER', label: 'Teachers' }, { key: 'PARENT', label: 'Parents' }].map(r => (
                  <div key={r.key} className={`msg-role-chip${filter === r.key ? ' active' : ''}`} onClick={() => setFilter(r.key)}>{r.label}</div>
                ))}
              </div>
            )}
          </div>
          <div id="msg-list-items">
            {pool.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)' }}>
                <MessageCircle size={32} style={{ marginBottom: 10, color: 'var(--text3)', opacity: 0.25 }} />
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>No conversations yet</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Click <strong>+</strong> to start a new message</div>
              </div>
            ) : pool.map(m => {
              const c = getContact(m);
              return (
                <div key={m.id} className={`msg-item-row${m.id === currentMsgId ? ' active' : ''}`}
                  onMouseEnter={e => { const el = e.currentTarget.querySelector('.msg-del-btn'); if (el) el.style.opacity = '1'; }}
                  onMouseLeave={e => { const el = e.currentTarget.querySelector('.msg-del-btn'); if (el) el.style.opacity = '0'; }}>
                  <div className="msg-item-avi" style={{ background: c.aColor, color: c.aText, position: 'relative' }} onClick={() => switchMsg(m.id)}>{c.avi}</div>
                  <div className="msg-item-body" onClick={() => switchMsg(m.id)}>
                    <div className="msg-sender-row">
                      <div className="msg-sender">{c.name}{m.unread ? <span className="msg-unread-dot" /> : ''}</div>
                      <div className="msg-time-label">{m.time}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginTop: 1 }}>{c.role}</div>
                    <div className="msg-preview">{m.preview || 'No messages yet'}</div>
                  </div>
                  <button className="msg-del-btn" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'var(--coral-pale)', border: 'none', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', color: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .15s' }}
                    onClick={e => { e.stopPropagation(); deleteConversation(m.id); }} title="Delete conversation">
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="msg-pane">
          {!currentMsg ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 14, fontWeight: 800 }}>Select a conversation</div>
          ) : (
            <>
              <div className="msg-pane-header">
                <div className="user-avi" style={{ background: currentContact.aColor, color: currentContact.aText, fontSize: 13, fontWeight: 800, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{currentContact.avi}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{currentContact.name}</div>
                  <div className="text-muted">{currentContact.role}</div>
                </div>
                <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}
                  onClick={() => deleteConversation(currentMsg.id)} title="Delete conversation">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
              <div className="msg-chat-area">
                {!currentMsg.chat?.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: 'var(--text3)' }}>
                    <MessageCircle size={40} style={{ opacity: 0.25 }} />
                    <div style={{ fontSize: 13, fontWeight: 600 }}>No messages yet. Say hello!</div>
                  </div>
                ) : currentMsg.chat.map((c, i) => {
                  const isOutMsg = (msg) => (msg.authorEmail && msg.authorEmail === user?.email) || (msg.authorId && msg.authorId === myId) || (!msg.authorEmail && !msg.authorId && (msg.from_dir === 'out' || msg.from === 'out'));
                  const isOut = isOutMsg(c);
                  const isMine = isOut;
                  const prev = i > 0 ? currentMsg.chat[i - 1] : null;
                  const prevDir = prev ? isOutMsg(prev) : isOut;
                  const senderChanged = i > 0 && prevDir !== isOut;
                  const next = i < currentMsg.chat.length - 1 ? currentMsg.chat[i + 1] : null;
                  const isLastInGroup = !next || isOutMsg(next) !== isOut;
                  if (editingMsg === i) {
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start', padding: '2px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 10, padding: '6px 8px' }}>
                          <input autoFocus value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && editText.trim()) { editMessage(currentMsg.id, i, editText.trim()); setEditingMsg(null); setEditText(''); } if (e.key === 'Escape') { setEditingMsg(null); setEditText(''); } }} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--text)', width: 180, fontFamily: "'Nunito',sans-serif" }} />
                          <button onClick={() => { if (editText.trim()) { editMessage(currentMsg.id, i, editText.trim()); } setEditingMsg(null); setEditText(''); }} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                          <button onClick={() => { setEditingMsg(null); setEditText(''); }} style={{ background: 'none', color: 'var(--text3)', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={i} className={`msg-bubble-row ${isOut ? 'out' : 'in'}${senderChanged ? ' sender-change' : ''}`}>
                      <div className={`bubble bubble-${isOut ? 'out' : 'in'}`}>
                        {c.text}
                        {c.edited && <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 4 }}>(edited)</span>}
                        {isMine && (
                          <span style={{ marginLeft: 6, display: 'inline-flex', gap: 2, verticalAlign: 'middle' }}>
                            <button onClick={e => { e.stopPropagation(); setEditingMsg(i); setEditText(c.text); }} title="Edit" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', opacity: 0.4, display: 'inline-flex', alignItems: 'center', fontSize: 11 }}><Pencil size={11} /></button>
                            <button onClick={e => { e.stopPropagation(); if (confirm('Delete this message?')) deleteMessage(currentMsg.id, i); }} title="Delete" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', opacity: 0.4, display: 'inline-flex', alignItems: 'center', fontSize: 11 }}><Trash2 size={11} /></button>
                          </span>
                        )}
                      </div>
                      {isLastInGroup && <div className="bubble-meta">{c.time}</div>}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div className="msg-input-bar">
                <button className="send-btn" style={{ background: 'none', color: 'var(--text3)', fontSize: 16 }} onClick={() => fileInputRef.current?.click()} title="Attach file">
                  <Paperclip size={18} />
                </button>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setFileToSend(f); e.target.value = ''; }} />
                {fileToSend && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-pale)', padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Paperclip size={11} /> {fileToSend.name}
                  </span>
                )}
                <input className="msg-input" placeholder={`Reply to ${currentContact?.name || '...'}...`} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} />
                <button className="send-btn" onClick={handleSend}><Send size={16} /></button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
