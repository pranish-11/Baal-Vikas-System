import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { School } from 'lucide-react';
import Podium from '../components/Leaderboard/Podium';
import LeaderboardRow from '../components/Leaderboard/LeaderboardRow';

export default function LeaderboardPage() {
  const { students, currentLBFilter, setCurrentLBFilter, getScaledLeaderboard, currentRole, user, getTeacherClassrooms, hasAssignedClasses } = useApp();
  const [classFilter, setClassFilter] = useState('all');

  let visibleStudents = students;
  if (currentRole === 'teacher') {
    const assigned = getTeacherClassrooms(user?.email);
    if (assigned.length > 0) visibleStudents = students.filter(s => assigned.includes(s.class));
    else visibleStudents = [];
  }

  const allClasses = useMemo(() => {
    const set = new Set(visibleStudents.map(s => s.class).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [visibleStudents]);

  const filtered = classFilter === 'all' ? visibleStudents : visibleStudents.filter(s => s.class === classFilter);

  const lbList = getScaledLeaderboard(currentLBFilter).filter(s => filtered.find(f => f.id === s.id));
  const maxPts = lbList[0]?.pts || 1;

  const chips = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  const showClassFilter = currentRole === 'admin' || (currentRole === 'teacher' && allClasses.length > 2);

  if (currentRole === 'teacher' && !hasAssignedClasses(user?.email)) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text3)', opacity: 0.3 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <p>You must be assigned to a class by the admin to access this feature.</p>
      </div>
    );
  }

  return (
    <>
      <div className="filter-row" style={{ marginBottom: 16 }}>
        {chips.map(c => (
          <div key={c.key} className={`filter-chip${currentLBFilter === c.key ? ' active' : ''}`} onClick={() => setCurrentLBFilter(c.key)}>
            {c.label}
          </div>
        ))}
        {showClassFilter && allClasses.filter(c => c !== 'all').map(cls => (
          <div key={cls} className={`filter-chip${classFilter === cls ? ' active' : ''}`} onClick={() => setClassFilter(cls)}>
            <School size={12} style={{ marginRight: 3 }} /> {cls.includes('—') ? cls.split('—')[1]?.trim() || cls : cls}
          </div>
        ))}
        {showClassFilter && allClasses.length > 2 && (
          <div className={`filter-chip${classFilter === 'all' ? ' active' : ''}`} onClick={() => setClassFilter('all')}>
            All Classes
          </div>
        )}
      </div>
      <div className="card mb-16">
        <Podium list={lbList} />
        <div>
          {lbList.map(s => (
            <LeaderboardRow key={s.id} student={s} maxPts={maxPts} />
          ))}
        </div>
      </div>
    </>
  );
}
