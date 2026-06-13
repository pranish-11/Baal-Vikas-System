import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Tag, Plus, Check, Clock, X, Calendar, Edit3, Sparkles, UtensilsCrossed, Bed, Smile, Frown, Meh, Brain, Users, TreePine, Heart, Star, ThumbsDown, Zap } from 'lucide-react';
import LegoBrickIcon from '../components/LegoBrickIcon';
import { requestJSON } from '../api';
import { API_BASE } from '../config';

function isLive(timeStr) {
  if (!timeStr) return false;
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const then = new Date();
  then.setHours(h, m, 0, 0);
  const diff = (now - then) / 60000;
  return diff >= 0 && diff <= 150;
}
function timeAgo(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const then = new Date();
  then.setHours(h, m, 0, 0);
  const diff = Math.round((now - then) / 60000);
  if (diff < 0) return null;
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  const hrs = Math.floor(diff / 60);
  return `${hrs}h ${diff % 60}m ago`;
}

const ACTIVITIES_FULL = [
  { key: 'ate', label: 'Ate meals', icon: UtensilsCrossed, color: '#4CAF96', detailPlaceholder: 'What did they eat?', hasRefused: true },
  { key: 'nap', label: 'Slept', icon: Bed, color: '#7C5CBF', detailPlaceholder: 'How long? (e.g. 1.5 hrs)' },
  { key: 'play', label: 'Played', icon: LegoBrickIcon, color: '#6366f1', detailPlaceholder: 'What did they play?' },
  { key: 'outdoor', label: 'Outdoor', icon: TreePine, color: '#22c55e', detailPlaceholder: 'Outdoor activities?' },
  { key: 'snack', label: 'Snack', icon: UtensilsCrossed, color: '#f59e0b', detailPlaceholder: 'What snack?', hasRefused: true },
];

