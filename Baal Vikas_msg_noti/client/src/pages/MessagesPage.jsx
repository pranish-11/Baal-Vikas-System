import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { requestJSON } from '../api';
import { MessageCircle, Search, Paperclip, Send, Trash2, Edit2, X, Check } from 'lucide-react';
import useSocket from '../hooks/useSocket';

export default function MessagesPage() {
  const { messages, setMessages, currentRole, openModal, sendMsg, setCurrentMsgId, currentMsgId, deleteConversation, user, editMessage, deleteMessage } = useApp();
  const userId = user?.id || (user?.email || '').replace(/[^a-z0-9]/gi, '_');
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [fileToSend, setFileToSend] = useState(null);
  const [editingChatIdx, setEditingChatIdx] = useState(null);
  const [editInput, setEditInput] = useState('');
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Real-time socket for instant message delivery
  const onNewMessage = useCallback((data) => {
    const { threadId, message, from } = data;
    setMessages(prev => {
      const existing = prev.find(m => m.id === threadId || m.senderId === from);
      const newChat = { from: 'in', from_dir: 'in', text: message?.text || '', time: 'Just now' };
      if (existing) {
        return prev.map(m =>
          (m.id === threadId || m.senderId === from)
            ? { ...m, chat: [...(m.chat || []), newChat], preview: newChat.text, time: 'Just now', unread: true }
            : m
        );
      }
      // New conversation — create a thread for the sender
      const senderName = message?.senderName || message?.sender || 'Unknown';
      const newThread = {
        id: threadId || 'sock-' + Date.now(),
        sender: senderName,
        role: message?.senderRole || 'Contact',
        avi: senderName.substring(0, 2).toUpperCase(),
        aColor: 'var(--sky-pale)',
        aText: 'var(--sky)',
        preview: newChat.text,
        time: 'Just now',
        unread: true,
        chat: [newChat],
        senderId: from,
      };
      return [newThread, ...prev];
    });
  }, [setMessages]);

  const { sendMessage: socketSend } = useSocket({ userId, onNewMessage });

  // Real-time poll: merge server data with local conversations
  useEffect(() => {
    const interval = setInterval(async () => {
      const deleted = new Set(JSON.parse(localStorage.getItem('axion_deleted_conversations')));
      try {
        const data = await requestJSON('http://127.0.0.1:8011/api/messages');
        if (data && data.items) {
          const serverMsgs = data.items.filter(m => !deleted.has(m.id));
          const serverSenderIds = new Set(serverMsgs.map(m => m.senderId).filter(Boolean));
          const merged = [...messages.filter(m => !serverSenderIds.has(m.senderId)), ...serverMsgs];
          if (JSON.stringify(merged) !== JSON.stringify(messages)) {
            setMessages(merged);
          }
          return;
        }
      } catch {}
      try {
        const uid = user?.id || 'default';
        const stored = JSON.parse(localStorage.getItem(`axion_messages_${uid}`));
        if (stored) {
          const filtered = stored.filter(m => !deleted.has(m.id));
          if (JSON.stringify(filtered) !== JSON.stringify(messages)) {
            setMessages(filtered);
          }
        }
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [messages, user]);

  let pool = messages.filter(m => m.sender !== user?.name);
  if (filter !== 'all') pool = pool.filter(m => m.role?.toUpperCase() === filter);
  if (search) {
    const q = search.toLowerCase();
    pool = pool.filter(m =>
      m.sender.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      (m.preview || '').toLowerCase().includes(q) ||
      (m.chat || []).some(c => c.text.toLowerCase().includes(q))
    );
  }

  useEffect(() => {
    if (!currentMsgId && messages.length > 0) {
      setCurrentMsgId(messages[0].id);
    }
  }, [messages, currentMsgId, setCurrentMsgId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentMsgId]);

  const currentMsg = messages.find(m => m.id === currentMsgId);
  const isOwnMessage = (msg) => msg.from_dir === 'out' || msg.from === 'out';

  const switchMsg = (id) => {
    setCurrentMsgId(id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m));
  };

  const handleSend = () => {
    if (!input.trim() && !fileToSend) return;
    const doSend = (text) => {
      sendMsg(text);
      // Emit real-time socket event
      if (currentMsg?.senderId) {
        socketSend({ recipientId: currentMsg.senderId, threadId: currentMsg.id, message: { text, from_dir: 'out', senderName: user?.name || 'Me', senderRole: currentRole?.toUpperCase() || 'TEACHER', recipientName: currentMsg.sender } });
      }
    };
    if (fileToSend) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        sendMsg(input.trim(), { name: fileToSend.name, type: fileToSend.type, size: fileToSend.size, dataUrl: ev.target.result });
        setInput('');
        setFileToSend(null);
      };
      reader.readAsDataURL(fileToSend);
      return;
    }
    doSend(input.trim());
    setInput('');
    setFileToSend(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setFileToSend(file);
    e.target.value = '';
  };

  const getFileDataUrl = (fileKey) => {
    try { const cache = JSON.parse(localStorage.getItem('axion_file_data') || '{}'); return cache[fileKey] || null; } catch { return null; }
  };

  const isImageType = (type) => type?.startsWith('image/');
  const formatFileSize = (bytes) => { if (!bytes) return ''; if (bytes < 1024) return bytes + 'B'; if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB'; return (bytes / 1048576).toFixed(1) + 'MB'; };

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
            {(currentRole === 'admin' || currentRole === 'teacher') && (
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ key: 'all', label: 'All' }, { key: 'TEACHER', label: 'Teachers' }, { key: 'PARENT', label: 'Parents' }].map(r => (
                  <div key={r.key} className={`msg-role-chip${filter === r.key ? ' active' : ''}`} onClick={() => setFilter(r.key)}>
                    {r.label}
                  </div>
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
            ) : pool.map(m => (
              <div key={m.id} className={`msg-item-row${m.id === currentMsgId ? ' active' : ''}`}
                onMouseEnter={e => { const el = e.currentTarget.querySelector('.msg-del-btn'); if (el) el.style.opacity = '1'; }}
                onMouseLeave={e => { const el = e.currentTarget.querySelector('.msg-del-btn'); if (el) el.style.opacity = '0'; }}>
                <div className="msg-item-avi" style={{ background: m.aColor, color: m.aText, position: 'relative' }} onClick={() => switchMsg(m.id)}>
                  {m.avi}
                </div>
                <div className="msg-item-body" onClick={() => switchMsg(m.id)}>
                  <div className="msg-sender-row">
                    <div className="msg-sender">{m.sender}{m.unread ? <span className="msg-unread-dot" /> : ''}</div>
                    <div className="msg-time-label">{m.time}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginTop: 1 }}>{m.role === 'TEACHER' ? 'Teacher' : m.role === 'PARENT' ? 'Parent' : m.role === 'ADMIN' ? 'Admin' : m.role === 'Contact' ? 'Contact' : m.role}</div>
                  <div className="msg-preview">{m.preview || 'No messages yet'}</div>
                </div>
                <button className="msg-del-btn" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'var(--coral-pale)', border: 'none', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', color: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .15s' }}
                  onClick={e => { e.stopPropagation(); deleteConversation(m.id); }} title="Delete conversation">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="msg-pane">
          {!currentMsg ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 14, fontWeight: 800 }}>
              Select a conversation
            </div>
          ) : (
            <>
              <div className="msg-pane-header">
                <div className="user-avi" style={{ background: currentMsg.aColor, color: currentMsg.aText, fontSize: 13, fontWeight: 800, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {currentMsg.avi}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{currentMsg.sender}</div>
                  <div className="text-muted">{currentMsg.role}</div>
                </div>
                <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}
                  onClick={() => deleteConversation(currentMsg.id)} title="Delete conversation">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
              <div className="msg-chat-area" id="msg-chat">
                {!currentMsg.chat?.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: 'var(--text3)' }}>
                    <MessageCircle size={40} style={{ opacity: 0.25 }} />
                    <div style={{ fontSize: 13, fontWeight: 600 }}>No messages yet. Say hello!</div>
                  </div>
                ) : currentMsg.chat.map((c, i) => {
                  const isOut = isOwnMessage(c);
                  const prev = i > 0 ? currentMsg.chat[i - 1] : null;
                  const prevDir = prev ? isOwnMessage(prev) : isOut;
                  const next = i < currentMsg.chat.length - 1 ? currentMsg.chat[i + 1] : null;
                  const nextDir = next ? isOwnMessage(next) : null;
                  const senderChanged = i > 0 && prevDir !== isOut;
                  const isLastInGroup = nextDir === null || nextDir !== isOut;
                  const isFile = c.fileKey || (c.text && c.text.startsWith('[File:'));
                  const fileDataUrl = c.fileKey ? getFileDataUrl(c.fileKey) : null;
                  const isImage = fileDataUrl && isImageType(c.fileType);
                  const isEditing = editingChatIdx === i;

                  return (
                    <div key={i} className={`msg-bubble-row ${isOut ? 'out' : 'in'}${senderChanged ? ' sender-change' : ''}`}
                         onMouseEnter={e => { const el = e.currentTarget.querySelector('.msg-actions'); if (el) el.style.opacity = '1'; }}
                         onMouseLeave={e => { const el = e.currentTarget.querySelector('.msg-actions'); if (el) el.style.opacity = '0'; }}>
                      {!isEditing && isOut && !isFile && !isImage && (
                        <div className="msg-actions" style={{ display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.2s', padding: '0 8px', alignSelf: 'center' }}>
                          <button onClick={() => { setEditingChatIdx(i); setEditInput(c.text); }} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }} title="Edit"><Edit2 size={12} /></button>
                          <button onClick={() => { if(window.confirm('Delete message?')) deleteMessage(currentMsg.id, i); }} style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', padding: 4 }} title="Delete"><Trash2 size={12} /></button>
                        </div>
                      )}
                      <div className={`bubble bubble-${isOut ? 'out' : 'in'}`} style={isImage ? { padding: 4 } : (isFile ? { fontStyle: 'italic', opacity: 0.85 } : {})}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input autoFocus value={editInput} onChange={e => setEditInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { editMessage(currentMsg.id, i, editInput); setEditingChatIdx(null); } else if (e.key === 'Escape') setEditingChatIdx(null); }} style={{ background: 'var(--surface1)', color: 'var(--text1)', border: 'none', padding: '4px 8px', borderRadius: 4, flex: 1, minWidth: 150 }} />
                            <button onClick={() => { editMessage(currentMsg.id, i, editInput); setEditingChatIdx(null); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 2 }}><Check size={14} /></button>
                            <button onClick={() => setEditingChatIdx(null)} style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', padding: 2 }}><X size={14} /></button>
                          </div>
                        ) : isImage ? (
                          <img src={fileDataUrl} alt={c.fileName} style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, display: 'block' }} />
                        ) : isFile ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Paperclip size={12} />
                            <span style={{ flex: 1, wordBreak: 'break-all' }}>{c.fileName || c.text}</span>
                            {c.fileSize ? <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{formatFileSize(c.fileSize)}</span> : null}
                          </span>
                        ) : (
                          <>
                            {c.text}
                            {c.edited && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>(edited)</span>}
                          </>
                        )}
                      </div>
                      
                      {isLastInGroup && !isEditing && <div className="bubble-meta">{c.time}</div>}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div className="msg-input-bar">
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
                <button className="send-btn" style={{ background: 'none', color: 'var(--text3)', fontSize: 16 }} onClick={() => fileInputRef.current?.click()} title="Attach file">
                  <Paperclip size={18} />
                </button>
                {fileToSend && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-pale)', padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Paperclip size={11} />
                    {fileToSend.name}
                  </span>
                )}
                <input className="msg-input" id="msg-input-field" placeholder={`Reply to ${currentMsg.sender}...`} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} />
                <button className="send-btn" onClick={handleSend}><Send size={16} /></button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
