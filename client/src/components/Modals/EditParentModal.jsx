import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function EditParentModal({ open, onClose }) {
  const { students, currentStudentFilter, saveParentDetails } = useApp();
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');

  const student = students.find(s => s.id === currentStudentFilter) || students[0];

  useEffect(() => {
    if (open && student) {
      setParentName(student.parentName || '');
      setParentEmail(student.parentEmail || '');
    }
  }, [open, student]);

  if (!open || !student) return null;

  const handleSubmit = () => {
    saveParentDetails(student.id, parentName, parentEmail);
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-title">✎ Edit Parent — {student.name}</div>
        <div className="form-group-m">
          <label className="form-label-m">Parent / Guardian Name</label>
          <input className="form-input-m" value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Full name" />
        </div>
        <div className="form-group-m">
          <label className="form-label-m">Parent Contact Email</label>
          <input className="form-input-m" value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="parent@email.com" />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Save ✓</button>
        </div>
      </div>
    </div>
  );
}
