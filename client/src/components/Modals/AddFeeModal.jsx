import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function AddFeeModal({ open, onClose }) {
  const { students, submitAddFee } = useApp();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [studentId, setStudentId] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    if (!title || !amount) return;
    submitAddFee({ title, amount: parseFloat(amount), studentId: studentId || undefined, term, dueDate, description });
    setTitle(''); setAmount(''); setStudentId(''); setTerm('Term 1'); setDueDate(''); setDescription('');
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-title">Add Fee Record</div>
        <div className="form-group-m">
          <label className="form-label-m">Fee Title</label>
          <input className="form-input-m" placeholder="e.g. Tuition Fee" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="form-row-2">
          <div className="form-group-m">
            <label className="form-label-m">Amount ($)</label>
            <input className="form-input-m" type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="form-group-m">
            <label className="form-label-m">Term</label>
            <select className="form-select-m" value={term} onChange={e => setTerm(e.target.value)}>
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
              <option>Annual</option>
            </select>
          </div>
        </div>
        <div className="form-group-m">
          <label className="form-label-m">Student (optional)</label>
          <select className="form-select-m" value={studentId} onChange={e => setStudentId(e.target.value)}>
            <option value="">— All / General fee —</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
          </select>
        </div>
        <div className="form-group-m">
          <label className="form-label-m">Due Date</label>
          <input className="form-input-m" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div className="form-group-m">
          <label className="form-label-m">Description (optional)</label>
          <textarea className="form-textarea-m" placeholder="Additional details..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Add Fee Record ✓</button>
        </div>
      </div>
    </div>
  );
}
