import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function MyChild() {
  const { user } = useAuth();
  const [child, setChild] = useState(null);
  const [events, setEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [history, setHistory] = useState([]);
  const { leaderboardRefreshKey } = useOutletContext() || {};

  useEffect(() => {
    if (!user?.childId) return;
    Promise.all([
      axios.get(`/api/students/${user.childId}`),
      axios.get(`/api/detection/events?studentId=${user.childId}`),
      axios.get('/api/leaderboard?period=today'),
      axios.get(`/api/leaderboard/history/${user.childId}`)
    ]).then(([childRes, eventsRes, lbRes, histRes]) => {
      setChild(childRes.data);
      setEvents(eventsRes.data.slice(0, 4));
      setLeaderboard(lbRes.data);
      setHistory(histRes.data);
    });
  }, [user?.childId, leaderboardRefreshKey]);

  const pointsTodayForChild = useMemo(() => {
    if (!child) return 0;
    const row = leaderboard.find(
      (r) => String(r._id) === String(child._id)
    );
    return row?.periodPoints ?? 0;
  }, [child, leaderboard]);

  const rankTodayForChild = useMemo(() => {
    if (!child) return null;
    const idx = leaderboard.findIndex(
      (r) => String(r._id) === String(child._id)
    );
    return idx >= 0 ? idx + 1 : null;
  }, [child, leaderboard]);

  if (!child) {
    return (
      <div className="page-padding">
        <div className="empty-hint">Loading child profile…</div>
      </div>
    );
  }

  return (
    <div className="page-padding">
      <div className="hero-child">
        <div
          className="sc-avatar hero-avatar"
          style={{
            background: child.avatarBg || 'var(--primary-pale)',
            color: child.avatarColor || 'var(--primary)',
          }}
        >
          {child.initials}
        </div>
        <div>
          <h1 className="title-font hero-title">
            {child.firstName} {child.lastName}
          </h1>
          <div className="school-mini-loc">{child.classroom}</div>
          <div className="hero-stats">
            <Stat label="Points Today" value={String(pointsTodayForChild)} />
            <Stat
              label="Rank Today"
              value={rankTodayForChild ? `#${rankTodayForChild}` : '—'}
            />
            <Stat label="Behavior%" value={`${child.behaviorPercent ?? 0}%`} />
            <Stat label="Days Present" value="22/23" />
          </div>
        </div>
      </div>

      <div className="card card-pad dashboard-stack-margin">
        <h2 className="title-font section-title">Today&apos;s Activity</h2>
        {events.map((e) => (
          <div key={e._id} className={`detection-feed-item ${e.type}`}>
            <div className="det-ev-title">{e.title}</div>
            <div className="det-ev-desc">{e.description}</div>
            <div className="det-ev-meta">
              {new Date(e.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
        {events.length === 0 ? (
          <div className="empty-hint">No activity logged today.</div>
        ) : null}
      </div>

      <div className="card card-pad dashboard-stack-margin">
        <h2 className="title-font section-title">Recent Points History</h2>
        {history.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {history.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--surface2)', borderRadius: 'var(--radius)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{h.points > 0 ? '+' : ''}{h.points} pts</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{h.source} - {h.reason}</div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>
                  {new Date(h.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-hint">No points history available.</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card card-pad child-stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value title-font child-stat-value">{value}</div>
    </div>
  );
}
