import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function AwardModal({ open, onClose }) {
  const { students, submitAward } = useApp();
  const [student, setStudent] = useState(students[0]?.name || '');
  const [points, setPoints] = useState(5);
  const [source, setSource] = useState('Teacher Award');
  const [description, setDescription] = useState('');
  const [notify, setNotify] = useState('Yes');

  if (!open) return null;

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-title">🌟 Award Behavior Points</div>
        <div className="form-group-m">
          <label className="form-label-m">Student</label>
          <select className="form-select-m" value={student} onChange={e => setStudent(e.target.value)}>
            {students.map(s => <option key={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-row-2">
          <div className="form-group-m">
            <label className="form-label-m">Points</label>
            <input className="form-input-m" type="number" value={points} min={1} max={20} onChange={e => setPoints(Number(e.target.value))} />
          </div>
          <div className="form-group-m">
            <label className="form-label-m">Source</label>
            <select className="form-select-m" value={source} onChange={e => setSource(e.target.value)}>
              <option>Teacher Award</option>
              <option>AI Detection</option>
              <option>Peer Nomination</option>
              <option>Parent Report</option>
            </select>
          </div>
        </div>
        <div className="form-group-m">
          <label className="form-label-m">Behavior Description</label>
          <textarea className="form-textarea-m" value={description} onChange={e => setDescription(e.target.value)} placeholder="What did this student do?" />
        </div>
        <div className="form-group-m">
          <label className="form-label-m">Notify Parent?</label>
          <select className="form-select-m" value={notify} onChange={e => setNotify(e.target.value)}>
            <option>Yes — send message to parent</option>
            <option>No — update quietly</option>
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => submitAward({ studentId: students.find(s => s.name === student)?.id, points, source, description, notifyParent: notify === 'Yes' })}>Award Points ✓</button>
        </div>
      </div>
    </div>
  );
}
