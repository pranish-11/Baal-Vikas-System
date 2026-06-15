import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Save, Sparkles, RotateCcw, Zap, Check, X, UtensilsCrossed, Bed, ChevronDown, ChevronUp, Clock, ThumbsDown, Smile, Frown, Meh, Brain, Users, TreePine, Heart, Star } from 'lucide-react';
import { requestJSON } from '../api';
import { API_BASE } from '../config';
import LegoBrickIcon from '../components/LegoBrickIcon';

const ACTIVITIES = [
  { key: 'ate', label: 'Ate', icon: UtensilsCrossed, color: '#4CAF96', detailLabel: 'What did they eat?', detailPlaceholder: 'e.g. Rice, veggies, fruit', refusedLabel: 'Refused to eat?' },
  { key: 'nap', label: 'Slept', icon: Bed, color: '#7C5CBF', detailLabel: 'Sleep details?', detailPlaceholder: 'e.g. 1.5 hrs, 12:00-1:30pm' },
  { key: 'play', label: 'Playing', icon: LegoBrickIcon, color: '#6366f1', detailLabel: 'What did they play?', detailPlaceholder: 'e.g. Blocks, sensory play, with friends' },
  { key: 'outdoor', label: 'Outdoor', icon: TreePine, color: '#22c55e', detailLabel: 'Outdoor activities?', detailPlaceholder: 'e.g. Playground, running, sandbox' },
  { key: 'snack', label: 'Snack', icon: UtensilsCrossed, color: '#f59e0b', detailLabel: 'What snack?', detailPlaceholder: 'e.g. Fruit, crackers, milk', refusedLabel: 'Refused snack?' },
];

