import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { User, Trash2, X, Check } from 'lucide-react';

export default function EditStudentModal({ open, onClose }) {
  const { students, currentStudentFilter, submitEditStudent, deleteStudent, openModal, getAllClasses } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [className, setClassName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  const student = students.find(s => s.id === currentStudentFilter) || students[0];
  const allClasses = getAllClasses();

  useEffect(() => {
    if (open && student) {
      const parts = student.name.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setAge(String(student.age || ''));
      setClassName(student.class || '');
      setParentName(student.parentName || '');
      setParentEmail(student.parentEmail || '');
      setMedicalNotes(student.medicalNotes || '');
    }
  }, [open, student]);

  if (!open || !student) return null;

  const handleSubmit = () => {
    submitEditStudent(student.id, { firstName, lastName, age: parseInt(age) || 0, className, parentName, parentEmail, medicalNotes });
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={20} style={{ color: 'var(--primary)' }} /> Edit Student — {student.name}
        </div>
        <div className="form-row-2">
          <div className="form-group-m"><label className="form-label-m">First Name</label><input className="form-input-m" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
          <div className="form-group-m"><label className="form-label-m">Last Name</label><input className="form-input-m" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-group-m"><label className="form-label-m">Age</label><input className="form-input-m" type="number" value={age} onChange={e => setAge(e.target.value)} /></div>
          <div className="form-group-m"><label className="form-label-m">Classroom</label>
            <select className="form-select-m" value={className} onChange={e => setClassName(e.target.value)}>
              <option value="">Select a class...</option>
              {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group-m"><label className="form-label-m">Parent / Guardian</label><input className="form-input-m" value={parentName} onChange={e => setParentName(e.target.value)} /></div>
        <div className="form-group-m"><label className="form-label-m">Parent Email</label><input className="form-input-m" value={parentEmail} onChange={e => setParentEmail(e.target.value)} /></div>
        <div className="form-group-m"><label className="form-label-m">Medical / Dietary Notes</label><textarea className="form-textarea-m" value={medicalNotes} onChange={e => setMedicalNotes(e.target.value)} /></div>
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-sm" style={{ background: 'var(--coral-pale)', color: 'var(--coral)', border: '1.5px solid var(--coral)', fontWeight: 800, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => deleteStudent(student.id, student.name)}><Trash2 size={14} /> Remove Student</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><X size={14} /> Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Check size={14} /> Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
