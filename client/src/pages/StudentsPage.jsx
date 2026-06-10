import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Search, Tag, UserPlus, Activity, GraduationCap, School, Plus, Users } from 'lucide-react';
import StudentCard from '../components/Students/StudentCard';
import AttendanceBar from '../components/Students/AttendanceBar';

export default function StudentsPage() {
  const { students, attendanceData, openModal, setCurrentStudentFilter, currentRole, user, getTeacherClassrooms } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const dateStr = new Date().toISOString().slice(0, 10);
  const rec = attendanceData[dateStr] || {};

  let visibleStudents = students;
  if (currentRole === 'teacher') {
    const assigned = getTeacherClassrooms(user?.email);
    if (assigned) visibleStudents = students.filter(s => assigned.includes(s.class));
  }

  let filtered = visibleStudents;
  if (filter === 'excellent') filtered = filtered.filter(s => s.pct >= 80);
  else if (filter === 'good') filtered = filtered.filter(s => s.pct >= 50 && s.pct < 80);
  else if (filter === 'attention') filtered = filtered.filter(s => s.pct < 50);
  else if (filter === 'absent') filtered = filtered.filter(s => rec[s.id] === 'absent');

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.class.toLowerCase().includes(q));
  }

  const classrooms = useMemo(() => {
    const map = {};
    (currentRole === 'admin' ? visibleStudents : filtered).forEach(s => {
      const cls = s.class || 'Unassigned';
      if (!map[cls]) map[cls] = [];
      map[cls].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [currentRole, visibleStudents, filtered]);

  const chips = [
    { key: 'all', label: 'All Students' },
    { key: 'excellent', label: 'Excellent' },
    { key: 'good', label: 'Good' },
    { key: 'attention', label: 'Needs Attention' },
    { key: 'absent', label: 'Absent Today' },
  ];

  return (
    <>
      <div className="filter-row">
        {chips.map(c => (
          <div key={c.key} className={`filter-chip${filter === c.key ? ' active' : ''}`} onClick={() => setFilter(c.key)}>
            {c.label}
          </div>
        ))}
        {(currentRole === 'teacher' || currentRole === 'admin') && (
          <button className="btn btn-sm" style={{ background: 'var(--primary-pale)', color: 'var(--primary)', border: '1.5px solid var(--primary)', fontWeight: 800, fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}
            onClick={() => openModal('teacherTag')}>
            <Tag size={14} /> Tag
          </button>
        )}
        {(currentRole === 'teacher' || currentRole === 'admin') && (
          <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #16a34a', fontWeight: 800, fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}
            onClick={() => openModal('addBehaviour')}>
            <Activity size={14} /> Log Behaviour
          </button>
        )}
        {currentRole === 'admin' && (
          <>
            <button className="btn btn-sm" style={{ background: 'var(--coral-pale)', color: 'var(--coral)', border: '1.5px solid var(--coral)', fontWeight: 800, fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}
              onClick={() => openModal('linkParent')}>
              <UserPlus size={14} /> Link Parent
            </button>
            <button className="btn btn-sm" style={{ background: 'var(--lavender-pale)', color: 'var(--lavender)', border: '1.5px solid var(--lavender)', fontWeight: 800, fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}
              onClick={() => openModal('assignClass')}>
              <GraduationCap size={14} /> Assign Classes
            </button>
            <button className="btn btn-sm" style={{ background: 'var(--primary-pale)', color: 'var(--primary)', border: '1.5px solid var(--primary)', fontWeight: 800, fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}
              onClick={() => openModal('manageClasses')}>
              <Plus size={14} /> Manage Classes
            </button>
            <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #16a34a', fontWeight: 800, fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}
              onClick={() => openModal('manageUsers')}>
              <Users size={14} /> Accounts
            </button>
          </>
        )}
        <div style={{ position: 'relative', maxWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
          <input className="msg-search" style={{ paddingLeft: 30, width: '100%' }} placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <AttendanceBar visibleStudents={visibleStudents} />
      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14, fontWeight: 600 }}>
          No students match this filter.
        </div>
      ) : currentRole === 'admin' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {classrooms.map(([cls, students]) => {
            const classFiltered = filtered.filter(s => (s.class || 'Unassigned') === cls);
            if (classFiltered.length === 0) return null;
            return (
              <div key={cls}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c4b5fd' }}>
                    <School size={17} style={{ color: '#7c3aed' }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{cls}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{students.length} student{students.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="student-grid">
                  {classFiltered.map(s => (
                    <div key={s.id} onClick={() => { setCurrentStudentFilter(s.id); openModal('studentDetail'); }} style={{ cursor: 'pointer' }}>
                      <StudentCard student={s} attendanceStatus={rec[s.id] || null} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="student-grid">
          {filtered.map(s => (
            <div key={s.id} onClick={() => { setCurrentStudentFilter(s.id); openModal('studentDetail'); }} style={{ cursor: 'pointer' }}>
              <StudentCard student={s} attendanceStatus={rec[s.id] || null} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
