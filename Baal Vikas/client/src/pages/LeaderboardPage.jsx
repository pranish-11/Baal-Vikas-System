import { useApp } from '../contexts/AppContext';
import { Star, Bot, Trophy, Award, Medal } from 'lucide-react';

const TIER_ICONS = { gold: Trophy, silver: Award, bronze: Medal };
import Podium from '../components/Leaderboard/Podium';
import LeaderboardRow from '../components/Leaderboard/LeaderboardRow';
import RewardTiers from '../components/Leaderboard/RewardTiers';

export default function LeaderboardPage() {
  const { students, awardedRewards, currentLBFilter, setCurrentLBFilter, getScaledLeaderboard, openModal } = useApp();

  const lbList = getScaledLeaderboard(currentLBFilter);
  const maxPts = lbList[0]?.pts || 1;

  const chips = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <>
      <div className="filter-row" style={{ marginBottom: 16 }}>
        {chips.map(c => (
          <div key={c.key} className={`filter-chip${currentLBFilter === c.key ? ' active' : ''}`} onClick={() => setCurrentLBFilter(c.key)}>
            {c.label}
          </div>
        ))}
      </div>
      <div className="card mb-16">
        <Podium list={lbList} />
        <div>
          {lbList.map(s => (
            <LeaderboardRow key={s.id} student={s} maxPts={maxPts} />
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Reward Tiers</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => openModal('giveReward')}>Give Reward</button>
            <button className="btn btn-ghost btn-sm" onClick={() => openModal('editRewards')}>Edit Tiers</button>
          </div>
        </div>
        <RewardTiers />
        {awardedRewards.length > 0 && (
          <div style={{ padding: '0 20px 16px', marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .6, color: 'var(--text3)', marginBottom: 10, paddingTop: 14, borderTop: '1px solid var(--border)' }}>Recently Awarded</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {awardedRewards.slice(0, 8).map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: r.bg || 'var(--primary-pale)', border: `1.5px solid ${r.border || 'var(--primary)'}` }}>
                  <div style={{ fontSize: 20, flexShrink: 0, display: 'flex', alignItems: 'center' }}>{(() => { const I = TIER_ICONS[r.tier] || Trophy; return <I size={24} style={{ color: r.color }} />; })()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{r.studentName} <span style={{ fontSize: 11, fontWeight: 700, color: r.color, marginLeft: 6 }}>{r.label}</span></div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.note}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>{r.date}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>{r.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
