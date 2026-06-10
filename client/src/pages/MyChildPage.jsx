import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Tag, Plus, Check, Clock, X, Calendar, Edit3, Sparkles, UtensilsCrossed, Bed } from 'lucide-react';
import LegoBrickIcon from '../components/LegoBrickIcon';
import { requestJSON } from '../api';
import { API_BASE } from '../config';

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

  const dateStr = new Date().toISOString().slice(0, 10);
  const rec = attendanceData[dateStr] || {};
  const todayStatus = rec[myChild.id];
  const dailyLog = dailyLogs[myChild.id]?.[dateStr] || null;

  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm, setLogForm] = useState({
    ate: dailyLog?.ate || false,
    nap: dailyLog?.nap || false,
    play: dailyLog?.play || false,
    group: dailyLog?.group || false,
    quiet: dailyLog?.quiet || false,
    note: dailyLog?.note || '',
  });

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
    { key: 'ate', label: 'Ate meals' },
    { key: 'nap', label: 'Slept' },
    { key: 'play', label: 'Played' },
  ];

  const saveDailyLog = () => {
    const data = { ...logForm, updatedAt: new Date().toISOString() };
    const newDailyLogs = {
      ...dailyLogs,
      [myChild.id]: {
        ...(dailyLogs[myChild.id] || {}),
        [dateStr]: data,
      },
    };
    setDailyLogs(newDailyLogs);
    requestJSON(`${API_BASE}/data/axion_daily_logs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDailyLogs),
    }).catch(() => {});
    const act = {
      id: 'act-' + Date.now(),
      title: `Daily log updated for ${myChild.name}`,
      desc: Object.entries(logForm).filter(([k, v]) => k !== 'note' && v).map(([k]) => k).join(', ') + (logForm.note ? ' — ' + logForm.note : ''),
      time: 'Just now', timeLabel: 'Just now',
    };
    setActivities([act, ...activities]);
    showToast('Daily activities saved');
    setShowLogForm(false);
  };

  const toggleActivity = (key) => {
    setLogForm({ ...logForm, [key]: !logForm[key] });
  };

  const logItems = dailyLog ? [
    { label: 'Ate meals', done: dailyLog.ate },
    { label: 'Slept', done: dailyLog.nap },
    { label: 'Played', done: dailyLog.play },
  ] : [];

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

          {dailyLog && (
            <div style={{ padding: 14, borderRadius: 12, background: '#fafafa', border: '1px solid var(--border)', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', marginBottom: 8 }}>📋 Today's Activities</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: dailyLog.note ? 8 : 0 }}>
                {[
                  { key: 'ate', label: 'Ate meals', icon: '🍽️', done: dailyLog.ate, doneBg: '#e8f5e9', doneCol: '#2e7d32', notBg: '#f5f5f5', notCol: '#aaa' },
                  { key: 'nap', label: 'Slept', icon: '💤', done: dailyLog.nap, doneBg: 'var(--sky-pale)', doneCol: '#1565c0', notBg: '#f5f5f5', notCol: '#aaa' },
                  { key: 'play', label: 'Played', icon: '🎮', done: dailyLog.play, doneBg: 'var(--gold-pale)', doneCol: '#e65100', notBg: '#f5f5f5', notCol: '#aaa' },
                ].map(a => (
                  <span key={a.key} style={{
                    padding: '4px 10px', borderRadius: 20,
                    background: a.done ? a.doneBg : a.notBg,
                    color: a.done ? a.doneCol : a.notCol,
                    fontSize: 11, fontWeight: 700,
                    transition: 'all .15s',
                    opacity: a.done ? 1 : 0.6,
                  }}>
                    {a.icon} {a.label}{!a.done ? ' — Not yet' : ''}
                  </span>
                ))}
              </div>
              {dailyLog.note && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', fontStyle: 'italic' }}>"{dailyLog.note}"</div>}
            </div>
          )}

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 12 }}>
              {dailyActivities.map(a => (
                <div key={a.key}
                  onClick={() => toggleActivity(a.key)}
                  style={{
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer', userSelect: 'none',
                    background: logForm[a.key] ? 'var(--primary-pale)' : 'var(--surface2)',
                    border: `2px solid ${logForm[a.key] ? 'var(--primary)' : 'transparent'}`,
                    textAlign: 'center', fontWeight: 700, fontSize: 13,
                    color: logForm[a.key] ? 'var(--primary)' : 'var(--text3)',
                    transition: 'all .15s',
                  }}>
                  {logForm[a.key] ? <Check size={16} style={{ display: 'block', margin: '0 auto 4px' }} /> : <X size={16} style={{ display: 'block', margin: '0 auto 4px' }} />}
                  {a.label}
                </div>
              ))}
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
            {isTeacher && !showLogForm && (
              <span className="card-action" onClick={() => setShowLogForm(true)}>
                <Edit3 size={13} style={{ display: 'inline', marginRight: 3 }} /> Log today
              </span>
            )}
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

            {dailyLog && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 2, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Today's Activities</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'ate', label: 'Ate meals', icon: UtensilsCrossed, done: dailyLog.ate },
                    { key: 'nap', label: 'Slept', icon: Bed, done: dailyLog.nap },
                    { key: 'play', label: 'Playing', icon: LegoBrickIcon, done: dailyLog.play },
                  ].map(item => {
                    const isPlay = item.key === 'play';
                    return (
                      <div key={item.key} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                        padding: '12px 6px', borderRadius: isPlay ? 14 : 10,
                        background: item.done
                          ? isPlay ? 'linear-gradient(135deg, #eef2ff, #e0e7ff)' : 'var(--primary-pale)'
                          : 'var(--surface2)',
                        border: isPlay && item.done ? '1.5px solid #6366f1' : 'none',
                        textAlign: 'center', position: 'relative',
                      }}>
                        {isPlay && item.done && (
                          <div style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px rgba(34,197,94,0.5)', animation: 'pulse 1.5s infinite' }} />
                        )}
                        <div style={{
                          width: 36, height: 36, borderRadius: isPlay ? 12 : 10,
                          background: item.done
                            ? isPlay ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--primary)'
                            : 'var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                        }}>
                          <item.icon size={16} />
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: item.done ? 'var(--primary)' : 'var(--text3)' }}>{item.label}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: item.done ? 'var(--primary)' : 'var(--text3)' }}>{item.done ? (isPlay ? 'Active' : 'Done') : 'Not yet'}</div>
                      </div>
                    );
                  })}
                </div>
                {dailyLog.note && (
                  <div style={{ marginTop: 12, padding: '10px 12px 8px', borderRadius: 10, background: '#f7f6f3', border: '1px solid #e8e5e0', fontSize: 12, fontWeight: 500, color: '#3a3a4a', lineHeight: 1.7, position: 'relative' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Note</div>
                    <div>{dailyLog.note}</div>
                  </div>
                )}
              </div>
            )}

            {!dailyLog && !isTeacher && (
              <div style={{ marginBottom: 14, padding: 14, textAlign: 'center', color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>
                No daily activities logged yet for today.
              </div>
            )}

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
