import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Trophy, Award, Medal } from 'lucide-react';

const DEFAULT_TIERS = {
  gold: { title: 'Gold Trophy', desc: 'Star sticker on class chart + 10 min extra recess + certificate of excellence' },
  silver: { title: 'Silver Award', desc: "Choose the class's afternoon activity + homework pass (1 day)" },
  bronze: { title: 'Bronze Badge', desc: 'Full homework pass for the week + recognition at morning circle' },
};

export default function GiveRewardModal({ open, onClose }) {
  const { students, awardedRewards, setAwardedRewards } = useApp();
  const rewardTiers = DEFAULT_TIERS;
  const [tier, setTier] = useState('gold');
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState('yes');

  if (!open) return null;

  const tiers = [
    { key: 'gold', icon: Trophy, label: rewardTiers.gold.title, border: '#F4A929', solidBg: '#FEF3C7', textCol: '#92600A' },
    { key: 'silver', icon: Award, label: rewardTiers.silver.title, border: '#8A9BAA', solidBg: '#E2E8F0', textCol: '#3D5166' },
    { key: 'bronze', icon: Medal, label: rewardTiers.bronze.title, border: '#C07B45', solidBg: '#FDEBD0', textCol: '#7A4520' },
  ];

  const submit = () => {
    const student = students.find(s => s.id === studentId) || students[0];
    if (!student) return;
    const meta = { gold: { label: rewardTiers.gold.title, color: '#B07D0F', bg: '#fffbeb', border: 'var(--gold)' }, silver: { label: rewardTiers.silver.title, color: '#5a6b78', bg: '#f1f5f9', border: '#8A9BAA' }, bronze: { label: rewardTiers.bronze.title, color: '#8c5a2a', bg: '#fff7ed', border: '#C07B45' } };
    const m = meta[tier];
    const entry = {
      id: Date.now(), studentId: student.id, studentName: student.name, studentInit: student.init,
      studentBg: student.bg, studentCol: student.col, tier, label: m.label,
      color: m.color, bg: m.bg, border: m.border, note: note || rewardTiers[tier].desc,
      by: 'Teacher', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }), notified: notify === 'yes',
    };
    const updated = [entry, ...awardedRewards];
    setAwardedRewards(updated);
    onClose();
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 480, padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,var(--gold) 0%,#f4a929 100%)', padding: '20px 24px 18px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.25)', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 3 }}>Give a Reward</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Recognise outstanding student behaviour</div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .6, color: 'var(--text3)', marginBottom: 10 }}>Select Reward Tier</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
            {tiers.map(t => {
              const isSelected = tier === t.key;
              return (
                <div key={t.key} onClick={() => setTier(t.key)}
                  style={{ border: `${isSelected ? 3 : 2}px solid ${t.border}`, borderRadius: 14, padding: '14px 8px 12px', textAlign: 'center', cursor: 'pointer', transition: 'all .18s ease', background: isSelected ? t.solidBg : '#fff', boxShadow: isSelected ? `0 4px 16px ${t.border}55` : '0 1px 3px rgba(0,0,0,0.06)', transform: isSelected ? 'scale(1.06)' : 'scale(1)', position: 'relative' }}>
                  {isSelected && <div style={{ position: 'absolute', top: 7, right: 9, width: 18, height: 18, borderRadius: '50%', background: t.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>}
                  <div style={{ marginBottom: 6 }}>{(() => { const Icon = t.icon; return <Icon size={isSelected ? 30 : 24} style={{ color: t.border, transition: 'all .18s' }} />; })()}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: isSelected ? t.textCol : '#6b7280' }}>{t.label}</div>
                </div>
              );
            })}
          </div>
          <div className="form-group-m">
            <label className="form-label-m">Student</label>
            <select className="form-select-m" value={studentId} onChange={e => setStudentId(e.target.value)}>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group-m">
            <label className="form-label-m">Note <span style={{ color: 'var(--text3)', fontWeight: 600 }}>(optional)</span></label>
            <textarea className="form-textarea-m" style={{ minHeight: 72 }} value={note} onChange={e => setNote(e.target.value)} placeholder="Why are you giving this reward?" />
          </div>
          <div className="form-group-m">
            <label className="form-label-m">Notify Parent?</label>
            <select className="form-select-m" value={notify} onChange={e => setNotify(e.target.value)}>
              <option value="yes">Yes — send message to parent</option>
              <option value="no">No — update quietly</option>
            </select>
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '14px 24px' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} style={{ background: 'var(--gold)', borderColor: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6 }}><Trophy size={14} /> Give Reward</button>
        </div>
      </div>
    </div>
  );
}
