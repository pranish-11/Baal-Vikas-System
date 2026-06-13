import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function SendReminderModal({ open, onClose }) {
  const { fees, submitSendReminder } = useApp();
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');

  if (!open) return null;

  const unpaidFees = fees.filter(f => f.status !== 'paid');

  const handleSubmit = () => {
    if (!selectedId) return;
    submitSendReminder(selectedId, message);
    setSelectedId(''); setMessage('');
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-title">Send Payment Reminder</div>
        <div className="form-group-m">
          <label className="form-label-m">Fee Record</label>
          <select className="form-select-m" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">— Select fee —</option>
            {unpaidFees.map(f => <option key={f.id} value={f.id}>{f.title} — ${f.balance.toFixed(2)} outstanding</option>)}
          </select>
        </div>
        <div className="form-group-m">
          <label className="form-label-m">Reminder Message (optional)</label>
          <textarea className="form-textarea-m" style={{ minHeight: 80 }} placeholder="Custom reminder message..." value={message} onChange={e => setMessage(e.target.value)} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Send Reminder</button>
        </div>
      </div>
    </div>
  );
}
