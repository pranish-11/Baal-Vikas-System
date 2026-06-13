import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { School } from 'lucide-react';
import Podium from '../components/Leaderboard/Podium';
import LeaderboardRow from '../components/Leaderboard/LeaderboardRow';

export default function LeaderboardPage() {
  const { students, currentLBFilter, setCurrentLBFilter, getScaledLeaderboard, currentRole, user, getTeacherClassrooms } = useApp();
  const [classFilter, setClassFilter] = useState('all');

  let visibleStudents = students;
  if (currentRole === 'teacher') {
    const assigned = getTeacherClassrooms(user?.email);
    if (assigned) visibleStudents = students.filter(s => assigned.includes(s.class));
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
