import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import axios from '../api/axios.js';
import Podium from '../components/Podium.jsx';
import LeaderboardRow from '../components/LeaderboardRow.jsx';
import Modal from '../components/Modal.jsx';

const DEFAULT_REWARDS = {
  gold: 'Top 3 weekly earn a gold certificate and classroom privilege.',
  silver: 'Ranks 4–10 receive silver recognition and a small prize.',
  bronze: 'Consistent effort earns bronze badges monthly.',
};

export default function Leaderboard() {
  const { openAwardModal, leaderboardRefreshKey } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const period = searchParams.get('period') || 'today';
  const [rows, setRows] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [rewardTexts, setRewardTexts] = useState(DEFAULT_REWARDS);
  const [draftRewards, setDraftRewards] = useState(DEFAULT_REWARDS);

  const load = () => {
    axios.get(`/api/leaderboard?period=${period}`).then((r) => setRows(r.data));
  };

  useEffect(() => {
    load();
  }, [period, leaderboardRefreshKey]);

  const maxPoints = useMemo(
    () => Math.max(...rows.map((x) => x.periodPoints ?? x.points ?? 0), 1),
    [rows]
  );

  const openEdit = () => {
    setDraftRewards(rewardTexts);
    setEditOpen(true);
  };

  const saveRewards = () => {
    setRewardTexts(draftRewards);
    setEditOpen(false);
  };

  return (
    <div className="page-padding">
      <div className="filter-chips">
        {[
          { id: 'today', label: 'Today' },
          { id: 'week', label: 'This Week' },
          { id: 'month', label: 'This Month' },
        ].map((p) => (
          <button
            key={p.id}
            type="button"
            className={`chip${period === p.id ? ' active' : ''}`}
            onClick={() => setSearchParams({ period: p.id })}
          >
            {p.label}
          </button>
        ))}
        <button type="button" className="btn-primary btn-sm" onClick={() => openAwardModal?.()}>
          Award Points
        </button>
        <button type="button" className="btn-secondary btn-sm">
          AI Update
        </button>
      </div>

      <div className="card card-pad">
        <h2 className="title-font section-title">Podium</h2>
        <Podium students={rows.slice(0, 3)} />
      </div>

      <div className="card card-pad dashboard-stack-margin">
        <h2 className="title-font section-title">Full Ranked List</h2>
        {rows.map((s, i) => (
          <LeaderboardRow
            key={s._id}
            rank={i + 1}
            student={s}
            maxPoints={maxPoints}
            onAward={(id) => openAwardModal?.(id)}
          />
        ))}
      </div>

      <div className="card card-pad dashboard-stack-margin">
        <h2 className="title-font section-title-sm">Reward Tiers</h2>
        <div className="reward-tiers">
          <div className="reward-tier-block">
            <strong>Gold</strong> — {rewardTexts.gold}
          </div>
          <div className="reward-tier-block">
            <strong>Silver</strong> — {rewardTexts.silver}
          </div>
          <div className="reward-tier-block">
            <strong>Bronze</strong> — {rewardTexts.bronze}
          </div>
        </div>
        <button type="button" className="btn-secondary btn-sm dashboard-stack-margin" onClick={openEdit}>
          Edit Rewards
        </button>
      </div>

      <Modal
        open={editOpen}
        title="Edit Rewards"
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={saveRewards}>
              Save
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Gold description</label>
          <input
            className="form-input"
            value={draftRewards.gold}
            onChange={(e) =>
              setDraftRewards((x) => ({ ...x, gold: e.target.value }))
            }
          />
        </div>
        <div className="form-group">
          <label className="form-label">Silver description</label>
          <input
            className="form-input"
            value={draftRewards.silver}
            onChange={(e) =>
              setDraftRewards((x) => ({ ...x, silver: e.target.value }))
            }
          />
        </div>
        <div className="form-group">
          <label className="form-label">Bronze description</label>
          <input
            className="form-input"
            value={draftRewards.bronze}
            onChange={(e) =>
              setDraftRewards((x) => ({ ...x, bronze: e.target.value }))
            }
          />
        </div>
      </Modal>
    </div>
  );
}
