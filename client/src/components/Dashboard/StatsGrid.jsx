import { useApp } from '../../contexts/AppContext';
import { MessageSquare, AlertTriangle, Star, Calendar, TrendingUp, CircleCheckBig, Timer, XCircle, CalendarOff } from 'lucide-react';

export default function StatsGrid() {
  const { currentRole, students, complaints, messages, attendanceData, user, getTeacherClassrooms, navTo } = useApp();

  let visibleStudents = students;
  if (currentRole === 'teacher') {
    const assigned = getTeacherClassrooms(user?.email);
    if (assigned) visibleStudents = students.filter(s => assigned.includes(s.class));
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const rec = attendanceData[dateStr] || {};
  const presentCount = visibleStudents.filter(s => rec[s.id] === 'present').length;
  const lateCount = visibleStudents.filter(s => rec[s.id] === 'late').length;
  const absentCount = visibleStudents.filter(s => rec[s.id] === 'absent').length;
  const leaveCount = visibleStudents.filter(s => rec[s.id] === 'leave').length;
  const totalStudents = visibleStudents.length;
  const attendancePct = totalStudents ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0;

  const excellent = visibleStudents.filter(s => s.pct >= 80).length;
  const fair = visibleStudents.filter(s => s.pct >= 50 && s.pct < 80).length;
  const attention = visibleStudents.filter(s => s.pct < 50).length;
  const openComplaints = complaints.filter(c => c.status === 'open' || c.status === 'in-progress' || c.status === 'escalated').length;
  const unreadMessages = messages.filter(m => m.unread).length;

  const parentChild = currentRole === 'parent' ? (() => { const email = user?.email || ''; return students.find(s => s.parentEmail && s.parentEmail.toLowerCase() === email.toLowerCase()) || null; })() : null;

  if (currentRole === 'admin' || currentRole === 'teacher') {
    return (
      <div className="stats-grid">
        {/* Attendance Card */}
        <div className="stat-card" style={{ cursor: 'pointer', gridColumn: 'span 2' }} onClick={() => navTo('students')}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
              <svg width="68" height="68" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--surface2)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray={`${attendancePct * 0.97} 97`} strokeLinecap="round" transform="rotate(-90 18 18)" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: 'var(--primary)' }}>{attendancePct}%</div>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Today's Attendance</div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}><CircleCheckBig size={13} /> {presentCount} Present</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#eab308' }}><Timer size={13} /> {lateCount} Late</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#e11d48' }}><XCircle size={13} /> {absentCount} Absent</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#3b82f6' }}><CalendarOff size={12} /> {leaveCount} Leave</div>
              </div>
              <div style={{ marginTop: 6, height: 6, borderRadius: 3, background: 'var(--surface2)', display: 'flex', overflow: 'hidden', gap: 2, padding: 1 }}>
                {presentCount > 0 && <div style={{ flex: presentCount, background: 'var(--primary)', borderRadius: 2 }} />}
                {lateCount > 0 && <div style={{ flex: lateCount, background: '#eab308', borderRadius: 2 }} />}
                {absentCount > 0 && <div style={{ flex: absentCount, background: '#e11d48', borderRadius: 2 }} />}
                {leaveCount > 0 && <div style={{ flex: leaveCount, background: '#3b82f6', borderRadius: 2 }} />}
              </div>
            </div>
          </div>
        </div>

        {/* Behavior Card */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navTo('students')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{excellent}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Excellent</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, padding: '6px 8px', borderRadius: 6, background: '#fefce8', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#a16207' }}>{fair}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#a16207' }}>Fair</div>
            </div>
            <div style={{ flex: 1, padding: '6px 8px', borderRadius: 6, background: '#fff1f2', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#be123c' }}>{attention}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#be123c' }}>Attention</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navTo('messages')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--sky-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={16} style={{ color: 'var(--sky)' }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{unreadMessages}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Unread{unreadMessages === 1 ? '' : 's'}</div>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{messages.length} total conversations</div>
        </div>

        {/* Total Points */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navTo('leaderboard')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={16} style={{ color: 'var(--gold)' }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{visibleStudents.reduce((s, x) => s + (x.pts || 0), 0)}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Total Points</div>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{totalStudents} students</div>
        </div>

        {/* Open Complaints */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navTo('complaints')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--coral-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} style={{ color: 'var(--coral)' }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{openComplaints}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Open Complaints</div>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{openComplaints > 0 ? 'Needs response' : 'All handled'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-grid">
      {/* Parent: Behavior Score */}
      <div className="stat-card" style={{ cursor: 'pointer', gridColumn: 'span 2' }} onClick={() => navTo('myChild')}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
            <svg width="68" height="68" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--surface2)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray={`${(parentChild?.pct || 0) * 0.97} 97`} strokeLinecap="round" transform="rotate(-90 18 18)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: 'var(--primary)' }}>{parentChild?.pct || 0}%</div>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Behavior Score</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{parentChild?.name || 'Your Child'}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>{parentChild?.class || ''} · {parentChild?.pts || 0} pts</div>
          </div>
        </div>
      </div>

      {/* Attendance */}
      <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navTo('attendanceReports')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={16} style={{ color: 'var(--gold)' }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{(() => { const s = parentChild ? (rec[parentChild.id] || null) : null; return s === 'present' ? 'Present' : s === 'late' ? 'Late' : s === 'absent' ? 'Absent' : s === 'leave' ? 'Leave' : '—'; })()}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Today's Attendance</div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{parentChild?.class || 'Not assigned'}</div>
      </div>

      {/* Messages */}
      <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navTo('messages')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--sky-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={16} style={{ color: 'var(--sky)' }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{unreadMessages}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Unread{unreadMessages === 1 ? '' : 's'}</div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{unreadMessages > 0 ? 'Reply today' : 'All read'}</div>
      </div>

      {/* Complaints */}
      <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navTo('complaints')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--coral-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={16} style={{ color: 'var(--coral)' }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{openComplaints}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Open Complaints</div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{openComplaints > 0 ? 'Pending' : 'All resolved'}</div>
      </div>
    </div>
  );
}