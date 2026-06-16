import { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Tag, X, Search } from 'lucide-react';

const PRESET_TAGS = [
  'Improve reading', 'Needs support', 'Independent work', 'Active participation',
  'Excellent focus', 'Helps others', 'Math confidence', 'Writing progress',
  'Shy in group', 'Follows directions', 'Creative thinker', 'Leadership shown',
];

export default function TeacherTagModal({ open, onClose, data }) {
  const { students, teacherTags, addTeacherTag, removeTeacherTag, currentRole, user, getTeacherClassrooms } = useApp();

  const visibleStudents = currentRole === 'teacher'
    ? (() => { const a = getTeacherClassrooms(user?.email); return a ? students.filter(s => a.includes(s.class)) : students; })()
    : students;

  const initialId = data?.studentId && visibleStudents.find(s => s.id === data.studentId) ? data.studentId : visibleStudents[0]?.id || '';
  const [selectedStudent, setSelectedStudent] = useState(initialId);
  const [customTag, setCustomTag] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const selected = visibleStudents.find(s => s.id === selectedStudent);
  const filtered = useMemo(() => {
    if (!searchQ) return visibleStudents;
    const q = searchQ.toLowerCase();
    return visibleStudents.filter(s => s.name.toLowerCase().includes(q) || (s.class || '').toLowerCase().includes(q));
  }, [searchQ, visibleStudents]);

  const pickerHeight = Math.min(filtered.length, 6) * 40 + 8;

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-title" style={{ marginBottom: 14 }}>Tag Student</div>
        <div className="form-group">
          <label className="form-label">Student</label>
          <div style={{ position: 'relative' }}>
            <div onClick={() => { setPickerOpen(!pickerOpen); setSearchQ(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'var(--surface2)', border: '1.5px solid var(--border)', cursor: 'pointer', transition: 'border-color .15s' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: selected?.bg || '#e8f5e9', color: selected?.col || '#2E7D6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                {selected?.init || '??'}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{selected?.name || 'Select student'}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{selected?.class || ''}</div>
              </div>
              <span style={{ fontSize: 10, color: '#aaa', transition: 'transform .2s', transform: pickerOpen ? 'rotate(180deg)' : '' }}>▼</span>
            </div>
            {pickerOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4, background: '#fff', borderRadius: 10, border: '1.5px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                  <Search size={13} style={{ color: '#aaa', flexShrink: 0 }} />
                  <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search student..."
                    style={{ border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, background: 'transparent', width: '100%' }} />
                </div>
                <div style={{ maxHeight: pickerHeight, overflowY: 'auto', padding: 4 }}>
                  {filtered.length === 0 ? (
                    <div style={{ padding: '12px 10px', fontSize: 12, color: 'var(--text3)', fontWeight: 600, textAlign: 'center' }}>No students found</div>
                  ) : filtered.map(s => (
                    <div key={s.id} onClick={() => { setSelectedStudent(s.id); setPickerOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', background: s.id === selectedStudent ? 'var(--primary-pale)' : 'transparent', transition: 'background .1s' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: s.bg || '#e8f5e9', color: s.col || '#2E7D6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                        {s.init || '??'}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{s.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{s.class || ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
