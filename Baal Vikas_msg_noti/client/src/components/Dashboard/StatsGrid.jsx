import { useApp } from '../../contexts/AppContext';
import { Users, BookOpen, MessageSquare, AlertTriangle, Star, ClipboardList, Calendar } from 'lucide-react';

const ICON_MAP = {
  user: Users,
  book: BookOpen,
  message: MessageSquare,
  alert: AlertTriangle,
  star: Star,
  clip: ClipboardList,
  calendar: Calendar,
};

export default function StatsGrid() {
  const { currentRole, students, complaints, messages, fees, attendanceData, user, getTeacherClassrooms, navTo } = useApp();

  // Filter students by teacher's assigned classrooms
  let visibleStudents = students;
  if (currentRole === 'teacher') {
    const assigned = getTeacherClassrooms(user?.email);
    if (assigned) visibleStudents = students.filter(s => assigned.includes(s.class));
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const rec = attendanceData[dateStr] || {};
  const presentCount = visibleStudents.filter(s => rec[s.id] === 'present' || rec[s.id] === 'late').length;
  const totalStudents = visibleStudents.length;
  const attendancePct = totalStudents ? Math.round((presentCount / totalStudents) * 100) : 0;
  const openComplaints = complaints.filter(c => c.status === 'open' || c.status === 'in-progress' || c.status === 'escalated').length;
  const unreadMessages = messages.filter(m => m.unread).length;
  const overdueFees = fees.filter(f => f.status === 'overdue').length;

  const NAV_MAP = { 'Present Today': 'students', 'Total Students': 'students', 'Unread Messages': 'messages', 'Overdue Fees': 'fees', 'Total Points': 'leaderboard', 'Open Complaints': 'complaints', 'Behavior Score': 'myChild', 'Attendance': 'myChild' };

  const roleStats = {
    admin: [
      { icon: 'user', bg: 'var(--primary-pale)', val: presentCount || totalStudents, label: 'Present Today', tag: totalStudents ? `${attendancePct}% of ${totalStudents} enrolled` : 'No students', tagClass: 'tag-green' },
      { icon: 'book', bg: 'var(--sky-pale)', val: totalStudents, label: 'Total Students', tag: `${new Set(students.map(s => s.class)).size} classrooms`, tagClass: 'tag-blue' },
      { icon: 'message', bg: 'var(--gold-pale)', val: unreadMessages, label: 'Unread Messages', tag: messages.length ? `${messages.length} total conversations` : 'No messages', tagClass: 'tag-gold' },
      { icon: 'alert', bg: 'var(--coral-pale)', val: overdueFees, label: 'Overdue Fees', tag: overdueFees > 0 ? `${overdueFees} overdue` : 'All paid', tagClass: 'tag-red' },
    ],
    teacher: [
      { icon: 'user', bg: 'var(--primary-pale)', val: presentCount || totalStudents, label: 'Present Today', tag: totalStudents ? `${attendancePct}% attendance` : 'No students', tagClass: 'tag-green' },
      { icon: 'star', bg: 'var(--gold-pale)', val: visibleStudents.reduce((s, x) => s + (x.pts || 0), 0), label: 'Total Points', tag: `${totalStudents} students`, tagClass: 'tag-gold' },
      { icon: 'message', bg: 'var(--sky-pale)', val: unreadMessages, label: 'Unread Messages', tag: messages.length ? `${messages.length} conversations` : 'No messages', tagClass: 'tag-blue' },
      { icon: 'clip', bg: 'var(--coral-pale)', val: openComplaints, label: 'Open Complaints', tag: openComplaints > 0 ? 'Needs response' : 'All handled', tagClass: 'tag-orange' },
    ],
    parent: [
      { icon: 'star', bg: 'var(--primary-pale)', val: students[0]?.pct || 0, label: 'Behavior Score', tag: `${students[0]?.pts || 0} pts total`, tagClass: 'tag-green' },
      { icon: 'calendar', bg: 'var(--gold-pale)', val: `${students[0]?.pct || 0}%`, label: 'Attendance', tag: students[0]?.class || 'Not assigned', tagClass: 'tag-gold' },
      { icon: 'message', bg: 'var(--sky-pale)', val: unreadMessages, label: 'Unread Messages', tag: unreadMessages > 0 ? 'Reply today' : 'All read', tagClass: 'tag-blue' },
      { icon: 'clip', bg: 'var(--coral-pale)', val: openComplaints, label: 'Open Complaints', tag: openComplaints > 0 ? 'Pending' : 'All resolved', tagClass: 'tag-orange' },
    ],
  };

  const stats = roleStats[currentRole] || roleStats.admin;

  return (
    <div className="stats-grid">
      {stats.map((s, i) => {
        const Icon = ICON_MAP[s.icon];
        return (
          <div key={i} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => { const p = NAV_MAP[s.label]; if (p) navTo(p); }}>
            <div className="stat-icon" style={{ background: s.bg }}>
              {Icon && <Icon size={18} />}
            </div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
            <span className={`stat-tag ${s.tagClass}`}>{s.tag}</span>
          </div>
        );
      })}
    </div>
  );
}
