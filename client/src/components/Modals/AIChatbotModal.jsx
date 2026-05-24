import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Bot, Send, User, Sparkles } from 'lucide-react';

export default function AIChatbotModal({ open, onClose, data }) {
  const { students, attendanceData, teacherTags, activities, fees, complaints, user } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const childId = data?.studentId;
  const child = childId ? students.find(s => s.id === childId) : (user?.email ? students.find(s => s.parentEmail?.toLowerCase() === user.email.toLowerCase()) : students[0]);

  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = child
        ? `Hi! I'm Axion AI. I can help you with information about ${child.name}. Try asking about their day, attendance, behavior, or fees.`
        : `Hi! I'm Axion AI. Select a child to get started.`;
      setMessages([{ from: 'bot', text: greeting }]);
    }
  }, [open, child]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getBehaviourScore = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('axion_behaviour_entries') || '[]');
      const studentEntries = stored.filter(e => e.studentId === child?.id);
      return Math.max(0, Math.min(100, studentEntries.reduce((sum, e) => sum + (e.type === 'positive' ? 2 : -2), 0)));
    } catch { return 0; }
  };

  const getDailyLogForDate = (studentId, dateStr) => {
    try {
      const all = JSON.parse(localStorage.getItem('axion_daily_logs')) || {};
      return all[studentId]?.[dateStr] || null;
    } catch { return null; }
  };

  const generateResponse = (query) => {
    if (!child) return 'Please select a child first to get personalized information.';

    const q = query.toLowerCase();
    const dateStr = new Date().toISOString().slice(0, 10);
    const rec = attendanceData[dateStr] || {};
    const todayStatus = rec[child.id];
    const realPct = getBehaviourScore();
    const todayLog = getDailyLogForDate(child.id, dateStr);

    const parts = [];

    if (q.includes('day') || q.includes('today') || q.includes('summary') || q.includes('how is')) {
      parts.push(`**${child.name}** is in **${child.class}**.`);
      if (todayStatus === 'present') parts.push('They are marked **Present** today.');
      else if (todayStatus === 'late') parts.push('They arrived **Late** today.');
      else if (todayStatus === 'absent') parts.push('They are **Absent** today.');
      else if (todayStatus === 'leave') parts.push('They are **On Leave** today.');
      else parts.push('Attendance has **not been marked** yet today.');

      parts.push(`They have **${child.pts || 0} points** with a behavior score of **${realPct}%** and are ranked **#${child.rank || 'N/A'}** in class.`);

      if (todayLog) {
        const done = [];
        if (todayLog.ate) done.push('ate meals');
        if (todayLog.nap) done.push('took a nap');
        if (todayLog.play) done.push('had outdoor play');
        if (todayLog.group) done.push('did group activity');
        if (todayLog.quiet) done.push('had quiet time');
        if (done.length > 0) parts.push(`Today's activities: ${done.join(', ')}.`);
        if (todayLog.note) parts.push(`Teacher note: "${todayLog.note}".`);
      }

      const tags = teacherTags[child.id];
      if (tags?.length) {
        parts.push(`Teacher observations: ${tags.join(', ')}.`);
      }

      const childActs = activities.filter(a => a.title?.toLowerCase().includes(child.name.toLowerCase()));
      if (childActs.length > 0) {
        parts.push(`Recent activity: ${childActs.slice(0, 3).map(a => a.title).join(', ')}.`);
      }
    }

    if (q.includes('attendance') || q.includes('absent') || q.includes('present')) {
      const weekDates = [];
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      for (let i = 0; i < 5; i++) {
        const d = new Date(now);
        d.setDate(diff + i);
        weekDates.push(d.toISOString().slice(0, 10));
      }
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const statuses = weekDates.map(d => {
        const r = attendanceData[d] || {};
        return r[child.id] || '—';
      });
      parts.push(`This week's attendance: ${weekDays.map((d, i) => `${d}: ${statuses[i]}`).join(', ')}.`);
    }

    if (q.includes('fee') || q.includes('payment') || q.includes('due') || q.includes('balance')) {
      const childFees = fees.filter(f => f.studentName?.toLowerCase().includes(child.name.toLowerCase()));
      if (childFees.length > 0) {
        const totalDue = childFees.reduce((s, f) => s + f.balance, 0);
        parts.push(`**Fee Summary**: ${childFees.length} record(s). Total outstanding: **$${totalDue}**.`);
        childFees.forEach(f => {
          parts.push(`- ${f.title}: $${f.balance} remaining (${f.status})`);
        });
      } else {
        parts.push('No fee records found for your child.');
      }
    }

    if (q.includes('behavior') || q.includes('point') || q.includes('score') || q.includes('rank')) {
      parts.push(`**Behavior Overview**: ${child.pts || 0} points, ${getBehaviourScore()}% score, ranked #${child.rank || 'N/A'} in class.`);
    }

    if (q.includes('tag') || q.includes('observation') || q.includes('teacher say')) {
      const tags = teacherTags[child.id];
      if (tags?.length) {
        parts.push(`**Teacher Observations**: ${tags.join(', ')}.`);
      } else {
        parts.push('No teacher observations recorded yet.');
      }
    }

    if (q.includes('activity') || q.includes('log') || q.includes('daily') || q.includes('eat') || q.includes('play') || q.includes('sleep') || q.includes('nap')) {
      if (todayLog) {
        const done = [];
        const notDone = [];
        if (todayLog.ate) done.push('ate meals'); else notDone.push('ate meals');
        if (todayLog.nap) done.push('napped'); else notDone.push('napped');
        if (todayLog.play) done.push('played outside'); else notDone.push('played outside');
        if (todayLog.group) done.push('did group activity'); else notDone.push('did group activity');
        if (todayLog.quiet) done.push('had quiet time'); else notDone.push('had quiet time');
        if (done.length > 0) parts.push(`**Completed**: ${done.join(', ')}.`);
        if (notDone.length > 0) parts.push(`**Not done yet**: ${notDone.join(', ')}.`);
        if (todayLog.note) parts.push(`**Teacher note**: ${todayLog.note}.`);
      } else {
        parts.push('No daily activities logged yet for today.');
      }
    }

    if (parts.length === 0) {
      parts.push(`I can tell you about ${child.name}'s day, attendance, fees, behavior, activities, or teacher observations. Try asking something like "How is my child doing today?"`);
    }

    return parts.join('\n\n');
  };

  const handleSend = () => {
    if (!input.trim() || !child) return;
    const userMsg = { from: 'user', text: input.trim() };
    const botResponse = generateResponse(input.trim());
    setMessages([...messages, userMsg, { from: 'bot', text: botResponse }]);
    setInput('');
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 480, padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ background: 'linear-gradient(135deg,var(--primary) 0%,var(--primary-light) 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>Axion AI Assistant</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{child ? `Helping with ${child.name}` : 'No child selected'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {child && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {['How is my child doing today?', 'What activities today?', 'Behavior overview', 'Teacher observations'].map(q => (
              <span key={q} style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--primary-pale)', color: 'var(--primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                onClick={() => {
                  const botResponse = generateResponse(q);
                  setMessages([...messages, { from: 'user', text: q }, { from: 'bot', text: botResponse }]);
                }}>
                <Sparkles size={10} style={{ display: 'inline-block', marginRight: 3, verticalAlign: 'middle' }} />
                {q}
              </span>
            ))}
          </div>
        )}

        <div style={{ height: 320, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, flexDirection: m.from === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.from === 'user' ? 'var(--coral-pale)' : 'var(--primary-pale)', color: m.from === 'user' ? 'var(--coral)' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>
                {m.from === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div style={{ maxWidth: '80%', padding: '8px 14px', borderRadius: m.from === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: m.from === 'user' ? 'var(--primary)' : 'var(--surface2)', color: m.from === 'user' ? '#fff' : 'var(--text)', fontSize: 13, fontWeight: 600, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {m.text.split('\n').map((line, j) => {
                  if (line.startsWith('**') && line.endsWith('**')) return <div key={j} style={{ fontWeight: 900, fontSize: 14, marginTop: 6 }}>{line.slice(2, -2)}</div>;
                  if (line.startsWith('- ')) return <div key={j} style={{ marginLeft: 10 }}>• {line.slice(2)}</div>;
                  return <div key={j}>{line}</div>;
                })}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="msg-input" placeholder={child ? `Ask about ${child.name}...` : 'Select a child to ask about'} style={{ flex: 1 }} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} disabled={!child} />
          <button className="send-btn" onClick={handleSend} disabled={!child}><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
}
