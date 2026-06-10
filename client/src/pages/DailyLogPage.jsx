import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Save, Sparkles, RotateCcw, Zap, Check, X, UtensilsCrossed, Bed } from 'lucide-react';
import { requestJSON } from '../api';
import { API_BASE } from '../config';
import LegoBrickIcon from '../components/LegoBrickIcon';

const ACTIVITIES = [
  { key: 'ate', label: 'Ate', icon: UtensilsCrossed, color: '#4CAF96' },
  { key: 'nap', label: 'Slept', icon: Bed, color: '#7C5CBF' },
  { key: 'play', label: 'Playing', icon: LegoBrickIcon, color: '#6366f1' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadAllLogs() {
  try { return JSON.parse(localStorage.getItem('axion_daily_logs')) || {}; } catch { return {}; }
}

export default function DailyLogPage() {
  const { students, setActivities, activities, showToast, currentRole, user, getTeacherClassrooms, dailyLogs, setDailyLogs } = useApp();
  const [logs, setLogs] = useState({});
  const [dirty, setDirty] = useState({});
  const [saving, setSaving] = useState({});
  const dateStr = todayStr();
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const visibleStudents = currentRole === 'teacher'
    ? (() => { const a = getTeacherClassrooms(user?.email); return a ? students.filter(s => a.includes(s.class)) : students; })()
    : students;

  useEffect(() => {
    const local = loadAllLogs();
    // Merge context data (most complete) with local (may have unsaved edits)
    setLogs({ ...dailyLogs, ...local });
  }, [dailyLogs]);

  const persistLogs = useCallback((logsToSave) => {
    // Merge local edits into the full context data to preserve other students' logs
    const merged = { ...dailyLogs };
    for (const [sid, dates] of Object.entries(logsToSave)) {
      if (!merged[sid]) merged[sid] = {};
      Object.assign(merged[sid], dates);
    }
    localStorage.setItem('axion_daily_logs', JSON.stringify(merged));
    setDailyLogs(merged);
    // Save directly to backend (bypass debounced queueSyncToDB for immediate sync)
    requestJSON(`${API_BASE}/data/axion_daily_logs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    }).catch(() => {});
  }, [dailyLogs, setDailyLogs]);

  const getDefaultRow = () => ({ ate: false, nap: false, play: false, note: '', updatedAt: null });

  const getRow = (sid) => logs[sid]?.[dateStr] || getDefaultRow();

  const updateRow = (sid, patch) => {
    const current = logs[sid]?.[dateStr] || getDefaultRow();
    const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
    const newLogs = { ...logs };
    if (!newLogs[sid]) newLogs[sid] = {};
    newLogs[sid][dateStr] = updated;
    setLogs(newLogs);
    setDirty({ ...dirty, [sid]: true });
  };

  const saveRow = (sid) => {
    setSaving({ ...saving, [sid]: true });
    persistLogs({ ...logs });
    const row = getRow(sid);
    const student = students.find(s => s.id === sid);
    if (student) {
      const act = {
        id: 'act-' + Date.now() + '-' + sid,
        title: `Daily log: ${student.name}`,
        desc: ACTIVITIES.filter(a => row[a.key]).map(a => a.label).join(', ') + (row.note ? ` \u2014 ${row.note}` : ''),
        time: 'Just now', timeLabel: 'Just now',
      };
      setActivities([act, ...activities]);
    }
    setTimeout(() => {
      setSaving({ ...saving, [sid]: false });
      setDirty({ ...dirty, [sid]: false });
    }, 300);
  };

  const saveAll = () => {
    const dirtyIds = Object.keys(dirty).filter(k => dirty[k]);
    if (dirtyIds.length === 0) { showToast('No changes to save'); return; }
    persistLogs(logs);
    dirtyIds.forEach(sid => {
      const row = getRow(sid);
      const student = students.find(s => s.id === sid);
      if (student) {
        const act = {
          id: 'act-' + Date.now() + '-' + sid,
          title: `Daily log: ${student.name}`,
          desc: ACTIVITIES.filter(a => row[a.key]).map(a => a.label).join(', '),
          time: 'Just now', timeLabel: 'Just now',
        };
        setActivities([act, ...activities]);
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
        case 'full': patch = { ate: true, nap: true, play: true }; break;
        case 'half': patch = { ate: true, nap: true, play: false }; break;
        case 'reset': patch = { ate: false, nap: false, play: false, note: '' }; break;
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
    visibleStudents.forEach(s => {
      const current = newLogs[s.id]?.[dateStr] || getDefaultRow();
      const updated = { ...current, [key]: !currentAllOn, updatedAt: new Date().toISOString() };
      if (!newLogs[s.id]) newLogs[s.id] = {};
      newLogs[s.id][dateStr] = updated;
      setDirty({ ...dirty, [s.id]: true });
    });
    setLogs(newLogs);
    showToast(currentAllOn ? `Unmarked all` : `Marked all`);
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

  return (
    <div style={{ WebkitFontSmoothing: 'antialiased' }}>
      <div style={{
        marginBottom: 28, paddingBottom: 20,
        borderBottom: '1px solid #f0eeea',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, color: '#1a1a2e' }}>Daily Log</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#aaa', fontWeight: 600, marginTop: 4, letterSpacing: -0.1 }}>
              <span>{todayLabel}</span>
              <span style={{ color: '#ddd' }}>&middot;</span>
              <span>{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-sm" style={{ background: '#f0f9f6', color: '#2a8a6a', border: '1px solid #d0e8df', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, borderRadius: 9, letterSpacing: -0.1, padding: '6px 12px' }} onClick={() => applyPreset('full')}>
              <Zap size={12} /> Full Day
            </button>
            <button className="btn btn-sm" style={{ background: '#faf9f7', color: '#888', border: '1px solid #eae7e2', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, borderRadius: 9, letterSpacing: -0.1, padding: '6px 12px' }} onClick={() => applyPreset('half')}>
              Half Day
            </button>
            <button className="btn btn-sm" style={{ background: '#faf9f7', color: '#888', border: '1px solid #eae7e2', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, borderRadius: 9, letterSpacing: -0.1, padding: '6px 12px' }} onClick={() => applyPreset('reset')}>
              <RotateCcw size={11} /> Reset
            </button>
            <button className="btn btn-primary btn-sm" style={{ borderRadius: 9, fontSize: 11, fontWeight: 700, letterSpacing: -0.1, padding: '6px 14px', boxShadow: dirtyCount > 0 ? '0 4px 12px rgba(46,125,107,0.25)' : 'none', transition: 'all .2s', opacity: dirtyCount === 0 ? 0.5 : 1 }} onClick={saveAll} disabled={dirtyCount === 0}>
              <Save size={11} /> {dirtyCount > 0 ? `Save All (${dirtyCount})` : 'All Saved'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {ACTIVITIES.map(a => {
          const allOn = visibleStudents.every(s => (logs[s.id]?.[dateStr] || getDefaultRow())[a.key]);
          const isPlay = a.key === 'play';
          return (
            <button key={a.key} onClick={() => bulkToggle(a.key)}
              style={{
                padding: '6px 14px', borderRadius: isPlay ? 10 : 8,
                border: allOn ? `1.5px solid ${isPlay ? '#6366f1' : a.color}` : '1px solid #eae7e2',
                background: allOn ? (isPlay ? 'linear-gradient(135deg, #eef2ff, #e0e7ff)' : '#f0f9f6') : '#fff',
                cursor: 'pointer', userSelect: 'none',
                display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 11,
                color: allOn ? (isPlay ? '#6366f1' : '#2a8a6a') : '#888', letterSpacing: -0.1,
                transition: 'all .15s',
              }}>
              <a.icon size={13} style={{ color: allOn ? (isPlay ? '#6366f1' : a.color) : '#b0a898' }} />
              {allOn ? `Unmark` : `Mark`} {a.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visibleStudents.map((s, idx) => {
          const row = getRow(s.id);
          const isDirty = dirty[s.id];
          const isSaving = saving[s.id];
          const hasNote = row.note?.trim()?.length > 0;
          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px',
              background: isDirty ? '#f6fbf9' : '#fff',
              borderRadius: 14,
              border: '1px solid',
              borderColor: isDirty ? '#cce8df' : '#eeecf0',
              boxShadow: isDirty ? '0 2px 8px rgba(46,125,107,0.06)' : '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all .2s ease',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: s.bg || '#eef5f2', color: s.col || '#2a8a6a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, flexShrink: 0,
              }}>
                {s.init}
              </div>

              <div style={{
                fontWeight: 800, fontSize: 13, flex: '0 0 100px',
                color: isDirty ? '#1a6b55' : '#1a1a2e', letterSpacing: -0.15,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{s.name}</div>

              <div style={{ display: 'flex', gap: 5, flex: '0 0 auto' }}>
                {ACTIVITIES.map(a => {
                  const on = row[a.key];
                  const isPlay = a.key === 'play';
                  return (
                    <div key={a.key} onClick={() => updateRow(s.id, { [a.key]: !on })}
                      style={{
                        padding: '6px 12px', borderRadius: isPlay ? 10 : 8, cursor: 'pointer', userSelect: 'none',
                        display: 'flex', alignItems: 'center', gap: 5, position: 'relative',
                        background: on
                          ? isPlay ? 'linear-gradient(135deg, #eef2ff, #e0e7ff)' : a.color + '14'
                          : '#f8f7f5',
                        border: on ? `1.5px solid ${isPlay ? '#6366f1' : a.color}` : '1.5px solid transparent',
                        fontWeight: 700, fontSize: 11, letterSpacing: -0.1,
                        color: on ? a.color : '#b0a898',
                        transition: 'all .12s',
                        opacity: isSaving ? 0.5 : 1,
                        whiteSpace: 'nowrap',
                      }}>
                      {isPlay && on && (
                        <div style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 4px rgba(34,197,94,0.5)', animation: 'pulse 1.5s infinite' }} />
                      )}
                      {on ? <Check size={11} /> : <X size={11} />}
                      {a.label}
                    </div>
                  );
                })}
              </div>

              <div style={{ flex: '1 1 80px', minWidth: 60 }}>
                <input
                  style={{
                    width: '100%', padding: '6px 10px', borderRadius: 8,
                    border: '1px solid', borderColor: hasNote ? '#d0c8b8' : '#eae7e2',
                    fontSize: 11, fontWeight: 600, letterSpacing: -0.1,
                    fontFamily: 'inherit', background: '#fcfbf9', color: '#1a1a2e',
                    outline: 'none', transition: 'all .15s',
                    opacity: isSaving ? 0.5 : 1,
                  }}
                  placeholder="Add note..."
                  value={row.note || ''}
                  onChange={e => updateRow(s.id, { note: e.target.value })}
                  onFocus={e => { e.target.style.borderColor = '#b8a898'; }}
                  onBlur={e => { e.target.style.borderColor = hasNote ? '#d0c8b8' : '#eae7e2'; }}
                />
              </div>

              <button
                onClick={() => saveRow(s.id)} disabled={!isDirty || isSaving}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none',
                  fontWeight: 700, fontSize: 11, letterSpacing: -0.1,
                  cursor: isDirty && !isSaving ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  background: isDirty ? 'var(--primary)' : '#f2f0ec',
                  color: isDirty ? '#fff' : '#b8b0a0',
                  boxShadow: isDirty ? '0 2px 8px rgba(46,125,107,0.2)' : 'none',
                  transition: 'all .25s',
                  transform: isSaving ? 'scale(.95)' : 'scale(1)',
                }}>
                {isSaving ? (
                  <div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
                ) : isDirty ? (
                  <Save size={10} />
                ) : (
                  <Check size={10} />
                )}
                {isSaving ? 'Saving' : isDirty ? 'Save' : 'Saved'}
              </button>
            </div>
          );
        })}
      </div>

      {dirtyCount > 0 && (
        <div style={{ marginTop: 16, padding: '8px 14px', borderRadius: 10, background: '#fffcf0', border: '1px solid #f0e0a0', fontSize: 11, fontWeight: 600, color: '#9a7a20', textAlign: 'center', letterSpacing: -0.1 }}>
          {dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
