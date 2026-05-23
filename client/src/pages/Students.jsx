import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from '../api/axios.js';
import StudentCard from '../components/StudentCard.jsx';
import Modal from '../components/Modal.jsx';

function tierFilter(bp, chip) {
  if (chip === 'all') return true;
  if (chip === 'excellent') return bp >= 70;
  if (chip === 'good') return bp >= 45 && bp < 70;
  return bp < 45;
}

export default function Students() {
  const { openAwardModal, studentsRefreshKey } = useOutletContext() || {};
  const [students, setStudents] = useState([]);
  const [chip, setChip] = useState('all');
  const [search, setSearch] = useState('');

  const [manageOpen, setManageOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [parentEmail, setParentEmail] = useState('');
  const [parentName, setParentName] = useState('');

  const loadStudents = () => {
    axios.get('/api/students').then((r) => setStudents(r.data));
  };

  useEffect(() => {
    loadStudents();
  }, [studentsRefreshKey]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return students.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      const bp = s.behaviorPercent ?? 0;
      if (!tierFilter(bp, chip)) return false;
      if (q && !name.includes(q)) return false;
      return true;
    });
  }, [students, chip, search]);

  const grouped = useMemo(() => {
    const map = {};
    for (const s of filtered) {
      const cr = s.classroom || 'Unassigned';
      if (!map[cr]) map[cr] = [];
      map[cr].push(s);
    }
    return map;
  }, [filtered]);

  const onCardClick = (student, action) => {
    if (action === 'manage') {
      setActiveStudent(student);
      setParentEmail('');
      setParentName('');
      setManageOpen(true);
    } else {
      openAwardModal?.(student._id);
    }
  };

  const handleAssignParent = async () => {
    if (!parentEmail) return;
    try {
      await axios.post(`/api/students/${activeStudent._id}/assign-parent`, {
        parentEmail,
        parentName,
      });
      alert('Parent assigned successfully!');
      loadStudents();
      setManageOpen(false);
    } catch (err) {
      alert('Failed to assign parent: ' + err.response?.data?.message);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${activeStudent.firstName}?`)) return;
    try {
      await axios.delete(`/api/students/${activeStudent._id}`);
      loadStudents();
      setManageOpen(false);
    } catch (err) {
      alert('Failed to remove student');
    }
  };

  const handleEdit = async () => {
    try {
      await axios.put(`/api/students/${activeStudent._id}`, {
        firstName: activeStudent.firstName,
        lastName: activeStudent.lastName,
        classroom: activeStudent.classroom,
      });
      alert('Student updated successfully!');
      loadStudents();
    } catch (err) {
      alert('Failed to update student');
    }
  };

  return (
    <div className="page-padding">
      <div className="filter-chips">
        {['all', 'excellent', 'good', 'attention'].map((c) => (
          <button
            key={c}
            type="button"
            className={`chip${chip === c ? ' active' : ''}`}
            onClick={() => setChip(c)}
          >
            {c === 'all'
              ? 'All'
              : c === 'excellent'
                ? 'Excellent (≥70%)'
                : c === 'good'
                  ? 'Good (45–69%)'
                  : 'Needs Attention (<45%)'}
          </button>
        ))}
      </div>
      <div className="form-group search-group">
        <span className="search-icon" aria-hidden="true">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </span>
        <input
          className="form-input search-input"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([classroom, list]) => (
        <div key={classroom} style={{ marginBottom: '2rem' }}>
          <h2 className="title-font section-title" style={{ marginBottom: '1rem' }}>{classroom} <span style={{ fontSize: '1rem', color: 'var(--text3)' }}>({list.length})</span></h2>
          <div className="student-grid">
            {list.map((s) => (
              <StudentCard
                key={s._id}
                student={s}
                onClick={onCardClick}
              />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 ? (
        <div className="empty-hint">No students match your filters.</div>
      ) : null}

      <Modal
        open={manageOpen}
        title={`Manage ${activeStudent?.firstName} ${activeStudent?.lastName}`}
        onClose={() => setManageOpen(false)}
      >
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 className="title-font" style={{ marginBottom: '1rem' }}>Edit Details</h3>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              className="form-input"
              value={activeStudent?.firstName || ''}
              onChange={(e) => setActiveStudent({ ...activeStudent, firstName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              className="form-input"
              value={activeStudent?.lastName || ''}
              onChange={(e) => setActiveStudent({ ...activeStudent, lastName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Classroom</label>
            <input
              className="form-input"
              value={activeStudent?.classroom || ''}
              onChange={(e) => setActiveStudent({ ...activeStudent, classroom: e.target.value })}
            />
          </div>
          <button type="button" className="btn-secondary btn-sm" onClick={handleEdit}>
            Save Changes
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 className="title-font" style={{ marginBottom: '1rem' }}>Assign Parent</h3>
          {activeStudent?.parentId ? (
            <div className="empty-hint" style={{ padding: '1rem', background: 'var(--surface2)', borderRadius: 'var(--radius)' }}>
              Parent already assigned.
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Parent Email (Required)</label>
                <input
                  type="email"
                  className="form-input"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Parent Name (Optional)</label>
                <input
                  className="form-input"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <button type="button" className="btn-primary btn-sm" onClick={handleAssignParent}>
                Assign Parent
              </button>
            </>
          )}
        </div>
        <div>
          <h3 className="title-font" style={{ marginBottom: '1rem', color: 'var(--coral)' }}>Danger Zone</h3>
          <button type="button" className="btn-coral btn-sm" onClick={handleRemove}>
            Remove Student
          </button>
        </div>
      </Modal>
    </div>
  );
}
