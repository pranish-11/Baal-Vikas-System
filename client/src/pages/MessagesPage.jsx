import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { requestJSON } from '../api';
import { MessageCircle, Search, Paperclip, Send, Trash2, Edit2, Check, X, Loader, Plus } from 'lucide-react';
import useSocket from '../hooks/useSocket';

const API_BASE = 'http://127.0.0.1:8011/api';

export default function MessagesPage() {
  const { messages, setMessages, currentRole, openModal, sendMsg, setCurrentMsgId, currentMsgId, deleteConversation, user, editMessage, deleteMessage, allEligibleUsers, setAllEligibleUsers, startChatWith } = useApp();
  const [loading, setLoading] = useState(true);
  const emailId = (user?.email || '').replace(/[^a-z0-9]/gi, '_');
  const rolePrefix = currentRole === 'admin' ? '' : currentRole + '_';
  const userId = user?.id || rolePrefix + emailId;
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [fileToSend, setFileToSend] = useState(null);
  const [editingChat, setEditingChat] = useState(null);
  const [editInput, setEditInput] = useState('');
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Real-time socket for instant message delivery
  const onNewMessage = useCallback((data) => {
    const { threadId, message, from } = data;
    const plainFrom = from?.replace(/^(admin|teacher|parent)_/i, '');
    setMessages(prev => {
      const existing = prev.find(m =>
        m.id === threadId ||
        m.senderId === from ||
        m.senderId === plainFrom ||
        m.participants?.includes(from) ||
        m.participants?.some(p => p.endsWith('_' + plainFrom))
      );
      const newChat = { from: 'in', from_dir: 'in', text: message?.text || '', time: 'Just now' };
      if (existing) {
        return prev.map(m =>
          (m.id === threadId ||
           m.senderId === from ||
           m.senderId === plainFrom ||
           m.participants?.includes(from) ||
           m.participants?.some(p => p.endsWith('_' + plainFrom)))
            ? { ...m, chat: [...(m.chat || []), newChat], preview: newChat.text, time: 'Just now', unread: true }
            : m
        );
      }
      // New conversation — create a thread for the sender
      const senderName = message?.senderName || message?.sender || 'Unknown';
      const senderRole = message?.senderRole || 'Contact';
      const newThread = {
        id: threadId || 'sock-' + Date.now(),
        participants: [userId, from],
        participantNames: {
          [userId]: user?.name || 'Me',
          [from]: senderName
        },
        participantRoles: {
          [userId]: currentRole?.toUpperCase() || 'USER',
          [from]: senderRole
        },
        participantAvis: {
          [userId]: (user?.name || 'Me').substring(0, 2).toUpperCase(),
          [from]: senderName.substring(0, 2).toUpperCase()
        },
        aColor: 'var(--sky-pale)',
        aText: 'var(--sky)',
        preview: newChat.text,
        time: 'Just now',
        unread: true,
        chat: [newChat],
        senderId: from,
        sender: senderName,
        role: senderRole,
        avi: senderName.substring(0, 2).toUpperCase(),
      };
      return [newThread, ...prev];
    });
  }, [setMessages, userId, currentRole, user]);

  const { sendMessage: socketSend } = useSocket({ userId, onNewMessage });

  // Load eligible users on mount
  useEffect(() => {
    if (allEligibleUsers.length === 0) {
      requestJSON(`${API_BASE}/messages/users`).then(data => {
        setAllEligibleUsers(data.users || []);
      }).catch(() => {
        const mockByRole = {
          admin: [
            { id: 'teacher_anika_roy_axionschool_edu', name: 'Ms. Anika Roy', role: 'TEACHER', avi: 'AR', aColor: 'var(--sky-pale)', aText: 'var(--sky)' },
            { id: 'parent_lena_kim_parent_edu', name: 'Mrs. Lena Kim', role: 'PARENT', avi: 'LK', aColor: 'var(--coral-pale)', aText: 'var(--coral)' },
            { id: 'parent_mei_axion_edu', name: 'Mrs. Mei Chen', role: 'PARENT', avi: 'MC', aColor: 'var(--coral-pale)', aText: 'var(--coral)' },
            { id: 'parent_priya_axion_edu', name: 'Mrs. Priya Sharma', role: 'PARENT', avi: 'PS', aColor: 'var(--coral-pale)', aText: 'var(--coral)' },
            { id: 'parent_sarah_axion_edu', name: 'Mrs. Sarah Wilson', role: 'PARENT', avi: 'SW', aColor: 'var(--coral-pale)', aText: 'var(--coral)' },
            { id: 'parent_raj_axion_edu', name: 'Mr. Raj Patel', role: 'PARENT', avi: 'RP', aColor: 'var(--coral-pale)', aText: 'var(--coral)' },
          ],
            teacher: [
              { id: 'parent_lena_kim_parent_edu', name: 'Mrs. Lena Kim', role: 'PARENT', avi: 'LK', aColor: 'var(--coral-pale)', aText: 'var(--coral)' },
            { id: 'parent_mei_axion_edu', name: 'Mrs. Mei Chen', role: 'PARENT', avi: 'MC', aColor: 'var(--coral-pale)', aText: 'var(--coral)' },
            { id: 'parent_priya_axion_edu', name: 'Mrs. Priya Sharma', role: 'PARENT', avi: 'PS', aColor: 'var(--coral-pale)', aText: 'var(--coral)' },
            { id: 'parent_sarah_axion_edu', name: 'Mrs. Sarah Wilson', role: 'PARENT', avi: 'SW', aColor: 'var(--coral-pale)', aText: 'var(--coral)' },
            { id: 'parent_raj_axion_edu', name: 'Mr. Raj Patel', role: 'PARENT', avi: 'RP', aColor: 'var(--coral-pale)', aText: 'var(--coral)' },
          ],
            parent: [
              { id: 'teacher_anika_roy_axionschool_edu', name: 'Ms. Anika Roy', role: 'TEACHER', avi: 'AR', aColor: 'var(--sky-pale)', aText: 'var(--sky)' },
          ],
        };
        setAllEligibleUsers(mockByRole[currentRole] || mockByRole.admin);
      });
    }
  }, [allEligibleUsers.length, setAllEligibleUsers, currentRole]);

  // Real-time poll: merge server data with local conversations
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    const poll = async () => {
      const deleted = new Set(JSON.parse(localStorage.getItem('axion_deleted_conversations') || '[]'));
      try {
        const data = await requestJSON(`${API_BASE}/messages`, { signal: AbortSignal.timeout(8000) });
        if (data && data.items) {
          const serverMsgs = data.items.filter(m => !deleted.has(m.id));
          const serverIds = new Set(serverMsgs.map(m => m.id).filter(Boolean));
          const merged = [...messagesRef.current.filter(m => !serverIds.has(m.id)), ...serverMsgs];
          if (JSON.stringify(merged) !== JSON.stringify(messagesRef.current)) {
            setMessages(merged);
          }
          return;
        }
      } catch {}
      try {
        const stored = JSON.parse(localStorage.getItem('axion_messages') || '[]');
        if (stored.length) {
          const filtered = stored.filter(m => !deleted.has(m.id));
          if (JSON.stringify(filtered) !== JSON.stringify(messagesRef.current)) {
            setMessages(filtered);
          }
        }
      } catch {}
    };
    poll().finally(() => setLoading(false));
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [setMessages]);

  const isMyId = (id) => {
    if (!id) return false;
    if (id === userId) return true;
    if (id === emailId) return true;
    if (id.endsWith('_' + emailId)) return true;
    return false;
  };

  const getContactInfo = (m) => {
    if (m.participants) {
      const contactId = m.participants.find(id => !isMyId(id)) || m.participants[0];
      return {
        name: m.participantNames?.[contactId] || m.sender,
        role: m.participantRoles?.[contactId] || m.role,
        avi: m.participantAvis?.[contactId] || m.avi,
        id: contactId
      };
    }
    return { name: m.sender, role: m.role, avi: m.avi, id: m.senderId };
  };

  // Build pool of conversations — only show conversations the user is a participant in
  let pool = messages.filter(m => {
    if (m.participants) return m.participants.some(id => isMyId(id));
    if (m.senderId) return isMyId(m.senderId);
    return m.sender !== user?.name;
  });
  if (filter !== 'all') pool = pool.filter(m => getContactInfo(m).role?.toUpperCase() === filter);

  // When a role filter is active, also show eligible contacts of that role as "new chat" cards
  const existingContactIds = new Set(pool.map(m => {
    const c = getContactInfo(m);
    return c.id;
  }).filter(Boolean));
  const contactPool = (filter !== 'all' ? allEligibleUsers.filter(u => u.role === filter) : []).filter(u =>
    u.name !== user?.name && !existingContactIds.has(u.id) && !existingContactIds.has(u.id.replace(/^(admin|teacher|parent)_/i, ''))
  );
  const showContactCards = contactPool.length > 0;

  if (search) {
    const q = search.toLowerCase();
    pool = pool.filter(m => {
      const c = getContactInfo(m);
      return c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        (m.preview || '').toLowerCase().includes(q) ||
        (m.chat || []).some(msg => msg.text.toLowerCase().includes(q));
    });
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

  const getContactId = (m) => {
    if (m.participants) return m.participants.find(id => !isMyId(id)) || m.participants[0];
    return m.senderId;
  };

  const isOwnMessage = (msg) => {
    if (msg.authorEmail) return msg.authorEmail === user?.email;
    if (msg.authorId) return isMyId(msg.authorId);
    if (msg.from_dir) return msg.from_dir === 'out';
    if (msg.from) return msg.from === 'out';
    return false;
  };

  const switchMsg = (id) => {
    setCurrentMsgId(id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m));
  };

  const doSocketSend = (text) => {
    const contact = getContactInfo(currentMsg);
    if (contact?.id) {
      socketSend({ recipientId: contact.id, threadId: currentMsg.id, message: { text, from_dir: 'out', senderName: user?.name || 'Me', senderRole: currentRole?.toUpperCase() || 'TEACHER', recipientName: contact.name } });
    }
  };

  const handleSend = () => {
    if (!input.trim() && !fileToSend) return;
    const text = input.trim();
    const contact = getContactInfo(currentMsg);
    const recipientId = contact?.id || '';
    if (fileToSend) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        sendMsg(text, { name: fileToSend.name, type: fileToSend.type, size: fileToSend.size, dataUrl: ev.target.result }, recipientId);
        doSocketSend(text || `[File: ${fileToSend.name}]`);
        setInput('');
        setFileToSend(null);
      };
      reader.readAsDataURL(fileToSend);
      return;
    }
    sendMsg(text, null, recipientId);
    doSocketSend(text);
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
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ key: 'all', label: 'All' }, { key: 'TEACHER', label: 'Teachers' }, { key: 'PARENT', label: 'Parents' }].map(r => (
                <div key={r.key} className={`msg-role-chip${filter === r.key ? ' active' : ''}`} onClick={() => setFilter(r.key)}>
                  {r.label}
                </div>
              ))}
            </div>
          </div>
          <div id="msg-list-items">
            {loading ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)' }}>
                <Loader size={24} style={{ marginBottom: 10, animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: 12, fontWeight: 600 }}>Loading messages...</div>
              </div>
            ) : pool.length === 0 && !showContactCards ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)' }}>
                <MessageCircle size={32} style={{ marginBottom: 10, color: 'var(--text3)', opacity: 0.25 }} />
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>No conversations yet</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Click <strong>+</strong> to start a new message</div>
              </div>
            ) : (
              <>
                {pool.map(m => {
                  const c = getContactInfo(m);
                  return (
                  <div key={m.id} className={`msg-item-row${m.id === currentMsgId ? ' active' : ''}`}
                    onMouseEnter={e => { const el = e.currentTarget.querySelector('.msg-del-btn'); if (el) el.style.opacity = '1'; }}
                    onMouseLeave={e => { const el = e.currentTarget.querySelector('.msg-del-btn'); if (el) el.style.opacity = '0'; }}>
                    <div className="msg-item-avi" style={{ background: m.aColor, color: m.aText, position: 'relative' }} onClick={() => switchMsg(m.id)}>
                      {c.avi}
                    </div>
                    <div className="msg-item-body" onClick={() => switchMsg(m.id)}>
                      <div className="msg-sender-row">
                        <div className="msg-sender">{c.name}{m.unread ? <span className="msg-unread-dot" /> : ''}</div>
                        <div className="msg-time-label">{m.time}</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginTop: 1 }}>{c.role === 'TEACHER' ? 'Teacher' : c.role === 'PARENT' ? 'Parent' : c.role === 'ADMIN' ? 'Admin' : c.role === 'Contact' ? 'Contact' : c.role}</div>
                      <div className="msg-preview">{m.preview || 'No messages yet'}</div>
                    </div>
                    <button className="msg-del-btn" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'var(--coral-pale)', border: 'none', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', color: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .15s' }}
                      onClick={e => { e.stopPropagation(); deleteConversation(m.id); }} title="Delete conversation">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )})}
                {contactPool.map(u => (
                  <div key={u.id} className={`msg-item-row${currentMsg?.senderId === u.id ? ' active' : ''}`}
                    onClick={() => { startChatWith(u.id, u.name, u.role); }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <div className="msg-item-avi" style={{ background: u.aColor || 'var(--surface2)', color: u.aText || 'var(--text2)', position: 'relative' }}>
                      {u.avi}
                    </div>
                    <div className="msg-item-body">
                      <div className="msg-sender-row">
                        <div className="msg-sender">{u.name} <span className="msg-unread-dot" style={{ background: 'var(--primary)' }} /></div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginTop: 1 }}>{u.role === 'TEACHER' ? 'Teacher' : u.role === 'PARENT' ? 'Parent' : u.role}</div>
                      <div className="msg-preview" style={{ color: 'var(--primary)', fontWeight: 700 }}>Start a conversation <Plus size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /></div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        <div className="msg-pane">
          {!currentMsg ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 14, fontWeight: 800 }}>
              Select a conversation
            </div>
          ) : (() => {
            const currentContact = getContactInfo(currentMsg);
            return (
            <>
              <div className="msg-pane-header">
                <div className="user-avi" style={{ background: currentMsg.aColor, color: currentMsg.aText, fontSize: 13, fontWeight: 800, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {currentContact.avi}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{currentContact.name}</div>
                  <div className="text-muted">{currentContact.role}</div>
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

                  return (
                    <div key={i} className={`msg-bubble-row ${isOut ? 'out' : 'in'}${senderChanged ? ' sender-change' : ''}`}>
                      <div className={`bubble bubble-${isOut ? 'out' : 'in'}`} style={isImage ? { padding: 4 } : (isFile ? { fontStyle: 'italic', opacity: 0.85 } : {})}>
                        {editingChat === i ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                            <input className="msg-input" style={{ width: '100%', background: 'var(--bg-card)', color: 'var(--text1)' }} value={editInput} onChange={e => setEditInput(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') { editMessage(currentMsg.id, i, editInput); setEditingChat(null); } if (e.key === 'Escape') setEditingChat(null); }} />
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button className="btn btn-sm" style={{ padding: '4px 8px', background: 'var(--bg-app)', color: 'var(--text2)' }} onClick={() => setEditingChat(null)}><X size={12} /> Cancel</button>
                              <button className="btn btn-primary btn-sm" style={{ padding: '4px 8px' }} onClick={() => { editMessage(currentMsg.id, i, editInput); setEditingChat(null); }}><Check size={12} /> Save</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {isImage ? (
                              <img src={fileDataUrl} alt={c.fileName} style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, display: 'block' }} />
                            ) : isFile ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Paperclip size={12} />
                                <span style={{ flex: 1, wordBreak: 'break-all' }}>{c.fileName || c.text}</span>
                                {c.fileSize ? <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{formatFileSize(c.fileSize)}</span> : null}
                              </span>
                            ) : c.text}
                            {c.edited && !isFile && <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 6 }}>(edited)</span>}
                            {isOut && !isFile && !isImage && (
                              <div className="msg-bubble-actions">
                                <button className="msg-act-btn" onClick={() => { setEditingChat(i); setEditInput(c.text); }}><Edit2 size={12} /></button>
                                <button className="msg-act-btn msg-act-btn-del" onClick={() => deleteMessage(currentMsg.id, i)}><Trash2 size={12} /></button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {isLastInGroup && <div className="bubble-meta">{c.time}</div>}
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
                <input className="msg-input" id="msg-input-field" placeholder={`Reply to ${currentContact.name}...`} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} />
                <button className="send-btn" onClick={handleSend}><Send size={16} /></button>
              </div>
            </>
          );})()}
        </div>
      </div>
    </div>
  );
}