export default function MyChildPage() {
  const { students, activities, setActivities, currentRole, user, attendanceData, dailyLogs, setDailyLogs, openModal, teacherTags, showToast } = useApp();
  const email = user?.email || '';

  let myChild = null;
  if (currentRole === 'parent' && students.length > 0) {
    myChild = students.find(s => s.parentEmail && s.parentEmail.toLowerCase() === email.toLowerCase());
  }

  if (!myChild) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <p>No child profile linked to your account. Contact the school to link your child.</p>
      </div>
    );
  }

  const isTeacher = currentRole === 'teacher' || currentRole === 'admin';

  const todayStr = new Date().toISOString().slice(0, 10);
  const rec = attendanceData[todayStr] || {};
  const todayStatus = rec[myChild.id];
  const dailyLog = dailyLogs[myChild.id]?.[todayStr] || null;

  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm, setLogForm] = useState({
    ate: false, ateDetails: '', ateRefused: false, ateTime: '',
    nap: false, napDetails: '', napTime: '',
    play: false, playDetails: '', playTime: '',
    outdoor: false, outdoorDetails: '', outdoorTime: '',
    snack: false, snackDetails: '', snackRefused: false, snackTime: '',
    mood: '', learning: '', social: '', health: '',
    overallRating: 0, note: '',
  });

  useEffect(() => {
    setLogForm({
      ate: dailyLog?.ate || false,
      ateDetails: dailyLog?.ateDetails || '',
      ateRefused: dailyLog?.ateRefused || false,
      ateTime: dailyLog?.ateTime || '',
      nap: dailyLog?.nap || false,
      napDetails: dailyLog?.napDetails || '',
      napTime: dailyLog?.napTime || '',
      play: dailyLog?.play || false,
      playDetails: dailyLog?.playDetails || '',
      playTime: dailyLog?.playTime || '',
      outdoor: dailyLog?.outdoor || false,
      outdoorDetails: dailyLog?.outdoorDetails || '',
      outdoorTime: dailyLog?.outdoorTime || '',
      snack: dailyLog?.snack || false,
      snackDetails: dailyLog?.snackDetails || '',
      snackRefused: dailyLog?.snackRefused || false,
      snackTime: dailyLog?.snackTime || '',
      mood: dailyLog?.mood || '',
      learning: dailyLog?.learning || '',
      social: dailyLog?.social || '',
      health: dailyLog?.health || '',
      overallRating: dailyLog?.overallRating || 0,
      note: dailyLog?.note || '',
    });
  }, [dailyLog]);

  // Date navigation for viewing past daily logs
  const [viewDate, setViewDate] = useState(todayStr);
  const viewDailyLog = dailyLogs[myChild.id]?.[viewDate] || null;
  const isViewingToday = viewDate === todayStr;

  const childActivities = activities.filter(a =>
    a.title?.toLowerCase().includes(myChild.name.toLowerCase())
  );

  const realPct = myChild.pct || Math.min(100, Math.round((myChild.pts || 0) / 85 * 100));

  const weekData = useMemo(() => {
    const dates = [];
    const n = new Date();
    const d2 = n.getDay();
    const df = n.getDate() - d2 + (d2 === 0 ? -6 : 1);
    for (let i = 0; i < 5; i++) {
      const d3 = new Date(n);
      d3.setDate(df + i);
      dates.push(d3.toISOString().slice(0, 10));
    }
    const present = dates.filter(d => (attendanceData[d] || {})[myChild.id] === 'present').length;
    const late = dates.filter(d => (attendanceData[d] || {})[myChild.id] === 'late').length;
    const absent = dates.filter(d => (attendanceData[d] || {})[myChild.id] === 'absent').length;
    const marked = dates.filter(d => (attendanceData[d] || {})[myChild.id] !== null).length;
    const rate = marked > 0 ? Math.round(present / marked * 100) : 0;
    const statuses = dates.map(d => (attendanceData[d] || {})[myChild.id] || null);
    return { dates, present, late, absent, rate, statuses, dayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] };
  }, [myChild.id, attendanceData]);

  const tags = teacherTags[myChild.id] || [];
  const posCount = childActivities.filter(a => a.title?.toLowerCase().includes('awarded') || a.title?.toLowerCase().includes('positive')).length;
  const negCount = childActivities.filter(a => a.title?.toLowerCase().includes('deduct') || a.title?.toLowerCase().includes('negative')).length;

  const getWeekDates = () => {
    const dates = [];
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    for (let i = 0; i < 5; i++) {
      const d = new Date(now.setDate(diff + i));
      if (i > 0) now.setDate(now.getDate() + 1);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const weekStatuses = weekDates.map(d => {
    const dayRec = attendanceData[d] || {};
    return dayRec[myChild.id] || null;
  });

  const dailyActivities = [
    { key: 'ate', label: 'Ate meals', detailKey: 'ateDetails', detailPlaceholder: 'What did they eat?', timeKey: 'ateTime', hasRefused: true },
    { key: 'nap', label: 'Slept', detailKey: 'napDetails', detailPlaceholder: 'How long? (e.g. 1.5 hrs)', timeKey: 'napTime' },
    { key: 'play', label: 'Played', detailKey: 'playDetails', detailPlaceholder: 'What did they play?', timeKey: 'playTime' },
    { key: 'outdoor', label: 'Outdoor', detailKey: 'outdoorDetails', detailPlaceholder: 'Outdoor activities?', timeKey: 'outdoorTime' },
    { key: 'snack', label: 'Snack', detailKey: 'snackDetails', detailPlaceholder: 'What snack?', timeKey: 'snackTime', hasRefused: true },
  ];

  const saveDailyLog = () => {
    const data = { ...logForm, updatedAt: new Date().toISOString() };
    // Auto-set times for any toggled-on activities that lack a time
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    dailyActivities.forEach(a => {
      if (data[a.key] && !data[a.timeKey]) data[a.timeKey] = nowTime;
    });
    const newDailyLogs = {
      ...dailyLogs,
      [myChild.id]: {
        ...(dailyLogs[myChild.id] || {}),
        [todayStr]: data,
      },
    };
    setDailyLogs(newDailyLogs);
    requestJSON(`${API_BASE}/data/axion_daily_logs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDailyLogs),
    }).catch(() => {});
    const summary = dailyActivities.filter(a => logForm[a.key]).map(a => {
      let s = a.label;
      if (a.hasRefused && logForm[a.key + 'Refused']) s += ' (refused)';
      if (logForm[a.detailKey]) s += ': ' + logForm[a.detailKey];
      if (logForm[a.timeKey]) s += ' @ ' + logForm[a.timeKey];
      return s;
    }).join(', ');
    const act = {
      id: 'act-' + Date.now(),
      title: `Daily log updated for ${myChild.name}`,
      desc: summary + (logForm.note ? ' — ' + logForm.note : ''),
      time: 'Just now', timeLabel: 'Just now',
      studentId: myChild.id,
    };
    setActivities([act, ...activities]);
    requestJSON(`${API_BASE}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Daily log: ${myChild.name}`,
        desc: summary + (logForm.note ? ' — ' + logForm.note : ''),
        icon: '📋',
        studentId: myChild.id,
        studentName: myChild.name,
        loggedAt: new Date().toISOString(),
      }),
    }).catch(() => {});
    showToast('Daily activities saved');
    setShowLogForm(false);
  };

  const toggleActivity = (key) => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setLogForm(prev => {
      const newVal = !prev[key];
      const patch = { [key]: newVal };
      if (newVal) patch[key + 'Time'] = now;
      if (!newVal) patch[key + 'Time'] = '';
      return { ...prev, ...patch };
    });
  };

  const logItems = dailyLog ? [
    { label: 'Ate meals', done: dailyLog.ate, details: dailyLog.ateDetails, refused: dailyLog.ateRefused, time: dailyLog.ateTime, color: '#4CAF96' },
    { label: 'Slept', done: dailyLog.nap, details: dailyLog.napDetails, time: dailyLog.napTime, color: '#7C5CBF' },
    { label: 'Played', done: dailyLog.play, details: dailyLog.playDetails, time: dailyLog.playTime, color: '#6366f1' },
    { label: 'Outdoor', done: dailyLog.outdoor, details: dailyLog.outdoorDetails, time: dailyLog.outdoorTime, color: '#22c55e' },
    { label: 'Snack', done: dailyLog.snack, details: dailyLog.snackDetails, refused: dailyLog.snackRefused, time: dailyLog.snackTime, color: '#f59e0b' },
  ] : [];

  const overviewLogItems = [
    { label: 'Ate meals', done: dailyLog?.ate, details: dailyLog?.ateDetails, refused: dailyLog?.ateRefused, time: dailyLog?.ateTime, color: '#4CAF96' },
    { label: 'Slept', done: dailyLog?.nap, details: dailyLog?.napDetails, time: dailyLog?.napTime, color: '#7C5CBF' },
    { label: 'Played', done: dailyLog?.play, details: dailyLog?.playDetails, time: dailyLog?.playTime, color: '#6366f1' },
    { label: 'Outdoor', done: dailyLog?.outdoor, details: dailyLog?.outdoorDetails, time: dailyLog?.outdoorTime, color: '#22c55e' },
    { label: 'Snack', done: dailyLog?.snack, details: dailyLog?.snackDetails, refused: dailyLog?.snackRefused, time: dailyLog?.snackTime, color: '#f59e0b' },
  ];

  const viewLogItems = [
    { label: 'Ate meals', done: viewDailyLog?.ate, details: viewDailyLog?.ateDetails, refused: viewDailyLog?.ateRefused, time: viewDailyLog?.ateTime, color: '#4CAF96' },
    { label: 'Slept', done: viewDailyLog?.nap, details: viewDailyLog?.napDetails, time: viewDailyLog?.napTime, color: '#7C5CBF' },
    { label: 'Played', done: viewDailyLog?.play, details: viewDailyLog?.playDetails, time: viewDailyLog?.playTime, color: '#6366f1' },
    { label: 'Outdoor', done: viewDailyLog?.outdoor, details: viewDailyLog?.outdoorDetails, time: viewDailyLog?.outdoorTime, color: '#22c55e' },
    { label: 'Snack', done: viewDailyLog?.snack, details: viewDailyLog?.snackDetails, refused: viewDailyLog?.snackRefused, time: viewDailyLog?.snackTime, color: '#f59e0b' },
  ];

  const MOOD_MAP = { happy: { emoji: '😊', label: 'Happy', color: '#22c55e' }, okay: { emoji: '😐', label: 'Okay', color: '#f59e0b' }, tired: { emoji: '😴', label: 'Tired', color: '#8b5cf6' }, sad: { emoji: '😢', label: 'Sad', color: '#6366f1' }, fussy: { emoji: '😣', label: 'Fussy', color: '#ef4444' } };

  return (
    <>
      <div className="child-header-card">
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: myChild.bg || 'var(--primary-pale)', color: myChild.col || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, marginBottom: 8, flexShrink: 0, overflow: 'hidden' }}>
          {myChild.init}
        </div>
        <div className="child-hn">{myChild.name}</div>
        <div className="child-hs">{myChild.class} · Age {myChild.age}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {isTeacher && (
            <button className="btn btn-sm" style={{ background: 'var(--sky-pale)', color: 'var(--sky)', border: '1.5px solid var(--sky)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              onClick={() => openModal('teacherSummary')}>
              <Plus size={14} /> Log Observation
            </button>
          )}
          {isTeacher && (
            <button className="btn btn-sm" style={{ background: 'var(--gold-pale)', color: 'var(--gold)', border: '1.5px solid var(--gold)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              onClick={() => setShowLogForm(!showLogForm)}>
              <Edit3 size={14} /> {showLogForm ? 'Cancel' : 'Log Daily'}
            </button>
          )}
        </div>
        <div className="child-stats-row">
          {[
            { val: myChild.pts, label: 'Points' },
            { val: `#${myChild.rank || '-'}`, label: 'Class Rank' },
            { val: `${realPct}%`, label: 'Behavior Score' },
            { val: todayStatus === 'present' ? 'Present' : todayStatus === 'late' ? 'Late' : todayStatus === 'absent' ? 'Absent' : todayStatus === 'leave' ? 'Leave' : '-', label: 'Today' },
          ].map((stat, i) => (
            <div key={i} className="child-stat">
              <div className="child-stat-val">{stat.val}</div>
              <div className="child-stat-lbl">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, border: '1.5px solid var(--primary)', background: 'linear-gradient(135deg, var(--primary-pale) 0%, #fff 100%)' }}>
        <div className="card-header">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} style={{ color: 'var(--primary)' }} />
            Overview — {myChild.name}
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ padding: '12px 8px', borderRadius: 12, background: todayStatus === 'present' ? '#e8f5e9' : todayStatus === 'late' ? '#fff3e0' : todayStatus === 'absent' ? '#ffebee' : '#f5f5f5', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 4 }}>Today</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: todayStatus === 'present' ? '#2e7d32' : todayStatus === 'late' ? '#e65100' : todayStatus === 'absent' ? '#c62828' : 'var(--text3)' }}>
                {todayStatus === 'present' ? '✓' : todayStatus === 'late' ? '⏰' : todayStatus === 'absent' ? '✗' : todayStatus === 'leave' ? '📅' : '—'}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginTop: 2 }}>
                {todayStatus === 'present' ? 'Present' : todayStatus === 'late' ? 'Late' : todayStatus === 'absent' ? 'Absent' : todayStatus === 'leave' ? 'Leave' : 'No mark'}
              </div>
            </div>
            <div style={{ padding: '12px 8px', borderRadius: 12, background: 'var(--gold-pale)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 4 }}>Points</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)' }}>{myChild.pts || 0}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginTop: 2 }}>Rank #{myChild.rank || '-'}</div>
            </div>
            <div style={{ padding: '12px 8px', borderRadius: 12, background: 'var(--primary-pale)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 4 }}>Behavior</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>{realPct}%</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginTop: 2 }}>Score</div>
            </div>
            <div style={{ padding: '12px 8px', borderRadius: 12, background: '#e3f2fd', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 4 }}>Attendance</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#1565c0' }}>{weekData.rate}%</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginTop: 2 }}>This Week</div>
            </div>
          </div>

          <div style={{ padding: 14, borderRadius: 12, background: '#fafafa', border: '1px solid var(--border)', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', marginBottom: 10 }}>📋 Today's Full Report</div>

            {/* Mood + Rating row (only if data exists) */}
            {dailyLog && (dailyLog.mood || dailyLog.overallRating > 0) && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {dailyLog.mood && MOOD_MAP[dailyLog.mood] && (
                  <div style={{ padding: '5px 10px', borderRadius: 8, background: MOOD_MAP[dailyLog.mood].color + '20', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}>
                    {MOOD_MAP[dailyLog.mood].emoji} Mood: {MOOD_MAP[dailyLog.mood].label}
                  </div>
                )}
                {dailyLog.overallRating > 0 && (
                  <div style={{ padding: '5px 10px', borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700 }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={12} fill={i < dailyLog.overallRating ? '#f59e0b' : 'none'} color={i < dailyLog.overallRating ? '#f59e0b' : '#d4d4d4'} />
                    ))}
                    <span style={{ marginLeft: 4, color: '#a16207' }}>Rating</span>
                  </div>
                )}
              </div>
            )}

            {/* Activities - always shown, greyed out when no data */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: (dailyLog?.note || dailyLog?.learning || dailyLog?.social || dailyLog?.health) ? 8 : 0 }}>
              {overviewLogItems.map(item => {
                const c = item.color;
                const hasData = item.done !== undefined && item.done !== null;
                const done = Boolean(item.done);
                const live = isLive(item.time);
                const ago = timeAgo(item.time);
                return (
                  <div key={item.label} style={{
                    padding: '7px 10px', borderRadius: 8,
                    background: done ? c + '15' : hasData ? '#f5f5f5' : '#f5f5f5',
                    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                    borderLeft: done ? `3px solid ${c}` : hasData ? '3px solid #ddd' : '3px solid #ddd',
                    opacity: !hasData ? 0.4 : 1,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: done ? c : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {done ? '✓' : '✗'} {item.label}
                      {live && <span style={{ fontSize: 8, fontWeight: 800, color: '#22c55e', padding: '1px 5px', borderRadius: 3, background: '#dcfce7' }}>LIVE</span>}
                      {item.time && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginLeft: 2 }}>🕐 {item.time}</span>}
                      {ago && <span style={{ fontSize: 10, fontWeight: 600, color: live ? '#22c55e' : '#9ca3af' }}>({ago})</span>}
                    </div>
                    {item.refused && <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', padding: '1px 6px', borderRadius: 4, background: '#fee2e2' }}>Refused</span>}
                    {item.details && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{item.details}</span>}
                  </div>
                );
              })}
            </div>

            {/* Development notes (only if data exists) */}
            {dailyLog && (dailyLog.learning || dailyLog.social || dailyLog.health) && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {dailyLog.learning && <div style={{ padding: '5px 10px', borderRadius: 8, background: '#f3e8ff', fontSize: 11, fontWeight: 600, color: '#7c3aed' }}>🧠 {dailyLog.learning}</div>}
                {dailyLog.social && <div style={{ padding: '5px 10px', borderRadius: 8, background: '#e0f2fe', fontSize: 11, fontWeight: 600, color: '#0369a1' }}>👥 {dailyLog.social}</div>}
                {dailyLog.health && <div style={{ padding: '5px 10px', borderRadius: 8, background: '#fce4ec', fontSize: 11, fontWeight: 600, color: '#c62828' }}>❤️ {dailyLog.health}</div>}
              </div>
            )}

            {dailyLog?.note && <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#f7f6f3', borderLeft: '3px solid var(--primary)', fontSize: 12, fontWeight: 600, color: '#3a3a4a', lineHeight: 1.6 }}>{dailyLog.note}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', marginBottom: 8 }}>📊 Weekly Attendance</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {weekData.dayLabels.map((label, i) => {
                  const st = weekData.statuses[i];
                  const dotColor = st === 'present' ? '#2e7d32' : st === 'late' ? '#e65100' : st === 'absent' ? '#c62828' : '#e0e0e0';
                  return (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: st ? '#fff' : '#999' }}>
                          {st === 'present' ? '✓' : st === 'late' ? '~' : st === 'absent' ? '✗' : '-'}
                        </div>
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)' }}>{label}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>
                {weekData.present} present · {weekData.late} late · {weekData.absent} absent
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', marginBottom: 8 }}>📈 Behavior Trend</div>
              {posCount > 0 || negCount > 0 ? (
                <>
                  <div style={{ height: 8, borderRadius: 4, background: '#ffcdd2', overflow: 'hidden', marginBottom: 6, display: 'flex' }}>
                    {posCount + negCount > 0 && (
                      <div style={{ height: '100%', width: `${posCount / (posCount + negCount) * 100}%`, background: '#66bb6a', borderRadius: 4 }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                    <span style={{ color: '#2e7d32' }}>+{posCount} positive</span>
                    <span style={{ color: '#c62828' }}>-{negCount} corrective</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginTop: 4 }}>
                    {posCount > negCount ? '🌟 Great behavioral trend!' : negCount > 0 ? '📝 Some room for improvement' : ''}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>No entries recorded yet</div>
              )}

              {tags.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 4 }}>🏷️ Teacher Observations</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {tags.map((tag, i) => (
                      <span key={i} style={{ padding: '2px 8px', borderRadius: 12, background: 'var(--primary-pale)', color: 'var(--primary)', fontSize: 10, fontWeight: 700 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {childActivities.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', marginBottom: 8 }}>🔄 Recent Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {childActivities.slice(0, 4).map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.title?.toLowerCase().includes('awarded') ? '#66bb6a' : a.title?.toLowerCase().includes('deduct') ? '#ef5350' : 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{a.title}</span>
                    {a.time && <span style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{a.time}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isTeacher && showLogForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">Log Daily Activities — {myChild.name}</div>
            <Calendar size={16} style={{ color: 'var(--text3)' }} />
          </div>
          <div className="card-body">
            {/* Mood */}
            <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, background: '#fefce8', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#a16207', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Smile size={13} /> How was their mood today?
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {[
                  { value: 'happy', label: 'Happy', emoji: '😊', color: '#22c55e' },
                  { value: 'okay', label: 'Okay', emoji: '😐', color: '#f59e0b' },
                  { value: 'tired', label: 'Tired', emoji: '😴', color: '#8b5cf6' },
                  { value: 'sad', label: 'Sad', emoji: '😢', color: '#6366f1' },
                  { value: 'fussy', label: 'Fussy', emoji: '😣', color: '#ef4444' },
                ].map(m => {
                  const active = logForm.mood === m.value;
                  return (
                    <button key={m.value} onClick={() => setLogForm({ ...logForm, mood: active ? '' : m.value })}
                      style={{
                        padding: '5px 10px', borderRadius: 8, border: active ? `1.5px solid ${m.color}` : '1px solid #e5e5e5',
                        background: active ? m.color + '20' : '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 11,
                        color: active ? m.color : '#888',
                      }}>
                      {m.emoji} {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activities */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              {dailyActivities.map(a => (
                <div key={a.key} style={{
                  padding: 10, borderRadius: 10,
                  background: logForm[a.key] ? 'var(--primary-pale)' : 'var(--surface2)',
                  border: `2px solid ${logForm[a.key] ? 'var(--primary)' : 'transparent'}`,
                  transition: 'all .15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: logForm[a.key] ? 8 : 0 }}>
                    <div onClick={() => toggleActivity(a.key)} style={{
                      cursor: 'pointer', userSelect: 'none', fontWeight: 700, fontSize: 13,
                      color: logForm[a.key] ? 'var(--primary)' : 'var(--text3)',
                      display: 'flex', alignItems: 'center', gap: 4, flex: 1,
                    }}>
                      {logForm[a.key] ? <Check size={16} /> : <X size={16} />}
                      {a.label}
                    </div>
                  </div>
                  {logForm[a.key] && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {a.hasRefused && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--coral)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={logForm[a.key + 'Refused'] || false} onChange={e => setLogForm({ ...logForm, [a.key + 'Refused']: e.target.checked })} style={{ accentColor: 'var(--coral)' }} />
                            <ThumbsDown size={11} /> Refused
                          </label>
                        )}
                        <input style={{ flex: 1, minWidth: 120, padding: '5px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}
                          placeholder={a.detailPlaceholder} value={logForm[a.detailKey] || ''}
                          onChange={e => setLogForm({ ...logForm, [a.detailKey]: e.target.value })} />
                        <input style={{ width: 80, padding: '5px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}
                          placeholder="Time" value={logForm[a.timeKey] || ''}
                          onChange={e => setLogForm({ ...logForm, [a.timeKey]: e.target.value })} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Development Notes */}
            <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#666' }}>DEVELOPMENT NOTES</div>
              {[
                { key: 'learning', label: 'Learning / Skills', icon: Brain, placeholder: 'e.g. Recognized letters, counted to 10', color: '#8b5cf6' },
                { key: 'social', label: 'Social Interaction', icon: Users, placeholder: 'e.g. Shared toys, played with friends', color: '#06b6d4' },
                { key: 'health', label: 'Health Notes', icon: Heart, placeholder: 'e.g. Cough, fever, allergies, bumps', color: '#ef4444' },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <f.icon size={13} style={{ color: f.color, flexShrink: 0 }} />
                  <input style={{
                    flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #eae7e2', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', outline: 'none',
                  }}
                    placeholder={f.placeholder} value={logForm[f.key] || ''}
                    onChange={e => setLogForm({ ...logForm, [f.key]: e.target.value })} />
                </div>
              ))}
            </div>

            {/* Overall Rating */}
            <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#a16207', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={13} /> Overall Day Rating
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5].map(r => (
                  <button key={r} onClick={() => setLogForm({ ...logForm, overallRating: logForm.overallRating === r ? 0 : r })}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: logForm.overallRating >= r ? '1px solid #f59e0b' : '1px solid #e5e5e5',
                      background: logForm.overallRating >= r ? '#fef3c7' : '#fff',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: logForm.overallRating >= r ? '#d97706' : '#d4d4d4',
                    }}>
                    <Star size={14} fill={logForm.overallRating >= r ? '#f59e0b' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 600, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }}
              placeholder="Add a note about today (e.g. 'Had a great time playing outside')"
              value={logForm.note}
              onChange={e => setLogForm({ ...logForm, note: e.target.value })}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLogForm(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveDailyLog}>Save Activities</button>
            </div>
          </div>
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Daily Activity Log</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => {
                  const d = new Date(viewDate + 'T00:00:00');
                  d.setDate(d.getDate() - 1);
                  setViewDate(d.toISOString().slice(0, 10));
                }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--text2)', lineHeight: '22px' }}
              >‹</button>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', whiteSpace: 'nowrap', minWidth: 80, textAlign: 'center' }}>
                {new Date(viewDate + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: viewDate === todayStr ? undefined : 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const d = new Date(viewDate + 'T00:00:00');
                  d.setDate(d.getDate() + 1);
                  const next = d.toISOString().slice(0, 10);
                  if (next <= todayStr) setViewDate(next);
                }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: viewDate >= todayStr ? 'var(--border)' : 'var(--text2)', lineHeight: '22px' }}
                disabled={viewDate >= todayStr}
              >›</button>
              {!isViewingToday && (
                <button
                  onClick={() => setViewDate(todayStr)}
                  style={{ background: 'var(--primary)', border: 'none', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: '22px' }}
                >Today</button>
              )}
              {isTeacher && !showLogForm && (
                <span className="card-action" onClick={() => setShowLogForm(true)} style={{ marginLeft: 4 }}>
                  <Edit3 size={13} style={{ display: 'inline', marginRight: 3 }} /> Log today
                </span>
              )}
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--primary-pale)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>Attendance Today</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>
                  {todayStatus === 'present' ? <><Check size={16} style={{ display: 'inline' }} /> Present</> : todayStatus === 'late' ? <><Clock size={16} style={{ display: 'inline' }} /> Late</> : todayStatus === 'absent' ? <><X size={16} style={{ display: 'inline' }} /> Absent</> : todayStatus === 'leave' ? <><Calendar size={16} style={{ display: 'inline' }} /> On Leave</> : 'Not marked'}
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--gold-pale)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>Total Points</div>
                <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>{myChild.pts || 0}</div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  {isViewingToday ? "Today's Activities" : new Date(viewDate + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) + ' Activities'}
                </span>
              </div>

              {/* Mood + Rating (only if data exists for viewed date) */}
              {viewDailyLog && (viewDailyLog.mood || viewDailyLog.overallRating > 0) && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  {viewDailyLog.mood && MOOD_MAP[viewDailyLog.mood] && (
                    <div style={{ padding: '4px 10px', borderRadius: 8, background: MOOD_MAP[viewDailyLog.mood].color + '15', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}>
                      {MOOD_MAP[viewDailyLog.mood].emoji} Mood: {MOOD_MAP[viewDailyLog.mood].label}
                    </div>
                  )}
                  {viewDailyLog.overallRating > 0 && (
                    <div style={{ padding: '4px 10px', borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 700, color: '#a16207' }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={10} fill={i < viewDailyLog.overallRating ? '#f59e0b' : 'none'} color={i < viewDailyLog.overallRating ? '#f59e0b' : '#d4d4d4'} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Activities - always shown, greyed out when no log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {viewLogItems.map(item => {
                  const c = item.color;
                  const hasData = item.done !== undefined && item.done !== null;
                  const done = Boolean(item.done);
                  const live = isLive(item.time);
                  const ago = timeAgo(item.time);
                  return (
                    <div key={item.label} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                      borderRadius: 8,
                      background: done ? c + '12' : 'var(--surface2)',
                      borderLeft: done ? `3px solid ${c}` : hasData ? '3px solid #ddd' : '3px solid transparent',
                      opacity: !hasData ? 0.35 : 1,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: done ? c : 'var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                      }}>
                        {done ? <Check size={12} /> : <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', opacity: hasData ? 1 : 0.5 }}>—</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: done ? c : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {item.label}
                          {live && <span style={{ fontSize: 8, fontWeight: 800, color: '#22c55e', padding: '1px 5px', borderRadius: 3, background: '#dcfce7' }}>LIVE</span>}
                          {item.time && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)' }}>🕐 {item.time}</span>}
                          {ago && <span style={{ fontSize: 10, fontWeight: 600, color: live ? '#22c55e' : '#9ca3af' }}>({ago})</span>}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {item.refused && <span style={{ color: '#ef4444', fontWeight: 700 }}>Refused</span>}
                          {item.details && <span>{item.details}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dev notes (only if data exists) */}
              {viewDailyLog && (viewDailyLog.learning || viewDailyLog.social || viewDailyLog.health) && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {viewDailyLog.learning && <div style={{ padding: '4px 10px', borderRadius: 8, background: '#f3e8ff', fontSize: 10, fontWeight: 600, color: '#7c3aed' }}>🧠 {viewDailyLog.learning}</div>}
                  {viewDailyLog.social && <div style={{ padding: '4px 10px', borderRadius: 8, background: '#e0f2fe', fontSize: 10, fontWeight: 600, color: '#0369a1' }}>👥 {viewDailyLog.social}</div>}
                  {viewDailyLog.health && <div style={{ padding: '4px 10px', borderRadius: 8, background: '#fce4ec', fontSize: 10, fontWeight: 600, color: '#c62828' }}>❤️ {viewDailyLog.health}</div>}
                </div>
              )}

              {viewDailyLog?.note && (
                <div style={{ marginTop: 10, padding: '10px 12px 8px', borderRadius: 10, background: '#f7f6f3', border: '1px solid #e8e5e0', fontSize: 12, fontWeight: 500, color: '#3a3a4a', lineHeight: 1.7, position: 'relative' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Note</div>
                  <div>{viewDailyLog.note}</div>
                </div>
              )}
            </div>

            {childActivities.length === 0 ? (
              <div className="activity-item">
                <div className="act-icon" style={{ background: 'var(--primary-pale)', fontSize: 16 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </div>
                <div className="act-text"><div className="act-title">No recent activity recorded for {myChild.name} yet.</div></div>
              </div>
            ) : childActivities.slice(0, 5).map(a => (
              <div key={a.id} className="activity-item">
                <div className="act-icon" style={{ background: 'var(--primary-pale)', fontSize: 16 }}>{a.icon}</div>
                <div className="act-text">
                  <div className="act-title">{a.title}</div>
                  <div className="act-time">{a.time || a.timeLabel || ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Weekly Attendance</div>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>This week's daily attendance</div>
            {dayLabels.map((d, i) => {
              const st = weekStatuses[i];
              const isPresent = st === 'present';
              const barWidth = isPresent ? 100 : st === 'late' ? 50 : st === 'absent' ? 0 : st === 'leave' ? 50 : 0;
              return (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 32, fontSize: 12, fontWeight: 700, color: 'var(--text3)' }}>{d}</div>
                  <div className="stu-bar-wrap" style={{ flex: 1, height: 8 }}>
                    {st ? (
                      <div className="stu-bar" style={{
                        width: `${barWidth}%`,
                        background: isPresent ? 'var(--primary)' : st === 'late' ? 'var(--gold)' : st === 'absent' ? 'var(--coral)' : 'var(--lavender)'
                      }} />
                    ) : (
                      <div style={{ height: 8, borderRadius: 4, background: 'var(--border)' }} />
                    )}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, minWidth: 60, textAlign: 'right', color: st ? 'var(--text)' : 'var(--text3)' }}>
                    {st ? (isPresent ? 'Present' : st === 'late' ? 'Late' : st === 'absent' ? 'Absent' : 'Leave') : '-'}
                  </div>
                </div>
              );
            })}
            {weekStatuses.some(s => s) ? (
              <div style={{ marginTop: 14, padding: 12, background: 'var(--primary-pale)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--primary)', textAlign: 'center' }}>
                Weekly Attendance: {weekStatuses.filter(s => s === 'present' || s === 'late').length}/{weekStatuses.filter(s => s !== null).length} days present
              </div>
            ) : (
              <div style={{ marginTop: 14, padding: 12, background: 'var(--surface2)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--text3)', textAlign: 'center' }}>
                No attendance data this week yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {teacherTags[myChild.id]?.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">Teacher Observations</div>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {teacherTags[myChild.id].map(tag => (
              <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, background: 'var(--primary-pale)', color: 'var(--primary)', fontSize: 12, fontWeight: 700 }}>
                <Tag size={12} /> {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