const MOODS = [
  { value: 'happy', label: 'Happy', icon: Smile, color: '#22c55e' },
  { value: 'okay', label: 'Okay', icon: Meh, color: '#f59e0b' },
  { value: 'tired', label: 'Tired', icon: Meh, color: '#8b5cf6' },
  { value: 'sad', label: 'Sad', icon: Frown, color: '#6366f1' },
  { value: 'fussy', label: 'Fussy', icon: Frown, color: '#ef4444' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyLogPage() {
  const { students, setActivities, activities, showToast, currentRole, user, getTeacherClassrooms, dailyLogs, setDailyLogs, hasAssignedClasses } = useApp();
  const [logs, setLogs] = useState({});
  const logsRef = useRef(logs);
  logsRef.current = logs;
  const [dirty, setDirty] = useState({});
  const [saving, setSaving] = useState({});
  const [expanded, setExpanded] = useState({});
  const dateStr = todayStr();
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const visibleStudents = currentRole === 'teacher'
    ? (() => { const a = getTeacherClassrooms(user?.email); return a.length > 0 ? students.filter(s => a.includes(s.class)) : []; })()
    : students;

  useEffect(() => {
    setLogs({ ...dailyLogs });
  }, [dailyLogs]);

  const dailyLogsRef = useRef(dailyLogs);
  dailyLogsRef.current = dailyLogs;

  const persistLogs = useCallback((logsToSave) => {
    const merged = { ...dailyLogsRef.current };
    for (const [sid, dates] of Object.entries(logsToSave)) {
      if (!merged[sid]) merged[sid] = {};
      Object.assign(merged[sid], dates);
    }
    setDailyLogs(merged);
    requestJSON(`${API_BASE}/data/axion_daily_logs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    }).catch(() => {});
  }, [setDailyLogs]);

  const getDefaultRow = () => ({
    ate: false, ateDetails: '', ateRefused: false, ateTime: '',
    nap: false, napDetails: '', napTime: '',
    play: false, playDetails: '', playTime: '',
    outdoor: false, outdoorDetails: '', outdoorTime: '',
    snack: false, snackDetails: '', snackRefused: false, snackTime: '',
    mood: '',
    learning: '',
    social: '',
    health: '',
    overallRating: 0,
    note: '', updatedAt: null,
  });

  const getRow = (sid) => logsRef.current[sid]?.[dateStr] || getDefaultRow();

  const updateRow = (sid, patch) => {
    const current = logsRef.current[sid]?.[dateStr] || getDefaultRow();
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const autoPatch = {};
    ACTIVITIES.forEach(a => {
      if (patch[a.key] === true) autoPatch[a.key + 'Time'] = now;
      if (patch[a.key] === false) autoPatch[a.key + 'Time'] = '';
    });
    const updated = { ...current, ...patch, ...autoPatch, updatedAt: new Date().toISOString() };
    setLogs(prev => ({ ...prev, [sid]: { ...(prev[sid] || {}), [dateStr]: updated } }));
    setDirty(prev => ({ ...prev, [sid]: true }));
  };

  const getActivitySummary = (row) => {
    const parts = [];
    ACTIVITIES.forEach(a => {
      if (row[a.key]) {
        let s = a.label;
        if (row[a.key + 'Refused']) s += ' (refused)';
        if (row[a.key + 'Details']) s += ': ' + row[a.key + 'Details'];
        if (row[a.key + 'Time']) s += ' @ ' + row[a.key + 'Time'];
        parts.push(s);
      }
    });
    return parts.join(', ');
  };

  const saveRow = (sid) => {
    const currentLogs = logsRef.current;
    setSaving(prev => ({ ...prev, [sid]: true }));
    persistLogs({ ...currentLogs });
    const row = currentLogs[sid]?.[dateStr] || getDefaultRow();
    const student = students.find(s => s.id === sid);
    if (student) {
      const summary = getActivitySummary(row);
      const act = {
        id: 'act-' + Date.now() + '-' + sid,
        title: `Daily log: ${student.name}`,
        desc: summary + (row.note ? ` — ${row.note}` : ''),
        time: 'Just now', timeLabel: 'Just now',
        studentId: sid,
      };
      setActivities(prev => [act, ...prev]);
      // Also save to server
      requestJSON(`${API_BASE}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Daily log: ${student.name}`,
          desc: summary + (row.note ? ` — ${row.note}` : ''),
          icon: '📋',
          studentId: sid,
          studentName: student.name,
        }),
      }).catch(() => {});
    }
    setTimeout(() => {
      setSaving(prev => ({ ...prev, [sid]: false }));
      setDirty(prev => ({ ...prev, [sid]: false }));
    }, 300);
  };

  const saveAll = () => {
    const currentLogs = logsRef.current;
    const dirtyIds = Object.keys(dirty).filter(k => dirty[k]);
    if (dirtyIds.length === 0) { showToast('No changes to save'); return; }
    persistLogs(currentLogs);
    dirtyIds.forEach(sid => {
      const row = currentLogs[sid]?.[dateStr] || getDefaultRow();
      const student = students.find(s => s.id === sid);
      if (student) {
        const summary = getActivitySummary(row);
        const act = {
          id: 'act-' + Date.now() + '-' + sid,
          title: `Daily log: ${student.name}`,
          desc: summary,
          time: 'Just now', timeLabel: 'Just now',
          studentId: sid,
        };
        setActivities(prev => [act, ...prev]);
        requestJSON(`${API_BASE}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Daily log: ${student.name}`,
            desc: summary,
            icon: '📋',
            studentId: sid,
            studentName: student.name,
          }),
        }).catch(() => {});
      }
    });
    setDirty({});
    showToast(`Saved ${dirtyIds.length} log(s)`);
  };

  const applyPreset = (preset) => {
    const newLogs = { ...logs };
    visibleStudents.forEach(s => {
      const current = newLogs[s.id]?.[dateStr] || getDefaultRow();
      let patch;
      switch (preset) {
        case 'full': patch = { ate: true, nap: true, play: true, outdoor: true, snack: true, ateRefused: false, snackRefused: false, mood: 'happy', overallRating: 5 }; break;
        case 'half': patch = { ate: true, nap: true, play: false, outdoor: false, snack: true, ateRefused: false, snackRefused: false }; break;
        case 'reset': patch = { ate: false, nap: false, play: false, outdoor: false, snack: false, ateRefused: false, ateDetails: '', ateTime: '', napDetails: '', napTime: '', playDetails: '', playTime: '', outdoorDetails: '', outdoorTime: '', snackDetails: '', snackRefused: false, snackTime: '', mood: '', learning: '', social: '', health: '', overallRating: 0, note: '' }; break;
        default: return;
      }
      const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
      if (!newLogs[s.id]) newLogs[s.id] = {};
      newLogs[s.id][dateStr] = updated;
      setDirty({ ...dirty, [s.id]: true });
    });
    setLogs(newLogs);
    showToast(`Preset applied to all`);
  };

  const bulkToggle = (key) => {
    const newLogs = { ...logs };
    const currentAllOn = visibleStudents.every(s => (newLogs[s.id]?.[dateStr] || getDefaultRow())[key]);
    const val = !currentAllOn;
    visibleStudents.forEach(s => {
      const current = newLogs[s.id]?.[dateStr] || getDefaultRow();
      const patch = { [key]: val, updatedAt: new Date().toISOString() };
      if (!val && key === 'ate') patch.ateRefused = false;
      if (!val && key === 'snack') patch.snackRefused = false;
      const updated = { ...current, ...patch };
      if (!newLogs[s.id]) newLogs[s.id] = {};
      newLogs[s.id][dateStr] = updated;
      setDirty({ ...dirty, [s.id]: true });
    });
    setLogs(newLogs);
    showToast(val ? `Marked all` : `Unmarked all`);
  };

  const studentCount = visibleStudents.length;
  const dirtyCount = Object.keys(dirty).filter(k => dirty[k]).length;

  if (visibleStudents.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Sparkles size={32} /></div>
        <p>No students registered yet.</p>
      </div>
    );
  }

  if (currentRole === 'teacher' && !hasAssignedClasses(user?.email)) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text3)', opacity: 0.3 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <p>You must be assigned to a class by the admin to access this feature.</p>
      </div>
    );
  }

  return (
    <div style={{ WebkitFontSmoothing: 'antialiased' }}>
      {/* Header */}
      <div style={{
        marginBottom: 28, paddingBottom: 20,
        borderBottom: '1px solid #f0eeea',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
              Daily Log
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#aaa', fontWeight: 600, marginTop: 4, letterSpacing: -0.1 }}>
              <span>{todayLabel}</span>
              <span style={{ color: '#ddd' }}>&middot;</span>
              <span>{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {[
              { key: 'full', label: 'Full Day', icon: Zap, bg: '#f0f9f6', color: '#2a8a6a', border: '#d0e8df' },
              { key: 'half', label: 'Half Day', icon: null, bg: '#faf9f7', color: '#888', border: '#eae7e2' },
              { key: 'reset', label: 'Reset', icon: RotateCcw, bg: '#faf9f7', color: '#888', border: '#eae7e2' },
            ].map(btn => (
              <button key={btn.key} className="btn btn-sm" style={{
                background: btn.bg, color: btn.color, border: `1px solid ${btn.border}`,
                fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
                borderRadius: 10, letterSpacing: -0.1, padding: '6px 12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }} onClick={() => applyPreset(btn.key)}>
                {btn.icon && <btn.icon size={12} />} {btn.label}
              </button>
            ))}
            <button className="btn btn-primary btn-sm" style={{
              borderRadius: 10, fontSize: 11, fontWeight: 700, letterSpacing: -0.1,
              padding: '6px 14px',
              boxShadow: dirtyCount > 0 ? '0 4px 14px rgba(46,125,107,0.3)' : '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all .2s', opacity: dirtyCount === 0 ? 0.5 : 1,
            }} onClick={saveAll} disabled={dirtyCount === 0}>
              <Save size={11} /> {dirtyCount > 0 ? `Save All (${dirtyCount})` : 'All Saved'}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk toggle row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {ACTIVITIES.map(a => {
          const allOn = visibleStudents.every(s => (logsRef.current[s.id]?.[dateStr] || getDefaultRow())[a.key]);
          const isPlay = a.key === 'play';
          return (
            <button key={a.key} onClick={() => bulkToggle(a.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                border: allOn ? `1.5px solid ${a.color}` : '1px solid #eae7e2',
                background: allOn ? a.color + '12' : '#fff',
                cursor: 'pointer', userSelect: 'none',
                display: 'flex', alignItems: 'center', gap: 5,
                fontWeight: 700, fontSize: 11,
                color: allOn ? a.color : '#888', letterSpacing: -0.1,
                transition: 'all .15s',
                boxShadow: allOn ? `0 2px 8px ${a.color}20` : 'none',
              }}>
              <a.icon size={13} style={{ color: allOn ? a.color : '#b0a898' }} />
              {allOn ? `All` : `Mark`} {a.label}
            </button>
          );
        })}
      </div>

      {/* Student cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibleStudents.map((s, idx) => {
          const row = getRow(s.id);
          const isDirty = dirty[s.id];
          const isSaving = saving[s.id];
          const hasNote = row.note?.trim()?.length > 0;
          const isExpanded = expanded[s.id];
          const anyOn = ACTIVITIES.some(a => row[a.key]);
          return (
            <div key={s.id} style={{
              borderRadius: 16,
              border: '1px solid',
              borderColor: isDirty ? '#cce8df' : '#eeecf0',
              background: isDirty ? '#f6fbf9' : '#fff',
              boxShadow: isDirty ? '0 4px 16px rgba(46,125,107,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all .25s ease',
              overflow: 'hidden',
              ':hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
            }}>
              {/* Card header row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', cursor: 'pointer',
              }}
                onClick={() => setExpanded({ ...expanded, [s.id]: !isExpanded })}>
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: s.bg || '#eef5f2', color: s.col || '#2a8a6a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, flexShrink: 0,
                  boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.06)',
                }}>
                  {s.init}
                </div>

                {/* Name */}
                <div style={{
                  fontWeight: 800, fontSize: 13, flex: '0 0 100px',
                  color: isDirty ? '#1a6b55' : '#1a1a2e', letterSpacing: -0.15,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{s.name}</div>

                {/* Quick toggle badges */}
                <div style={{ display: 'flex', gap: 4, flex: '0 0 auto' }}>
                  {ACTIVITIES.map(a => {
                    const on = row[a.key];
                    return (
                      <div key={a.key} onClick={e => { e.stopPropagation(); updateRow(s.id, { [a.key]: !on }); if (!on) setExpanded({ ...expanded, [s.id]: true }); }}
                        style={{
                          padding: '5px 8px', borderRadius: 8, cursor: 'pointer', userSelect: 'none',
                          display: 'flex', alignItems: 'center', gap: 3, position: 'relative',
                          background: on ? a.color + '14' : '#f8f7f5',
                          border: on ? `1.5px solid ${a.color}40` : '1.5px solid transparent',
                          fontWeight: 700, fontSize: 10, letterSpacing: -0.1,
                          color: on ? a.color : '#b0a898',
                          transition: 'all .12s',
                          opacity: isSaving ? 0.5 : 1,
                          whiteSpace: 'nowrap',
                        }}>
                        {on ? <Check size={10} /> : <X size={10} />}
                        {a.label}
                      </div>
                    );
                  })}
                </div>

                {/* Summary text */}
                <div style={{
                  flex: 1, minWidth: 60, fontSize: 11,
                  color: !anyOn ? 'var(--text3)' : '#1a6b55',
                  fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {anyOn ? getActivitySummary(row) : '—'}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); saveRow(s.id); }} disabled={!isDirty || isSaving}
                    style={{
                      padding: '6px 10px', borderRadius: 8, border: 'none',
                      fontWeight: 700, fontSize: 11, letterSpacing: -0.1,
                      cursor: isDirty && !isSaving ? 'pointer' : 'default',
                      background: isDirty ? 'var(--primary)' : '#f2f0ec',
                      color: isDirty ? '#fff' : '#b8b0a0',
                      boxShadow: isDirty ? '0 2px 8px rgba(46,125,107,0.2)' : 'none',
                      transition: 'all .25s',
                      transform: isSaving ? 'scale(.95)' : 'scale(1)',
                    }}>
                    {isSaving ? '...' : isDirty ? 'Save' : 'Saved'}
                  </button>
                  <div style={{
                    color: 'var(--text3)', transition: 'transform .25s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    display: 'flex',
                  }}>
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Expanded detail section */}
              {isExpanded && (
                <div style={{ padding: '0 16px 14px 62px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Mood */}
                  <div style={{ padding: 12, borderRadius: 12, background: '#fefce8', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#a16207', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Smile size={13} /> How was their mood?
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {MOODS.map(m => {
                        const active = row.mood === m.value;
                        const MIcon = m.icon;
                        return (
                          <button key={m.value} onClick={() => updateRow(s.id, { mood: active ? '' : m.value })}
                            style={{
                              padding: '6px 12px', borderRadius: 8, border: active ? `2px solid ${m.color}` : '1px solid #e5e5e5',
                              background: active ? m.color + '20' : '#fff', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 11,
                              color: active ? m.color : '#888', transition: 'all .12s',
                              boxShadow: active ? `0 2px 6px ${m.color}30` : 'none',
                            }}>
                            <MIcon size={13} /> {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Activity Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 800, color: '#999',
                      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
                    }}>
                      ACTIVITY DETAILS
                    </div>
                    {ACTIVITIES.map(a => {
                      const on = row[a.key];
                      return (
                        <div key={a.key} style={{
                          padding: '10px 12px', borderRadius: 12,
                          background: on ? a.color + '08' : '#fafafa',
                          border: on ? `1px solid ${a.color}30` : '1px solid #f0f0f0',
                          marginBottom: 4,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: on ? 8 : 0 }}>
                            <label style={{
                              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                              fontWeight: 700, color: on ? a.color : '#aaa', cursor: 'pointer', userSelect: 'none',
                            }}>
                              <input type="checkbox" checked={on}
                                onChange={() => { updateRow(s.id, { [a.key]: !on, [`${a.key}Details`]: on ? '' : row[a.key + 'Details'] || '' }); if (!on) setExpanded({ ...expanded, [s.id]: true }); }}
                                style={{ accentColor: a.color, transform: 'scale(1.1)' }} />
                              <a.icon size={14} /> {a.label}
                            </label>
                          </div>
                          {on && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              {a.refusedLabel && (
                                <label style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  fontSize: 11, fontWeight: 600, color: '#ef4444',
                                  cursor: 'pointer', padding: '4px 8px',
                                  borderRadius: 6, background: row[a.key + 'Refused'] ? '#fee2e2' : '#fff',
                                  border: '1px solid', borderColor: row[a.key + 'Refused'] ? '#fca5a5' : '#e5e5e5',
                                  userSelect: 'none',
                                }}>
                                  <input type="checkbox" checked={row[a.key + 'Refused'] || false}
                                    onChange={e => updateRow(s.id, { [a.key + 'Refused']: e.target.checked })}
                                    style={{ accentColor: '#ef4444' }} />
                                  <ThumbsDown size={11} /> {a.refusedLabel}
                                </label>
                              )}
                              <div style={{ flex: 1, minWidth: 120, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input style={{
                                  flex: 1, padding: '6px 10px', borderRadius: 8,
                                  border: '1px solid #ddd', fontSize: 11, fontWeight: 600,
                                  fontFamily: 'inherit', outline: 'none',
                                  background: '#fff',
                                }}
                                  placeholder={a.detailPlaceholder}
                                  value={row[a.key + 'Details'] || ''}
                                  onChange={e => updateRow(s.id, { [a.key + 'Details']: e.target.value })}
                                />
                                {row[a.key + 'Time'] && (
                                  <span style={{
                                    padding: '5px 10px', borderRadius: 6,
                                    background: a.color + '15', color: a.color,
                                    fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                                    display: 'flex', alignItems: 'center', gap: 3,
                                  }}>
                                    <Clock size={10} /> {row[a.key + 'Time']}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Development Notes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 800, color: '#999',
                      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
                    }}>
                      DEVELOPMENT NOTES
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        { key: 'learning', label: 'Learning / Skills', icon: Brain, placeholder: 'e.g. Recognized letters A-C, counted to 10', color: '#8b5cf6', bgColor: '#f3e8ff' },
                        { key: 'social', label: 'Social Interaction', icon: Users, placeholder: 'e.g. Shared toys, played with friends', color: '#06b6d4', bgColor: '#e0f2fe' },
                        { key: 'health', label: 'Health Notes', icon: Heart, placeholder: 'e.g. Cough, fever, allergies, bumps', color: '#ef4444', bgColor: '#fce4ec' },
                      ].map(f => (
                        <div key={f.key} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 10px', borderRadius: 8,
                          background: row[f.key]?.trim() ? f.bgColor : '#fafafa',
                          border: '1px solid', borderColor: row[f.key]?.trim() ? f.color + '40' : '#eee',
                        }}>
                          <f.icon size={14} style={{ color: f.color, flexShrink: 0 }} />
                          <input style={{
                            flex: 1, fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                            outline: 'none', border: 'none', background: 'transparent',
                          }}
                            placeholder={f.placeholder}
                            value={row[f.key] || ''}
                            onChange={e => updateRow(s.id, { [f.key]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Overall Rating */}
                  <div style={{ padding: 12, borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#a16207', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={13} /> Overall Day Rating
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map(r => (
                        <button key={r} onClick={() => updateRow(s.id, { overallRating: row.overallRating === r ? 0 : r })}
                          style={{
                            width: 34, height: 34, borderRadius: 8,
                            border: row.overallRating >= r ? '1.5px solid #f59e0b' : '1px solid #e5e5e5',
                            background: row.overallRating >= r ? '#fef3c7' : '#fff',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: row.overallRating >= r ? '#d97706' : '#d4d4d4',
                            transition: 'all .15s',
                            boxShadow: row.overallRating >= r ? '0 2px 6px rgba(245,158,11,0.2)' : 'none',
                          }}>
                          <Star size={15} fill={row.overallRating >= r ? '#f59e0b' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* General Note */}
                  <div>
                    <input style={{
                      width: '100%', padding: '8px 12px', borderRadius: 10,
                      border: '1.5px solid', borderColor: hasNote ? '#d0c8b8' : '#eae7e2',
                      fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                      background: '#fcfbf9', color: '#1a1a2e', outline: 'none',
                    }}
                      placeholder="General note..."
                      value={row.note || ''}
                      onChange={e => updateRow(s.id, { note: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dirty count bar */}
      {dirtyCount > 0 && (
        <div style={{
          marginTop: 16, padding: '10px 16px', borderRadius: 12,
          background: '#fffcf0', border: '1px solid #f0e0a0',
          fontSize: 11, fontWeight: 700, color: '#9a7a20',
          textAlign: 'center', letterSpacing: -0.1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Clock size={13} />
          {dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
