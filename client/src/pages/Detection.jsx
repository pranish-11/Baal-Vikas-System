import { useEffect, useState } from 'react';
import axios from '../api/axios.js';
import StatCard from '../components/StatCard.jsx';

export default function Detection() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get('/api/detection/stats'),
      axios.get('/api/detection/events'),
      axios.get('/api/schools'),
    ]).then(([a, b, c]) => {
      setStats(a.data);
      setEvents(b.data);
      setSchools(c.data);
    });
  }, []);

  return (
    <div className="page-padding">
      <div className="stats-grid">
        <StatCard label="System Status">
          <span>
            <span className="pulse-dot" />
            Online
          </span>
        </StatCard>
        <StatCard
          label="Students Recognized"
          value={String(stats?.studentsRecognized ?? 0)}
        />
        <StatCard
          label="Behavior Events Today"
          value={String(stats?.behaviorEventsToday ?? 0)}
        />
        <StatCard
          label="AI Points Auto-Awarded"
          value={String(stats?.aiPointsAwarded ?? 0)}
        />
      </div>

      <div className="two-col dashboard-stack-margin">
        <div className="camera-box">
          <div className="camera-grid" />
          <div className="camera-badge">Room 3 LIVE</div>
        </div>
        <div className="camera-box">
          <div className="camera-grid" />
          <div className="camera-badge">Playground STANDBY</div>
        </div>
      </div>

      <div className="card card-pad dashboard-stack-margin">
        <h2 className="title-font section-title">AI Events</h2>
        {events.map((e) => (
          <div
            key={e._id}
            className={`detection-feed-item ${e.type}`}
          >
            <div className="det-ev-title">{e.title}</div>
            <div className="det-ev-desc">{e.description}</div>
            <div className="det-ev-meta">
              {e.studentId?.firstName} {e.studentId?.lastName} ·{' '}
              {new Date(e.timestamp).toLocaleString()} · Confidence{' '}
              {Math.round((e.confidence || 0) * 100)}%
            </div>
          </div>
        ))}
        {events.length === 0 ? <div className="empty-hint">No events.</div> : null}
      </div>

      <h2 className="title-font section-title">Schools</h2>
      <div className="schools-grid">
        {schools.map((s) => (
          <div key={s._id} className="card school-mini">
            <div className="school-mini-name">{s.name}</div>
            <div className="school-mini-loc">{s.location}</div>
            <div className="school-mini-stats">
              <span className="mini-pill">{s.numberOfRooms} rooms</span>
              <span className="mini-pill">{s.notes?.split('·')[0]?.trim() || '—'} students</span>
            </div>
          </div>
        ))}
        <div className="register-dash-card">Register new school</div>
      </div>
    </div>
  );
}
