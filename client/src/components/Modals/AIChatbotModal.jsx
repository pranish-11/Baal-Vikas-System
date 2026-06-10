import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Bot, Send, User, Sparkles } from 'lucide-react';

const TRIGGERS = {
  today: ['today', 'now', 'current', 'how is', 'how was', 'doing', 'status', 'going', 'right now', 'day', 'update', 'daily', 'tonight', 'happening', 'morning', 'afternoon', 'progress', 'hows'],
  attendance: ['attendance', 'present', 'absent', 'late', 'skip', 'miss', 'came to school', 'went to school', 'show up', 'absentee', 'arrive', 'leave early', 'tardy', 'not there'],
  behavior: ['behavior', 'behaviour', 'points', 'score', 'rank', 'podium', 'leaderboard', 'conduct', 'good', 'bad', 'naughty', 'nice', 'kind', 'helpful', 'disrupt', 'discipline', 'improve', 'improvement', 'badge', 'reward', 'award', 'trophy', 'medal'],
  activities: ['activity', 'activities', 'did they do', 'played', 'ate', 'eat', 'lunch', 'snack', 'nap', 'slept', 'rest', 'group', 'circle', 'outdoor', 'playground', 'arts', 'crafts', 'music', 'story', 'reading', 'coloring', 'blocks', 'sensory', 'water', 'sand'],
  observations: ['observation', 'observe', 'tag', 'teacher say', 'teacher said', 'teacher note', 'summary', 'remark', 'comment', 'feedback', 'note about', 'mention', 'report', 'describe', 'impression', 'review'],
  complaints: ['complaint', 'concern', 'issue', 'problem', 'worry', 'raise', 'file', 'ticket', 'report', 'complain'],
  weekly: ['week', 'weekly', 'last week', 'this week', 'past week', 'previous week', 'whole week', 'all week', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  compare: ['compare', 'versus', 'vs', 'than', 'better', 'worse', 'improving', 'declining', 'changed', 'difference', 'more', 'less', 'same as', 'different from'],
  help: ['help', 'what can', 'guide', 'tutorial', 'explain', 'how to', 'what do you', 'capabilities', 'features', 'commands', 'list', 'menu', 'options', 'hi', 'hello', 'hey', 'start', 'begin'],
};

function matchIntent(q, intentWords) {
  return intentWords.some(w => {
    if (w.includes('.*')) {
      const parts = w.split('.*');
      return parts.every(p => q.includes(p));
    }
    return q.includes(w);
  });
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function getWeekDates(referenceDate) {
  const dates = [];
  const d = new Date(referenceDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  for (let i = 0; i < 5; i++) {
    const wd = new Date(d);
    wd.setDate(diff + i);
    dates.push(toDateStr(wd));
  }
  return dates;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function parseDateRef(q) {
  const today = new Date();
  const todayStr = toDateStr(today);
  if (q.includes('yesterday')) {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return { label: 'Yesterday', dateStr: toDateStr(y), weekDates: null };
  }
  if (q.includes('last week')) {
    const lw = new Date(today);
    lw.setDate(lw.getDate() - 7);
    return { label: 'Last week', dateStr: null, weekDates: getWeekDates(lw) };
  }
  if (matchIntent(q, TRIGGERS.weekly)) {
    const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5 };
    for (const [name, dayIndex] of Object.entries(dayMap)) {
      if (q.includes(name)) {
        const target = new Date(today);
        const todayDay = target.getDay() || 7;
        target.setDate(target.getDate() + (dayIndex - todayDay));
        return { label: name.charAt(0).toUpperCase() + name.slice(1), dateStr: toDateStr(target), weekDates: null };
      }
    }
    return { label: 'This week', dateStr: null, weekDates: getWeekDates(today) };
  }
  return { label: 'Today', dateStr: todayStr, weekDates: null };
}

export default function AIChatbotModal({ open, onClose, data }) {
  const { students, attendanceData, teacherTags, activities, complaints, user } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const [context, setContext] = useState({
    lastTopic: null,
    lastDateRef: null,
    lastIntent: null,
    mentionCount: 0,
  });

  const childId = data?.studentId;
  const child = childId ? students.find(s => s.id === childId) : (user?.email ? students.find(s => s.parentEmail?.toLowerCase() === user.email.toLowerCase()) : students[0]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setContext({ lastTopic: null, lastDateRef: null, lastIntent: null, mentionCount: 0 });
      const greeting = child
        ? `Hi! I'm Axion AI. I can help you with information about ${child.name}. Try asking about their day, attendance, behavior, or complaints.`
        : `Hi! I'm Axion AI. Select a child to get started.`;
      setMessages([{ from: 'bot', text: greeting }]);
    }
  }, [open, child]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const getBehaviourScore = (studentId) => {
    const s = students.find(st => st.id === studentId);
    return s?.pct || 0;
  };

  const getBehaviourEntries = () => [];

  const getDailyLogForDate = () => null;

  const getTeacherSummaries = () => [];

  const getChildComplaints = (studentName, email) => complaints.filter(c =>
    c.student?.toLowerCase().includes(studentName.toLowerCase()) ||
    c.by?.toLowerCase().includes(email.split('@')[0]?.toLowerCase() || '')
  );
  const getChildActivities = (studentName) => activities.filter(a =>
    a.title?.toLowerCase().includes(studentName.toLowerCase())
  );

  function generateSuggestions(intent, childName) {
    const pools = {
      today: [
        'How was attendance this week?',
        'What activities did they do?',
        'Tell me about their behavior',
        'What do teachers say?',
      ],
      attendance: [
        'How is my child doing today?',
        'What about last week?',
        'Compare with yesterday',
        'Any behavior updates?',
      ],
      behavior: [
        'How is my child doing today?',
        'Show me daily activities',
        'What do teachers observe?',
      ],
      activities: [
        'How was attendance today?',
        'Any teacher observations?',
        'Tell me about behavior points',
      ],
      observations: [
        'How is my child doing today?',
        'Show me this week\'s attendance',
        'Any recent activities?',
      ],
      complaints: [
        'How is my child doing today?',
      ],
      weekly: [
        'How is today going?',
        'What about behavior?',
        'Any teacher observations?',
      ],
      compare: [
        'How is my child doing today?',
        'Show me this week\'s attendance',
        'What activities today?',
      ],
      help: [
        'How is my child doing today?',
        'Attendance this week',
        'Behavior and points',
      ],
    };
    return pools[intent] || pools.today;
  }

  function generateResponse(query, currentContext) {
    if (!child) return { text: 'Please select a child first to get personalized information.', suggestions: generateSuggestions('help', ''), newContext: currentContext };

    const q = query.toLowerCase().trim();
    const dateStr = toDateStr(new Date());
    const rec = attendanceData[dateStr] || {};
    const todayStatus = rec[child.id];
    const todayLog = getDailyLogForDate(child.id, dateStr);
    const score = getBehaviourScore(child.id);
    const entries = getBehaviourEntries(child.id);
    const childComplaintsList = getChildComplaints(child.name, user?.email || '');
    const childActivities = getChildActivities(child.name);
    const summaries = getTeacherSummaries(child.id);
    const tags = teacherTags[child.id] || [];

    const dateRef = parseDateRef(q);

    if (q === '' || q === 'help') {
      const text = `I can help you track **${child.name}**'s progress. Here's what I can do:\n\n- **Daily summary** — attendance, activities, behavior at a glance\n- **Attendance** — daily or weekly records\n- **Daily activities** — what they ate, played, napped\n- **Behavior & points** — score, rank, trends\n- **Teacher observations** — tags and notes\n- **Fees & payments** — balances and due dates\n- **Complaints** — any concerns raised\n\nTry asking: *"How is my child doing today?"*`;
      return { text, suggestions: generateSuggestions('help', child.name), newContext: { ...currentContext, lastTopic: 'help' } };
    }

    let intents = [];

    if (matchIntent(q, TRIGGERS.help) || q === 'help' || q === '') intents.push('help');
    if (matchIntent(q, TRIGGERS.today)) intents.push('today');
    if (matchIntent(q, TRIGGERS.attendance)) intents.push('attendance');
    if (matchIntent(q, TRIGGERS.behavior)) intents.push('behavior');
    if (matchIntent(q, TRIGGERS.activities)) intents.push('activities');
    if (matchIntent(q, TRIGGERS.observations)) intents.push('observations');
    if (matchIntent(q, TRIGGERS.complaints)) intents.push('complaints');
    if (matchIntent(q, TRIGGERS.weekly)) intents.push('weekly');
    if (matchIntent(q, TRIGGERS.compare)) intents.push('compare');

    const isFollowUp = q.includes('more') || q.includes('tell me') || q.includes('elaborate') || q.includes('continue') || q.includes('and') || q.includes('also') || q.includes('what else');

    if (intents.length === 0 && !isFollowUp) {
      const text = `I didn't quite understand that. Try asking about **${child.name}**'s day, attendance, behavior, activities, or teacher observations.`;
      return { text, suggestions: generateSuggestions('help', child.name), newContext: { ...currentContext, lastTopic: null } };
    }

    if (intents.length === 0 && isFollowUp && currentContext.lastTopic) {
      intents.push(currentContext.lastTopic);
    }

    const parts = [];
    const seen = new Set();

    if (intents.includes('today') || intents.includes('help')) {
      seen.add('today');
      const attendPhrases = {
        present: ['marked **Present** today', 'attended school today', 'came to school today'],
        late: ['arrived **Late** today', 'came in late today'],
        absent: ['marked **Absent** today', 'did not come to school today'],
        leave: ['**On Leave** today', 'on leave today'],
      };
      const phrase = attendPhrases[todayStatus] ? pickRandom(attendPhrases[todayStatus]) : 'Attendance has **not been marked** yet today';
      parts.push(`**${child.name}** is in **${child.class}** (Age ${child.age}).`);
      parts.push(`${child.name} was ${phrase}.`);

      if (intents.includes('today')) {
        if (todayLog) {
          const done = [];
          if (todayLog.ate) done.push('ate');
          if (todayLog.nap) done.push('slept');
          if (todayLog.play) done.push('played');
          if (done.length > 0) parts.push(`Activities completed: **${done.join(', ')}**.`);
          if (todayLog.note) parts.push(`Teacher note: *"${todayLog.note}"*`);
        }
        parts.push(`Points: **${child.pts || 0}**  |  Behavior: **${score}%**  |  Rank: **#${child.rank || '-'}**`);

        if (tags.length > 0) {
          parts.push(`Teacher observations: ${tags.join(', ')}.`);
        }

        if (childActivities.length > 0) {
          parts.push(`Recent: ${childActivities.slice(0, 3).map(a => a.title).join(', ')}`);
        }
      }
    }

    if (intents.includes('attendance') && !seen.has('attendance')) {
      seen.add('attendance');
      const weekDates = dateRef.weekDates || getWeekDates(new Date());
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const statuses = weekDates.map(d => {
        const r = attendanceData[d] || {};
        return r[child.id] || '—';
      });
      const presentCount = statuses.filter(s => s === 'present').length;
      const lateCount = statuses.filter(s => s === 'late').length;
      const absentCount = statuses.filter(s => s === 'absent').length;
      const markedCount = statuses.filter(s => s !== '—').length;

      if (intents.includes('weekly') || dateRef.label !== 'Today') {
        parts.push(`**${dateRef.label} attendance** (${formatDate(weekDates[0])} - ${formatDate(weekDates[4])}):`);
      } else {
        parts.push(`**This week's attendance**:`);
      }
      statuses.forEach((s, i) => {
        const dayStr = `${weekDays[i]} (${formatDate(weekDates[i])})`;
        if (s === 'present') parts.push(`- ${dayStr}: **Present**`);
        else if (s === 'late') parts.push(`- ${dayStr}: **Late**`);
        else if (s === 'absent') parts.push(`- ${dayStr}: **Absent**`);
        else parts.push(`- ${dayStr}: —`);
      });
      if (markedCount > 0) {
        const rate = Math.round((presentCount + lateCount) / markedCount * 100);
        parts.push(`On-time rate: **${rate}%** (${presentCount} present, ${lateCount} late, ${absentCount} absent)`);
      } else {
        parts.push('No attendance data recorded yet.');
      }
    }

    if (intents.includes('behavior') && !seen.has('behavior')) {
      seen.add('behavior');
      const pos = entries.filter(e => e.type === 'positive').length;
      const neg = entries.filter(e => e.type === 'negative').length;
      parts.push(`**Behavior overview** for ${child.name}:`);
      parts.push(`- Points: **${child.pts || 0}** | Score: **${score}%** | Class rank: **#${child.rank || '-'}**`);
      if (entries.length > 0) {
        parts.push(`- ${pos} positive entries, ${neg} negative entries`);
        if (pos > neg * 2) parts.push(`Showing **strong positive** behavior trends.`);
        else if (pos > neg) parts.push(`Trending **positively** overall.`);
        else if (neg > 0) parts.push(`Some **areas of improvement** noted recently.`);
      } else {
        parts.push('No behavior entries recorded yet.');
      }
    }

    if (intents.includes('activities') && !seen.has('activities')) {
      seen.add('activities');
      if (dateRef.dateStr) {
        const log = getDailyLogForDate(child.id, dateRef.dateStr);
        if (log) {
          parts.push(`**${dateRef.label}'s activities** (${formatDate(dateRef.dateStr)}):`);
          const done = [];
          const notDone = [];
          if (log.ate) done.push('ate'); else notDone.push('ate');
          if (log.nap) done.push('slept'); else notDone.push('slept');
          if (log.play) done.push('played'); else notDone.push('played');
          if (done.length > 0) parts.push(`- Done: ${done.join(', ')}`);
          if (notDone.length > 0) parts.push(`- Not done: ${notDone.length > 0 ? notDone.join(', ') : ''}`);
          if (log.note) parts.push(`- Note: *"${log.note}"*`);
        } else {
          parts.push(`No activities logged for **${dateRef.label}**.`);
        }
      } else {
        const weekLogs = dateRef.weekDates.map(d => ({ date: d, log: getDailyLogForDate(child.id, d) })).filter(x => x.log);
        if (weekLogs.length > 0) {
          parts.push(`**Activities for ${dateRef.label}:**`);
          weekLogs.forEach(({ date, log }) => {
            const done = ['ate', 'nap', 'play', 'group', 'quiet'].filter(k => log[k]);
            parts.push(`- ${formatDate(date)}: ${done.join(', ') || 'none'}${log.note ? ` — "${log.note}"` : ''}`);
          });
        } else {
          parts.push(`No activities logged for ${dateRef.label.toLowerCase()}.`);
        }
      }
    }

    if (intents.includes('observations') && !seen.has('observations')) {
      seen.add('observations');
      if (tags.length > 0) {
        parts.push(`**Teacher observations** for ${child.name}:`);
        parts.push(`Noticed qualities: ${tags.join(', ')}.`);
      } else {
        parts.push(`No teacher observations recorded yet for ${child.name}.`);
      }

      if (summaries.length > 0) {
        const latest = summaries[summaries.length - 1];
        parts.push(`**Latest summary** (${formatDate(latest.date)}): ${latest.summary}`);
      }
    }

    if (intents.includes('complaints') && !seen.has('complaints')) {
      seen.add('complaints');
      if (childComplaintsList.length > 0) {
        const open = childComplaintsList.filter(c => c.status === 'open' || c.status === 'pending');
        parts.push(`**Complaints** for ${child.name}:`);
        parts.push(`- Total: **${childComplaintsList.length}**`);
        parts.push(`- Open: **${open.length}**`);
        childComplaintsList.slice(0, 3).forEach(c => {
          parts.push(`- ${c.title} (${c.status})`);
        });
      } else {
        parts.push(`No complaints filed for ${child.name}.`);
      }
    }

    if (intents.includes('compare') && !seen.has('compare')) {
      seen.add('compare');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = toDateStr(yesterday);
      const yStatus = (attendanceData[yStr] || {})[child.id];
      const todayAttend = todayStatus || 'not marked';
      const yAttend = yStatus || 'not marked';
      parts.push(`**Comparison:**`);
      parts.push(`- Today: **${todayAttend}** vs Yesterday: **${yAttend}**`);

      const yLog = getDailyLogForDate(child.id, yStr);
      if (todayLog && yLog) {
        const todayCount = ['ate', 'nap', 'play', 'group', 'quiet'].filter(k => todayLog[k]).length;
        const yCount = ['ate', 'nap', 'play', 'group', 'quiet'].filter(k => yLog[k]).length;
        if (todayCount > yCount) parts.push(`- More activities completed today (**${todayCount}**) than yesterday (**${yCount}**).`);
        else if (todayCount < yCount) parts.push(`- Fewer activities today (**${todayCount}**) compared to yesterday (**${yCount}**).`);
        else parts.push(`- Same number of activities as yesterday (**${todayCount}**).`);
      }

      if (entries.length > 0) {
        const recentEntries = entries.filter(e => {
          const ed = new Date(e.date || e.time);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return ed >= weekAgo;
        });
        const olderEntries = entries.filter(e => {
          const ed = new Date(e.date || e.time);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return ed < weekAgo;
        });
        if (recentEntries.length > 0 || olderEntries.length > 0) {
          const recentPos = recentEntries.filter(e => e.type === 'positive').length;
          const recentNeg = recentEntries.filter(e => e.type === 'negative').length;
          const olderPos = olderEntries.filter(e => e.type === 'positive').length;
          const olderNeg = olderEntries.filter(e => e.type === 'negative').length;
          if (recentPos - recentNeg > olderPos - olderNeg) parts.push(`Behavior is **improving** compared to earlier.`);
          else if (recentPos - recentNeg < olderPos - olderNeg) parts.push(`Behavior has **declined** recently compared to before.`);
        }
      }
    }

    if (intents.includes('weekly') && !seen.has('attendance') && !seen.has('activities')) {
      seen.add('weekly');
      const weekDates = dateRef.weekDates || getWeekDates(new Date());
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const statuses = weekDates.map(d => {
        const r = attendanceData[d] || {};
        return r[child.id] || '—';
      });
      const presentCount = statuses.filter(s => s === 'present').length;
      parts.push(`**${dateRef.label}** attendance summary:`);
      parts.push(`${weekDays.map((d, i) => `${d}: ${statuses[i] === 'present' ? 'Present' : statuses[i] === 'late' ? 'Late' : statuses[i] === 'absent' ? 'Absent' : statuses[i] === 'leave' ? 'Leave' : '-'}`).join(' | ')}`);
      parts.push(`Present: **${presentCount}** days`);
    }

    const text = parts.join('\n\n');
    const mainIntent = intents[0] || 'today';
    const suggestions = generateSuggestions(mainIntent, child.name);
    const newContext = { lastTopic: mainIntent, lastDateRef: dateRef, lastIntent: mainIntent, mentionCount: currentContext.mentionCount + 1 };

    return { text, suggestions, newContext };
  }

  const handleSend = () => {
    if (!input.trim() || !child) return;
    const userMsg = { from: 'user', text: input.trim() };
    const result = generateResponse(input.trim(), context);
    setMessages([...messages, userMsg, { from: 'bot', text: result.text, suggestions: result.suggestions }]);
    setContext(result.newContext);
    setInput('');
  };

  const handleSuggestionClick = (suggestion) => {
    if (!child) return;
    const userMsg = { from: 'user', text: suggestion };
    const result = generateResponse(suggestion, context);
    setMessages([...messages, userMsg, { from: 'bot', text: result.text, suggestions: result.suggestions }]);
    setContext(result.newContext);
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

        {child && messages.length <= 2 && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {['How is my child doing today?', 'Attendance this week', 'Behavior and points'].map(q => (
              <span key={q} style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--primary-pale)', color: 'var(--primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                onClick={() => handleSuggestionClick(q)}>
                <Sparkles size={10} style={{ display: 'inline-block', marginRight: 3, verticalAlign: 'middle' }} />
                {q}
              </span>
            ))}
          </div>
        )}

        <div style={{ height: 360, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map((m, i) => (
            <div key={i}>
              <div style={{ display: 'flex', gap: 8, flexDirection: m.from === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.from === 'user' ? 'var(--coral-pale)' : 'var(--primary-pale)', color: m.from === 'user' ? 'var(--coral)' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>
                  {m.from === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div style={{ maxWidth: '80%', padding: '8px 14px', borderRadius: m.from === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: m.from === 'user' ? 'var(--primary)' : 'var(--surface2)', color: m.from === 'user' ? '#fff' : 'var(--text)', fontSize: 13, fontWeight: 600, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {m.text.split('\n').map((line, j) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('**') && trimmed.endsWith('**')) return <div key={j} style={{ fontWeight: 900, fontSize: 14, marginTop: 6 }}>{trimmed.slice(2, -2)}</div>;
                    if (trimmed.startsWith('- ')) return <div key={j} style={{ marginLeft: 10 }}>• {trimmed.slice(2)}</div>;
                    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
                    if (parts.length > 0) return <div key={j}>{parts.map((p, k) => {
                      if (p.startsWith('**') && p.endsWith('**')) return <strong key={k}>{p.slice(2, -2)}</strong>;
                      if (p.startsWith('*') && p.endsWith('*') && !p.startsWith('**')) return <em key={k}>{p.slice(1, -1)}</em>;
                      return p;
                    })}</div>;
                    return <div key={j}>{trimmed}</div>;
                  })}
                </div>
              </div>
              {m.suggestions && m.from === 'bot' && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, marginLeft: 36, flexWrap: 'wrap' }}>
                  {m.suggestions.slice(0, 3).map((s, si) => (
                    <span key={si} style={{ padding: '3px 10px', borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
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

        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input ref={inputRef} className="msg-input" placeholder={child ? `Ask about ${child.name}...` : 'Select a child to ask about'} style={{ flex: 1 }} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} disabled={!child} />
          <button className="send-btn" onClick={handleSend} disabled={!child}><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
}
