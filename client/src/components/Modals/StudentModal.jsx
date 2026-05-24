import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { UserPlus } from 'lucide-react';

export default function StudentModal({ open, onClose }) {
  const { students, submitStudent, getAllClasses } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [classroom, setClassroom] = useState('');
  const [customClass, setCustomClass] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [enrollment, setEnrollment] = useState('');
  const [medical, setMedical] = useState('');

  const allClasses = getAllClasses();

  useEffect(() => {
    if (open) {
      setFirstName('');
      setLastName('');
      setAge('');
      setClassroom('');
      setCustomClass('');
      setShowCustom(false);
      setParentName('');
      setParentEmail('');
      setEnrollment('');
      setMedical('');
    }
  }, [open]);

  if (!open) return null;

  const effectiveClass = showCustom ? customClass : classroom;

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
        <div className="form-group-m"><label className="form-label-m">Parent / Guardian Name</label><input className="form-input-m" value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Full name" /></div>
        <div className="form-group-m"><label className="form-label-m">Parent Contact Email</label><input className="form-input-m" value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="parent@email.com" /></div>
        <div className="form-group-m"><label className="form-label-m">Enrollment Date</label><input className="form-input-m" type="date" value={enrollment} onChange={e => setEnrollment(e.target.value)} /></div>
        <div className="form-group-m"><label className="form-label-m">Medical / Dietary Notes</label><textarea className="form-textarea-m" value={medical} onChange={e => setMedical(e.target.value)} placeholder="Allergies, conditions..." /></div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => submitStudent({ firstName, lastName, age: parseInt(age) || 0, className: effectiveClass, parentName, parentEmail, enrollmentDate: enrollment, medicalNotes: medical })}>Register Student</button>
        </div>
      </div>
    </div>
  );
}
