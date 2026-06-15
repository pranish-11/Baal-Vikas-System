import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Tag, X } from 'lucide-react';

const PRESET_TAGS = [
  'Improve reading', 'Needs support', 'Independent work', 'Active participation',
  'Excellent focus', 'Helps others', 'Math confidence', 'Writing progress',
  'Shy in group', 'Follows directions', 'Creative thinker', 'Leadership shown',
];

export default function TeacherTagModal({ open, onClose }) {
  const { students, teacherTags, addTeacherTag, removeTeacherTag, currentRole, user, getTeacherClassrooms } = useApp();

  const visibleStudents = currentRole === 'teacher'
    ? (() => { const a = getTeacherClassrooms(user?.email); return a ? students.filter(s => a.includes(s.class)) : students; })()
    : students;

  const [selectedStudent, setSelectedStudent] = useState(visibleStudents[0]?.id || '');
  const [customTag, setCustomTag] = useState('');

  if (!open) return null;

  const currentTags = teacherTags[selectedStudent] || [];

  const handleAddTag = (tag) => {
    addTeacherTag(selectedStudent, tag);
  };

  const handleRemoveTag = (tag) => {
    removeTeacherTag(selectedStudent, tag);
  };

  const handleAddCustom = () => {
    if (!customTag.trim()) return;
    handleAddTag(customTag.trim());
    setCustomTag('');
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-title" style={{ marginBottom: 14 }}>Tag Student</div>
        <div className="form-group">
          <label className="form-label">Student</label>
          <select className="form-select-m" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
            {visibleStudents.map(s => <option key={s.id} value={s.id}>{s.name} — {s.class}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="form-label" style={{ marginBottom: 8 }}>Current Tags</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {currentTags.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>No tags yet</span>
            ) : currentTags.map(tag => (
              <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'var(--primary-pale)', color: 'var(--primary)', fontSize: 12, fontWeight: 700 }}>
                <Tag size={12} /> {tag}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(tag)} />
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="form-label" style={{ marginBottom: 8 }}>Quick Tags</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRESET_TAGS.filter(t => !currentTags.includes(t)).map(tag => (
              <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'var(--surface2)', color: 'var(--text2)', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid var(--border)' }}
                onClick={() => handleAddTag(tag)}>
                + {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Custom Tag</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="form-input" style={{ flex: 1 }} value={customTag} onChange={e => setCustomTag(e.target.value)} placeholder="Type a custom tag..." onKeyDown={e => { if (e.key === 'Enter') handleAddCustom(); }} />
            <button className="btn btn-primary btn-sm" onClick={handleAddCustom}>Add</button>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
