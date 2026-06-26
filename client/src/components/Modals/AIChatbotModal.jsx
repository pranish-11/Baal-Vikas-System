import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Leaf, Send, User, Sparkles } from 'lucide-react';
import { API_BASE } from '../../config';

function TypingDots() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setDots(p => p.length >= 3 ? '' : p + '.'), 400);
    return () => clearInterval(t);
  }, []);
  return <span style={{ fontSize: 16, letterSpacing: 2 }}>{dots}</span>;
}

export default function AIChatbotModal({ open, onClose, data }) {
  const { students, user } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const childId = data?.studentId;
  const child = childId ? students.find(s => s.id === childId) : (user?.email ? students.find(s => s.parentEmail?.toLowerCase() === user.email.toLowerCase()) : students[0]);

  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = child
        ? `Hey there! I'm Axion AI. I can help you track **${child.name}** — ask about attendance, meals, naps, behavior, or anything about their day!`
        : `Hey there! I'm Axion AI. Select a child to get started.`;
      setMessages([{ from: 'bot', text: greeting }]);
    }
  }, [open, child]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const askBot = useCallback(async (question) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('axion_token');
      const res = await fetch(`${API_BASE}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question, studentId: child?.id }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { answer: "Oops! I couldn't reach the server. Please try again in a moment.", suggestions: ['How is my child doing today?', 'Attendance this week'] };
    } finally {
      setLoading(false);
    }
  }, [child]);

  const handleSend = async () => {
    if (!input.trim() || !child || loading) return;
    const q = input.trim();
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: q }, { from: 'bot', text: '', typing: true }]);
    const result = await askBot(q);
    setMessages(prev => {
      const m = [...prev];
      m[m.length - 1] = { from: 'bot', text: result.answer || 'No response available.', suggestions: result.suggestions, typing: false };
      return m;
    });
  };

  const handleSuggestionClick = async (suggestion) => {
    if (!child || loading) return;
    setMessages(prev => [...prev, { from: 'user', text: suggestion }, { from: 'bot', text: '', typing: true }]);
    const result = await askBot(suggestion);
    setMessages(prev => {
      const m = [...prev];
      m[m.length - 1] = { from: 'bot', text: result.answer || 'No response available.', suggestions: result.suggestions, typing: false };
      return m;
    });
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 480, padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-xl)', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ background: 'linear-gradient(135deg,var(--primary) 0%,var(--primary-light) 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={20} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>Axion AI Assistant</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{child ? `Helping with ${child.name}` : 'No child selected'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}>✕</button>
        </div>

        {child && messages.length <= 2 && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {['How is my child doing today?', 'What did they eat?', 'Attendance this week', 'Behavior and points'].map(q => (
              <span key={q} style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--primary-pale)', color: 'var(--primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity .15s' }}
                onClick={() => handleSuggestionClick(q)}>
                <Sparkles size={10} style={{ display: 'inline-block', marginRight: 3, verticalAlign: 'middle' }} />
                {q}
              </span>
            ))}
          </div>
        )}

        <div className="ai-chat-scroll" style={{ height: 380, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 7, background: '#fafafa' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ animation: m.from === 'bot' && i > 0 ? 'fadeIn 0.25s ease' : undefined }}>
              <div style={{ display: 'flex', gap: 8, flexDirection: m.from === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.from === 'user' ? 'var(--coral-pale)' : 'var(--primary-pale)', color: m.from === 'user' ? 'var(--coral)' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>
                  {m.from === 'user' ? <User size={14} /> : <Leaf size={14} />}
                </div>
                <div style={{ maxWidth: '80%', padding: '8px 14px', borderRadius: m.from === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: m.from === 'user' ? 'var(--primary)' : '#fff', color: m.from === 'user' ? '#fff' : 'var(--text)', fontSize: 13, fontWeight: 600, lineHeight: 1.6, whiteSpace: 'pre-line', boxShadow: m.from === 'bot' ? '0 1px 3px rgba(0,0,0,0.06)' : undefined }}>
                  {m.typing ? (
                    <TypingDots />
                  ) : m.from === 'user' ? (
                    m.text
                  ) : (
                    m.text.split('\n').map((line, j) => {
                      const trimmed = line.trim();
                      if (!trimmed) return <div key={j} style={{ height: 4 }} />;
                      if (trimmed.startsWith('**') && trimmed.endsWith('**')) return <div key={j} style={{ fontWeight: 900, fontSize: 14, marginTop: 8, marginBottom: 4, color: 'var(--text)' }}>{trimmed.slice(2, -2)}</div>;
                      if (trimmed.startsWith('- ')) return <div key={j} style={{ marginLeft: 8, marginBottom: 2, color: 'var(--text2)' }}>• {trimmed.slice(2)}</div>;
                      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
                      if (parts.length > 0) return <div key={j} style={{ marginBottom: 2 }}>{parts.map((p, k) => {
                        if (p.startsWith('**') && p.endsWith('**')) return <strong key={k}>{p.slice(2, -2)}</strong>;
                        if (p.startsWith('*') && p.endsWith('*') && !p.startsWith('**')) return <em key={k}>{p.slice(1, -1)}</em>;
                        return p;
                      })}</div>;
                      return <div key={j} style={{ marginBottom: 2 }}>{trimmed}</div>;
                    })
                  )}
                </div>
              </div>
              {m.suggestions && m.from === 'bot' && !m.typing && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, marginLeft: 36, flexWrap: 'wrap' }}>
                  {m.suggestions.slice(0, 3).map((s, si) => (
                    <span key={si} style={{ padding: '4px 10px', borderRadius: 12, background: 'var(--primary-pale)', border: '1px solid var(--primary-pale)', color: 'var(--primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'background .15s' }}
                      onClick={() => handleSuggestionClick(s)}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', background: '#fff' }}>
          <input ref={inputRef} className="msg-input" placeholder={child ? `Ask about ${child.name}...` : 'Select a child to ask about'} style={{ flex: 1 }} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} disabled={!child || loading} />
          <button className="send-btn" onClick={handleSend} disabled={!child || !input.trim() || loading}><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
}
