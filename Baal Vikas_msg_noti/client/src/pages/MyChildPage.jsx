import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Tag, Bot, Plus, Check, Clock, X, Calendar, Edit3 } from 'lucide-react';
import { queueSyncToDB } from '../utils/dbSync';

function getDailyLog(studentId, dateStr) {
  try {
    const all = JSON.parse(localStorage.getItem('axion_daily_logs')) || {};
    return all[studentId]?.[dateStr] || null;
  } catch { return null; }
}

function setDailyLog(studentId, dateStr, data) {
  try {
    const all = JSON.parse(localStorage.getItem('axion_daily_logs')) || {};
    if (!all[studentId]) all[studentId] = {};
    all[studentId][dateStr] = data;
    localStorage.setItem('axion_daily_logs', JSON.stringify(all));
    queueSyncToDB('axion_daily_logs', all);
  } catch {}
}

function getStudentAvatar(studentId) {
  try { return JSON.parse(localStorage.getItem('axion_student_avatars'))?.[studentId] || null; } catch { return null; }
}

export default function MyChildPage() {
  const { students, activities, setActivities, currentRole, user, complaints, fees, attendanceData, openModal, teacherTags, showToast } = useApp();
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
  const avatarSrc = getStudentAvatar(myChild.id);
  const dailyLog = getDailyLog(myChild.id, dateStr);

  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm, setLogForm] = useState({
    ate: dailyLog?.ate || false,
    nap: dailyLog?.nap || false,
    play: dailyLog?.play || false,
    group: dailyLog?.group || false,
    quiet: dailyLog?.quiet || false,
    note: dailyLog?.note || '',
  });

  const childComplaints = complaints.filter(c =>
    c.student?.toLowerCase().includes(myChild.name.toLowerCase()) ||
    c.by?.toLowerCase().includes(email.split('@')[0]?.toLowerCase() || '')
  );

  const childFees = fees.filter(f =>
    f.studentName?.toLowerCase().includes(myChild.name.toLowerCase())
  );

  const childActivities = activities.filter(a =>
    a.title?.toLowerCase().includes(myChild.name.toLowerCase())
  );

  const getBehaviourScore = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('axion_behaviour_entries') || '[]');
      const studentEntries = stored.filter(e => e.studentId === myChild.id);
      return Math.max(0, Math.min(100, studentEntries.reduce((sum, e) => sum + (e.type === 'positive' ? 2 : -2), 0)));
    } catch { return 0; }
  };
  const realPct = getBehaviourScore();

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
    { key: 'nap', label: 'Took a nap' },
    { key: 'play', label: 'Outdoor play' },
    { key: 'group', label: 'Group activity' },
    { key: 'quiet', label: 'Quiet time' },
  ];

  const saveDailyLog = () => {
    const data = { ...logForm, updatedAt: new Date().toISOString() };
    setDailyLog(myChild.id, dateStr, data);
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
    { label: 'Took a nap', done: dailyLog.nap },
    { label: 'Outdoor play', done: dailyLog.play },
    { label: 'Group activity', done: dailyLog.group },
    { label: 'Quiet time', done: dailyLog.quiet },
  ] : [];

  return (
    <>
      <div className="child-header-card">
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: myChild.bg || 'var(--primary-pale)', color: myChild.col || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, marginBottom: 8, flexShrink: 0, overflow: 'hidden' }}>
          {avatarSrc ? <img src={avatarSrc} alt={myChild.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : myChild.init}
        </div>
        <div className="child-hn">{myChild.name}</div>
        <div className="child-hs">{myChild.class} · Age {myChild.age}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => openModal('aiChatbot', { studentId: myChild.id })}>
            <Bot size={16} /> AI Summary
          </button>
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

            {dailyLog && logItems.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Today's Routine</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {logItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: item.done ? 'var(--primary-pale)' : 'var(--surface2)' }}>
                      {item.done ? <Check size={14} style={{ color: 'var(--primary)' }} /> : <X size={14} style={{ color: 'var(--text3)' }} />}
                      <span style={{ fontSize: 12, fontWeight: 600, color: item.done ? 'var(--primary)' : 'var(--text3)' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
                {dailyLog.note && (
                  <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'var(--surface2)', fontSize: 12, fontWeight: 600, color: 'var(--text2)', fontStyle: 'italic' }}>
                    "{dailyLog.note}"
                  </div>
                )}
              </div>
            )}

            {!dailyLog && !isTeacher && (
              <div style={{ marginBottom: 14, padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>
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

      {(childComplaints.length > 0 || childFees.length > 0) && (
        <div className="two-col" style={{ marginTop: 16 }}>
          {childComplaints.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Complaints</div>
                <span className="card-action" onClick={() => {}}>View all</span>
              </div>
              <div className="card-body">
                {childComplaints.slice(0, 3).map(c => (
                  <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.status} · {c.time}</div>
                    </div>
                    <span className={`badge badge-${c.status}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {childFees.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Fee Status</div>
                <span className="card-action" onClick={() => {}}>View all</span>
              </div>
              <div className="card-body">
                {childFees.slice(0, 3).map(f => (
                  <div key={f.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{f.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>${f.balance} remaining</div>
                    </div>
                    <span className={`badge badge-${f.status}`}>{f.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
