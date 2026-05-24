import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function EditSchoolModal({ open, onClose }) {
  const { schools, submitEditSchool } = useApp();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [classrooms, setClassrooms] = useState('');
  const [teachers, setTeachers] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const school = schools[0];

  useEffect(() => {
    if (open && school) {
      setName(school.name || '');
      setLocation(school.location || '');
      setPrincipalName(school.principalName || '');
      setContactEmail(school.contactEmail || '');
      setClassrooms(String(school.rooms || ''));
      setTeachers(String(school.teachers || ''));
      setPhone(school.phone || '');
      setAddress(school.address || '');
      setNotes(school.notes || '');
    }
  }, [open, school]);

  if (!open || !school) return null;

  const handleSubmit = () => {
    submitEditSchool(school.id, { name, location, principalName, contactEmail, classrooms: parseInt(classrooms) || 0, teachers: parseInt(teachers) || 0, phone, address, notes });
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-title">✎ Edit School — {school.name}</div>
        <div className="form-row-2">
          <div className="form-group-m"><label className="form-label-m">School Name</label><input className="form-input-m" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="form-group-m"><label className="form-label-m">City / Location</label><input className="form-input-m" value={location} onChange={e => setLocation(e.target.value)} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-group-m"><label className="form-label-m">Principal Name</label><input className="form-input-m" value={principalName} onChange={e => setPrincipalName(e.target.value)} /></div>
          <div className="form-group-m"><label className="form-label-m">Contact Email</label><input className="form-input-m" value={contactEmail} onChange={e => setContactEmail(e.target.value)} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-group-m"><label className="form-label-m">Classrooms</label><input className="form-input-m" type="number" value={classrooms} onChange={e => setClassrooms(e.target.value)} /></div>
          <div className="form-group-m"><label className="form-label-m">Teachers</label><input className="form-input-m" type="number" value={teachers} onChange={e => setTeachers(e.target.value)} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-group-m"><label className="form-label-m">Phone</label><input className="form-input-m" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <div className="form-group-m"><label className="form-label-m">Address</label><input className="form-input-m" value={address} onChange={e => setAddress(e.target.value)} /></div>
        </div>
        <div className="form-group-m"><label className="form-label-m">Notes</label><textarea className="form-textarea-m" value={notes} onChange={e => setNotes(e.target.value)} /></div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Save Changes ✓</button>
        </div>
      </div>
    </div>
  );
}
