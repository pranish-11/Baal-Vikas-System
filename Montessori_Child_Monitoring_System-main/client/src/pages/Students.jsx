import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from '../api/axios.js';
import StudentCard from '../components/StudentCard.jsx';

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

  useEffect(() => {
    axios.get('/api/students').then((r) => setStudents(r.data));
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
      <div className="form-group">
        <input
          className="form-input"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="student-grid">
        {filtered.map((s) => (
          <StudentCard
            key={s._id}
            student={s}
            onClick={() => openAwardModal?.(s._id)}
          />
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-hint">No students match your filters.</div>
      ) : null}
    </div>
  );
}
