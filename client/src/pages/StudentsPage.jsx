import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Search, Tag, UserPlus, Activity, GraduationCap, School, Plus, Users } from 'lucide-react';
import StudentCard from '../components/Students/StudentCard';
import AttendanceBar from '../components/Students/AttendanceBar';

export default function StudentsPage() {
  const { students, attendanceData, openModal, setCurrentStudentFilter, currentRole, user, getTeacherClassrooms, selectedAttendanceDate, getAllClasses, hasAssignedClasses } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const dateStr = selectedAttendanceDate || new Date().toISOString().slice(0, 10);
  const rec = attendanceData[dateStr] || {};

  let visibleStudents = students;
  if (currentRole === 'teacher') {
    const assigned = getTeacherClassrooms(user?.email);
    if (assigned.length > 0) visibleStudents = students.filter(s => assigned.includes(s.class));
    else visibleStudents = [];
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

  const isFiltering = filter !== 'all' || !!search;

  const classrooms = useMemo(() => {
    const map = {};
    if (currentRole === 'admin') {
      getAllClasses().forEach(cls => { map[cls] = []; });
    }
    (currentRole === 'admin' ? visibleStudents : filtered).forEach(s => {
      const cls = s.class || 'Unassigned';
      if (!map[cls]) map[cls] = [];
      map[cls].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [currentRole, visibleStudents, filtered, getAllClasses]);

  if (currentRole === 'teacher' && !hasAssignedClasses(user?.email)) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text3)', opacity: 0.3 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <p>You must be assigned to a class by the admin to access this feature.</p>
      </div>
    );
  }

  const chips = [
    { key: 'all', label: 'All Students' },
    { key: 'excellent', label: 'Excellent' },
    { key: 'good', label: 'Fair' },
    { key: 'attention', label: 'Needs Attention' },
    { key: 'absent', label: 'Absent Today' },
  ];

  return (
    <>
      <div className="filter-row">
        {chips.map(c => (
          <div key={c.key} className={`filter-chip${filter === c.key ? ' active' : ''}`} onClick={() => setFilter(c.key)}>
            <span className="chip-lbl">{c.label}</span><span className="chip-lbl-short">{c.label.split(' ')[0]}</span>
          </div>
        ))}
      </div>
      <div className="filter-actions" style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        {(currentRole === 'teacher' || currentRole === 'admin') && (
          <button className="btn btn-sm" style={{ background: 'var(--primary-pale)', color: 'var(--primary)', border: '1.5px solid var(--primary)', fontWeight: 800, fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}
            onClick={() => openModal('teacherTag')}>
            <Tag size={14} /> <span className="btn-txt">Tag</span>
          </button>
        )}
        {(currentRole === 'teacher' || currentRole === 'admin') && (
          <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #16a34a', fontWeight: 800, fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}
            onClick={() => openModal('addBehaviour')}>
            <Activity size={14} /> <span className="btn-txt">Log Behaviour</span>
          </button>
        )}
        {currentRole === 'admin' && (
          <>
            <button className="btn btn-sm" style={{ background: 'var(--coral-pale)', color: 'var(--coral)', border: '1.5px solid var(--coral)', fontWeight: 800, fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}
              onClick={() => openModal('linkParent')}>
              <UserPlus size={14} /> <span className="btn-txt">Link Parent</span>
            </button>
            <button className="btn btn-sm" style={{ background: 'var(--lavender-pale)', color: 'var(--lavender)', border: '1.5px solid var(--lavender)', fontWeight: 800, fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}
              onClick={() => openModal('assignClass')}>
              <GraduationCap size={14} /> <span className="btn-txt">Assign Classes</span>
            </button>
            <button className="btn btn-sm" style={{ background: 'var(--primary-pale)', color: 'var(--primary)', border: '1.5px solid var(--primary)', fontWeight: 800, fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}
              onClick={() => openModal('manageClasses')}>
              <Plus size={14} /> <span className="btn-txt">Manage Classes</span>
            </button>
            <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #16a34a', fontWeight: 800, fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}
              onClick={() => openModal('manageUsers')}>
              <Users size={14} /> <span className="btn-txt">Accounts</span>
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {classrooms.map(([cls, students]) => {
            const classFiltered = filtered.filter(s => (s.class || 'Unassigned') === cls);
            if (classFiltered.length === 0 && isFiltering) return null;
            return (
              <div key={cls}>
                <div className="sc-class-hdr">
                  <div className="sc-icon" style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', border: '1px solid #c4b5fd' }}>
                    <School size={15} style={{ color: '#7c3aed' }} />
                  </div>
                  <span className="sc-title">{cls}</span>
                  <span className="sc-count">{students.length} student{students.length !== 1 ? 's' : ''}</span>
                </div>
                {classFiltered.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600, background: 'var(--surface2)', borderRadius: 10 }}>
                    No students in this class yet.
                  </div>
                ) : (
                  <div className="student-grid stagger-enter">
                    {classFiltered.map(s => (
                      <div key={s.id} onClick={() => { setCurrentStudentFilter(s.id); openModal('studentDetail'); }} style={{ cursor: 'pointer', height: '100%' }}>
                        <StudentCard student={s} attendanceStatus={rec[s.id] || null} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
