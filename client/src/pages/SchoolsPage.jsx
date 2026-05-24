import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { MapPin, GraduationCap } from 'lucide-react';

export default function SchoolsPage() {
  const { schools, registerSchool, openModal } = useApp();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [classrooms, setClassrooms] = useState('');
  const [teachers, setTeachers] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleRegister = () => {
    registerSchool({
      name,
      location,
      principalName,
      contactEmail,
      classrooms: parseInt(classrooms) || 0,
      teachers: parseInt(teachers) || 0,
      phone,
      address,
      notes,
    });
    setName(''); setLocation(''); setPrincipalName(''); setContactEmail('');
    setClassrooms(''); setTeachers(''); setPhone(''); setAddress(''); setNotes('');
  };

  const handleClear = () => {
    setName(''); setLocation(''); setPrincipalName(''); setContactEmail('');
    setClassrooms(''); setTeachers(''); setPhone(''); setAddress(''); setNotes('');
  };

  return (
    <div className="two-col mb-20">
      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Register New School</div>
          </div>
          <div className="card-body">
            <div className="form-row-2">
              <div className="form-group-m"><label className="form-label-m">School Name</label><input className="form-input-m" placeholder="e.g. Sunrise Montessori" value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="form-group-m"><label className="form-label-m">City / Location</label><input className="form-input-m" placeholder="e.g. Kathmandu" value={location} onChange={e => setLocation(e.target.value)} /></div>
            </div>
            <div className="form-row-2">
              <div className="form-group-m"><label className="form-label-m">Principal Name</label><input className="form-input-m" placeholder="Full name" value={principalName} onChange={e => setPrincipalName(e.target.value)} /></div>
              <div className="form-group-m"><label className="form-label-m">Contact Email</label><input className="form-input-m" placeholder="principal@school.edu" value={contactEmail} onChange={e => setContactEmail(e.target.value)} /></div>
            </div>
            <div className="form-row-2">
              <div className="form-group-m"><label className="form-label-m">No. of Classrooms</label><input className="form-input-m" type="number" placeholder="e.g. 6" value={classrooms} onChange={e => setClassrooms(e.target.value)} /></div>
              <div className="form-group-m"><label className="form-label-m">No. of Teachers</label><input className="form-input-m" type="number" placeholder="e.g. 8" value={teachers} onChange={e => setTeachers(e.target.value)} /></div>
            </div>
            <div className="form-row-2">
              <div className="form-group-m"><label className="form-label-m">Phone Number</label><input className="form-input-m" placeholder="+977-..." value={phone} onChange={e => setPhone(e.target.value)} /></div>
              <div className="form-group-m"><label className="form-label-m">Full Address</label><input className="form-input-m" placeholder="Street, District, Province" value={address} onChange={e => setAddress(e.target.value)} /></div>
            </div>
            <div className="form-group-m"><label className="form-label-m">Additional Notes</label><textarea className="form-textarea-m" placeholder="Extra info about the school..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={handleClear}>Clear</button>
              <button className="btn btn-primary" onClick={handleRegister}>Register School</button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="section-label">Registered Schools</div>
        {schools.map(s => (
          <div key={s.id} className="school-card">
            <div className="school-top">
              <div>
                <div className="school-name">{s.name}</div>
                <div className="school-location"><MapPin size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />{s.location}</div>
              </div>
              <span className="badge badge-resolved">Active</span>
            </div>
            <div className="school-stats">
              <div className="school-stat"><div className="school-stat-value">{s.rooms}</div><div className="school-stat-label">Rooms</div></div>
              <div className="school-stat"><div className="school-stat-value">{s.students}</div><div className="school-stat-label">Students</div></div>
              <div className="school-stat"><div className="school-stat-value">{s.teachers}</div><div className="school-stat-label">Teachers</div></div>
              <div className="school-stat"><div className="school-stat-value">2</div><div className="school-stat-label">Cameras</div></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openModal('schoolDetail')}>View Details</button>
              <button className="btn btn-ghost btn-sm" onClick={() => openModal('editSchool')}>✎ Edit</button>
              <button className="btn btn-sm" style={{ background: 'var(--sky-pale)', color: 'var(--sky)', border: '1.5px solid var(--sky)', fontWeight: 700, gap: 4, display: 'flex', alignItems: 'center' }} onClick={() => openModal('assignClass')}><GraduationCap size={14} /> Assign Classes</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
