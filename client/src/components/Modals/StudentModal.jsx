import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { UserPlus } from 'lucide-react';
import { API_BASE } from '../../config';

export default function StudentModal({ open, onClose }) {
  const { students, submitStudent, getAllClasses } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [classroom, setClassroom] = useState('');
  const [customClass, setCustomClass] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [selectedParent, setSelectedParent] = useState('');
  const [enrollment, setEnrollment] = useState('');
  const [medical, setMedical] = useState('');
  const [parents, setParents] = useState([]);

  const allClasses = getAllClasses();

  useEffect(() => {
    if (open) {
      setFirstName('');
      setLastName('');
      setAge('');
      setClassroom('');
      setCustomClass('');
      setShowCustom(false);
      setSelectedParent('');
      setEnrollment('');
      setMedical('');
      const token = localStorage.getItem('axion_token');
      fetch(`${API_BASE}/users?role=PARENT`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setParents(d.users || []))
        .catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  const effectiveClass = showCustom ? customClass : classroom;
  const parent = parents.find(p => p.id === selectedParent);

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserPlus size={20} style={{ color: 'var(--primary)' }} /> Register New Student
        </div>
        <div className="form-row-2">
          <div className="form-group-m"><label className="form-label-m">First Name</label><input className="form-input-m" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" /></div>
          <div className="form-group-m"><label className="form-label-m">Last Name</label><input className="form-input-m" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" /></div>
        </div>
        <div className="form-row-2">
          <div className="form-group-m"><label className="form-label-m">Age</label><input className="form-input-m" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 6" /></div>
          <div className="form-group-m"><label className="form-label-m">Classroom</label>
            {showCustom ? (
              <input className="form-input-m" value={customClass} onChange={e => setCustomClass(e.target.value)} placeholder="Enter new class name" autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) setShowCustom(false); }} />
            ) : (
              <select className="form-select-m" value={classroom} onChange={e => {
                const val = e.target.value;
                if (val === '__new__') { setShowCustom(true); setClassroom(''); }
                else setClassroom(val);
              }}>
                <option value="">Select a class...</option>
                {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__new__" style={{ fontWeight: 800, color: 'var(--primary)' }}>+ New Class</option>
              </select>
            )}
            {showCustom && (
              <div style={{ marginTop: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => { setShowCustom(false); setCustomClass(''); }}>Pick from existing</span>
              </div>
            )}
          </div>
        </div>
        <div className="form-group-m"><label className="form-label-m">Parent</label>
          <select className="form-select-m" value={selectedParent} onChange={e => setSelectedParent(e.target.value)}>
            <option value="">Select a parent...</option>
            {parents.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
          </select>
        </div>
        <div className="form-group-m"><label className="form-label-m">Enrollment Date</label><input className="form-input-m" type="date" value={enrollment} onChange={e => setEnrollment(e.target.value)} /></div>
        <div className="form-group-m"><label className="form-label-m">Medical / Dietary Notes</label><textarea className="form-textarea-m" value={medical} onChange={e => setMedical(e.target.value)} placeholder="Allergies, conditions..." /></div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => submitStudent({
            firstName, lastName, age: parseInt(age) || 0, className: effectiveClass,
            parentName: parent?.name || '', parentEmail: parent?.email || '',
            enrollmentDate: enrollment, medicalNotes: medical,
          })}>Register Student</button>
        </div>
      </div>
    </div>
  );
}
