import { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { UserPlus, Check, Search } from 'lucide-react';

export default function LinkParentModal({ open, onClose }) {
  const { students, submitEditStudent } = useApp();
  const [selStudent, setSelStudent] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  const parentList = useMemo(() => {
    const map = {};
    try {
      const profiles = JSON.parse(localStorage.getItem('axion_saved_profiles')) || [];
      profiles.forEach(p => {
        if (p.role === 'parent' && p.email) {
          map[p.email.toLowerCase()] = { name: p.name || p.email, email: p.email, fromSaved: true };
        }
      });
    } catch {}
    students.forEach(s => {
      if (s.parentEmail) {
        const key = s.parentEmail.toLowerCase();
        if (!map[key]) {
          map[key] = { name: s.parentName || s.parentEmail, email: s.parentEmail, fromSaved: false };
        } else if (s.parentName && !map[key].name) {
          map[key].name = s.parentName;
        }
      }
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const filteredStudents = studentSearch
    ? students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.class.toLowerCase().includes(studentSearch.toLowerCase()))
    : students;

  const filteredParents = parentSearch
    ? parentList.filter(p => p.name.toLowerCase().includes(parentSearch.toLowerCase()) || p.email.toLowerCase().includes(parentSearch.toLowerCase()))
    : parentList;

  if (!open) return null;

  const student = students.find(s => s.id === selStudent);

  const linkParent = (name, email) => {
    if (!selStudent || !email) return;
    const s = students.find(x => x.id === selStudent);
    if (!s) return;
    const parts = s.name.split(' ');
    submitEditStudent(selStudent, {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      age: s.age,
      className: s.class,
      parentName: name || '',
      parentEmail: email,
      medicalNotes: s.medicalNotes || '',
    });
  };

  const handleManualLink = () => {
    if (!manualEmail) return;
    linkParent(manualName, manualEmail);
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 540 }}>
        <div className="modal-title" style={{ marginBottom: 14 }}>Link Parent to Student</div>

        <label className="form-label-m" style={{ marginBottom: 8 }}>Select a student</label>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
          <input className="msg-search" style={{ paddingLeft: 30 }} placeholder="Search students..." value={studentSearch} onChange={e => { setSelStudent(''); setStudentSearch(e.target.value); }} />
        </div>
        <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
          {filteredStudents.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>No students match your search.</div>
          ) : filteredStudents.map(s => {
            const selected = selStudent === s.id;
            return (
              <div key={s.id}
                onClick={() => { setSelStudent(s.id); setStudentSearch(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                  borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  background: selected ? 'var(--primary-pale)' : 'transparent',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--surface2)'; }}
                onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: s.bg || 'var(--primary-pale)', color: s.col || 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, flexShrink: 0,
                }}>
                  {s.init}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{s.class}{s.parentEmail ? ` · ${s.parentEmail}` : ''}</div>
                </div>
                {selected && <Check size={14} style={{ color: 'var(--primary)' }} />}
              </div>
            );
          })}
        </div>

        {student && (
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--surface2)', marginBottom: 12, fontSize: 12 }}>
            <div><strong>Current parent:</strong> {student.parentName || 'None'} {student.parentEmail ? `· ${student.parentEmail}` : ''}</div>
          </div>
        )}

        {selStudent && (
          <>
            <label className="form-label-m" style={{ marginBottom: 8 }}>Link a parent</label>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
              <input className="msg-search" style={{ paddingLeft: 30 }} placeholder="Search parents..." value={parentSearch} onChange={e => setParentSearch(e.target.value)} />
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
              {filteredParents.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>
                  {parentSearch ? 'No parents match your search.' : 'No parent accounts found. Add one manually below.'}
                </div>
              ) : filteredParents.map(p => {
                const already = student?.parentEmail?.toLowerCase() === p.email.toLowerCase();
                return (
                  <div key={p.email}
                    onClick={() => { if (!already) linkParent(p.name, p.email); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      borderBottom: '1px solid var(--border)', cursor: already ? 'default' : 'pointer',
                      background: already ? 'var(--primary-pale)' : 'transparent',
                      transition: 'background .15s', opacity: already ? 0.7 : 1,
                    }}
                    onMouseEnter={e => { if (!already) e.currentTarget.style.background = 'var(--surface2)'; }}
                    onMouseLeave={e => { if (!already) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: p.fromSaved ? 'var(--coral-pale)' : 'var(--primary-pale)',
                      color: p.fromSaved ? 'var(--coral)' : 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, flexShrink: 0,
                    }}>
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{p.email}</div>
                    </div>
                    {already ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Check size={13} /> Linked
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--coral)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <UserPlus size={13} /> Link
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <button onClick={() => setShowManual(!showManual)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", textDecoration: 'underline', textUnderlineOffset: 2 }}>
                {showManual ? '− Hide manual entry' : '+ Add new parent manually'}
              </button>
            </div>

            {showManual && (
              <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 10, marginBottom: 12 }}>
                <div className="form-group-m">
                  <label className="form-label-m">Parent Name</label>
                  <input className="form-input-m" value={manualName} onChange={e => setManualName(e.target.value)} placeholder="e.g. Mrs. Lena Kim" />
                </div>
                <div className="form-group-m">
                  <label className="form-label-m">Parent Email</label>
                  <input className="form-input-m" value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="lena@example.com" />
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleManualLink} disabled={!manualEmail}
                  style={{ opacity: !manualEmail ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <UserPlus size={14} /> Link Manually
                </button>
              </div>
            )}
          </>
        )}

        <div className="modal-footer" style={{ marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
