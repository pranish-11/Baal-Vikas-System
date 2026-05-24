import { Trophy, Award, Medal } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const TIER_ICONS = [Trophy, Award, Medal];
const TIER_COLORS = ['#B07D0F', '#5a6b78', '#8c5a2a'];
const TIER_BORDERS = ['var(--gold)', '#8A9BAA', '#C07B45'];

export default function RewardTiers() {
  const { rewardTiers } = useApp();

  const tiers = [
    { title: rewardTiers.gold.title, desc: rewardTiers.gold.desc },
    { title: rewardTiers.silver.title, desc: rewardTiers.silver.desc },
    { title: rewardTiers.bronze.title, desc: rewardTiers.bronze.desc },
  ];

  return (
    <div className="rewards-grid">
      {tiers.map((t, i) => {
        const Icon = TIER_ICONS[i];
        return (
          <div key={i} className="reward-item" style={{ borderColor: TIER_BORDERS[i], borderWidth: 2, cursor: 'pointer' }}>
            <div className="reward-emoji"><Icon size={28} style={{ color: TIER_COLORS[i] }} /></div>
            <div className="reward-name" style={{ color: TIER_COLORS[i], fontSize: 14 }}>{t.title}</div>
            <div className="reward-desc">{t.desc}</div>
          </div>
        );
      })}
    </div>
  );
}
