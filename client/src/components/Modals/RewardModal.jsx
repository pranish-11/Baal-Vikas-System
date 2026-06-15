import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Trophy, Award, Medal } from 'lucide-react';
import { queueSyncToDB } from '../../utils/dbSync';

const TIER_META = { gold: { icon: Trophy, color: '#B07D0F' }, silver: { icon: Award, color: '#5a6b78' }, bronze: { icon: Medal, color: '#8c5a2a' } };

export default function RewardModal({ open, onClose }) {
  const { rewardTiers, setRewardTiers } = useApp();
  const [tiers, setTiers] = useState({ ...rewardTiers });

  if (!open) return null;

  const save = () => {
    setRewardTiers(tiers);
    localStorage.setItem('axion_reward_tiers', JSON.stringify(tiers));
    queueSyncToDB('axion_reward_tiers', tiers);
    onClose();
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-title">Edit Reward Tiers</div>
        {['gold', 'silver', 'bronze'].map((tier, idx) => {
          const m = TIER_META[tier];
          const Icon = m.icon;
          return (
            <div key={tier}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={18} style={{ color: m.color }} /> {tiers[tier]?.title || tier} Reward
              </div>
              <div className="form-group-m">
                <label className="form-label-m">Title</label>
                <input className="form-input-m" value={tiers[tier]?.title || ''} onChange={e => setTiers({ ...tiers, [tier]: { ...tiers[tier], title: e.target.value } })} />
              </div>
              <div className="form-group-m">
                <label className="form-label-m">Description</label>
                <input className="form-input-m" value={tiers[tier]?.desc || ''} onChange={e => setTiers({ ...tiers, [tier]: { ...tiers[tier], desc: e.target.value } })} />
              </div>
              {idx < 2 && <hr className="divider" />}
            </div>
          );
        })}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save Rewards</button>
        </div>
      </div>
    </div>
  );
}
