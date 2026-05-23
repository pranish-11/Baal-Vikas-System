import { useEffect, useState } from 'react';
import axios from '../api/axios.js';

export default function AttendanceFees() {
  const [fees, setFees] = useState([]);
  const [month, setMonth] = useState('2026-05');
  const [amount, setAmount] = useState(500);
  
  const loadFees = async () => {
    const { data } = await axios.get('/api/fees');
    setFees(data);
  };
  
  useEffect(() => {
    loadFees();
  }, []);
  
  const generateFees = async () => {
    if (!confirm(`Generate fees for ${month} at $${amount}?`)) return;
    try {
      await axios.post('/api/fees/generate', { month, amount });
      loadFees();
    } catch (err) {
      alert('Failed to generate fees');
    }
  };
  
  const toggleFee = async (id) => {
    try {
      await axios.put(`/api/fees/${id}/pay`);
      loadFees();
    } catch (err) {
      alert('Failed to update fee');
    }
  };
  
  return (
    <div className="page-padding">
      <div className="card card-pad dashboard-stack-margin">
        <h2 className="title-font section-title">Generate Monthly Fees</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Month</label>
            <input type="month" className="form-input" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Amount ($)</label>
            <input type="number" className="form-input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <button type="button" className="btn-primary" onClick={generateFees}>Generate</button>
        </div>
      </div>
      
      <div className="card card-pad">
        <h2 className="title-font section-title">Fee Status</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {fees.map(f => (
            <div key={f._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface2)', borderRadius: 'var(--radius)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{f.studentId?.firstName} {f.studentId?.lastName}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{f.month} - ${f.amount}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className={`badge ${f.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                  {f.status.toUpperCase()}
                </span>
                <button type="button" className={`btn-sm ${f.status === 'paid' ? 'btn-ghost' : 'btn-primary'}`} onClick={() => toggleFee(f._id)}>
                  {f.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                </button>
              </div>
            </div>
          ))}
          {fees.length === 0 && <div className="empty-hint">No fees generated yet.</div>}
        </div>
      </div>
    </div>
  );
}
