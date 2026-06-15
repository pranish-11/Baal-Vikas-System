import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function RecordPaymentModal({ open, onClose }) {
  const { fees, submitRecordPayment } = useApp();
  const [selectedId, setSelectedId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [note, setNote] = useState('');

  if (!open) return null;

  const unpaidFees = fees.filter(f => f.status !== 'paid');

  const handleSubmit = () => {
    if (!selectedId || !amountPaid) return;
    submitRecordPayment(selectedId, parseFloat(amountPaid), note);
    setSelectedId(''); setAmountPaid(''); setNote('');
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-title">Record Payment</div>
        <div className="form-group-m">
          <label className="form-label-m">Fee Record</label>
          <select className="form-select-m" value={selectedId} onChange={e => { setSelectedId(e.target.value); const f = fees.find(x => x.id === e.target.value); if (f) setAmountPaid(String(f.balance || f.amount)); }}>
            <option value="">— Select fee record —</option>
            {unpaidFees.map(f => <option key={f.id} value={f.id}>{f.title} — ${f.balance.toFixed(2)} remaining</option>)}
          </select>
        </div>
        <div className="form-group-m">
          <label className="form-label-m">Amount Paid ($)</label>
          <input className="form-input-m" type="number" step="0.01" placeholder="0.00" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
        </div>
        <div className="form-group-m">
          <label className="form-label-m">Note (optional)</label>
          <input className="form-input-m" placeholder="e.g. Paid via bank transfer" value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} style={{ background: '#15803d', borderColor: '#16a34a' }}>✓ Record Payment</button>
        </div>
      </div>
    </div>
  );
}
