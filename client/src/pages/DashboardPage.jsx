import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import StatsGrid from '../components/Dashboard/StatsGrid';
import ActivityFeed from '../components/Dashboard/ActivityFeed';
import BehaviorOverview from '../components/Dashboard/BehaviorOverview';
import MiniPodium, { MiniLBList } from '../components/Dashboard/MiniPodium';
import { Activity, MessageSquare, Calendar, Star, Clock, UtensilsCrossed, Bed, Leaf, TreePine } from 'lucide-react';
import LegoBrickIcon from '../components/LegoBrickIcon';

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
  const mins = diff % 60;
  return `${hrs}h ${mins}m ago`;
}

function isLive(timeStr) {
  if (!timeStr) return false;
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const then = new Date();
  then.setHours(h, m, 0, 0);
  const diff = (now - then) / 60000;
  return diff >= 0 && diff <= 150;
}

export default function DashboardPage({ onNavigate }) {
  const { currentRole, students, attendanceData, teacherTags, activities, user, openModal, complaints, messages, getTeacherClassrooms, dailyLogs, hasAssignedClasses, getTeacherClassName } = useApp();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);

  if (currentRole === 'parent') {
    const email = user?.email || '';
    const myChildren = students.filter(s => s.parentEmail && s.parentEmail.toLowerCase() === email.toLowerCase());
    const hasChildren = myChildren.length > 0;
    const safeIdx = hasChildren ? Math.min(selectedChildIdx, myChildren.length - 1) : 0;
    const child = hasChildren ? myChildren[safeIdx] : null;

    const dateStr = new Date().toISOString().slice(0, 10);
    const rec = attendanceData[dateStr] || {};
    const todayStatus = child ? rec[child.id] : null;
    const childTags = child ? teacherTags[child.id] || [] : [];
    const childActivities = activities.filter(a => child && a.title?.toLowerCase().includes(child.name.toLowerCase()));
    const unread = messages.filter(m => m.unread).length;
    const openComplaintsList = complaints.filter(c => c.status === 'open' || c.status === 'pending').length;
    const childRank = child ? students.filter(s => (s.pts || 0) > (child.pts || 0)).length + 1 : null;

    const todayLog = child ? dailyLogs[child.id]?.[dateStr] || null : null;
    const ACTIVITY_META = [
      { key: 'ate', label: 'Eating', icon: UtensilsCrossed, color: '#4CAF96', refused: todayLog?.ateRefused },
      { key: 'nap', label: 'Sleeping', icon: Bed, color: '#7C5CBF' },
      { key: 'play', label: 'Playing', icon: LegoBrickIcon, color: '#6366f1' },
      { key: 'outdoor', label: 'Outdoor', icon: TreePine, color: '#22c55e' },
      { key: 'snack', label: 'Snack', icon: UtensilsCrossed, color: '#f59e0b', refused: todayLog?.snackRefused },
    ];
    const allActivities = ACTIVITY_META.map(a => ({
      ...a,
      done: todayLog?.[a.key] || false,
      details: todayLog?.[a.key + 'Details'] || '',
      time: todayLog?.[a.key + 'Time'] || '',
    }));

    const quickActions = [
      { label: 'Messages', icon: MessageSquare, color: 'var(--sky)', bg: 'var(--sky-pale)', onClick: () => onNavigate('messages'), badge: unread || null },
      { label: 'Attendance', icon: Calendar, color: 'var(--primary)', bg: 'var(--primary-pale)', onClick: () => onNavigate('attendanceReports') },
      { label: 'My Child', icon: Star, color: 'var(--gold)', bg: 'var(--gold-pale)', onClick: () => onNavigate('myChild') },
      { label: 'Ask AI', icon: Leaf, color: 'var(--primary-dark)', bg: 'var(--primary-pale)', onClick: () => openModal('aiChatbot') },
    ];

    return (
      <>
        {/* Parent Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #fce4ec 0%, #fef2f2 50%, #fff 100%)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 20,
          border: '1.5px solid rgba(244,67,54,0.2)',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--coral), #d32f2f)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, flexShrink: 0, boxShadow: '0 3px 10px rgba(244,67,54,0.3)',
          }}>
            {(user?.name || user?.email || 'PA').substring(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#4a1a1a' }}>Welcome back, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Parent'}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {hasChildren && ` · ${myChildren.length} child${myChildren.length > 1 ? 'ren' : ''}`}
            </div>
          </div>
        </div>

        {!hasChildren && (
          <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text3)' }}>No child linked to this account.</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginTop: 8, opacity: 0.7 }}>
              Contact the school to link your child.
            </div>
          </div>
        )}

        {hasChildren && myChildren.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {myChildren.map((c, i) => (
              <div key={c.id} onClick={() => setSelectedChildIdx(i)} style={{
                padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800,
                background: i === safeIdx ? 'var(--primary)' : 'var(--surface2)',
                color: i === safeIdx ? '#fff' : 'var(--text2)',
                border: i === safeIdx ? 'none' : '1.5px solid #e5e7eb',
                transition: 'all .15s',
              }}>{c.name}</div>
            ))}
          </div>
        )}

        {child && (
          <>
            {/* Child Hero Card */}
            <div className="card" style={{ marginBottom: 20, border: '1.5px solid var(--primary-light)', background: 'linear-gradient(135deg, var(--primary-pale) 60%, #fff 100%)' }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: child.bg || 'var(--primary)', color: child.col || '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
                  {child.init}
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{child.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>{child.class} · Age {child.age}</div>
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
              {childTags.length > 0 && (
                <div style={{ padding: '0 20px 12px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {childTags.slice(0, 4).map(t => <span key={t} style={{ padding: '2px 10px', borderRadius: 10, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700 }}>{t}</span>)}
                </div>
              )}
            </div>

            {/* Today's Activities */}
            {(() => {
              const done = allActivities.filter(a => a.done);
              if (done.length === 0) return null;
              return (
                <div style={{ marginBottom: 16, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg, var(--primary-pale), #fff)', border: '1.5px solid rgba(46,125,107,0.25)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={16} /> Today's Activities
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {done.map(a => {
                      const MIcon = a.icon;
                      return (
                        <div key={a.key} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                          borderRadius: 10, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          border: `1px solid ${a.color}40`,
                        }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: a.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MIcon size={15} style={{ color: a.color }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {a.label}
                              {a.refused && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>(Refused)</span>}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)' }}>{a.details || a.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Quick Actions */}
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
          </>
        )}

        <div className="dash-grid stagger-enter">
          <div>
            <StatsGrid />
            <ActivityFeed onNavigate={onNavigate} />
          </div>
          <div>
            {child && (
              <>
                {/* Today's Activity Timeline */}
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} style={{ color: 'var(--primary)' }} />
                      Today's Activities
                    </div>
                    <span className="card-action" onClick={() => onNavigate('myChild')}>Full Report</span>
                  </div>
                  <div className="card-body" style={{ padding: '12px 20px' }}>
                    {todayLog ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Mood + Rating */}
                        {(todayLog.mood || todayLog.overallRating > 0) && (
                          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                            {todayLog.mood && (
                              <div style={{ padding: '4px 10px', borderRadius: 8, background: (
                                todayLog.mood === 'happy' ? '#dcfce7' :
                                todayLog.mood === 'okay' ? '#fef3c7' :
                                todayLog.mood === 'tired' ? '#f3e8ff' :
                                todayLog.mood === 'sad' ? '#e0f2fe' : '#fce4ec'
                              ), fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                {todayLog.mood === 'happy' ? '😊' : todayLog.mood === 'okay' ? '😐' : todayLog.mood === 'tired' ? '😴' : todayLog.mood === 'sad' ? '😢' : '😣'}
                                {' '}Mood: {todayLog.mood.charAt(0).toUpperCase() + todayLog.mood.slice(1)}
                              </div>
                            )}
                            {todayLog.overallRating > 0 && (
                              <div style={{ padding: '4px 10px', borderRadius: 8, background: '#fef3c7', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star key={i} size={10} fill={i < todayLog.overallRating ? '#f59e0b' : 'none'} color={i < todayLog.overallRating ? '#f59e0b' : '#d4d4d4'} />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {/* Timeline items */}
                        <div style={{ position: 'relative', paddingLeft: 20 }}>
                          <div style={{ position: 'absolute', left: 8, top: 4, bottom: 4, width: 2, background: '#e5e7eb', borderRadius: 1 }} />
                          {allActivities.filter(a => a.done).map((a, i) => {
                            const MIcon = a.icon;
                            const isCurrentlyLive = isLive(a.time);
                            const ago = timeAgo(a.time);
                            return (
                              <div key={a.key} style={{ position: 'relative', padding: '6px 0 6px 12px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <div style={{
                                  position: 'absolute', left: -16, top: 10, width: 10, height: 10, borderRadius: '50%',
                                  background: isCurrentlyLive ? '#22c55e' : a.color,
                                  boxShadow: isCurrentlyLive ? '0 0 8px rgba(34,197,94,0.6)' : 'none',
                                  animation: isCurrentlyLive ? 'pulse 1.5s infinite' : 'none',
                                }} />
                                <div style={{
                                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                  background: a.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <MIcon size={14} style={{ color: a.color }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {a.label}
                                    {a.refused && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>(Refused)</span>}
                                    {isCurrentlyLive && <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#dcfce7' }}>LIVE</span>}
                                    {a.time && <span style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginLeft: 2 }}>🕐 {a.time}</span>}
                                    {ago && <span style={{ fontSize: 10, fontWeight: 600, color: isCurrentlyLive ? '#22c55e' : '#9ca3af' }}>({ago})</span>}
                                  </div>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {a.details && <span>{a.details}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {allActivities.filter(a => a.done).length === 0 && (
                          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text3)', padding: 16 }}>
                            No activities recorded yet today
                          </div>
                        )}
                        {/* Dev notes */}
                        {(todayLog?.learning || todayLog?.social || todayLog?.health) && (
                          <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                            {todayLog.learning && <div style={{ padding: '3px 8px', borderRadius: 6, background: '#f3e8ff', fontSize: 10, fontWeight: 600, color: '#7c3aed' }}>🧠 {todayLog.learning}</div>}
                            {todayLog.social && <div style={{ padding: '3px 8px', borderRadius: 6, background: '#e0f2fe', fontSize: 10, fontWeight: 600, color: '#0369a1' }}>👥 {todayLog.social}</div>}
                            {todayLog.health && <div style={{ padding: '3px 8px', borderRadius: 6, background: '#fce4ec', fontSize: 10, fontWeight: 600, color: '#c62828' }}>❤️ {todayLog.health}</div>}
                          </div>
                        )}
                        {todayLog?.note && (
                          <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#f7f6f3', borderLeft: '3px solid var(--primary)', fontSize: 11, fontWeight: 600, color: '#3a3a4a', lineHeight: 1.6 }}>
                            {todayLog.note}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text3)', padding: 20 }}>
                        No data yet — teacher will log activities throughout the day
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
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

  if (currentRole === 'teacher' && !hasAssignedClasses(user?.email)) {
    return (
      <div className="empty-state" style={{ padding: 60, textAlign: 'center' }}>
        <div className="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text3)', opacity: 0.3 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <p style={{ fontSize: 20, fontWeight: 900, marginTop: 20, color: 'var(--text)' }}>Welcome, {user?.name || 'Teacher'}!</p>
        <p style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 600, maxWidth: 420, margin: '10px auto 0', lineHeight: 1.6 }}>
          You must be assigned to a class by the admin to access this feature.
        </p>
      </div>
    );
  }

  const teacherStudents = currentRole === 'teacher'
    ? (() => { const a = getTeacherClassrooms(user?.email); return a.length > 0 ? students.filter(s => a.includes(s.class)) : []; })()
    : students;

  const teacherClassName = currentRole === 'teacher' ? getTeacherClassName(user?.email) : '';

  const userName = user?.name || user?.email?.split('@')[0] || (currentRole === 'teacher' ? 'Teacher' : 'Admin');
  const userInitials = userName.substring(0, 2).toUpperCase();
  const isAdmin = currentRole === 'admin';

  const heroStyle = isAdmin
    ? { bg: 'linear-gradient(135deg, #f0fdf4 0%, #f3faf7 50%, #fff 100%)', border: 'rgba(46,125,107,0.25)', avatarBg: 'linear-gradient(135deg, var(--primary), #1b5e20)', shadow: 'rgba(46,125,107,0.3)', textColor: '#1a3a2e' }
    : { bg: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #fff 100%)', border: 'rgba(74,140,196,0.25)', avatarBg: 'linear-gradient(135deg, var(--sky), #4a8cc4)', shadow: 'rgba(74,140,196,0.3)', textColor: '#1e3a5f' };

  return (
    <>
      {/* Hero Section */}
      <div style={{
        background: heroStyle.bg,
        borderRadius: 16, padding: '20px 24px', marginBottom: 20,
        border: `1.5px solid ${heroStyle.border}`,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: heroStyle.avatarBg,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, flexShrink: 0, boxShadow: `0 3px 10px ${heroStyle.shadow}`,
        }}>
          {userInitials}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: heroStyle.textColor }}>Welcome back, {userName.split(' ')[0]}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>
            {isAdmin ? (
              `Managing ${students.length} students`
            ) : (
              <>{teacherClassName || 'No class assigned yet'}{teacherStudents.length > 0 && ` · ${teacherStudents.length} students`}</>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" style={{
            background: 'var(--primary)', color: '#fff', fontWeight: 800, gap: 6,
            display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: 10,
            border: 'none', fontSize: 12, cursor: 'pointer',
          }}
            onClick={() => isAdmin ? onNavigate('students') : openModal('addBehaviour')}>
            {!isAdmin && <Activity size={14} />} {isAdmin ? 'Manage Students' : 'Log Behaviour'}
          </button>
          <button className="btn btn-sm" style={{
            background: '#fff', color: 'var(--primary)', fontWeight: 800, gap: 6,
            display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: 10,
            border: '1.5px solid var(--primary)', fontSize: 12, cursor: 'pointer',
          }}
            onClick={() => isAdmin ? openModal('manageUsers') : onNavigate('students')}>
            {isAdmin ? 'Accounts' : 'Manage Students'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsGrid />

      {/* Main Grid */}
      <div className="dash-grid stagger-enter">
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
