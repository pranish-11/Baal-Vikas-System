import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from '../api/axios.js';
import StatCard from '../components/StatCard.jsx';
import Podium from '../components/Podium.jsx';
import ActivityItem from '../components/ActivityItem.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const REWARD_TIERS = {
  gold: 'Top 3 weekly earn a gold certificate and classroom privilege.',
  silver: 'Ranks 4–10 receive silver recognition and a small prize.',
  bronze: 'Consistent effort earns bronze badges monthly.',
};

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || '';
  const {
    studentsRefreshKey,
    complaintsRefreshKey,
    leaderboardRefreshKey,
  } = useOutletContext() || {};

  const [students, setStudents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [convData, setConvData] = useState({ conversations: [], totalUnread: 0 });
  const [detStats, setDetStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [st, lb, comp, conv, ds, ev, sch] = await Promise.all([
        axios.get('/api/students'),
        axios.get('/api/leaderboard?period=today'),
        axios.get('/api/complaints'),
        axios.get('/api/messages/conversations'),
        axios.get('/api/detection/stats'),
        axios.get('/api/detection/events'),
        role === 'admin'
          ? axios.get('/api/schools')
          : Promise.resolve({ data: [] }),
      ]);
      setStudents(st.data);
      setLeaderboard(lb.data);
      setComplaints(comp.data);
      setConvData(conv.data);
      setDetStats(ds.data);
      setEvents(ev.data);
      setSchools(sch.data || []);
    };
    load();
  }, [role, studentsRefreshKey, complaintsRefreshKey, leaderboardRefreshKey]);

  const openComplaints = useMemo(
    () => complaints.filter((c) => c.status === 'open').length,
    [complaints]
  );

  const pointsTodayTotal = useMemo(() => {
    return leaderboard.reduce((s, x) => s + (x.periodPoints || 0), 0);
  }, [leaderboard]);

  const pointsTodayForParent = useMemo(() => {
    if (role !== 'parent') return 0;
    if (!user?.childId) return 0;
    const row = leaderboard.find(
      (r) => String(r._id) === String(user.childId)
    );
    return row?.periodPoints ?? 0;
  }, [leaderboard, role, user?.childId]);

  const schoolsActive = useMemo(
    () => schools.filter((s) => s.status === 'active').length,
    [schools]
  );

  const behaviorCounts = useMemo(() => {
    let ex = 0,
      gd = 0,
      na = 0;
    for (const s of students) {
      const bp = s.behaviorPercent ?? 0;
      if (bp >= 70) ex++;
      else if (bp >= 45) gd++;
      else na++;
    }
    const max = Math.max(ex + gd + na, 1);
    return { ex, gd, na, max };
  }, [students]);

  const activityFeed = useMemo(() => {
    const items = [];
    for (const e of events) {
      items.push({
        type: 'detection',
        ts: new Date(e.timestamp).getTime(),
        title: e.title,
        subtitle: e.description,
        time: new Date(e.timestamp).toLocaleString(),
      });
    }
    for (const c of complaints) {
      items.push({
        type: 'complaint',
        ts: new Date(c.createdAt).getTime(),
        title: `Complaint: ${c.subject}`,
        subtitle: c.description?.slice(0, 80),
        time: new Date(c.createdAt).toLocaleString(),
      });
    }
    for (const cv of convData.conversations || []) {
      if (cv.lastMessage?.timestamp) {
        items.push({
          type: 'message',
          ts: new Date(cv.lastMessage.timestamp).getTime(),
          title: `Message with ${cv.partner?.name || 'Contact'}`,
          subtitle: cv.lastMessage.text,
          time: new Date(cv.lastMessage.timestamp).toLocaleString(),
        });
      }
    }
    items.sort((a, b) => b.ts - a.ts);
    return items.slice(0, 5);
  }, [events, complaints, convData]);

  const top3 = leaderboard.slice(0, 3);
  const mini = leaderboard.slice(3, 6);

  return (
    <div className="page-padding">
      <div className="stats-grid">
        {role === 'parent' ? (
          <>
            <StatCard
              label="Points Today"
              value={String(pointsTodayForParent)}
            />
            <StatCard
              label="Attendance"
              value={String(detStats?.studentsRecognized ?? 0)}
            />
            <StatCard label="Messages" value={String(convData.totalUnread ?? 0)} />
            <StatCard label="Open Complaints" value={String(openComplaints)} />
          </>
        ) : (
          <>
            <StatCard
              label="Present Today"
              value={String(detStats?.studentsRecognized ?? students.length)}
            />
            <StatCard
              label="Points Awarded Today"
              value={String(pointsTodayTotal)}
            />
            <StatCard label="Open Complaints" value={String(openComplaints)} />
            <StatCard label="Messages" value={String(convData.totalUnread ?? 0)} />
            {role === 'admin' ? (
              <StatCard label="Schools Active" value={String(schoolsActive)} />
            ) : null}
          </>
        )}
      </div>

      <div className="dashboard-grid dashboard-stack-margin">
        <div className="card card-pad">
          <h2 className="title-font section-title">Recent Activity</h2>
          {activityFeed.map((a, i) => (
            <ActivityItem
              key={`${a.type}-${a.ts}-${i}`}
              type={
                a.type === 'complaint'
                  ? 'complaint'
                  : a.type === 'message'
                    ? 'message'
                    : 'detection'
              }
              title={a.title}
              subtitle={a.subtitle}
              time={a.time}
            />
          ))}
          {activityFeed.length === 0 ? (
            <div className="empty-hint">No recent activity.</div>
          ) : null}
        </div>
        <div>
          <div className="card card-pad">
            <h2 className="title-font section-title-sm">Today&apos;s Leaders</h2>
            <Podium students={top3} />
            <div className="mini-list">
              {mini.map((s, i) => (
                <div key={s._id} className="mini-list-item">
                  <span>
                    #{i + 4} {s.firstName} {s.lastName}
                  </span>
                  <span className="title-font">{s.periodPoints ?? s.points ?? 0}</span>
                </div>
              ))}
            </div>
            <div className="reward-tiers">
              <div className="reward-tier-block">
                <strong>Gold</strong> — {REWARD_TIERS.gold}
              </div>
              <div className="reward-tier-block">
                <strong>Silver</strong> — {REWARD_TIERS.silver}
              </div>
              <div className="reward-tier-block">
                <strong>Bronze</strong> — {REWARD_TIERS.bronze}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card card-pad dashboard-stack-margin">
        <h2 className="title-font section-title">Behavior Overview</h2>
        <div className="behavior-overview-bars">
          <div className="bo-row">
            <div className="bo-label">Excellent ≥70%</div>
            <div className="bo-bar-wrap">
              <div
                className="bo-bar-fill bo-fill-ex"
                style={{
                  width: `${(behaviorCounts.ex / behaviorCounts.max) * 100}%`,
                }}
              />
            </div>
            <div className="title-font bo-count">{behaviorCounts.ex}</div>
          </div>
          <div className="bo-row">
            <div className="bo-label">Good 45–69%</div>
            <div className="bo-bar-wrap">
              <div
                className="bo-bar-fill bo-fill-gd"
                style={{
                  width: `${(behaviorCounts.gd / behaviorCounts.max) * 100}%`,
                }}
              />
            </div>
            <div className="title-font bo-count">{behaviorCounts.gd}</div>
          </div>
          <div className="bo-row">
            <div className="bo-label">Needs Attention &lt;45%</div>
            <div className="bo-bar-wrap">
              <div
                className="bo-bar-fill bo-fill-na"
                style={{
                  width: `${(behaviorCounts.na / behaviorCounts.max) * 100}%`,
                }}
              />
            </div>
            <div className="title-font bo-count">{behaviorCounts.na}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
