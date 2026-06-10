import { useApp } from '../contexts/AppContext';
import StatsGrid from '../components/Dashboard/StatsGrid';
import ActivityFeed from '../components/Dashboard/ActivityFeed';
import BehaviorOverview from '../components/Dashboard/BehaviorOverview';
import MiniPodium, { MiniLBList } from '../components/Dashboard/MiniPodium';
import { Activity, MessageSquare, Calendar, Star, ArrowRight, Check, X, Clock, UtensilsCrossed, Bed } from 'lucide-react';
import LegoBrickIcon from '../components/LegoBrickIcon';

export default function DashboardPage({ onNavigate }) {
  const { currentRole, students, attendanceData, teacherTags, activities, user, openModal, complaints, messages, getTeacherClassrooms, dailyLogs } = useApp();

  if (currentRole === 'parent') {
    const email = user?.email || '';
    const child = students.find(s => s.parentEmail && s.parentEmail.toLowerCase() === email.toLowerCase());
    const dateStr = new Date().toISOString().slice(0, 10);
    const rec = attendanceData[dateStr] || {};
    const todayStatus = child ? rec[child.id] : null;
    const childTags = child ? teacherTags[child.id] || [] : [];
    const childActivities = activities.filter(a => child && a.title?.toLowerCase().includes(child.name.toLowerCase()));
    const unread = messages.filter(m => m.unread).length;
    const openComplaintsList = complaints.filter(c => c.status === 'open' || c.status === 'pending').length;
    const childRank = child ? students.filter(s => (s.pts || 0) > (child.pts || 0)).length + 1 : null;

    const quickActions = [
      { label: 'Messages', icon: MessageSquare, color: 'var(--sky)', bg: 'var(--sky-pale)', onClick: () => onNavigate('messages'), badge: unread || null },
      { label: 'Attendance', icon: Calendar, color: 'var(--primary)', bg: 'var(--primary-pale)', onClick: () => onNavigate('attendanceReports') },
      { label: 'My Child', icon: Star, color: 'var(--gold)', bg: 'var(--gold-pale)', onClick: () => onNavigate('myChild') },
    ];

    return (
      <>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Welcome back{child ? `, ${user?.email?.split('@')[0] || 'Parent'}` : ''}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {child && (
          <div className="card" style={{ marginBottom: 20, border: '1.5px solid var(--primary-light)', background: 'linear-gradient(135deg, var(--primary-pale) 60%, #fff 100%)' }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: child.bg || 'var(--primary)', color: child.col || '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
                {child.init}
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{child.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>{child.class} · Age {child.age}</div>
                {childTags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {childTags.slice(0, 3).map(t => <span key={t} style={{ padding: '2px 8px', borderRadius: 10, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700 }}>{t}</span>)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>{child.pts || 0}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>Points</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--gold)' }}>#{childRank || '-'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>Rank</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--sky)' }}>{child.pct || 0}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>Behavior</div>
                </div>
              </div>
              <div style={{ padding: '8px 16px', borderRadius: 10, background: todayStatus === 'present' ? 'var(--primary-pale)' : todayStatus === 'late' ? 'var(--gold-pale)' : todayStatus === 'absent' ? 'var(--coral-pale)' : 'var(--surface2)', textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)' }}>Today</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: todayStatus === 'present' ? 'var(--primary)' : todayStatus === 'late' ? 'var(--gold)' : todayStatus === 'absent' ? 'var(--coral)' : 'var(--text3)' }}>
                  {todayStatus === 'present' ? 'Present' : todayStatus === 'late' ? 'Late' : todayStatus === 'absent' ? 'Absent' : todayStatus === 'leave' ? 'Leave' : '—'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
          {quickActions.map(a => (
            <div key={a.label} onClick={a.onClick} style={{
              padding: '16px', borderRadius: 14, background: a.bg, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              border: '1.5px solid transparent', transition: 'all .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: a.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <a.icon size={20} style={{ color: a.color }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textAlign: 'center' }}>
                {a.label}
                {a.badge && <span style={{ marginLeft: 4, padding: '1px 6px', borderRadius: 8, background: a.color, color: '#fff', fontSize: 10 }}>{a.badge}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="dash-grid">
          <div>
            <StatsGrid />
            <ActivityFeed onNavigate={onNavigate} />
          </div>
          <div>
            {child && (() => {
              const todayLog = dailyLogs[child.id]?.[dateStr] || null;
              const items = [
                { key: 'ate', label: 'Ate meals', icon: UtensilsCrossed, done: todayLog?.ate ?? false },
                { key: 'nap', label: 'Slept', icon: Bed, done: todayLog?.nap ?? false },
                { key: 'play', label: 'Playing', icon: LegoBrickIcon, done: todayLog?.play ?? false },
              ];
              return (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <div className="card-title">Today's Activities</div>
                    <span className="card-action" onClick={() => onNavigate('myChild')}>Details</span>
                  </div>
                  <div className="card-body" style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {items.map(item => {
                        const isPlay = item.key === 'play';
                        return (
                          <div key={item.key} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                            borderRadius: isPlay ? 14 : 10,
                            background: item.done
                              ? isPlay ? 'linear-gradient(135deg, #eef2ff, #e0e7ff)' : 'var(--primary-pale)'
                              : 'var(--surface2)',
                            border: isPlay && item.done ? '1.5px solid #6366f1' : 'none',
                            position: 'relative', opacity: todayLog ? 1 : 0.5,
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
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: item.done ? 'var(--primary)' : 'var(--text3)' }}>{item.label}</div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: item.done ? 'var(--primary)' : 'var(--text3)' }}>{item.done ? (isPlay ? 'Active' : 'Done') : 'Not yet'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {todayLog?.note && (
                      <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--surface2)', fontSize: 12, fontWeight: 600, fontStyle: 'italic', color: 'var(--text2)' }}>
                        "{todayLog.note}"
                      </div>
                    )}
                    {!todayLog && (
                      <div style={{ marginTop: 8, textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>
                        No activities recorded yet today — teacher will update after class
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            {child && childActivities.length > 0 && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div className="card-title">Recent Activity</div>
                  <span className="card-action" onClick={() => onNavigate('myChild')}>View all</span>
                </div>
                <div className="card-body" style={{ padding: '12px 20px' }}>
                  {childActivities.slice(0, 5).map(a => (
                    <div key={a.id} className="activity-item">
                      <div className="act-icon" style={{ background: 'var(--primary-pale)', fontSize: 14 }}>{a.icon || '📝'}</div>
                      <div className="act-text">
                        <div className="act-title">{a.title}</div>
                        <div className="act-time">{a.time || a.timeLabel || ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {child && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Teacher Observations</div>
                  <span className="card-action" onClick={() => onNavigate('myChild')}>View all</span>
                </div>
                <div className="card-body">
                  {childTags.length > 0 ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {childTags.map(t => <span key={t} style={{ padding: '5px 12px', borderRadius: 20, background: 'var(--primary-pale)', color: 'var(--primary)', fontSize: 12, fontWeight: 700 }}>{t}</span>)}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 12, color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>No observations yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  const teacherStudents = currentRole === 'teacher'
    ? (() => { const a = getTeacherClassrooms(user?.email); return a ? students.filter(s => a.includes(s.class)) : students; })()
    : students;

  return (
    <>
      {(currentRole === 'teacher' || currentRole === 'admin') && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #16a34a', fontWeight: 800, gap: 6, display: 'flex', alignItems: 'center' }}
            onClick={() => openModal('addBehaviour')}>
            <Activity size={14} /> Log Behaviour
          </button>
          <button className="btn btn-sm" style={{ background: 'var(--primary-pale)', color: 'var(--primary)', border: '1.5px solid var(--primary)', fontWeight: 800, gap: 6, display: 'flex', alignItems: 'center' }}
            onClick={() => onNavigate('students')}>
            Manage Students
          </button>
        </div>
      )}
      <StatsGrid />
      <div className="dash-grid">
        <div>
          <ActivityFeed onNavigate={onNavigate} />
          <BehaviorOverview onNavigate={onNavigate} studentsList={teacherStudents} />
        </div>
        <div>
          <div className="card mb-16">
            <div className="card-header">
              <div className="card-title">Today's Leaders</div>
              <span className="card-action" onClick={() => onNavigate('leaderboard')}>Full board →</span>
            </div>
            <MiniPodium studentsList={teacherStudents} />
            <MiniLBList studentsList={teacherStudents} />
          </div>
        </div>
      </div>
    </>
  );
}
